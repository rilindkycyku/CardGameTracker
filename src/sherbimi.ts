/**
 * Rregullat e punës pa internet — çka ruhet, çka nuk preket, çka fshihet.
 *
 * Aplikacioni luhet rreth një tavoline ku interneti është rastësi (pika 1), dhe
 * deri tani ai punonte pa internet vetëm nëse shfletuesi e kishte mbajtur vetë
 * faqen në cache — pra ndonjëherë po e ndonjëherë jo. Punëtori i shërbimit e
 * bën atë premtim të matshëm: skedarët e ndërtimit ruhen një herë, dhe pastaj
 * faqja hapet e plotë edhe me telefonin në «mënyrë avioni».
 *
 * Vendimet rrinë këtu e jo te `punetori.ts`, sepse aty nuk provohen dot: ai
 * skedar njeh `self`, `caches` dhe ngjarjet e shfletuesit. Ky njeh vetëm vargje
 * dhe objekte, prandaj importohet drejt nga `node --test` — si çdo modul tjetër
 * logjike (pika 1).
 */

/** Parathënja e koshit. Versioni i ngjitet pas, që të mos përzihen dy ndërtime. */
export const PARATHENJA_E_KOSHIT = 'tavolina';

/**
 * Emri i koshit për një version.
 *
 * Versioni hyn te emri e jo te një fushë brenda: kështu ndërtimi i ri nis me
 * kosh krejt të ri, dhe ai i vjetri fshihet i tëri kur punëtori i ri merr
 * pushtetin. Pa këtë, një `index.html` i ri do të tregonte te skedarë të
 * hashuar që koshi i vjetër nuk i ka, dhe faqja do të mbetej gjysmake — e
 * pikërisht ajo gjendje nuk kapet dot me sy.
 */
export function emriIKoshit(versioni: string): string {
  return `${PARATHENJA_E_KOSHIT}-${versioni}`;
}

/** Koshët e ndërtimeve të vjetra, që fshihen sapo ky punëtor merr pushtetin. */
export function koshetEVjetra(emrat: string[], iTanishmi: string): string[] {
  return emrat.filter(
    (emri) => emri !== iTanishmi && emri.startsWith(`${PARATHENJA_E_KOSHIT}-`),
  );
}

/* ── Lista e paraprakes ─────────────────────────────────────────────────── */

/** Një hyrje e manifestit të Vite-s, aq sa na duhet prej saj. */
export type HyrjaEManifestit = {
  file: string;
  css?: string[];
  assets?: string[];
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
};

export type Manifesti = Record<string, HyrjaEManifestit>;

/**
 * Skedarët që hyjnë te kosha me instalimin, nxjerrë nga manifesti i ndërtimit.
 *
 * Ndiqen vetëm importet **statike** të hyrjes. Ato të vonuarat lihen jashtë me
 * qëllim, dhe kjo nuk është kursim: `peerjs` ngarkohet vetëm kur përdoruesi e
 * nis mënyrën me kod, dhe ai kusht është arsyeja pse ajo varësi qëndron fare
 * (pika 7 e pika 10). Një punëtor që e shkarkon atë copë me instalimin do ta
 * thyente kushtin pikërisht atje ku nuk duket — te rrjeti, jo te ekrani.
 *
 * Kush e prek atë mënyrë e merr copën nga rrjeti herën e parë, dhe atëherë ajo
 * ruhet vetvetiu: leximi i mëvonshëm kalon nëpër koshin e njëjtë.
 */
export function precachja(manifesti: Manifesti, teTjerat: string[]): string[] {
  const dale = new Set<string>(teTjerat);
  const pare = new Set<string>();

  const ndiq = (emri: string) => {
    if (pare.has(emri)) return;
    pare.add(emri);

    const hyrja = manifesti[emri];
    if (!hyrja || hyrja.isDynamicEntry) return;

    dale.add(`/${hyrja.file}`);
    for (const css of hyrja.css ?? []) dale.add(`/${css}`);
    for (const asset of hyrja.assets ?? []) dale.add(`/${asset}`);
    // Vetëm `imports`: `dynamicImports` janë pikërisht ato copa që presin një
    // prekje të përdoruesit, dhe ato nuk shkarkohen pa u kërkuar.
    for (const tjetri of hyrja.imports ?? []) ndiq(tjetri);
  };

  for (const [emri, hyrja] of Object.entries(manifesti)) {
    if (hyrja.isEntry) ndiq(emri);
  }

  return [...dale];
}

/* ── Strategjia e një kërkese ───────────────────────────────────────────── */

/**
 * Çka bëhet me një kërkesë:
 *
 * - `shelli` — navigim: kthehet `index.html` i koshit. Rrugët janë me hash
 *   (`#/loja/3`), prandaj çdo navigim është i njëjti dokument, dhe ai dokument
 *   duhet të hapet edhe pa rrjetë fare.
 * - `koshi` — skedar i vetë faqes: koshi i pari, rrjeti vetëm nëse mungon.
 *   Emrat janë të hashuar, prandaj një skedar i ruajtur nuk vjetërohet kurrë;
 *   ndërtimi i ri sjell emra të rinj dhe kosh të ri.
 * - `anashkalo` — punëtori nuk e prek fare.
 *
 * Anashkalimi mban dy gjëra që nuk janë hollësi. Kërkesat jashtë origjinës —
 * serveri i sinjalizimit, relenjat TURN — nuk kalojnë nëpër kosh **as nuk
 * lexohen**: ato janë e vetmja shmangje e pikës 1, dhe një punëtor që i prek do
 * ta zgjeronte atë shmangje pa e thënë kush. Dhe çdo metodë përveç `GET` rri
 * jashtë, sepse një përgjigje e ruajtur për një kërkesë që ndryshon gjendje
 * nuk do të thoshte asgjë.
 */
export type Strategjia = 'shelli' | 'koshi' | 'anashkalo';

export function strategjia(
  kerkesa: { url: string; metoda: string; navigim: boolean },
  rrenja: string,
): Strategjia {
  if (kerkesa.metoda !== 'GET') return 'anashkalo';

  // Krahasimi bëhet mbi origjinën e plotë me `/` në fund, që `https://a.app`
  // të mos e pranojë `https://a.appstore.example` si të vetën.
  const brenda =
    kerkesa.url === rrenja || kerkesa.url.startsWith(`${rrenja}/`);
  if (!brenda) return 'anashkalo';

  /*
   * `/_vercel/` është i strehuesit, jo i faqes — dhe nuk preket fare.
   *
   * Atje rri skripti i matjes dhe shtegu ku ai i dërgon numrat (pika 18). Emri
   * i tij nuk është i hashuar, prandaj një kopje e ruajtur do të mbetej e
   * ngrirë derisa të ngrihej versioni i aplikacionit; dhe një përgjigje e
   * ruajtur e vetë numërimit do ta vriste numërimin në heshtje — kërkesa e
   * dytë do të merrte të parën nga koshi e nuk do të dilte kurrë nga pajisja.
   * Aty rri edhe arsyeja e dytë: ai trafik shkon te një server, pra te
   * shmangja, dhe punëtori nuk hyn mes saj.
   */
  if (kerkesa.url.slice(rrenja.length).startsWith('/_vercel/')) {
    return 'anashkalo';
  }

  return kerkesa.navigim ? 'shelli' : 'koshi';
}
