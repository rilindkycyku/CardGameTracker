/**
 * Një klient Supabase shumë i vogël, i shkruar me dorë mbi `fetch`.
 *
 * Aplikacioni nuk ka backend dhe nuk ka llogari të vetën. Kush i do mbrëmjet e
 * veta te më shumë se një pajisje sjell **projektin e vet** Supabase, ngjit
 * adresën dhe çelësin publik të tij këtu, dhe hyn me një llogari që ekziston
 * vetëm brenda atij projekti. Asgjë te ky skedar nuk i flet asnjë serveri të
 * Tavolinës, sepse ai nuk ekziston (pika 19).
 *
 * `@supabase/supabase-js` do ta bënte të njëjtën punë, por është ~120 kB për
 * atë që del të jenë katër thirrje HTTP — një hyrje me fjalëkalim, një
 * rifreskim, një `select` dhe një `upsert` — dhe rregulli i varësive vlen edhe
 * këtu (pika 10). E njëjta arsye si te kodi QR i shkruar me dorë.
 *
 * ── çka ruhet te kjo pajisje ─────────────────────────────────────────────
 *
 * Adresa e projektit, çelësi publik, email-i dhe dy tokenat rrinë te
 * `localStorage`. Asnjëra nuk është më e ndjeshme se ajo që rri tashmë te
 * IndexedDB: vetë mbrëmjet janë te ky shfletues në formë të lexueshme, pra një
 * pajisje që e hap dikush tjetër ia tregonte gjithsesi ato. Ajo që ka rëndësi
 * është se çelësi i ruajtur këtu është ai **publik** — shih `kontrolloCelesin`
 * te `projekti.ts`, e cila e refuzon `service_role`-in pikërisht sepse ai i
 * anashkalon rregullat e rreshtave.
 *
 * Vendimet e provueshme rrinë te `projekti.ts` dhe `skema.ts` (pika 1); këtu
 * mbeten `fetch`-i dhe `localStorage`-i.
 */

import {
  kontrolloCelesin,
  mesazhiGabimit,
  referencaProjektit,
  shtegiRegjistrimit,
} from './projekti.ts';
import {
  ID_SKEMES,
  MIGRIMET,
  SKEMA_VERSIONI,
  SQL_INSTALIMI,
  STORI_META,
  TABELA,
  VERSIONI_PARA_NUMERIMIT,
  migrimetPezull,
} from './skema.ts';
import type { Migrimi } from './skema.ts';

const CELESI_RUAJTJES = 'tavolina.sinkronizimi';

export { SKEMA_VERSIONI, SQL_INSTALIMI, TABELA, sqlPerMigrim } from './skema.ts';

/** Përmbledhja e sinkronizimit të fundit, ashtu si e lexon ekrani. */
export type Permbledhja = {
  kur: string;
  gabim: string | null;
  marre: number;
  derguar: number;
  kerkohetVendim?: boolean;
};

