/**
 * Mënyra e tretë e lidhjes — një kod i vetëm, dhe sinjalizimi te vetë origjina.
 *
 * Kjo e bashkon atë që dy mënyrat e tjera e kishin secila gjysmë: kodin e
 * shkurtër të mënyrës me server, dhe mungesën e një të treti të mënyrës pa
 * server. Serveri që i takon të dyja anët është i yni — `api/sinjali.ts`, te e
 * njëjta adresë ku rri vetë aplikacioni — dhe rri atje me kërkesë të shprehur
 * të pronarit (pika 1).
 *
 * Ajo që kalon nëpër të është pikërisht paketa e `sinjalizimi.ts`: të njëjtat
 * bajte që te mënyra pa server kalojnë nëpër dy kode QR. Kështu kodeku i SDP-së,
 * kontrolli i alfabetit dhe `ref`-i i përgjigjes janë të njëjtët — një vend i
 * vetëm, i provuar tashmë, dhe jo një format i dytë që del jashtë sinkronie.
 *
 * **`iceServers` rri i zbrazët**, si te `lidhja.ts` dhe për të njëjtën arsye
 * (pika 7): pa STUN e pa TURN mblidhen vetëm kandidatë `typ host`, prandaj
 * asnjë server i tretë nuk kontaktohet dhe lidhja del vetëm brenda së njëjtës
 * rrjetë. Pra kjo mënyrë kërkon që të dy telefonat të rrinë te i njëjti wifi —
 * e njëjta kërkesë si mënyra pa server, por me një kod në vend të dy skanimeve.
 * Kush luan nëpër rrjeta të ndryshme e ka mënyrën me kod të PeerJS-it, e cila
 * mban relenjat e veta. `VITE_ICE_SERVERS` e ndërron këtë gjatë ndërtimit, për
 * atë që ka një TURN të vetin — dhe e zbrazët, si te prodhimi, do të thotë
 * askush.
 *
 * Serveri preket vetëm sa zgjat shtrëngimi i duarve. Sapo kanali hapet, asnjë
 * kërkesë nuk niset më: pikët kalojnë drejt mes dy telefonave, dhe as nuk e
 * shohin atë shteg. Kjo është ndryshe nga PeerJS-i, i cili e mban prizën hapur
 * tërë mbrëmjen.
 */

import { kodiNgaBajtet } from './kodi.ts';
import { kaWebRTC, mbledhKandidatet } from './lidhja.ts';
import {
  paketoSinjalin,
  sdpNgaSinjali,
  shpaketoSinjalin,
  sinjaliNgaSdp,
} from './sinjalizimi.ts';
import {
  AFATI_I_FTESES,
  adresaESinjalit,
  pritjaEPyetjes,
  serveratEICE,
  type Roli,
} from './takimi.ts';

/**
 * Një kod i ri i rastit.
 *
 * Rri këtu e jo te `kodi.ts`, sepse ai modul nuk njeh asnjë API shfletuesi me
 * qëllim (pika 1): bajtet i vijnë nga jashtë, që provat t'i japin të njohura.
 */
export function kodIRi(): string | null {
  const bajtet = new Uint8Array(8);
  crypto.getRandomValues(bajtet);
  return kodiNgaBajtet(bajtet);
}

/** Emri i kanalit të dhënash — i njëjti si te mënyra pa server. */
const KANALI = 'pikët';

/** Sa pritet një kërkesë te serveri ynë para se të quhet e dështuar. */
const AFATI_I_KERKESES = 15_000;

/**
 * Sa pritet kanali të hapet pasi përgjigja u dërgua.
 *
 * Brenda së njëjtës rrjetë kandidatët janë `typ host` dhe shtrëngimi mbaron për
 * pak sekonda; një kanal që nuk u hap brenda kësaj kohe nuk do të hapet më —
 * ftesa i shkoi dikujt tjetër, ose telefoni tjetër u ngrit nga tavolina.
 */
const AFATI_I_KANALIT = 12_000;

/**
 * Sa herë provohet e tëra — ftesë e re, përgjigje e re — para se të dorëzohet.
 *
 * Dy veta që e skanojnë kodin njëkohësisht e marrin të dy të njëjtën ftesë, dhe
 * strehuesi i përgjigjet vetëm njërit. I dyti ka nevojë për ftesën e radhës, e
 * cila vjen brenda pak sekondash.
 */
const PROVAT_E_KANALIT = 4;

function lidhjeERe(): RTCPeerConnection {
  return new RTCPeerConnection({ iceServers: serveratEICE(import.meta.env?.VITE_ICE_SERVERS) });
}

