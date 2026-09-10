/**
 * Sinjalizimi i lidhjes së drejtpërdrejtë — SDP-ja e paketuar brenda një adrese.
 *
 * Dy telefona në të njëjtin wifi kapen drejtpërdrejt me një kanal WebRTC, dhe
 * atëherë pikët shkojnë të gjalla e jo si fotografi. Pengesa e vetme është
 * shkëmbimi i parë: WebRTC-ja kërkon që të dy anët t'i njohin kredencialet e
 * njëra-tjetrës, dhe kjo bëhet zakonisht me një server sinjalizimi.
 *
 * Server nuk ka, prandaj sinjali kalon nga jashtë: bëhet kod QR, dhe kamera e
 * telefonit është shtegu. Kjo do të thotë se sinjali duhet të hyjë në një kod QR
 * që lexohet nga ekrani i një telefoni tjetër — pra sa më i shkurtër.
 *
 * SDP-ja e Chrome-it për një kanal të vetëm të dhënash del mbi një mijë bajte,
 * dhe pothuajse e tëra është tekst i njëjtë çdo herë. Prandaj nga ajo mbahen
 * vetëm gjashtë gjëra që nuk merren me mend — kredencialet ICE, gishtëza DTLS,
 * roli, mid-i, porta SCTP dhe adresat — dhe pjesa tjetër rindërtohet fjalë për
 * fjalë te `sdpNgaSinjali`. Nga 1200 bajte bien nën 200.
 *
 * Mbahen vetëm kandidatët `typ host` mbi UDP. Kandidatët e tjerë nuk kanë kuptim
 * pa server: `srflx` e `relay` do të kërkonin STUN/TURN — pra pikërisht serverin
 * që nuk ka — dhe kandidatët TCP me portë 9 janë të pavlefshëm pa të. Kjo është
 * arsyeja pse lidhja punon vetëm brenda së njëjtës rrjetë, dhe ashtu duhet: loja
 * luhet rreth një tavoline.
 *
 * Çdo fushë kontrollohet me alfabet të ngushtë kur shpaketohet. Sinjali vjen nga
 * kushdo që të tregon një kod QR, dhe një rresht i futur brenda tij — një
 * kandidat `relay` që shpik një server — do t'i çonte pikët atje. Prandaj nuk
 * kalon asnjë karakter që SDP-ja e lexon si ndarës.
 *
 * Nuk njeh as `RTCPeerConnection`, as DOM: tekst brenda, tekst jashtë.
 */

import {
  bajtetNeHex,
  fushat,
  hexNeBajte,
  ne64,
  ne64Tekst,
  nenshkruaj,
  nga64,
  nga64Tekst,
  rrenjaEFaqes,
} from './paketa.ts';

/** Ana që e lëshon sinjalin. */
export type LlojiISinjalit = 'ftese' | 'pergjigje';

/** Ajo që mbahet nga një SDP — gjithçka tjetër rindërtohet. */
export type Sinjali = {
  lloji: LlojiISinjalit;
  /** Identifikuesi i mediumit; duhet i njëjti në të dy anët. */
  mid: string;
  ufrag: string;
  pwd: string;
  /** Gishtëza DTLS sha-256, 64 shkronja heks të vogla. */
  gishti: string;
  setup: 'actpass' | 'active' | 'passive';
  sctp: number;
  maxMesazhi: number;
  /** Adresat `typ host` mbi UDP, si `[adresa, porta]`. */
  adresat: [string, number][];
  /**
   * `ufrag`-u i ftesës që kjo përgjigje i përgjigjet; i zbrazët te ftesa.
   *
   * Pa të, një përgjigje e vjetër — kodi i mbetur i hapur në ekranin e dikujt —
   * do të aplikohej mbi ftesën e re dhe lidhja do të vdiste në heshtje.
   */
  ref: string;
};

/** Versioni i paketës së sinjalit, i pavarur nga ai i fotografisë. */
export const VERSIONI = 1;

const FUSHA = 11;

/** Prioriteti standard i një kandidati `typ host`, komponenti 1. */
const PRIORITETI = 2113937151;

const SCTP_DEFAULT = 5000;
const MESAZHI_DEFAULT = 262144;

/* ── Alfabetet e lejuara ────────────────────────────────────────────────── */

// `ice-char` i RFC 5245-s: shkronjë, shifër, `+` ose `/`.
const ICE = /^[A-Za-z0-9+/]{4,256}$/;
const MID = /^[A-Za-z0-9_-]{1,16}$/;
// IPv4, IPv6 dhe emri mDNS `<uuid>.local` — pa hapësirë, pa ndarës SDP-je.
const ADRESA = /^[A-Za-z0-9.:-]{1,64}$/;
const ROLET = ['actpass', 'active', 'passive'] as const;

function porta(vlera: string): number | null {
  const n = Number(vlera);
  return Number.isInteger(n) && n >= 1 && n <= 65535 ? n : null;
}

/* ── Leximi i SDP-së ────────────────────────────────────────────────────── */