export type Konfigurimi = {
  url: string;
  anonKey: string;
  email: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  /** Kur pushon së pranuari tokeni i hyrjes (ms). Rifreskohet një minutë para. */
  skadonMe: number;
  automatik: boolean;
  /** Shënjuesit: `updated_at`-i më i ri që është shkarkuar tashmë, dhe ora
   * lokale e dërgimit të fundit të suksesshëm. */
  pulledAt: string;
  pushedAt: number;
  /** Te cili migrim ishte projekti herën e fundit që e pa kjo pajisje. Ndihmesë
   * për ekranin, kurrë zëvendësim i pyetjes së vërtetë — projektin mund ta ketë
   * ngritur një pajisje tjetër. */
  skemaVersioni: number;
  /**
   * A e ka parë përdoruesi çka rri te cloud-i dhe a ka thënë çka duhet bërë me
   * të. Derisa ta thotë, kjo pajisje vetëm shkarkon e nuk dërgon kurrë.
   *
   * `false` është ajo që mban një pajisje **sapo e lidhur**; `null` do të thoshte
   * një pajisje që lidhej para se kjo pyetje të ekzistonte.
   */
  lidhjaVerifikuar: boolean | null;
  /** «Herën tjetër dërgo gjithçka, pa i besuar flamurëve.» */
  ngaFillimiTjeter: boolean;
  /**
   * Sa sinkronizime me radhë kanë mbetur te të njëjtët rreshta të shtyrë.
   *
   * Një rresht cloud-i prindi i të cilit nuk ekziston më nuk zbatohet dot kurrë,
   * dhe pa këtë numërues ai do ta mbante shënjuesin në vend përgjithmonë — pra
   * sinkronizimi do të pushonte së ecuri në heshtje. Te tri, shtyrja fiket një
   * herë dhe shënjuesi kalon.
   */
  ngecur: number;
  /** Çelësat e shtyrë herën e fundit, për ta ditur a janë të njëjtët. */
  shtyreFundit: string;
  /** Kur u numëruan për herë të fundit të dyja anët kundër njëra-tjetrës. */
  kontrolluarMe: number;
  /** Kur e nënshkroi kjo pajisje rreshtin e vet te projekti. */
  pajisjaShenuarMe: number;
  fundit: Permbledhja | null;
};

const BOSH: Konfigurimi = {
  url: '',
  anonKey: '',
  email: '',
  userId: '',
  accessToken: '',
  refreshToken: '',
  skadonMe: 0,
  automatik: true,
  pulledAt: '',
  pushedAt: 0,
  skemaVersioni: 0,
  lidhjaVerifikuar: null,
  ngaFillimiTjeter: false,
  ngecur: 0,
  shtyreFundit: '',
  kontrolluarMe: 0,
  pajisjaShenuarMe: 0,
  fundit: null,
};

const degjuesit = new Set<(k: Konfigurimi) => void>();

/** «Konfigurimi i ruajtur ndryshoi.» Kthen çregjistrimin. */
export function onKonfigurim(fn: (k: Konfigurimi) => void): () => void {
  degjuesit.add(fn);
  return () => degjuesit.delete(fn);
}

export function lexoKonfigurimin(): Konfigurimi {
  try {
    const raw = localStorage.getItem(CELESI_RUAJTJES);
    return raw ? { ...BOSH, ...(JSON.parse(raw) as Partial<Konfigurimi>) } : { ...BOSH };
  } catch {
    // Shfletimi privat dhe një hyrje e prishur duken njësoj prej këtu: pa
    // konfigurim.
    return { ...BOSH };
  }
}

export function ruajKonfigurimin(patch: Partial<Konfigurimi>): Konfigurimi {
  const i = { ...lexoKonfigurimin(), ...patch };
  try {
    localStorage.setItem(CELESI_RUAJTJES, JSON.stringify(i));
  } catch {
    // S'ka çka bëhet: sinkronizimi punon për këtë seancë, thjesht nuk mbahet mend.
  }
  for (const fn of degjuesit) fn(i);
  return i;
}

/** Harron projektin, çelësin dhe sesionin — gjithçka që kjo pajisje dinte për
 * kopjen e cloud-it. Vetë kopja nuk preket, dhe as baza te IndexedDB. */
export function pastroKonfigurimin(): Konfigurimi {
  try {
    localStorage.removeItem(CELESI_RUAJTJES);
  } catch {
    // Si më sipër.
  }
  for (const fn of degjuesit) fn({ ...BOSH });
  return { ...BOSH };
}

/** I lidhur do të thotë: një projekt, një çelës, dhe një sesion që rifreskohet
 * pa e kërkuar sërish fjalëkalimin. */
export function eshteLidhur(k: Konfigurimi = lexoKonfigurimin()): boolean {
  return Boolean(k.url && k.anonKey && k.refreshToken);
}