/** Emri i vendit të ruajtjes, ashtu si e thotë serveri te `x-takimi`. */
export type Vendi = 'upstash' | 'kujtesa' | null;

function vendiNgaKoka(pergjigja: Response): Vendi {
  const thene = pergjigja.headers.get('x-takimi');
  return thene === 'upstash' || thene === 'kujtesa' ? thene : null;
}

/** Kërkesa me afat: pa të, një portal wifi-je e le premtimin të varur përgjithmonë. */
async function kerko(adresa: string, cilesimet?: RequestInit): Promise<Response> {
  const ndalesa = new AbortController();
  const afati = window.setTimeout(() => ndalesa.abort(), AFATI_I_KERKESES);

  try {
    return await fetch(adresa, { ...cilesimet, signal: ndalesa.signal, cache: 'no-store' });
  } finally {
    window.clearTimeout(afati);
  }
}

/**
 * Shkruan një varg te serveri.
 *
 * `zene` është përgjigje e ligjshme e jo gabim: dikush tjetër i erdhi kësaj
 * ftese i pari, dhe kjo anë ka nevojë vetëm për ftesën e radhës.
 */
async function shkruaj(
  rrenja: string,
  kodi: string,
  roli: Roli,
  trupi: string,
): Promise<{ vendi: Vendi; zene: boolean }> {
  const pergjigja = await kerko(adresaESinjalit(rrenja, kodi, roli), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ kodi, roli, trupi }),
  });

  if (pergjigja.status === 409) return { vendi: vendiNgaKoka(pergjigja), zene: true };
  if (!pergjigja.ok) throw new Error(`sinjali ${pergjigja.status}`);
  return { vendi: vendiNgaKoka(pergjigja), zene: false };
}

/** Fshin një varg. Heshtja te dështimi është me qëllim: kjo është pastrim. */
async function fshi(rrenja: string, kodi: string, roli: Roli): Promise<void> {
  try {
    await kerko(adresaESinjalit(rrenja, kodi, roli), { method: 'DELETE' });
  } catch {
    // Vargu vdes vetë brenda `JETA` sekondash gjithsesi.
  }
}

/** Lexon një varg nga serveri. `null` do të thotë «ende nuk është shkruar». */
async function lexo(
  rrenja: string,
  kodi: string,
  roli: Roli,
): Promise<{ trupi: string | null; vendi: Vendi }> {
  const pergjigja = await kerko(adresaESinjalit(rrenja, kodi, roli));
  const vendi = vendiNgaKoka(pergjigja);

  if (pergjigja.status === 404) return { trupi: null, vendi };
  if (!pergjigja.ok) throw new Error(`sinjali ${pergjigja.status}`);

  const lexuar = (await pergjigja.json()) as { trupi?: unknown };
  return { trupi: typeof lexuar.trupi === 'string' ? lexuar.trupi : null, vendi };
}

const fle = (sa: number) => new Promise((zgjidh) => window.setTimeout(zgjidh, sa));

/* ── Strehuesi: ai që mban pikët ────────────────────────────────────────── */

export type GjendjaEStrehuesitMeTakim = {
  kodi: string | null;
  vizitore: number;
  gabimi: string | null;
  dukeProvuar: boolean;
  /**
   * Ku e mban serveri vargun.
   *
   * `kujtesa` do të thotë se asnjë vend ruajtjeje nuk është lidhur, pra lidhja
   * do të dalë herë po e herë jo — dhe ekrani e thotë. Një mënyrë që dështon një
   * herë në tri është më e keqe se një që thotë hapur se nuk është ngritur.
   */
  vendi: Vendi;
};

