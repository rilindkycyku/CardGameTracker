/**
 * Lidhja e drejtpërdrejtë mes telefonave — kanali WebRTC dhe rruga e sinjalit.
 *
 * Ai që mban pikët është strehuesi; kush do t'i shohë është vizitori. Sinjali
 * shkëmbehet me dy kode QR, sepse server sinjalizimi nuk ka:
 *
 *   1. Strehuesi tregon ftesën. Vizitori e skanon me kamerën e telefonit — jo
 *      me aplikacionin — dhe kamera hap `#/lidhu/<paketë>`. Prandaj punon edhe
 *      në një telefon që nuk e ka pasur kurrë aplikacionin.
 *   2. Vizitori tregon përgjigjen. Strehuesi e skanon me kamerën e vet, dhe
 *      kamera hap `#/pergjigje/<paketë>` në një skedë të dytë.
 *   3. Skeda e dytë e kalon paketën te skeda e lojës me `BroadcastChannel`, dhe
 *      pastaj thotë „mbyllu".
 *
 * Hapi i tretë ekziston sepse skeda e lojës nuk guxon të lëvizë: ajo mban
 * `RTCPeerConnection`-in, dhe një navigim do ta vriste pikërisht lidhjen që po
 * ndërtohej. Kamera nuk di t'ia dorëzojë tekstin një skede që rri hapur, prandaj
 * skeda e dytë bën atë punë dhe ikën. `BroadcastChannel` dhe ngjarja `storage`
 * përdoren të dyja: e dyta punon edhe atje ku e para mungon, dhe kushtojnë sa
 * dy dëgjues.
 *
 * Nuk kontaktohet asnjë server, dhe kjo nuk është vetëm zgjedhje: `iceServers`
 * rri i zbrazët, prandaj mbledhen vetëm kandidatë `typ host` dhe lidhja del
 * vetëm brenda së njëjtës rrjetë. Pikët nuk kalojnë nëpër asnjë pajisje tjetër.
 *
 * Kufiri: një rrjetë që i ndan klientët nga njëri-tjetri (AP isolation, wifi i
 * hotelit, «rrjeta e mysafirëve») e bllokon këtë rrugë fare. Atëherë mbetet
 * fotografia e `ndarja.ts`, dhe paneli e thotë hapur.
 *
 * Ajo që kalon nëpër kanal është pikërisht paketa e `ndarja.ts` — të njëjtat
 * bajte të fotografisë. Kështu pamja vetëm-lexim ka një rrugë të vetme leximi.
 */

import {
  adresaEFteses,
  paketoSinjalin,
  sdpNgaSinjali,
  shpaketoSinjalin,
  sinjaliNgaSdp,
} from './sinjalizimi.ts';

/** Emri i kanalit të dhënash. */
const KANALI = 'pikët';

/** Kanali mes skedave të së njëjtës pajisje, për përgjigjen e skanuar. */
const KANALI_I_SKEDAVE = 'bridzh-sinjali';

/** Çelësi rezervë, për atje ku `BroadcastChannel` mungon. */
const CELESI = 'bridzh-sinjali';

/**
 * Sa pritet mbledhja e kandidatëve para se ftesa shfaqet gjithsesi.
 *
 * Pa afat, `icegatheringstatechange` mund të mos vijë kurrë te një rrjetë e
 * çuditshme dhe kodi QR nuk do të dilte fare. Me kandidatët që kemi, lidhja
 * ende provohet.
 */
const PRITJA = 2500;

/* ── Ndihmësa ───────────────────────────────────────────────────────────── */

export function kaWebRTC(): boolean {
  return typeof RTCPeerConnection !== 'undefined';
}

/** Pret sa mbledhen kandidatët, ose sa mbaron afati. */
function mbledhKandidatet(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();

  return new Promise((zgjidh) => {
    const afati = window.setTimeout(mbaro, PRITJA);

    function mbaro() {
      window.clearTimeout(afati);
      pc.removeEventListener('icegatheringstatechange', shiko);
      zgjidh();
    }

    function shiko() {
      if (pc.iceGatheringState === 'complete') mbaro();
    }

    pc.addEventListener('icegatheringstatechange', shiko);
  });
}

