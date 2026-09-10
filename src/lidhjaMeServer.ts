/**
 * Mënyra e dytë e lidhjes — me kod të shkurtër, përmes një serveri sinjalizimi.
 *
 * Kjo është një **shmangje me qëllim** nga pika 1 e `CLAUDE.md`-së, dhe rri e
 * ndarë te ky skedar pikërisht që shmangja të mos përhapet. Mënyra pa server
 * (`lidhja.ts`) mbetet ajo e parazgjedhur; kjo hyn vetëm kur përdoruesi e
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
 */

import type { DataConnection, Peer } from 'peerjs';

import { idIStrehuesit, kodiNgaBajtet } from './kodi.ts';

/**
 * Sa herë provohet një kod i re kur emri del i zënë.
 *
 * Hapësira është dyzet bita, prandaj një përplasje e vërtetë është pothuajse e
 * pamundur — por reja është publike dhe e përbashkët, dhe një provë e dytë
 * kushton më lirë se një mesazh gabimi që nuk e ndreq njeri.
 */
const PROVAT = 3;

/**
 * Serveri i sinjalizimit, kur nuk është reja publike.
 *
 * `VITE_PEER_SERVER` lexohet gjatë ndërtimit, si `host:porta/shtegu`. E zbrazët
 * — dhe kështu rri te ndërtimi i prodhimit — do të thotë reja publike e
 * PeerJS-it, pikërisht ajo që përshkruhet më lart.
 *
 * Ekziston për dy arsye. E para: reja publike nuk kapet nga makina e provave,
 * prandaj pa këtë e tërë kjo mënyrë do të shkonte e paprovuar — dhe kodi i
 * rrjetës i paprovuar është pikërisht ai që prishet te tavolina. E dyta: kush
 * nuk do t'ia besojë lidhjen një serveri të huaj mund të ngrejë të vetin
 * (`peerjs-server`) dhe ta ndërtojë aplikacionin me adresën e tij — atëherë
 * mënyra me kod nuk i thotë asgjë asnjë të treti.
 */
function serveriIZgjedhur(): { host: string; port: number; path: string; secure: boolean } | undefined {
  const thene = import.meta.env?.VITE_PEER_SERVER;
  if (typeof thene !== 'string' || !thene) return undefined;

  const [autoriteti, ...shtegu] = thene.split('/');
  const [host, porta] = (autoriteti ?? '').split(':');
  if (!host) return undefined;

  const numri = Number(porta);

  return {
    host,
    port: Number.isInteger(numri) && numri > 0 ? numri : 443,
    path: `/${shtegu.join('/')}`,
    // Vetëm reja publike merr TLS pa u thënë; një server i vendosur vetë
    // zakonisht rri pa të gjatë zhvillimit.
    secure: false,
  };
}

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

/** Teksti shqip për gabimet e PeerJS-it, që të mos dalë emri i tipit në ekran. */
function shpjegimi(lloji: string): string {
  switch (lloji) {
    case 'browser-incompatible':
      return 'Ky shfletues nuk e mban lidhjen e drejtpërdrejtë.';
    case 'network':
    case 'server-error':
    case 'socket-error':
    case 'socket-closed':
      return 'Serveri i lidhjes nuk u kap. A ka internet ky telefon?';
    case 'ssl-unavailable':
      return 'Serveri i lidhjes nuk pranon lidhje të sigurt.';
    case 'peer-unavailable':
      return 'Ky kod nuk u gjet. A rri hapur paneli te telefoni që mban pikët?';
    case 'invalid-id':
    case 'invalid-key':
      return 'Kodi nuk u pranua nga serveri.';
    case 'webrtc':
      return 'Lidhja mes pajisjeve dështoi.';
    default:
      return 'Lidhja nuk u ngrit; provoje sërish.';
  }
}

/* ── Strehuesi: ai që mban pikët ────────────────────────────────────────── */

export type GjendjaEStrehuesitMeKod = {
  /** Kodi që tregohet, ose `null` sa përgatitet. */
  kodi: string | null;
  vizitore: number;
  gabimi: string | null;
};

export class StrehuesiMeKod {
  #njofto: (gjendja: GjendjaEStrehuesitMeKod) => void;
  #gjendja: GjendjaEStrehuesitMeKod = { kodi: null, vizitore: 0, gabimi: null };

