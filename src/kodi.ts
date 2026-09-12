/**
 * Kodi i bashkimit — tetë karaktere që i dikton dot dikujt përtej tavolinës.
 *
 * Përdoret vetëm nga mënyra me server (`lidhjaMeServer.ts`). Mënyra pa server e
 * bën shkëmbimin me dy kode QR, sepse gjithçka që duhet për lidhjen — gishtëza
 * DTLS dhe kredencialet ICE — nuk hyn te tetë karaktere. Me një server
 * sinjalizimi mes vete, të dyja anët e marrin atë nga serveri, dhe atëherë
 * mjafton një emër i shkurtër që të gjejnë njëra-tjetrën.
 *
 * Alfabeti është Crockford base32: pa `I`, `L`, `O` dhe `U`. Tri të parat
 * ngatërrohen me `1` e `0` kur kodi lexohet nga ekrani ose diktohet me zë — dhe
 * pikërisht ajo është puna e këtij kodi — kurse `U` hiqet që rastësia të mos
 * shkruajë fjalë që nuk duhen. Leximi i kthen ngatërresat prapa: `O` bëhet `0`,
 * `I` e `L` bëhen `1`.
 *
 * Tetë karaktere nga tridhjetë e dy janë dyzet bita, pra mbi një mijë miliardë
 * kode. Kjo nuk është kot: te reja e PeerJS-it emrat rrinë në një hapësirë të
 * përbashkët publike, prandaj kushdo që e gjen emrin lidhet dhe i shikon pikët.
 * Gjashtë karaktere do të kishin qenë më të lehta për t'u shkruar dhe njësoj të
 * lehta për t'u qëlluar.
 *
 * Nuk njeh as DOM, as rrjetë: bajtet e rastit i vjen nga jashtë, që provat ta
 * matin me bajte të njohura.
 */

/** Crockford base32 — pa `I`, `L`, `O`, `U`. */
export const ALFABETI = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Sa karaktere ka kodi. */
export const GJATESIA = 8;

/**
 * Parathënja e emrit te serveri i sinjalizimit.
 *
 * Reja publike e PeerJS-it përdoret me një çelës të përbashkët, prandaj emrat e
 * çdo aplikacioni rrinë bashkë. Pa parathënje, një kod tetëkarakterësh i këtij
 * aplikacioni mund të përplasej me emrin e ndonjë tjetri.
 *
 * Mbeti `bridzh` edhe pasi aplikacioni u quajt „Tavolina", dhe jo nga harresa:
 * kjo nuk është emër që lexon njeriu, është pjesë e telit. Të dy telefonat e
 * ndërtojnë të njëjtin emër nga i njëjti kod, prandaj një parathënje e ndërruar
 * do të thoshte se telefoni me versionin e ri nuk lidhet me atë që ende nuk e
 * ka rifreskuar faqen — dhe kjo pikërisht atëherë kur po ulen te tavolina. Kur
 * të ndërrohet, duhet të ndërrohet te të dy njëkohësisht.
 */
export const PARATHENJA = 'bridzh';

/**
 * Kodi nga bajte të rastit.
 *
 * Një bajt jep pikërisht tetë vlera për secilën shkronjë të alfabetit
 * (256 = 32 × 8), prandaj `& 31` nuk anon nga asnjë shkronjë.
 */
export function kodiNgaBajtet(bajtet: Uint8Array): string | null {
  if (bajtet.length < GJATESIA) return null;

  let kodi = '';
  for (let i = 0; i < GJATESIA; i++) kodi += ALFABETI[bajtet[i]! & 31];

  return kodi;
}

/** Kodi si tregohet: `A3F2-7KQM`. Vija e mban të lexueshëm dhe të diktueshëm. */
export function shfaqKodin(kodi: string): string {
  return `${kodi.slice(0, 4)}-${kodi.slice(4)}`;
}