function lidhjeERe(): RTCPeerConnection {
  // Pa `iceServers`: as STUN, as TURN, prandaj asnjë server i kontaktuar dhe
  // vetëm kandidatë brenda rrjetës.
  return new RTCPeerConnection({ iceServers: [] });
}

/* ── Strehuesi: ai që mban pikët ────────────────────────────────────────── */

export type GjendjaEStrehuesit = {
  /** Paketa e ftesës që tregohet si kod QR, ose `null` sa përgatitet. */
  ftesa: string | null;
  /** Sa vizitorë i shikojnë pikët tani. */
  vizitore: number;
  /** Po pranohet një përgjigje pikërisht tani. */
  dukeLidhur: boolean;
  gabimi: string | null;
};

export class Strehuesi {
  #njofto: (gjendja: GjendjaEStrehuesit) => void;
  #gjendja: GjendjaEStrehuesit = {
    ftesa: null,
    vizitore: 0,
    dukeLidhur: false,
    gabimi: null,
  };

  /** Ftesa që pret një përgjigje — e vetmja që mund të pranohet. */
  #pritja: { pc: RTCPeerConnection; ufrag: string } | null = null;
  /**
   * Lidhjet që kaluan sinjalizimin.
   *
   * Ndahen nga `#pritja` me qëllim: `#hapFtese` e mbyll ftesën e papërgjigjur,
   * dhe pa këtë ndarje ajo do të mbyllte pikërisht lidhjen që sapo u hap —
   * ftesa tjetër përgatitet nga `dc.onopen`, kur pc-ja e saj ende do të rrinte
   * te `#pritja`.
   */
  #lidhjet = new Set<RTCPeerConnection>();
  /** Kanalet e hapura drejt vizitorëve. */
  #kanalet = new Set<RTCDataChannel>();
  /**
   * Kodi i përgjigjes së pranuar së fundi.
   *
   * Përgjigja mbërrin nga dy rrugë njëherësh — `BroadcastChannel` dhe ngjarja
   * `storage` — prandaj e njëjta paketë vjen dy herë. Pa këtë, e dyta do të
   * shkruante një përshkrim të dytë mbi një lidhje që kishte mbaruar punë,
   * `setRemoteDescription` do të kërcente, dhe kapja e gabimit do të rrëzonte
   * një lidhje të mirë.
   */
  #kodiIPranuar: string | null = null;
  /** Paketa e fundit e pamjes; ajo që marrin vizitorët sapo lidhen. */
  #paketa: string;
  #skedat: BroadcastChannel | null = null;
  #mbyllur = false;

  constructor(paketa: string, njofto: (gjendja: GjendjaEStrehuesit) => void) {
    this.#paketa = paketa;
    this.#njofto = njofto;
  }

  #ndrysho(pjesa: Partial<GjendjaEStrehuesit>): void {
    if (this.#mbyllur) return;
    this.#gjendja = { ...this.#gjendja, ...pjesa };
    this.#njofto(this.#gjendja);
  }

  /** Nis dëgjimin e përgjigjeve dhe përgatit ftesën e parë. */
  async nis(): Promise<void> {
    if (!kaWebRTC()) {
      this.#ndrysho({ gabimi: 'Ky shfletues nuk e mban lidhjen e drejtpërdrejtë.' });
      return;
    }

    if (typeof BroadcastChannel !== 'undefined') {
      this.#skedat = new BroadcastChannel(KANALI_I_SKEDAVE);
      this.#skedat.onmessage = (ngjarja) => {
        const kodi = (ngjarja.data as { pergjigja?: unknown } | null)?.pergjigja;
        if (typeof kodi === 'string') void this.pergjigju(kodi);
      };
    }

    window.addEventListener('storage', this.#ngaRuajtja);

    await this.#hapFtese();
  }

  /**
   * Skeda e dytë e shkruan përgjigjen te `localStorage`; ngjarja bie te kjo.
   *
   * Rruga e dytë nuk është tepri: `BroadcastChannel` mungon te shfletues të
   * vjetër, dhe atëherë kjo është e vetmja.
   */
  #ngaRuajtja = (ngjarja: StorageEvent): void => {
    if (ngjarja.key !== CELESI || !ngjarja.newValue) return;

    try {
      const lexuar = JSON.parse(ngjarja.newValue) as { pergjigja?: unknown };
      if (typeof lexuar.pergjigja === 'string') void this.pergjigju(lexuar.pergjigja);
    } catch {
      // Një vlerë e prishur te ruajtja nuk është arsye për t'u rrëzuar.
    }
  };

  async #hapFtese(): Promise<void> {
    if (this.#mbyllur) return;

    this.#pritja?.pc.close();
    this.#pritja = null;
    this.#ndrysho({ ftesa: null, dukeLidhur: false });

    try {
      const pc = lidhjeERe();
      // Kanali krijohet para ftesës, që SDP-ja të ketë rreshtin e tij.
      const dc = pc.createDataChannel(KANALI);

      dc.onopen = () => {
        this.#kanalet.add(dc);
        // Kush lidhet i merr pikët menjëherë, pa pritur raundin tjetër.
        try {
          dc.send(this.#paketa);
        } catch {
          // Kanali u mbyll mes kohe; heqja bëhet te `onclose`.
        }
        this.#ndrysho({ vizitore: this.#kanalet.size, gabimi: null });
        // Ftesa tjetër përgatitet vetëm tani, që kodi QR të mos ndërrohet nën
        // hundën e atij që po e skanon.
        void this.#hapFtese();
      };

      dc.onclose = () => {
        this.#kanalet.delete(dc);
        this.#lidhjet.delete(pc);
        pc.close();
        this.#ndrysho({ vizitore: this.#kanalet.size });
      };

      pc.oniceconnectionstatechange = () => {
        // Dështimi para se kanali të hapet e lë ftesën pa përgjigje të mirë;
        // atëherë duhet një ftesë e re, përndryshe kodi QR rri i pavlefshëm.
        if (pc.iceConnectionState !== 'failed' || dc.readyState === 'open') return;

        this.#lidhjet.delete(pc);
        pc.close();
        this.#ndrysho({
          dukeLidhur: false,
          gabimi:
            'Lidhja nuk u ngrit. A janë të dy telefonat në të njëjtin wifi? '
            + 'Ka rrjeta që i ndalojnë lidhjet mes pajisjeve.',
        });
        void this.#hapFtese();
      };

      await pc.setLocalDescription(await pc.createOffer());
      await mbledhKandidatet(pc);

      const sdp = pc.localDescription?.sdp;
      const sinjali = sdp ? sinjaliNgaSdp(sdp, 'ftese') : null;

      if (!sinjali) {
        this.#ndrysho({ gabimi: 'Ftesa nuk u përgatit; provoje sërish.' });
        pc.close();
        return;
      }

      if (sinjali.adresat.length === 0) {
        this.#ndrysho({
          gabimi: 'Nuk u gjet asnjë adresë në rrjetë. A është telefoni në wifi?',
        });
        pc.close();
        return;
      }

      this.#pritja = { pc, ufrag: sinjali.ufrag };
      this.#ndrysho({ ftesa: paketoSinjalin(sinjali), gabimi: null });
    } catch {
      this.#ndrysho({ gabimi: 'Ftesa nuk u përgatit; provoje sërish.' });
    }
  }

  /**
   * Pranon përgjigjen e një vizitori. Kthen `false` nëse kodi nuk i shkon ftesës.
   *
   * `ref` kontrollohet kundër ftesës që pret: një përgjigje e vjetër — kodi i
   * mbetur i hapur në ekranin e dikujt — do të aplikohej mbi ftesën e re dhe
   * lidhja do të vdiste në heshtje.
   */
  async pergjigju(kodi: string): Promise<boolean> {
    if (this.#mbyllur) return false;
    // E njëjta paketë vjen nga dy rrugë; e dyta nuk ka çka të bëjë.
    if (kodi === this.#kodiIPranuar) return true;

    const sinjali = shpaketoSinjalin(kodi);

    if (!sinjali || sinjali.lloji !== 'pergjigje') {
      this.#ndrysho({ gabimi: 'Kodi i skanuar nuk lexohet i tëri.' });
      return false;
    }

    /*
     * Ftesa që mungon dhe ftesa që nuk përputhet janë e njëjta gjë për atë që
     * skanoi, dhe marrin të njëjtin tekst.
     *
     * Pa këtë, kodi që vjen kur `#pritja` është bosh — pra pikërisht sa
     * përgatitet ftesa e radhës, pas një lidhjeje të mbaruar — kalonte pa lënë
     * gjurmë: njeriu ngjitte kodin, shtypte «Lidhu», dhe nuk ndodhte kurrgjë.
     * Kodi është i vjetër gjithsesi, sepse i përgjigjej ftesës së kaluar.
     */
    const pritja = this.#pritja;

    if (!pritja || sinjali.ref !== pritja.ufrag) {
      this.#ndrysho({
        gabimi: 'Ky kod i përgjigjet një ftese të vjetër. Skanoje kodin e tanishëm.',
      });
      return false;
    }

    /*
     * Gjendja shkruhet para `await`-it, e jo pas.
     *
     * Kjo nuk është stil: paketa vjen nga dy rrugë, dhe nëse `storage`-i vjen i
     * pari kurse `BroadcastChannel`-i mbërrin sa pritet `setRemoteDescription`,
     * thirrja e dytë e gjen ende `#pritja`-n të plotë dhe `#kodiIPranuar`-in
     * bosh. Atëherë shkruhen dy përshkrime njëherësh mbi të njëjtën lidhje, e
     * dyta kërcen, dhe kapja e gabimit rrëzon një lidhje që ishte e mirë.
     *
     * Pikërisht kjo dilte një herë në tri te prova me shfletues.
     */
    this.#kodiIPranuar = kodi;
    this.#lidhjet.add(pritja.pc);
    this.#pritja = null;
    this.#ndrysho({ dukeLidhur: true, gabimi: null });

    try {
      await pritja.pc.setRemoteDescription({
        type: 'answer',
        sdp: sdpNgaSinjali(sinjali),
      });

      // Skeda që e skanoi kodin pret pohimin, që t'i thotë njeriut «mbyllu».
      this.#skedat?.postMessage({ pranuar: kodi });

      return true;
    } catch {
      this.#kodiIPranuar = null;
      this.#lidhjet.delete(pritja.pc);
      pritja.pc.close();
      this.#ndrysho({ dukeLidhur: false, gabimi: 'Lidhja nuk u ngrit; provoje sërish.' });
      void this.#hapFtese();
      return false;
    }
  }

  /** Dërgon pamjen e re te çdo vizitor i lidhur. */
  transmeto(paketa: string): void {
    this.#paketa = paketa;

    for (const dc of this.#kanalet) {
      if (dc.readyState !== 'open') continue;
      try {
        dc.send(paketa);
      } catch {
        // Kanali po mbyllet; `onclose` e heq.
      }
    }
  }

  /** Përgatit një ftesë të re, pasi diçka shkoi keq. */
  rifillo(): void {
    void this.#hapFtese();
  }

  mbyll(): void {
    this.#mbyllur = true;
    window.removeEventListener('storage', this.#ngaRuajtja);
    this.#skedat?.close();
    this.#pritja?.pc.close();
    for (const dc of this.#kanalet) dc.close();
    for (const pc of this.#lidhjet) pc.close();
    this.#kanalet.clear();
    this.#lidhjet.clear();
  }
}

/** Adresa e ftesës, e gatshme për kod QR. */
export function adresaEFtesesNgaFaqja(ftesa: string): string {
  return adresaEFteses(window.location.href, ftesa);
}

/* ── Vizitori: ai që shikon ─────────────────────────────────────────────── */

export type GjendjaEVizitorit = {
  /** Paketa e përgjigjes që tregohet si kod QR. */
  pergjigja: string | null;
  lidhur: boolean;
  /** Paketa e fundit e pamjes që mbërriti. */
  paketa: string | null;
  /** Ora e paketës së fundit. */
  kur: number | null;
  gabimi: string | null;
};

export class Vizitori {
  #njofto: (gjendja: GjendjaEVizitorit) => void;
  #gjendja: GjendjaEVizitorit = {
    pergjigja: null,
    lidhur: false,
    paketa: null,
    kur: null,
    gabimi: null,
  };

  #kodi: string;
  #pc: RTCPeerConnection | null = null;
  #mbyllur = false;

  constructor(kodiIFteses: string, njofto: (gjendja: GjendjaEVizitorit) => void) {
    this.#kodi = kodiIFteses;
    this.#njofto = njofto;
  }

  #ndrysho(pjesa: Partial<GjendjaEVizitorit>): void {
    if (this.#mbyllur) return;
    this.#gjendja = { ...this.#gjendja, ...pjesa };
    this.#njofto(this.#gjendja);
  }

  async nis(): Promise<void> {
    if (!kaWebRTC()) {
      this.#ndrysho({ gabimi: 'Ky shfletues nuk e mban lidhjen e drejtpërdrejtë.' });
      return;
    }

    const ftesa = shpaketoSinjalin(this.#kodi);

    if (!ftesa || ftesa.lloji !== 'ftese') {
      this.#ndrysho({ gabimi: 'Kjo ftesë nuk lexohet e tëra.' });
      return;
    }

    try {
      const pc = lidhjeERe();
      this.#pc = pc;

      // Kanalin e hap strehuesi; kjo anë vetëm e pranon.
      pc.ondatachannel = (ngjarja) => {
        const dc = ngjarja.channel;

        dc.onopen = () => this.#ndrysho({ lidhur: true, gabimi: null });
        dc.onclose = () => this.#ndrysho({ lidhur: false });
        dc.onmessage = (mesazhi) => {
          if (typeof mesazhi.data === 'string') {
            this.#ndrysho({ paketa: mesazhi.data, kur: Date.now(), lidhur: true });
          }
        };
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          this.#ndrysho({
            lidhur: false,
            gabimi:
              'Lidhja nuk u ngrit. A janë të dy telefonat në të njëjtin wifi? '
              + 'Ka rrjeta që i ndalojnë lidhjet mes pajisjeve.',
          });
        }
        if (pc.iceConnectionState === 'disconnected') {
          this.#ndrysho({ lidhur: false });
        }
      };

      await pc.setRemoteDescription({ type: 'offer', sdp: sdpNgaSinjali(ftesa) });
      await pc.setLocalDescription(await pc.createAnswer());
      await mbledhKandidatet(pc);

      const sdp = pc.localDescription?.sdp;
      const sinjali = sdp ? sinjaliNgaSdp(sdp, 'pergjigje', ftesa.ufrag) : null;

      if (!sinjali) {
        this.#ndrysho({ gabimi: 'Përgjigja nuk u përgatit; hape lidhjen sërish.' });
        return;
      }

      this.#ndrysho({ pergjigja: paketoSinjalin(sinjali), gabimi: null });
    } catch {
      this.#ndrysho({ gabimi: 'Përgjigja nuk u përgatit; hape lidhjen sërish.' });
    }
  }

  mbyll(): void {
    this.#mbyllur = true;
    this.#pc?.close();
  }
}

