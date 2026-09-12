/**
 * Mënyra e dytë e lidhjes — me kod të shkurtër, përmes një serveri sinjalizimi.
 *
 * Kjo është një **shmangje me qëllim** nga pika 1 e `CLAUDE.md`-së, dhe rri e
 * ndarë te ky skedar pikërisht që shmangja të mos përhapet. Mënyra pa server
 * (`lidhja.ts`) mbetet ajo pa asnjë të tretë; kjo hyn vetëm kur përdoruesi e
 * zgjedh me dorë, dhe paneli i thotë hapur çka del nga pajisja.
 *
 * Përse ekziston: shkëmbimi pa server kërkon dy skanime, sepse gishtëza DTLS dhe
 * kredencialet ICE nuk hyjnë te tetë karaktere dhe duhet të kalojnë nga jashtë.
 * Me një server mes vete, të dyja anët i marrin ato nga serveri, dhe mjafton një
 * kod i shkurtër — një skanim, ose një kod i diktuar me zë. Punon edhe kur të dy
 * telefonat nuk janë në të njëjtin wifi, dhe edhe kur rrjeta i ndan klientët nga
 * njëri-tjetri.
 *
 * Çka del nga pajisja, saktësisht:
 *
 * - **Te serveri i sinjalizimit** (`0.peerjs.com`, reja publike e PeerJS-it):
 *   kodi i lidhjes dhe adresat ICE të pajisjes — pra edhe IP-ja. Serveri i
 *   dorëzon mes vete kredencialet e lidhjes.
 * - **Te relenjat TURN** (`eu-0.turn.peerjs.com`, `us-0.turn.peerjs.com`), dhe
 *   vetëm kur lidhja e drejtpërdrejtë dështon: bajtet e kanalit. Ato bajte janë
 *   të kriptuara me DTLS mes dy pajisjeve, prandaj relenja nuk i lexon pikët —
 *   sheh se dy anë po shkëmbejnë diçka, sa dhe kur.
 * - **Pikët** nuk shkruhen te asnjë server. Kanali është i njëjti kanal WebRTC
 *   si te mënyra pa server, dhe kur të dy telefonat rrinë te i njëjti wifi
 *   zgjidhen kandidatët `typ host` — pra trafiku nuk del fare nga rrjeta.
 *
 * Këto rrinë të shkruara edhe te ekrani, e jo vetëm këtu: kush e zgjedh duhet ta
 * dijë çka zgjodhi.
 *
 * PeerJS-i ngarkohet vetëm kur kjo mënyrë niset (`await import('peerjs')`),
 * prandaj kush nuk e prek fare nuk e shkarkon fare. Ky është edhe kushti nën të
 * cilin varësia e katërt është e pranueshme.
 *
 * ## Çka e mban të gjallë
 *
 * Serveri i sinjalizimit është i dikujt tjetër, priza e telefonit vdes sa hyn
 * në xhep, dhe reja publike e PeerJS-it bie sa herë t'i teket. Deri tani secila
 * nga këto e linte kodin të vdekur derisa dikush ta rihapte skedën — pra
 * pikërisht te tavolina, ku askush nuk shikon konsolën. Katër gjëra e ndalojnë
 * atë, dhe asnjëra nuk guxon të hiqet:
 *
 * - **Hapja ka afat** (`AFATI_I_HAPJES`). Një server që e pranon prizën dhe nuk
 *   përgjigjet më nuk nxjerr asnjë gabim — pra pa afat, «Duke marrë kodin…»
 *   rrinte përgjithmonë.
 * - **Dështimi provohet sërish, me largim** (`pritjaEProves`). Strehuesi provon
 *   pa fund, sepse paneli i tij rri hapur tërë mbrëmjen; ana që shikon provon
 *   `PROVAT_E_VIZITORIT` herë dhe pastaj pret butonin.
 * - **Kodi nuk ndërrohet mes provave.** Kush e shkroi kodin në një copë letër
 *   nuk ka pse ta rishkruajë sepse wifi-ja pati një çast të keq. Ndërrohet
 *   vetëm kur serveri e refuzon si të zënë **para** se ta ketë pranuar një herë.
 * - **Rilidhja e butë nuk i vret lidhjet e hapura.** `peer.destroy()` i mbyll të
 *   gjitha bashkë me vete; `reconnect()` i mban. Prandaj serveri i humbur
 *   rikapet me të dytin, dhe një vizitor që rri duke shikuar nuk e vë re fare.
 *
 * Dhe të dyja anët zgjohen vetë te `online` dhe te kthimi i skedës në pamje:
 * telefoni që fjeti gjysmë ore e ka prizën e vdekur pa e ditur, dhe pritja e
 * radhës do të ishte gjysmë minute pas një preke që nuk e bën kush.
 */