export class StrehuesiMeTakim {
  #njofto: (gjendja: GjendjaEStrehuesitMeTakim) => void;
  #gjendja: GjendjaEStrehuesitMeTakim = {
    kodi: null,
    vizitore: 0,
    gabimi: null,
    dukeProvuar: true,
    vendi: null,
  };

  #kodi: string;
  #rrenja: string;
  #paketa: string;
  #kanalet = new Set<RTCDataChannel>();
  #lidhjet = new Set<RTCPeerConnection>();
  #pritja: RTCPeerConnection | null = null;
  #mbyllur = false;

  constructor(
    kodi: string,
    rrenja: string,
    paketa: string,
    njofto: (gjendja: GjendjaEStrehuesitMeTakim) => void,
  ) {
    this.#kodi = kodi;
    this.#rrenja = rrenja;
    this.#paketa = paketa;
    this.#njofto = njofto;
  }

  #ndrysho(pjesa: Partial<GjendjaEStrehuesitMeTakim>): void {
    if (this.#mbyllur) return;
    this.#gjendja = { ...this.#gjendja, ...pjesa };
    this.#njofto(this.#gjendja);
  }

  async nis(): Promise<void> {
    if (!kaWebRTC()) {
      this.#ndrysho({
        gabimi: 'Ky shfletues nuk e mban lidhjen e drejtpërdrejtë.',
        dukeProvuar: false,
      });
      return;
    }

    await this.#rrethi();
  }

  /** «Provo sërish» pasi provat kanë pushuar. */
  zgjohu(): void {
    if (this.#mbyllur || this.#gjendja.dukeProvuar) return;
    this.#ndrysho({ gabimi: null, dukeProvuar: true });
    void this.#rrethi();
  }

  /**
   * Një ftesë, dhe pastaj pyetja për përgjigjen e saj.
   *
   * Rrotullohet: sapo një vizitor lidhet, ftesa e radhës shkruhet për të dytin.
   * Ftesa e re e fshin përgjigjen e vjetër te serveri, prandaj `ref`-i i
   * pakrahasueshëm nuk mbetet pezull (pika 7).
   */
  async #rrethi(): Promise<void> {
    while (!this.#mbyllur) {
      let pc: RTCPeerConnection | null = null;

      try {
        pc = lidhjeERe();
        const ufrag = await this.#shkruajFtesen(pc);
        this.#pritja = pc;

        const u_lidh = await this.#pritPergjigjen(pc, ufrag);
        if (this.#mbyllur) return;

        // Pa përgjigje brenda afatit, ftesa përtërihet: kredencialet ICE të një
        // lidhjeje të harruar nuk ia vlen të mbahen tërë mbrëmjen.
        if (!u_lidh) {
          this.#pritja = null;
          pc.close();
          continue;
        }

        this.#lidhjet.add(pc);
        this.#pritja = null;
      } catch {
        pc?.close();
        this.#pritja = null;

        if (this.#mbyllur) return;
        this.#ndrysho({
          kodi: null,
          gabimi: 'Serveri i lidhjes nuk u kap. A ka internet ky telefon?',
          dukeProvuar: false,
        });
        return;
      }
    }
  }

  /** Përgatit një ftesë të re dhe e shkruan te serveri. Kthen `ufrag`-un e saj. */
  async #shkruajFtesen(pc: RTCPeerConnection): Promise<string> {
    const dc = pc.createDataChannel(KANALI);

    dc.onopen = () => {
      this.#kanalet.add(dc);
      try {
        dc.send(this.#paketa);
      } catch {
        // Kanali u mbyll mes kohe; heqja bëhet te `onclose`.
      }
      this.#ndrysho({ vizitore: this.#kanalet.size, gabimi: null });
    };

    dc.onclose = () => {
      this.#kanalet.delete(dc);
      this.#lidhjet.delete(pc);
      pc.close();
      this.#ndrysho({ vizitore: this.#kanalet.size });
    };

    await pc.setLocalDescription(await pc.createOffer());
    await mbledhKandidatet(pc);

    const sdp = pc.localDescription?.sdp;
    const sinjali = sdp ? sinjaliNgaSdp(sdp, 'ftese') : null;
    if (!sinjali) throw new Error('ftesa nuk u përgatit');

    if (sinjali.adresat.length === 0) {
      this.#ndrysho({
        gabimi: 'Nuk u gjet asnjë adresë në rrjetë. A është telefoni në wifi?',
      });
    }

    const { vendi } = await shkruaj(this.#rrenja, this.#kodi, 'ftese', paketoSinjalin(sinjali));
    this.#ndrysho({ kodi: this.#kodi, gabimi: null, dukeProvuar: true, vendi });

    return sinjali.ufrag;
  }

  /** Pyet serverin derisa përgjigja e kësaj ftese mbërrin, ose afati mbaron. */
  async #pritPergjigjen(pc: RTCPeerConnection, ufrag: string): Promise<boolean> {
    const deri = Date.now() + AFATI_I_FTESES;

    for (let prova = 1; !this.#mbyllur && Date.now() < deri; prova++) {
      await fle(pritjaEPyetjes(prova));
      if (this.#mbyllur) return false;

      const { trupi } = await lexo(this.#rrenja, this.#kodi, 'pergjigje');
      if (trupi === null) continue;

      const sinjali = shpaketoSinjalin(trupi);

      // Një përgjigje e ftesës së kaluar do të vriste në heshtje lidhjen e re.
      if (!sinjali || sinjali.lloji !== 'pergjigje' || sinjali.ref !== ufrag) continue;

      await pc.setRemoteDescription({ type: 'answer', sdp: sdpNgaSinjali(sinjali) });

      // Ftesa u konsumua: hiqet menjëherë, që kush skanon pikërisht tani të mos
      // i përgjigjet një ftese që nuk e pret më askush. E radhës vjen brenda
      // pak sekondash, dhe ana që shikon pyet derisa ajo të vijë.
      await fshi(this.#rrenja, this.#kodi, 'ftese');
      return true;
    }

    return false;
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

  mbyll(): void {
    this.#mbyllur = true;
    for (const dc of this.#kanalet) dc.close();
    for (const pc of this.#lidhjet) pc.close();
    this.#pritja?.close();
    this.#kanalet.clear();
    this.#lidhjet.clear();
    this.#pritja = null;
  }
}

/* ── Vizitori: ai që shikon ─────────────────────────────────────────────── */

export type GjendjaEVizitoritMeTakim = {
  lidhur: boolean;
  paketa: string | null;
  kur: number | null;
  gabimi: string | null;
  dukeProvuar: boolean;
};

export class VizitoriMeTakim {
  #njofto: (gjendja: GjendjaEVizitoritMeTakim) => void;
  #gjendja: GjendjaEVizitoritMeTakim = {
    lidhur: false,
    paketa: null,
    kur: null,
    gabimi: null,
    dukeProvuar: true,
  };

  #kodi: string;
  #rrenja: string;
  #pc: RTCPeerConnection | null = null;
  #mbyllur = false;

  constructor(
    kodi: string,
    rrenja: string,
    njofto: (gjendja: GjendjaEVizitoritMeTakim) => void,
  ) {
    this.#kodi = kodi;
    this.#rrenja = rrenja;
    this.#njofto = njofto;
  }

  #ndrysho(pjesa: Partial<GjendjaEVizitoritMeTakim>): void {
    if (this.#mbyllur) return;
    this.#gjendja = { ...this.#gjendja, ...pjesa };
    this.#njofto(this.#gjendja);
  }

  async nis(): Promise<void> {
    if (!kaWebRTC()) {
      this.#ndrysho({
        gabimi: 'Ky shfletues nuk e mban lidhjen e drejtpërdrejtë.',
        dukeProvuar: false,
      });
      return;
    }

    await this.#provo();
  }

  zgjohu(): void {
    if (this.#mbyllur || this.#gjendja.dukeProvuar) return;
    this.#ndrysho({ gabimi: null, dukeProvuar: true });
    void this.#provo();
  }

  /**
   * Ftesë, përgjigje, dhe pritje — dhe nëse kanali nuk hapet, e tëra nga e para.
   *
   * Prova e dytë nuk është tepri: dy veta që e skanojnë kodin njëkohësisht e
   * marrin të dy të njëjtën ftesë, dhe strehuesi i përgjigjet vetëm njërit. Pa
   * këtë rreth, i dyti rrinte te «Duke u lidhur…» pa fund — pra pikërisht ai
   * që u ul i fundit te tavolina nuk i shihte kurrë pikët.
   */
  async #provo(): Promise<void> {
    try {
      let eProvuara: string | null = null;

      for (let rrethi = 1; rrethi <= PROVAT_E_KANALIT && !this.#mbyllur; rrethi++) {
        const ftesa = await this.#merrFtesen(eProvuara);
        if (this.#mbyllur) return;

        if (!ftesa) {
          this.#ndrysho({
            gabimi: 'Ky kod nuk u gjet. A rri hapur paneli te telefoni që mban pikët?',
            dukeProvuar: false,
          });
          return;
        }

        eProvuara = ftesa;
        if (await this.#pergjigju(ftesa)) return;
      }

      if (this.#mbyllur) return;
      this.#ndrysho({
        lidhur: false,
        dukeProvuar: false,
        gabimi: 'Telefoni që mban pikët nuk u përgjigj. A rri hapur paneli atje?',
      });
    } catch {
      if (this.#mbyllur) return;
      this.#ndrysho({
        lidhur: false,
        gabimi: 'Serveri i lidhjes nuk u kap. A ka internet ky telefon?',
        dukeProvuar: false,
      });
    }
  }

  /**
   * Pyet derisa të vijë një ftesë, ose derisa provat mbarojnë.
   *
   * `perveq` është ajo që kjo anë e provoi tashmë dhe nuk e fitoi. Pa atë
   * krahasim, rrethi tjetër do t'i përgjigjej po asaj ftese — dhe do ta humbte
   * sërish, sepse përgjigja e saj është e zënë tashmë.
   */
  async #merrFtesen(perveq: string | null = null): Promise<string | null> {
    for (let prova = 1; !this.#mbyllur && prova <= 15; prova++) {
      const { trupi } = await lexo(this.#rrenja, this.#kodi, 'ftese');
      if (trupi !== null && trupi !== perveq) return trupi;
      await fle(pritjaEPyetjes(prova));
    }

    return null;
  }

  /** Kthen `true` vetëm nëse kanali u hap vërtet brenda afatit. */
  async #pergjigju(kodiIFteses: string): Promise<boolean> {
    const ftesa = shpaketoSinjalin(kodiIFteses);

    if (!ftesa || ftesa.lloji !== 'ftese') {
      this.#ndrysho({ gabimi: 'Kjo ftesë nuk lexohet e tëra.', dukeProvuar: false });
      return false;
    }

    const pc = lidhjeERe();
    this.#pc?.close();
    this.#pc = pc;

    let thuaj: ((u: boolean) => void) | null = null;
    const hapur = new Promise<boolean>((zgjidh) => {
      thuaj = zgjidh;
    });
    const mbaro = (u: boolean) => {
      thuaj?.(u);
      thuaj = null;
    };

    // Kanalin e hap strehuesi; kjo anë vetëm e pranon.
    pc.ondatachannel = (ngjarja) => {
      const dc = ngjarja.channel;

      dc.onopen = () => {
        this.#ndrysho({ lidhur: true, gabimi: null, dukeProvuar: false });
        mbaro(true);
      };
      dc.onclose = () => this.#ndrysho({ lidhur: false });
      dc.onmessage = (mesazhi) => {
        if (typeof mesazhi.data === 'string') {
          this.#ndrysho({ paketa: mesazhi.data, kur: Date.now(), lidhur: true });
        }
      };
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState !== 'failed') return;
      this.#ndrysho({
        lidhur: false,
        gabimi:
          'Lidhja nuk u ngrit. A janë të dy telefonat në të njëjtin wifi? '
          + 'Ka rrjeta që i ndalojnë lidhjet mes pajisjeve.',
      });
      mbaro(false);
    };

    await pc.setRemoteDescription({ type: 'offer', sdp: sdpNgaSinjali(ftesa) });
    await pc.setLocalDescription(await pc.createAnswer());
    await mbledhKandidatet(pc);

    const sdp = pc.localDescription?.sdp;
    const sinjali = sdp ? sinjaliNgaSdp(sdp, 'pergjigje', ftesa.ufrag) : null;

    if (!sinjali) {
      this.#ndrysho({ gabimi: 'Përgjigja nuk u përgatit; provoje sërish.', dukeProvuar: false });
      return false;
    }

    /*
     * Përgjigja pa asnjë adresë nuk dërgohet.
     *
     * Mbledhja e kandidatëve ka afat (`mbledhKandidatet`), dhe te një telefon i
     * ngarkuar ai afat mund të mbarojë para se të vijë qoftë një i vetëm.
     * Atëherë dilte një përgjigje e ligjshme e pa asnjë adresë: strehuesi e
     * pranonte, e prishte ftesën e vet për të, dhe pastaj priste një shtrëngim
     * që nuk kishte nga të vinte — pra lidhja dështonte **në heshtje**, dhe
     * bashkë me të edhe ajo e kujtdo tjetër që kishte skanuar atë ftesë.
     * Rrethi tjetër e provon sërish, me një ftesë të re.
     */
    if (sinjali.adresat.length === 0) {
      this.#ndrysho({
        gabimi: 'Nuk u gjet asnjë adresë në rrjetë. A është telefoni në wifi?',
      });
      pc.close();
      return false;
    }

    const { zene } = await shkruaj(
      this.#rrenja,
      this.#kodi,
      'pergjigje',
      paketoSinjalin(sinjali),
    );

    // Dikush tjetër i erdhi kësaj ftese i pari. Pritja këtu do të ishte kot: kjo
    // anë ka nevojë për ftesën e radhës, dhe ajo vjen brenda pak sekondash.
    if (zene) {
      pc.close();
      return false;
    }

    const afati = window.setTimeout(() => mbaro(false), AFATI_I_KANALIT);

    try {
      return await hapur;
    } finally {
      window.clearTimeout(afati);
      if (!this.#gjendja.lidhur) pc.close();
    }
  }

  mbyll(): void {
    this.#mbyllur = true;
    this.#pc?.close();
    this.#pc = null;
  }
}