/**
 * Kodi nga çka mund të shkruhet ose të ngjitet: kod, kod me vijë, a adresë.
 *
 * Vija, hapësira dhe shkronjat e vogla nuk kanë pse t'i pengojnë dikë që po e
 * shkruan me nxitim, prandaj hiqen para kontrollit. Adresa e plotë kalon njësoj
 * si te ngjitja e një lidhjeje nga një bisedë.
 */
export function lexoKodin(teksti: string): string | null {
  const pastruar = (teksti ?? '').trim();
  if (!pastruar) return null;

  // Adresa lexohet e para: pa këtë, shkronjat e «bashkohu» do të hynin te kodi.
  const gjetja = pastruar.match(/#\/bashkohu\/([^/?#\s]+)/i);
  const trupi = gjetja ? gjetja[1]! : pastruar;

  const kodi = trupi
    .toUpperCase()
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/[^0-9A-Z]/g, '');

  if (kodi.length !== GJATESIA) return null;
  for (const shkronja of kodi) if (!ALFABETI.includes(shkronja)) return null;

  return kodi;
}

/** Emri i strehuesit te serveri i sinjalizimit. */
export function idIStrehuesit(kodi: string): string {
  return `${PARATHENJA}-${kodi}`;
}

/** Adresa që hap pamjen dhe lidhet vetë, pa e shkruar kodin. */
export function adresaEBashkimit(rrenja: string, kodi: string): string {
  return `${rrenja.split('#')[0]!.replace(/\/+$/, '')}/#/bashkohu/${kodi}`;
}

/* ── Serveri i sinjalizimit ─────────────────────────────────────────────── */

/** Një server sinjalizimi, ashtu si e pret PeerJS-i. */
export type Serveri = {
  host: string;
  port: number;
  path: string;
  secure: boolean;
};

/**
 * Serverat e sinjalizimit, nga `VITE_PEER_SERVER`.
 *
 * Lista, e jo një i vetëm: kur i pari nuk kapet, provohet i dyti. Reja publike
 * e PeerJS-it është e vetmja e parazgjedhur, dhe prandaj kthimi i zbrazët do të
 * thotë pikërisht ajo — `undefined` i jepet PeerJS-it, i cili e di vetë ku
 * shkon. Një server i dytë nuk hyn këtu i shkruar, sepse çdo server që shtohet
 * është një i tretë që mëson kur luajmë: kush do një rezervë e shkruan vetë te
 * ndërtimi, dhe e di se çka shtoi.
 *
 * Formati i secilit: `[https://|http://]host[:porta][/shtegu]`, të ndarë me
 * presje ose hapësirë.
 *
 * TLS-ja nuk hamendësohet gabim. Skema e thënë vendos vetë; pa skemë, porta e
 * thotë — 443 dhe vetëm ajo është e sigurt — dhe pa portë fare lexohet një
 * server publik, pra 443. Kështu `localhost:9000` i provave del pa TLS, dhe
 * `peer.shembull.org` del me të. Deri tani `secure` rrinte `false` gjithmonë,
 * dhe një server i vetin me certifikatë nuk lidhej dot fare.
 */
export function serverat(thene: string | null | undefined): Serveri[] {
  if (typeof thene !== 'string') return [];

  const lista: Serveri[] = [];

  for (const copa of thene.split(/[,\s]+/)) {
    const serveri = njeServer(copa);
    if (serveri) lista.push(serveri);
  }

  return lista;
}

function njeServer(thene: string): Serveri | null {
  const pastruar = thene.trim();
  if (!pastruar) return null;

  const skema = /^(https?):\/\//i.exec(pastruar);
  const trupi = skema ? pastruar.slice(skema[0]!.length) : pastruar;

  const [autoriteti, ...shtegu] = trupi.split('/');
  const [host, porta] = (autoriteti ?? '').split(':');
  if (!host) return null;

  const numri = Number(porta);
  const uThaPorta = Boolean(porta) && Number.isInteger(numri) && numri > 0 && numri <= 65535;

  const secure = skema
    ? skema[1]!.toLowerCase() === 'https'
    : !uThaPorta || numri === 443;

  return {
    host,
    port: uThaPorta ? numri : secure ? 443 : 80,
    path: `/${shtegu.join('/')}`,
    secure,
  };
}