import type { DataConnection, Peer } from 'peerjs';

import {
  AFATI_I_HAPJES,
  PROVAT_E_VIZITORIT,
  idIStrehuesit,
  kodiNgaBajtet,
  pritjaEProves,
  serverat,
  shpjegimi,
  veprimiPasGabimit,
  type Serveri,
} from './kodi.ts';

/** Bajte të rastit për kodin. */
function bajteTeRastit(sa: number): Uint8Array {
  const bajtet = new Uint8Array(sa);
  crypto.getRandomValues(bajtet);
  return bajtet;
}

/** Ngarkon PeerJS-in vetëm kur duhet vërtet. */
async function ngarkoPeer(): Promise<typeof Peer> {
  const moduli = await import('peerjs');
  return moduli.Peer;
}

/** Lista e serverave, e lexuar një herë nga ndërtimi. */
function lista(): Serveri[] {
  return serverat(import.meta.env?.VITE_PEER_SERVER);
}

/**
 * Serveri i provës `cila`, ose `undefined` për rejën publike.
 *
 * Rrotullohet: prova e dytë shkon te serveri i dytë, dhe pas të fundit nis
 * prapë nga kreu. Me një server të vetëm — dhe kështu rri te prodhimi — kjo
 * është pa efekt.
 */
function serveriIProves(cila: number): Serveri | undefined {
  const te_gjithe = lista();
  if (te_gjithe.length === 0) return undefined;
  return te_gjithe[cila % te_gjithe.length]!;
}

/**
 * Zgjimi kur ka kuptim të provohet sërish.
 *
 * `online` është i qartë. Kthimi i skedës në pamje jo aq, dhe është pikërisht
 * ai që mungonte: Androidi dhe iOS-i e vrasin prizën e një skede të fshehur pa
 * i thënë asgjë faqes, prandaj telefoni i nxjerrë nga xhepi gjeti gjithmonë një
 * lidhje të vdekur dhe një pritje që sapo kishte nisur.
 */
function degjoZgjimin(zgjohu: () => void): () => void {
  const nePamje = () => {
    if (document.visibilityState === 'visible') zgjohu();
  };

  window.addEventListener('online', zgjohu);
  document.addEventListener('visibilitychange', nePamje);

  return () => {
    window.removeEventListener('online', zgjohu);
    document.removeEventListener('visibilitychange', nePamje);
  };
}