function rreshtat(sdp: string): string[] {
  return sdp.split(/\r\n|\r|\n/);
}

function vlera(sdp: string, parathenja: string): string | null {
  for (const rreshti of rreshtat(sdp)) {
    if (rreshti.startsWith(parathenja)) return rreshti.slice(parathenja.length).trim();
  }
  return null;
}

/**
 * Sinjali nga një SDP e vërtetë e shfletuesit.
 *
 * Kthen `null` kur mungon një fushë e domosdoshme — më mirë një gabim i thënë sa
 * hapet paneli se një kod QR që skanohet e pastaj nuk lidhet.
 */
export function sinjaliNgaSdp(sdp: string, lloji: LlojiISinjalit, ref = ''): Sinjali | null {
  const ufrag = vlera(sdp, 'a=ice-ufrag:');
  const pwd = vlera(sdp, 'a=ice-pwd:');
  const mid = vlera(sdp, 'a=mid:');
  const setup = vlera(sdp, 'a=setup:');
  const gishtezaEPlote = vlera(sdp, 'a=fingerprint:sha-256 ');

  if (!ufrag || !pwd || !mid || !setup || !gishtezaEPlote) return null;
  if (!ROLET.includes(setup as (typeof ROLET)[number])) return null;

  const gishti = gishtezaEPlote.replace(/:/g, '').toLowerCase();
  const bajtet = hexNeBajte(gishti);
  if (!bajtet || bajtet.length !== 32) return null;

  const sctp = porta(vlera(sdp, 'a=sctp-port:') ?? String(SCTP_DEFAULT));
  if (sctp === null) return null;

  const maxIThene = Number(vlera(sdp, 'a=max-message-size:') ?? MESAZHI_DEFAULT);
  const maxMesazhi =
    Number.isInteger(maxIThene) && maxIThene >= 0 ? maxIThene : MESAZHI_DEFAULT;

  const adresat: [string, number][] = [];
  const parePare = new Set<string>();

  for (const rreshti of rreshtat(sdp)) {
    if (!rreshti.startsWith('a=candidate:')) continue;

    // `a=candidate:<themel> <komponenti> udp <prioriteti> <adresa> <porta> typ host …`
    const pjeset = rreshti.slice('a=candidate:'.length).trim().split(' ');
    if (pjeset.length < 8) continue;
    if (pjeset[1] !== '1') continue;
    if ((pjeset[2] ?? '').toLowerCase() !== 'udp') continue;
    if (pjeset[6] !== 'typ' || pjeset[7] !== 'host') continue;

    const adresa = pjeset[4] ?? '';
    const p = porta(pjeset[5] ?? '');
    if (!ADRESA.test(adresa) || p === null) continue;

    const celesi = `${adresa}@${p}`;
    if (parePare.has(celesi)) continue;
    parePare.add(celesi);
    adresat.push([adresa, p]);
  }

  if (!ICE.test(ufrag) || !ICE.test(pwd) || !MID.test(mid)) return null;

  return {
    lloji,
    mid,
    ufrag,
    pwd,
    gishti,
    setup: setup as Sinjali['setup'],
    sctp,
    maxMesazhi,
    adresat,
    ref,
  };
}

/* ── Rindërtimi i SDP-së ────────────────────────────────────────────────── */

/**
 * SDP-ja e plotë nga sinjali.
 *
 * Pjesa e mbetur është e njëjta çdo herë për një kanal të vetëm të dhënash,
 * prandaj shkruhet fjalë për fjalë. `a=end-of-candidates` rri në fund sepse
 * kandidatët nuk vijnë me pika: mbledhja mbaroi para se sinjali të paketohej,
 * dhe pa këtë rresht ICE-ja e pret pa nevojë një minutë para se të dorëzohet.
 */
export function sdpNgaSinjali(sinjali: Sinjali): string {
  const gishtezaEPlote = (sinjali.gishti.match(/../g) ?? []).join(':').toUpperCase();

  const rreshtat = [
    'v=0',
    'o=- 4611731400430051336 2 IN IP4 127.0.0.1',
    's=-',
    't=0 0',
    `a=group:BUNDLE ${sinjali.mid}`,
    'a=msid-semantic: WMS',
    'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
    'c=IN IP4 0.0.0.0',
    `a=ice-ufrag:${sinjali.ufrag}`,
    `a=ice-pwd:${sinjali.pwd}`,
    'a=ice-options:trickle',
    `a=fingerprint:sha-256 ${gishtezaEPlote}`,
    `a=setup:${sinjali.setup}`,
    `a=mid:${sinjali.mid}`,
    `a=sctp-port:${sinjali.sctp}`,
    `a=max-message-size:${sinjali.maxMesazhi}`,
  ];

  sinjali.adresat.forEach(([adresa, p], i) => {
    rreshtat.push(
      `a=candidate:${i + 1} 1 udp ${PRIORITETI - i} ${adresa} ${p} typ host generation 0`,
    );
  });

  rreshtat.push('a=end-of-candidates');

  // SDP-ja i kërkon fundet e rreshtave CRLF, dhe një rresht bosh në fund.
  return `${rreshtat.join('\r\n')}\r\n`;
}