/**
 * Një projekt është ngritur te kjo pajisje, punoftë a jo ende sesioni.
 *
 * Dallimi ka rëndësi për gjithçka që raporton gjendjen: një rifreskim që
 * projekti e refuzon i heq tokenat, pra `eshteLidhur` bëhet `false` — dhe një
 * pajisje që e gjykon veten vetëm nga ajo do të heshtte krejt pikërisht në
 * çastin kur përdoruesit i duhet t'i thuhet se asgjë nuk po sinkronizohet më.
 */
export function eshteKonfiguruar(k: Konfigurimi = lexoKonfigurimin()): boolean {
  return Boolean(k.url && k.anonKey);
}

/* ── HTTP ───────────────────────────────────────────────────────────────── */

/** Një gabim me kod të lexueshëm nga kodi, jo vetëm nga njeriu. */
export type GabimiSinkut = Error & { kodi?: string; kodiPg?: string };

function gabimi(mesazhi: string, kodi?: string): GabimiSinkut {
  return Object.assign(new Error(mesazhi), kodi ? { kodi } : {});
}

/**
 * Sa pritet një kërkesë para se të quhet e vdekur.
 *
 * Pa këtë kufi, `fetch`-i nuk kthehet **kurrë** te disa gjendje rrjeti — portali
 * i një kafeneje që i mban lidhjet hapur pa u përgjigjur është klasika. Pasoja
 * nuk është një sinkronizim i humbur: `nePritje` te `sinkronizimi.ts` mbetet i
 * zënë përgjithmonë, pra çdo sinkronizim i mëpasshëm i bashkohet një premtimi që
 * nuk zgjidhet dot, butoni rri i fikur, dhe rruga e vetme jashtë është rihapja e
 * skedës. Një kërkesë e ndërprerë është thjesht një gabim si çdo tjetër.
 *
 * Dërgimi merr më gjatë sepse bart deri në 250 rreshta; leximet janë të vogla.
 */
const PRITJA = 20_000;
const PRITJA_E_DERGIMIT = 60_000;

/**
 * `fetch` që dorëzohet, dhe që nuk hedh kurrë diçka veç `GabimiSinkut`.
 *
 * `AbortSignal.timeout` mungon te shfletuesit e vjetër, prandaj ora mbahet me
 * dorë — dhe `clearTimeout` bie te `finally`, që një kërkesë e shpejtë të mos
 * lërë prapa një orë që zgjohet njëzet sekonda më vonë.
 */
async function kerko(adresa: string, opsionet: RequestInit, pritja = PRITJA): Promise<Response> {
  const nderprerja = new AbortController();
  const ora = setTimeout(() => nderprerja.abort(), pritja);

  try {
    return await fetch(adresa, { ...opsionet, signal: nderprerja.signal });
  } catch (err) {
    // Ndërprerja jonë dhe një rrjetë e rënë janë e njëjta gjë për thirrësin:
    // kërkesa nuk mori përgjigje. Dallimi thuhet me fjalë, që «nuk u arrit» të
    // mos lexohet si «projekti tha jo».
    if ((err as Error)?.name === 'AbortError') {
      throw gabimi('Projekti nuk u përgjigj brenda kohës — provo sërish.', 'rrjeti');
    }
    throw gabimi('Projekti nuk u arrit — kontrollo internetin.', 'rrjeti');
  } finally {
    clearTimeout(ora);
  }
}

async function trupi(res: Response): Promise<Record<string, unknown> | null> {
  const tekst = await res.text();
  if (!tekst) return null;
  try {
    return JSON.parse(tekst) as Record<string, unknown>;
  } catch {
    return { message: tekst };
  }
}