/** A e di shfletuesi se rrjeti mungon fare. */
function jashteRrjetit(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/* ── Strehuesi: ai që mban pikët ────────────────────────────────────────── */

export type GjendjaEStrehuesitMeKod = {
  /** Kodi që tregohet, ose `null` sa përgatitet ose sa serveri rri i humbur. */
  kodi: string | null;
  vizitore: number;
  gabimi: string | null;
  /** A do të provohet sërish vetvetiu — qoftë tani, qoftë pas pritjes. */
  dukeProvuar: boolean;
  /** Sa dështime me radhë; zero sapo serveri kapet. */
  deshtime: number;
};

export class StrehuesiMeKod {
  #njofto: (gjendja: GjendjaEStrehuesitMeKod) => void;
  #gjendja: GjendjaEStrehuesitMeKod = {
    kodi: null,
    vizitore: 0,
    gabimi: null,
    dukeProvuar: true,
    deshtime: 0,
  };

  #Peer: typeof Peer | null = null;
  #peer: Peer | null = null;
  #lidhjet = new Set<DataConnection>();
  #paketa: string;

  /** Kodi i kësaj mbrëmjeje. Mbahet nëpër prova, që të mos rishkruhet. */
  #kodi: string | null = null;
  /** A e pranoi serveri ndonjëherë këtë kod — vendos çka do të thotë «i zënë». */
  #uPranua = false;
  #deshtime = 0;
  #sprova = 0;
  #afati: number | null = null;
  #ora: number | null = null;
  /**
   * A rri `#provo` brenda punës së vet pikërisht tani.
   *
   * `disconnect()` e nxjerr `disconnected` në çast e jo te radha tjetër, pra
   * rilidhja e butë e thërriste dëgjuesin e vet dhe e numëronte veten dështim:
   * një lidhje e mirë prishej pikërisht sa po ndreqej.
   */
  #nePerpjekje = false;
  #hiqDegjuesit: (() => void) | null = null;
  #mbyllur = false;

  constructor(paketa: string, njofto: (gjendja: GjendjaEStrehuesitMeKod) => void) {
    this.#paketa = paketa;
    this.#njofto = njofto;
  }

  #ndrysho(pjesa: Partial<GjendjaEStrehuesitMeKod>): void {
    if (this.#mbyllur) return;
    this.#gjendja = { ...this.#gjendja, ...pjesa };
    this.#njofto(this.#gjendja);
  }

  async nis(): Promise<void> {
    this.#hiqDegjuesit = degjoZgjimin(() => this.zgjohu());

    try {
      this.#Peer = await ngarkoPeer();
    } catch {
      this.#ndrysho({ gabimi: 'Pjesa e lidhjes me kod nuk u ngarkua.', dukeProvuar: false });
      return;
    }

    if (this.#mbyllur) return;
    this.#hap();
  }

  /** «Provo sërish», ose rrjeti që u kthye: pritja e nisur nga e para. */
  zgjohu(): void {
    if (this.#mbyllur || this.#gjendja.kodi !== null) return;

    this.#deshtime = 0;
    this.#hiqOret();
    this.#provo();
  }

  #hap(): void {
    if (this.#mbyllur || !this.#Peer) return;

    const kodi = this.#kodi ?? kodiNgaBajtet(bajteTeRastit(8));

    if (!kodi) {
      this.#ndrysho({ gabimi: 'Kodi nuk u përgatit; provoje sërish.', dukeProvuar: false });
      return;
    }

    this.#kodi = kodi;
    this.#ndrysho({ dukeProvuar: true });

    const peer = new this.#Peer(idIStrehuesit(kodi), serveriIProves(this.#sprova));
    this.#peer = peer;
    this.#niseAfatin();

    peer.on('open', () => {
      this.#hiqOret();
      this.#deshtime = 0;
      this.#uPranua = true;
      this.#ndrysho({ kodi, gabimi: null, dukeProvuar: false, deshtime: 0 });
    });

    peer.on('connection', (lidhja) => {
      lidhja.on('open', () => {
        this.#lidhjet.add(lidhja);
        // Kush lidhet i merr pikët menjëherë, pa pritur raundin tjetër.
        try {
          lidhja.send(this.#paketa);
        } catch {
          // Lidhja u mbyll mes kohe; heqja bëhet te `close`.
        }
        this.#ndrysho({ vizitore: this.#lidhjet.size });
      });

      lidhja.on('close', () => {
        this.#lidhjet.delete(lidhja);
        this.#ndrysho({ vizitore: this.#lidhjet.size });
      });

      lidhja.on('error', () => {
        this.#lidhjet.delete(lidhja);
        this.#ndrysho({ vizitore: this.#lidhjet.size });
      });
    });

    peer.on('error', (gabimi: { type?: string }) => this.#deshtoi(gabimi?.type ?? ''));

    /*
     * Shkëputja vjen gjithmonë pas një gabimi — `_abort` e thërret vetë — pra
     * pritja është zakonisht e nisur tashmë. Rri si rrjetë sigurie: nëse ajo
     * rrugë ndërron te një version i ardhshëm, kodi nuk mbetet i vdekur pa e
     * thënë kush.
     */
    peer.on('disconnected', () => {
      if (this.#mbyllur || this.#nePerpjekje || this.#ora !== null) return;
      this.#deshtoi('network');
    });
  }

  #niseAfatin(): void {
    if (this.#afati !== null) window.clearTimeout(this.#afati);
    // Serveri që e pranon prizën dhe hesht nuk nxjerr gabim: afati e nxjerr.
    this.#afati = window.setTimeout(() => this.#deshtoi('socket-error'), AFATI_I_HAPJES);
  }

  #hiqOret(): void {
    if (this.#afati !== null) window.clearTimeout(this.#afati);
    if (this.#ora !== null) window.clearTimeout(this.#ora);
    this.#afati = null;
    this.#ora = null;
  }

  #deshtoi(lloji: string): void {
    if (this.#mbyllur) return;

    this.#hiqOret();
    const veprimi = veprimiPasGabimit(lloji);

    if (veprimi === 'ndal') {
      this.#peer?.destroy();
      this.#peer = null;
      this.#ndrysho({ kodi: null, gabimi: shpjegimi(lloji), dukeProvuar: false });
      return;
    }

    /*
     * «I zënë» ka dy kuptime, dhe ndarja e tyre është ajo që e mban kodin të
     * shkruar në letër të vlefshëm: para se serveri ta ketë pranuar një herë,
     * emri i takon vërtet dikujt tjetër dhe duhet një kod tjetër; pas asaj, i
     * zëni jemi ne vetë — regjistrimi i vjetër që serveri ende nuk e ka lëshuar
     * — dhe prova tjetër e gjen të lirë.
     */
    if (veprimi === 'kodTjeter' && !this.#uPranua) this.#kodi = null;

    this.#deshtime++;
    this.#sprova++;
    this.#ndrysho({
      kodi: null,
      gabimi: shpjegimi(lloji),
      deshtime: this.#deshtime,
      dukeProvuar: !jashteRrjetit(),
    });

    // Pa rrjet fare nuk ka çka provohet; `online` e zgjon vetë.
    if (jashteRrjetit()) return;

    this.#ora = window.setTimeout(() => this.#provo(), pritjaEProves(this.#deshtime));
  }

  /**
   * Prova e radhës: e butë kur mundet, e ashpër kur duhet.
   *
   * `destroy()` i mbyll bashkë me vete të gjitha lidhjet e hapura, pra një
   * vizitor që rri duke shikuar do ta humbte pamjen sa herë serveri kollitet.
   * `reconnect()` i mban — dhe e mban edhe emrin — prandaj provohet i pari.
   * Kërkon një peer të shkëputur e jo të shkatërruar, dhe pikërisht atë e
   * siguron rreshti para tij.
   */
  #provo(): void {
    if (this.#mbyllur) return;
    this.#ora = null;
    this.#ndrysho({ dukeProvuar: true });

    const peer = this.#peer;
    this.#nePerpjekje = true;

    try {
      if (peer && !peer.destroyed) {
        try {
          if (!peer.disconnected) peer.disconnect();
          peer.reconnect();
          this.#niseAfatin();
          return;
        } catch {
          // Rrugë e mbyllur; poshtë rri ajo e ashpra.
        }
      }

      peer?.destroy();
      this.#peer = null;
      this.#lidhjet.clear();
      this.#ndrysho({ vizitore: 0 });
      this.#hap();
    } finally {
      this.#nePerpjekje = false;
    }
  }

  /** Dërgon pamjen e re te çdo vizitor i lidhur. */
  transmeto(paketa: string): void {
    this.#paketa = paketa;

    for (const lidhja of this.#lidhjet) {
      if (!lidhja.open) continue;
      try {
        lidhja.send(paketa);
      } catch {
        // Lidhja po mbyllet; `close` e heq.
      }
    }
  }

  mbyll(): void {
    this.#mbyllur = true;
    this.#hiqOret();
    this.#hiqDegjuesit?.();
    this.#hiqDegjuesit = null;
    for (const lidhja of this.#lidhjet) lidhja.close();
    this.#lidhjet.clear();
    this.#peer?.destroy();
    this.#peer = null;
  }
}

/* ── Vizitori: ai që shikon ─────────────────────────────────────────────── */

export type GjendjaEVizitoritMeKod = {
  lidhur: boolean;
  /** Paketa e fundit e pamjes që mbërriti. */
  paketa: string | null;
  kur: number | null;
  gabimi: string | null;
  /** A do të provohet sërish vetvetiu — qoftë tani, qoftë pas pritjes. */
  dukeProvuar: boolean;
  deshtime: number;
};

export class VizitoriMeKod {
  #njofto: (gjendja: GjendjaEVizitoritMeKod) => void;
  #gjendja: GjendjaEVizitoritMeKod = {
    lidhur: false,
    paketa: null,
    kur: null,
    gabimi: null,
    dukeProvuar: true,
    deshtime: 0,
  };

  #kodi: string;
  #Peer: typeof Peer | null = null;
  #peer: Peer | null = null;
  #lidhja: DataConnection | null = null;
  #deshtime = 0;
  #sprova = 0;
  #afati: number | null = null;
  #ora: number | null = null;
  /** Si te strehuesi: `#provo` nuk guxon ta numërojë veten dështim. */
  #nePerpjekje = false;
  #hiqDegjuesit: (() => void) | null = null;
  #mbyllur = false;

  constructor(kodi: string, njofto: (gjendja: GjendjaEVizitoritMeKod) => void) {
    this.#kodi = kodi;
    this.#njofto = njofto;
  }

  #ndrysho(pjesa: Partial<GjendjaEVizitoritMeKod>): void {
    if (this.#mbyllur) return;
    this.#gjendja = { ...this.#gjendja, ...pjesa };
    this.#njofto(this.#gjendja);
  }

  async nis(): Promise<void> {
    this.#hiqDegjuesit = degjoZgjimin(() => this.zgjohu());

    try {
      this.#Peer = await ngarkoPeer();
    } catch {
      this.#ndrysho({ gabimi: 'Pjesa e lidhjes me kod nuk u ngarkua.', dukeProvuar: false });
      return;
    }

    if (this.#mbyllur) return;
    this.#hap();
  }

  /** «Provo sërish», ose rrjeti që u kthye: provat e numëruara nga e para. */
  zgjohu(): void {
    if (this.#mbyllur || this.#gjendja.lidhur) return;

    this.#deshtime = 0;
    this.#hiqOret();
    this.#provo();
  }

  #hap(): void {
    if (this.#mbyllur || !this.#Peer) return;

    this.#ndrysho({ dukeProvuar: true });

    // Emrin e kësaj ane e lëshon serveri: vetëm strehuesi ka nevojë për emër që
    // dihet përpara.
    const peer = new this.#Peer(serveriIProves(this.#sprova) ?? {});
    this.#peer = peer;
    this.#niseAfatin();

    peer.on('open', () => this.#lidhu());
    peer.on('error', (gabimi: { type?: string }) => this.#deshtoi(gabimi?.type ?? ''));

    peer.on('disconnected', () => {
      if (this.#mbyllur || this.#nePerpjekje || this.#ora !== null) return;
      this.#deshtoi('network');
    });
  }

  #lidhu(): void {
    const peer = this.#peer;
    if (this.#mbyllur || !peer) return;

    this.#niseAfatin();
    const lidhja = peer.connect(idIStrehuesit(this.#kodi));
    this.#lidhja = lidhja;

    lidhja.on('open', () => {
      this.#hiqOret();
      this.#deshtime = 0;
      this.#ndrysho({ lidhur: true, gabimi: null, dukeProvuar: false, deshtime: 0 });
    });

    /*
     * Mbyllja e kanalit nuk është fundi i mbrëmjes: telefoni i strehuesit mund
     * të ketë hyrë në xhep. Numrat e fundit rrinë në ekran — ata janë ende ata
     * që u shënuan — dhe lidhja provohet sërish nën to.
     */
    /*
     * Vetëm kanali i tanishëm ka të drejtë të thotë «u shkëput». Pa krahasimin
     * me `#lidhja`, kanali i vjetër që `#provo` sapo e mbylli e thërriste vetë
     * dështimin e radhës — pra çdo rilidhje numërohej dy herë dhe prova e pestë
     * mbërrinte në gjysmë të rrugës.
     */
    lidhja.on('close', () => {
      if (this.#mbyllur || this.#lidhja !== lidhja) return;
      this.#ndrysho({ lidhur: false });
      this.#deshtoi('webrtc');
    });

    lidhja.on('data', (te_dhenat) => {
      if (typeof te_dhenat === 'string') {
        this.#ndrysho({ paketa: te_dhenat, kur: Date.now(), lidhur: true });
      }
    });

    lidhja.on('error', (gabimi: { type?: string }) => {
      if (this.#mbyllur || this.#lidhja !== lidhja) return;
      this.#ndrysho({ lidhur: false });
      this.#deshtoi(gabimi?.type ?? '');
    });
  }

  #niseAfatin(): void {
    if (this.#afati !== null) window.clearTimeout(this.#afati);
    this.#afati = window.setTimeout(() => this.#deshtoi('socket-error'), AFATI_I_HAPJES);
  }

  #hiqOret(): void {
    if (this.#afati !== null) window.clearTimeout(this.#afati);
    if (this.#ora !== null) window.clearTimeout(this.#ora);
    this.#afati = null;
    this.#ora = null;
  }

  #deshtoi(lloji: string): void {
    if (this.#mbyllur) return;

    this.#hiqOret();
    const veprimi = veprimiPasGabimit(lloji);
    this.#deshtime++;
    this.#sprova++;

    /*
     * Ana që shikon nuk provon pa fund. Kur paneli u mbyll ose kodi është i
     * vjetër, provat nuk e ndreqin gjë — dhe ky telefon zakonisht nuk është ai
     * që e nisi mbrëmjen, pra nuk ka kush e shikon. Pas kufirit rri butoni.
     */
    const jep_pas = veprimi === 'ndal'
      || jashteRrjetit()
      || this.#deshtime >= PROVAT_E_VIZITORIT;

    this.#ndrysho({
      lidhur: false,
      gabimi: shpjegimi(lloji),
      deshtime: this.#deshtime,
      dukeProvuar: !jep_pas,
    });

    if (jep_pas) return;

    this.#ora = window.setTimeout(() => this.#provo(), pritjaEProves(this.#deshtime));
  }

  #provo(): void {
    if (this.#mbyllur) return;
    this.#ora = null;
    this.#ndrysho({ dukeProvuar: true });

    const peer = this.#peer;
    const vjetri = this.#lidhja;
    this.#nePerpjekje = true;

    try {
      // Serveri i kapur ende: mjafton kanali i ri, pa e ngritur lidhjen nga pari.
      if (peer && !peer.destroyed && peer.open) {
        // Hiqet i pari, që mbyllja e tij të mos lexohet si shkëputje e re.
        this.#lidhja = null;
        vjetri?.close();
        this.#lidhu();
        return;
      }

      if (peer && !peer.destroyed) {
        try {
          if (!peer.disconnected) peer.disconnect();
          peer.reconnect();
          this.#niseAfatin();
          return;
        } catch {
          // Rrugë e mbyllur; poshtë rri ajo e ashpra.
        }
      }

      this.#lidhja = null;
      peer?.destroy();
      this.#peer = null;
      this.#hap();
    } finally {
      this.#nePerpjekje = false;
    }
  }

  mbyll(): void {
    this.#mbyllur = true;
    this.#hiqOret();
    this.#hiqDegjuesit?.();
    this.#hiqDegjuesit = null;
    const lidhja = this.#lidhja;
    this.#lidhja = null;
    lidhja?.close();
    this.#peer?.destroy();
    this.#peer = null;
  }
}