/* ── Kur lidhja nuk kapet ───────────────────────────────────────────────── */

/**
 * Sa pritet sa hapet lidhja me serverin, para se të quhet e dështuar.
 *
 * Pa afat, një server që e pranon prizën dhe nuk përgjigjet më e lë ekranin te
 * «Duke marrë kodin…» **përgjithmonë** — pikërisht ajo gjendje ku njeriu rri e
 * pret pa asnjë fjalë. Me afat, dështimi thuhet dhe prova tjetër niset.
 */
export const AFATI_I_HAPJES = 12_000;

/**
 * Sa herë provon ana që shikon para se të ndalet e të presë butonin.
 *
 * Strehuesi provon pa fund — paneli rri hapur tërë mbrëmjen, dhe kush e hapi do
 * ta mbajë kodin të gjallë. Ana që shikon jo: kur kodi është i vjetër ose
 * paneli u mbyll, provat e pafundme vetëm pinë baterinë e telefonit të dikujt
 * që nuk ka çka të presë.
 */
export const PROVAT_E_VIZITORIT = 5;

/** Sa pritet pas dështimit të `deshtime`-të me radhë, në milisekonda. */
const SHKALLET = [1_000, 2_000, 4_000, 8_000, 15_000, 30_000];

/**
 * Largimi mes provave, që një server i rënë të mos marrë një kërkesë në sekondë.
 *
 * Nis shpejt sepse dështimi i parë është zakonisht një prizë e këputur nga
 * telefoni që u fut në xhep, dhe ajo kthehet në çast; ngjitet te gjysmë minute
 * sepse pas pesë dështimesh shkaku nuk është më i çastit.
 */
export function pritjaEProves(deshtime: number): number {
  const vendi = Math.min(Math.max(Math.trunc(deshtime), 1), SHKALLET.length);
  return SHKALLET[vendi - 1]!;
}

/**
 * Çka bëhet pas një gabimi të PeerJS-it.
 *
 * - `ndal` — provat nuk e ndreqin: shfletuesi nuk e mban, ose çelësi i serverit
 *   nuk pranohet. Thuhet dhe mbaron.
 * - `kodTjeter` — emri është i zënë te serveri; kodi i radhës e zgjidh.
 * - `prape` — gjithçka tjetër. Serveri, rrjeti dhe priza janë të gjitha gjëra
 *   që kthehen vetë, dhe pikërisht prandaj deri tani ngrinin: një gabim rrjeti
 *   e linte kodin të vdekur derisa dikush ta rihapte skedën.
 */
export type Veprimi = 'ndal' | 'kodTjeter' | 'prape';

export function veprimiPasGabimit(lloji: string): Veprimi {
  switch (lloji) {
    case 'browser-incompatible':
    case 'invalid-id':
    case 'invalid-key':
      return 'ndal';
    case 'unavailable-id':
      return 'kodTjeter';
    default:
      return 'prape';
  }
}

/** Teksti shqip për gabimet e PeerJS-it, që të mos dalë emri i tipit në ekran. */
export function shpjegimi(lloji: string): string {
  switch (lloji) {
    case 'browser-incompatible':
      return 'Ky shfletues nuk e mban lidhjen e drejtpërdrejtë.';
    case 'network':
    case 'socket-error':
    case 'socket-closed':
      return 'Serveri i lidhjes nuk u kap. A ka internet ky telefon?';
    case 'server-error':
      return 'Serveri i lidhjes nuk u përgjigj.';
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
      return 'Lidhja nuk u ngrit; provohet sërish.';
  }
}