  #peer: Peer | null = null;
  #lidhjet = new Set<DataConnection>();
  #paketa: string;
  #provat = 0;
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
    let Peer_: typeof Peer;

    try {
      Peer_ = await ngarkoPeer();
    } catch {
      this.#ndrysho({ gabimi: 'Pjesa e lidhjes me kod nuk u ngarkua.' });
      return;
    }

    if (this.#mbyllur) return;
    this.#hap(Peer_);
  }

  #hap(Peer_: typeof Peer): void {
    const kodi = kodiNgaBajtet(bajteTeRastit(8));

    if (!kodi) {
      this.#ndrysho({ gabimi: 'Kodi nuk u përgatit; provoje sërish.' });
      return;
    }

    const peer = new Peer_(idIStrehuesit(kodi), serveriIZgjedhur());
    this.#peer = peer;

    peer.on('open', () => this.#ndrysho({ kodi, gabimi: null }));

    peer.on('connection', (lidhja) => {
      lidhja.on('open', () => {
        this.#lidhjet.add(lidhja);
        // Kush lidhet i merr pikët menjëherë, pa pritur raundin tjetër.
        try {
          lidhja.send(this.#paketa);
        } catch {
          // Lidhja u mbyll mes kohe; heqja bëhet te `close`.
        }
        this.#ndrysho({ vizitore: this.#lidhjet.size, gabimi: null });
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

    peer.on('error', (gabimi: { type?: string }) => {
      const lloji = gabimi?.type ?? '';

      // Emri i zënë nuk është gabim për përdoruesin: provohet një kod tjetër.
      if (lloji === 'unavailable-id' && this.#provat < PROVAT) {
        this.#provat++;
        peer.destroy();
        this.#ndrysho({ kodi: null });
        this.#hap(Peer_);
        return;
      }

      this.#ndrysho({ gabimi: shpjegimi(lloji) });
    });

    /*
     * Shkëputja nga serveri nuk i vret lidhjet që janë hapur — ato rrinë drejt
     * mes pajisjeve. Prandaj rilidhja provohet pa e prishur asgjë: pa të,
     * kodi mbetet i pavlefshëm dhe askush i re nuk lidhet dot.
     */
    peer.on('disconnected', () => {
      if (this.#mbyllur || peer.destroyed) return;
      try {
        peer.reconnect();
      } catch {
        this.#ndrysho({ gabimi: 'Serveri i lidhjes u shkëput.' });
      }
    });
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
};

export class VizitoriMeKod {
  #njofto: (gjendja: GjendjaEVizitoritMeKod) => void;
  #gjendja: GjendjaEVizitoritMeKod = {
    lidhur: false,
    paketa: null,
    kur: null,
    gabimi: null,
  };

  #kodi: string;
  #peer: Peer | null = null;
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
    let Peer_: typeof Peer;

    try {
      Peer_ = await ngarkoPeer();
    } catch {
      this.#ndrysho({ gabimi: 'Pjesa e lidhjes me kod nuk u ngarkua.' });
      return;
    }

    if (this.#mbyllur) return;

    // Emri i kësaj ane e lëshon serveri: vetëm strehuesi ka nevojë për emër që
    // dihet përpara.
    // Mbingarkesa me vetëm opsione: emrin e kësaj ane e lëshon serveri.
    const peer = new Peer_(serveriIZgjedhur() ?? {});
    this.#peer = peer;

    peer.on('open', () => {
      const lidhja = peer.connect(idIStrehuesit(this.#kodi));

      lidhja.on('open', () => this.#ndrysho({ lidhur: true, gabimi: null }));
      lidhja.on('close', () => this.#ndrysho({ lidhur: false }));
      lidhja.on('data', (te_dhenat) => {
        if (typeof te_dhenat === 'string') {
          this.#ndrysho({ paketa: te_dhenat, kur: Date.now(), lidhur: true });
        }
      });
      lidhja.on('error', (gabimi: { type?: string }) => {
        this.#ndrysho({ lidhur: false, gabimi: shpjegimi(gabimi?.type ?? '') });
      });
    });

    peer.on('error', (gabimi: { type?: string }) => {
      this.#ndrysho({ lidhur: false, gabimi: shpjegimi(gabimi?.type ?? '') });
    });
  }

  mbyll(): void {
    this.#mbyllur = true;
    this.#peer?.destroy();
    this.#peer = null;
  }
}