/* ── Paketimi ───────────────────────────────────────────────────────────── */

/**
 * Sinjali si tekst i shkurtër, i sigurt për një adresë.
 *
 * Gishtëza shkon si bajte e jo si heks: nga 64 karaktere bie në 43, dhe njëzet
 * karaktere më pak janë dy versione më poshtë te kodi QR — pra module më të mëdha
 * në të njëjtin ekran, pra një skanim që zë.
 *
 * Adresat ndahen me `@` e jo me `:`, sepse një adresë IPv6 i ka dy pikat brenda.
 */
export function paketoSinjalin(sinjali: Sinjali): string {
  const bajtet = hexNeBajte(sinjali.gishti);
  if (!bajtet) return '';

  const trupi = [
    VERSIONI,
    sinjali.lloji === 'ftese' ? 'f' : 'p',
    sinjali.mid,
    sinjali.ufrag,
    sinjali.pwd,
    ne64(bajtet),
    sinjali.setup,
    sinjali.sctp,
    sinjali.maxMesazhi,
    sinjali.adresat.map(([adresa, p]) => `${adresa}@${p}`).join(','),
    sinjali.ref,
  ].join('|');

  return ne64Tekst(nenshkruaj(trupi));
}

/** Lexon një paketë sinjali. Kthen `null` për çdo gjë që nuk del e plotë. */
export function shpaketoSinjalin(kodi: string): Sinjali | null {
  const teksti = nga64Tekst(kodi);
  if (teksti === null) return null;

  const pjeset = fushat(teksti, FUSHA);
  if (!pjeset) return null;

  const [version, lloji, mid, ufrag, pwd, gishti64, setup, sctp, maxMesazhi, adresat, ref] =
    pjeset as [
      string, string, string, string, string, string,
      string, string, string, string, string,
    ];

  if (Number(version) !== VERSIONI) return null;
  if (lloji !== 'f' && lloji !== 'p') return null;
  if (!MID.test(mid) || !ICE.test(ufrag) || !ICE.test(pwd)) return null;
  if (!ROLET.includes(setup as (typeof ROLET)[number])) return null;
  if (ref !== '' && !ICE.test(ref)) return null;

  const bajtet = nga64(gishti64);
  if (!bajtet || bajtet.length !== 32) return null;

  const portaSctp = porta(sctp);
  if (portaSctp === null) return null;

  const sasiaEMesazhit = Number(maxMesazhi);
  if (!Number.isInteger(sasiaEMesazhit) || sasiaEMesazhit < 0) return null;

  const cifte: [string, number][] = [];
  for (const pjesa of adresat.split(',')) {
    if (!pjesa) continue;

    const kufi = pjesa.lastIndexOf('@');
    if (kufi <= 0) return null;

    const adresa = pjesa.slice(0, kufi);
    const p = porta(pjesa.slice(kufi + 1));
    if (!ADRESA.test(adresa) || p === null) return null;

    cifte.push([adresa, p]);
  }

  return {
    lloji: lloji === 'f' ? 'ftese' : 'pergjigje',
    mid,
    ufrag,
    pwd,
    gishti: bajtetNeHex(bajtet),
    setup: setup as Sinjali['setup'],
    sctp: portaSctp,
    maxMesazhi: sasiaEMesazhit,
    adresat: cifte,
    ref,
  };
}

/* ── Adresat ────────────────────────────────────────────────────────────── */

/** Adresa që skanon vizitori: hap aplikacionin dhe i përgjigjet ftesës. */
export function adresaEFteses(rrenja: string, kodi: string): string {
  return `${rrenjaEFaqes(rrenja)}/#/lidhu/${kodi}`;
}

/**
 * Adresa që skanon ai që mban pikët, për t'i marrë përgjigjen.
 *
 * Hapet në një skedë të dytë, sepse kamera e telefonit nuk di t'ia dorëzojë
 * tekstin skedës që rri hapur — dhe ajo skedë e mban lidhjen, prandaj nuk guxon
 * të lëvizë. Skeda e dytë e kalon kodin te e para nëpër `BroadcastChannel` dhe
 * pastaj mbyllet.
 */
export function adresaEPergjigjes(rrenja: string, kodi: string): string {
  return `${rrenjaEFaqes(rrenja)}/#/pergjigje/${kodi}`;
}

/** Kodi i një përgjigjeje, i nxjerrë nga çka mund të ngjitet: adresë a kod. */
export function kodiIPergjigjes(teksti: string): string | null {
  const pastruar = teksti.trim();
  if (!pastruar) return null;

  const gjetja = pastruar.match(/(?:#\/pergjigje\/)([A-Za-z0-9\-_]+)/);
  const kodi = gjetja ? gjetja[1]! : pastruar;

  return /^[A-Za-z0-9\-_]+$/.test(kodi) ? kodi : null;
}