async function fetchAuth(
  k: Konfigurimi,
  shtegu: string,
  body: unknown,
): Promise<Record<string, unknown>> {
  const res = await kerko(`${k.url}/auth/v1/${shtegu}`, {
    method: 'POST',
    headers: { apikey: k.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await trupi(res);
  if (!res.ok) {
    throw gabimi(mesazhiGabimit(res.status, data), res.status === 401 ? 'celesi' : 'auth');
  }
  return data ?? {};
}

type Sesioni = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: { id?: string; email?: string };
};

function ruajSesionin(data: Sesioni, shtese: Partial<Konfigurimi> = {}): Konfigurimi {
  return ruajKonfigurimin({
    accessToken: data.access_token || '',
    refreshToken: data.refresh_token || '',
    skadonMe: Date.now() + (Number(data.expires_in) || 3600) * 1000,
    userId: data.user?.id || '',
    email: data.user?.email || '',
    ...shtese,
  });
}

/**
 * A i detyrohet ende kjo pajisje përdoruesit një vendim për kopjen e cloud-it.
 *
 * Një lidhje **e re** po: ky shfletues sapo takoi një tabelë që nuk e ka parë
 * kurrë, dhe derisa dikush të thotë cila anë është e vërteta, dërgimi do të
 * ishte hamendje mbi historikun e dikujt. Një hyrje e dytë te i njëjti projekt
 * me të cilin kjo pajisje ka sinkronizuar tashmë jo — të dyja anët njihen, dhe
 * pyetja e përsëritur sa herë skadon një sesion do ta mësonte përdoruesin ta
 * kalojë me prekje pikërisht dialogun që ka rëndësi.
 */
function vendimiILidhjes(k: Konfigurimi, url: string): boolean | null {
  if (k.url === url && k.fundit) return k.lidhjaVerifikuar;
  return false;
}

/** Hyn te projekti i vetë përdoruesit. `url`/`anonKey` jepen herën e parë — asgjë
 * nuk ruhet para se projekti të jetë përgjigjur vërtet. */
export async function hyr({
  email,
  password,
  url,
  anonKey,
}: {
  email: string;
  password: string;
  url?: string;
  anonKey?: string;
}): Promise<Konfigurimi> {
  const k: Konfigurimi = {
    ...lexoKonfigurimin(),
    ...(url ? { url } : {}),
    ...(anonKey ? { anonKey } : {}),
  };
  const data = (await fetchAuth(k, 'token?grant_type=password', {
    email: email.trim(),
    password,
  })) as Sesioni;

  if (!data.access_token) throw gabimi('Projekti nuk ktheu sesion — provo sërish.', 'auth');

  return ruajSesionin(data, {
    url: k.url,
    anonKey: k.anonKey,
    lidhjaVerifikuar: vendimiILidhjes(lexoKonfigurimin(), k.url),
  });
}

/**
 * Krijon llogarinë brenda projektit të vetë përdoruesit.
 *
 * Me konfirmimin e email-it të ndezur (parazgjedhja e Supabase-it) përgjigjja
 * nuk ka sesion: llogaria ekziston por duhet konfirmuar, dhe kjo raportohet e
 * nuk trajtohet si dështim.
 */
export async function regjistrohu({
  email,
  password,
  url,
  anonKey,
}: {
  email: string;
  password: string;
  url?: string;
  anonKey?: string;
}): Promise<{ konfirmim: boolean; konfigurimi: Konfigurimi | null }> {
  const k: Konfigurimi = {
    ...lexoKonfigurimin(),
    ...(url ? { url } : {}),
    ...(anonKey ? { anonKey } : {}),
  };
  const origjina = typeof window === 'undefined' ? '' : window.location.origin;
  const data = (await fetchAuth(k, shtegiRegjistrimit(origjina), {
    email: email.trim(),
    password,
  })) as Sesioni;

  if (!data.access_token) return { konfirmim: true, konfigurimi: null };

  return {
    konfirmim: false,
    konfigurimi: ruajSesionin(data, {
      url: k.url,
      anonKey: k.anonKey,
      lidhjaVerifikuar: vendimiILidhjes(lexoKonfigurimin(), k.url),
    }),
  };
}

/**
 * Një token i përdorshëm, i rifreskuar kur është për të skaduar. Çdo kërkesë
 * kalon nga këtu, prandaj një sesion i lënë një javë vazhdon të punojë pa e
 * kërkuar sërish fjalëkalimin.
 *
 * Një rifreskim që projekti e refuzon (fjalëkalimi u ndërrua diku tjetër,
 * përdoruesi u fshi, projekti u ndal) i heq tokenat por e mban adresën dhe
 * çelësin: përdoruesit i duhet ta shkruajë fjalëkalimin sërish, e jo ta ngrejë
 * gjithçka nga e para.
 */
export async function siguroSesionin(): Promise<Konfigurimi> {
  const k = lexoKonfigurimin();
  if (!k.url || !k.anonKey) throw gabimi('Sinkronizimi nuk është konfiguruar.', 'pakonfiguruar');
  if (!k.refreshToken) throw gabimi('S\'ka sesion — hyr sërish me email e fjalëkalim.', 'sesioni');
  if (k.accessToken && Date.now() < k.skadonMe - 60_000) return k;

  let data: Sesioni;
  try {
    data = (await fetchAuth(k, 'token?grant_type=refresh_token', {
      refresh_token: k.refreshToken,
    })) as Sesioni;
  } catch (err) {
    if ((err as GabimiSinkut).kodi === 'rrjeti') throw err;
    ruajKonfigurimin({ accessToken: '', refreshToken: '', skadonMe: 0 });
    throw gabimi('Sesioni skadoi — hyr sërish me email e fjalëkalim.', 'sesioni');
  }

  return ruajSesionin(data);
}

export async function dil(): Promise<Konfigurimi> {
  const k = lexoKonfigurimin();
  try {
    if (k.accessToken) {
      await kerko(`${k.url}/auth/v1/logout`, {
        method: 'POST',
        headers: { apikey: k.anonKey, Authorization: `Bearer ${k.accessToken}` },
      });
    }
  } catch {
    // Dalja është punë lokale së pari: tokenat poshtë bien sido që të jetë.
  }
  return ruajKonfigurimin({ accessToken: '', refreshToken: '', skadonMe: 0 });
}

/**
 * Një thirrje PostgREST kundër projektit të përdoruesit, e identifikuar si ai
 * vetë që rregullat e rreshtave të vlejnë edhe për të.
 *
 * Kthen trupin e lexuar, ose vetë përgjigjen për thirrësin e vetëm që i duhet
 * një kokë — numri i rreshtave, të cilin PostgREST-i e shkruan te
 * `Content-Range` e jo te trupi.
 */
export async function rest(
  shtegu: string,
  {
    method = 'GET',
    body,
    headers = {},
    kthePergjigjen = false,
  }: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    kthePergjigjen?: boolean;
  } = {},
): Promise<unknown> {
  const k = await siguroSesionin();
  const res = await kerko(
    `${k.url}/rest/v1/${shtegu}`,
    {
      method,
      headers: {
        apikey: k.anonKey,
        Authorization: `Bearer ${k.accessToken}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    method === 'GET' ? PRITJA : PRITJA_E_DERGIMIT,
  );

  if (res.ok) return kthePergjigjen ? res : trupi(res);

  const data = await trupi(res);
  // PGRST205 është «atë tabelë nuk e njoh», pra skripti i ngritjes nuk ka rënë
  // kurrë. Është dështimi më i mundshëm i hapjes së parë, prandaj merr kodin e
  // vet dhe udhëzimin e vet.
  if (data?.code === 'PGRST205' || res.status === 404) {
    throw gabimi(mesazhiGabimit(res.status, data), 'tabela');
  }
  if (res.status === 401 || res.status === 403) {
    throw gabimi(mesazhiGabimit(res.status, data), 'leje');
  }

  // Kodi i vetë PostgREST-it udhëton me gabimin: thirrësi që mund të veprojë mbi
  // ndonjërin prej tyre nuk ka pse ta lexojë prozën angleze për ta njohur.
  return Promise.reject(
    Object.assign(gabimi(mesazhiGabimit(res.status, data), 'server'), {
      kodiPg: String(data?.code ?? ''),
    }),
  );
}

/* ── Ngritja e projektit ────────────────────────────────────────────────── */

/**
 * Kufiri këtu nuk është veçori që mungon, është vetë forma e API-së: çelësi i
 * ruajtur te kjo pajisje arrin **vetëm** te PostgREST-i, dhe PostgREST-i shërben
 * rreshta. Ai nuk krijon dot tabelë, politikë a trigger, dhe asnjë cilësim i
 * projektit nuk e bën të aftë — e cila është edhe ajo që e ndal një kopje të
 * vjedhur të `localStorage`-it nga rishkrimi i bazës.
 *
 * Prandaj ngritja është skripti, dhe `linkuSkriptit` e hap SQL Editor-in e vetë
 * përdoruesit me të brenda: një prekje, pastaj «Run». `verifikoSkemen` është
 * rruga prapa — çka ra pyetet te projekti, e jo te ai që shtypi butonin.
 */
export function linkuSkriptit(
  url: string = lexoKonfigurimin().url,
  skripti: string = SQL_INSTALIMI,
): string {
  const ref = referencaProjektit(url);
  if (!ref) return 'https://supabase.com/dashboard';
  return `https://supabase.com/dashboard/project/${ref}/sql/new?content=${encodeURIComponent(
    skripti,
  )}`;
}

/** Dështime që nuk thonë asgjë për skemën: pyetja nuk i doli kurrë projektit,
 * pra përgjigjja është «pyet sërish», jo «skripti nuk ka rënë». */
const PA_PERGJIGJE = new Set(['rrjeti', 'sesioni', 'pakonfiguruar']);

/**
 * Kontrollon deri ku arriti vërtet projekti, dhe e shënon.
 *
 * Skripti bie te një SQL Editor, te një skedë tjetër, jashtë çdo gjëje që ky
 * aplikacion mund ta shohë — pra raporti i vetëm i besueshëm është ai i vetë
 * bazës. Çdo migrim pezull mban një pyetje që kthen përgjigje vetëm pasi ai të
 * ketë rënë; provohen me radhë, dhe i pari që dështon është aty ku ka mbetur
 * projekti. Një skript i rënë përgjysmë mbahet mend si i tillë.
 */
export async function verifikoSkemen(nga = 0): Promise<number> {
  const pezull = migrimetPezull(nga);
  if (pezull.length === 0) return nga;

  let arritur = 0;
  for (const m of pezull) {
    if (!m.verifikimi) break;
    try {
      await rest(m.verifikimi);
    } catch (err) {
      if (PA_PERGJIGJE.has(String((err as GabimiSinkut).kodi))) throw err;
      break;
    }
    arritur = m.versioni;
  }

  if (arritur <= nga) {
    throw gabimi(
      `Projekti ende nuk e ka atë që kërkon skripti — tabela „${TABELA}" nuk përgjigjet. Ekzekutoje te SQL Editor (Run) dhe provo sërish.`,
      'pakryer',
    );
  }

  // Projektit i thuhet vetë se ku arriti, që çdo pajisje tjetër ta lexojë
  // përgjigjen e jo ta hamendësojë nga versioni i aplikacionit që i ra në dorë.
  // Përpjekje e mirë: migrimi ka rënë, dhe një shenjë e pashkruar nuk ka pse ta
  // raportojë atë si të parënë.
  await shenoVersioninSkemes(arritur).catch(() => undefined);
  ruajKonfigurimin({ skemaVersioni: arritur });
  return arritur;
}