/* ── Skeda e dytë: dorëzimi i përgjigjes ────────────────────────────────── */

/**
 * Dërgon paketën te skeda e lojës dhe pret pohimin.
 *
 * Pohimi ka kuptim: pa të, kjo skedë do të thoshte „u dërgua" edhe kur skeda e
 * lojës nuk është hapur fare — dhe atëherë njeriu pret kot para një ekrani që
 * i thotë se puna mbaroi. Me të, heshtja bëhet udhëzim: kopjoje kodin.
 *
 * Kthen funksionin e pastrimit.
 */
export function dergoPergjigjen(kodi: string, onPohim: () => void): () => void {
  let kanali: BroadcastChannel | null = null;

  if (typeof BroadcastChannel !== 'undefined') {
    kanali = new BroadcastChannel(KANALI_I_SKEDAVE);
    kanali.onmessage = (ngjarja) => {
      const pranuar = (ngjarja.data as { pranuar?: unknown } | null)?.pranuar;
      if (pranuar === kodi) onPohim();
    };
    kanali.postMessage({ pergjigja: kodi });
  }

  // Rruga rezervë: ngjarja `storage` bie te skedat e tjera të së njëjtës faqe.
  try {
    window.localStorage.setItem(CELESI, JSON.stringify({ pergjigja: kodi, kur: Date.now() }));
  } catch {
    // Ruajtja e ndaluar (dritare private) nuk e prish rrugën e parë.
  }

  return () => kanali?.close();
}