/**
 * Te cili migrim ka arritur projekti i lidhur.
 *
 * Lexohet nga projekti e jo nga kjo pajisje, sepse projekti është ai që u
 * migrua — një telefon që nuk ka ekzekutuar kurrë ndonjë do ta raportonte punën
 * e tabletit si të pabërë.
 */
export async function lexoVersioninSkemes(): Promise<number> {
  const rreshtat = (await rest(
    `${TABELA}?store=eq.${STORI_META}&record_id=eq.${ID_SKEMES}&select=data&limit=1`,
  )) as Array<{ data?: { versioni?: number } }> | null;

  const versioni = Number(rreshtat?.[0]?.data?.versioni);
  return Number.isFinite(versioni) && versioni > 0 ? versioni : VERSIONI_PARA_NUMERIMIT;
}

/** E shkruan atë lexim te vetë tabela e projektit. */
export async function shenoVersioninSkemes(versioni: number): Promise<number> {
  const k = await siguroSesionin();
  await rest(`${TABELA}?on_conflict=user_id,store,record_id`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: [
      {
        user_id: k.userId,
        store: STORI_META,
        record_id: ID_SKEMES,
        deleted: false,
        data: { versioni, perditesuar: new Date().toISOString() },
      },
    ],
  });
  return versioni;
}

export type GjendjaESkemes = {
  versioni: number;
  iFundit: number;
  perditeso: boolean;
  pezull: Migrimi[];
  mungon: boolean;
};

/** Çka i duhet ekranit për të ndarë «i freskët», «kërkon përditësim» dhe
 * «s'është ngritur kurrë». */
export async function gjendjaSkemes(): Promise<GjendjaESkemes> {
  try {
    const versioni = await lexoVersioninSkemes();
    return {
      versioni,
      iFundit: SKEMA_VERSIONI,
      perditeso: versioni < SKEMA_VERSIONI,
      pezull: migrimetPezull(versioni),
      mungon: false,
    };
  } catch (err) {
    if ((err as GabimiSinkut).kodi !== 'tabela') throw err;
    return { versioni: 0, iFundit: SKEMA_VERSIONI, perditeso: true, pezull: MIGRIMET, mungon: true };
  }
}

/**
 * Ndërron çelësin publik të ruajtur — ditën që përdoruesi e rrotullon te
 * Supabase.
 *
 * Çelësi i ri provohet para se të mbahet, sepse po shkruhet pikërisht te pajisja
 * që do t'i duhej ai për t'i folur projektit: ruajtja e një çelësi të shtypur
 * gabim dhe zbulimi i tij pastaj do ta linte pajisjen pa sinkronizim derisa të
 * shkëputej e të ngrihej nga e para. Kontrolli bëhet sa kohë punon ende ai i
 * vjetri.
 *
 * Vetëm çelësi. Një adresë tjetër do të thoshte bazë tjetër, me përdoruesit dhe
 * rreshtat e vet — pra rilidhje e jo redaktim, dhe ekrani e thotë ashtu.
 */
export async function ndryshoCelesin(celesiIRi: string): Promise<Konfigurimi> {
  const kontrolli = kontrolloCelesin(celesiIRi);
  if (!kontrolli.ok) throw gabimi(kontrolli.gabimi, 'celesi');

  const k = await siguroSesionin();
  const res = await kerko(`${k.url}/rest/v1/${TABELA}?select=record_id&limit=1`, {
    headers: { apikey: kontrolli.vlera, Authorization: `Bearer ${k.accessToken}` },
  });

  if (!res.ok) {
    const data = await trupi(res);
    if (res.status === 401 || res.status === 403) {
      throw gabimi(
        'Projekti nuk e pranoi çelësin e ri — kontrollo se është kopjuar i plotë dhe nga ky projekt.',
        'celesi',
      );
    }
    throw gabimi(mesazhiGabimit(res.status, data), 'server');
  }

  return ruajKonfigurimin({ anonKey: kontrolli.vlera });
}

export { kontrolloCelesin, normalizoUrl, referencaProjektit } from './projekti.ts';
