/**
 * Një sinkronizim: shkarko, zbato, dërgo.
 *
 * Rregullat e vendimeve rrinë te `bashkimi.ts` dhe provohen me `node --test`
 * (pika 1). Këtu rri ajo që nuk provohet dot pa shfletues e pa rrjet: leximi i
 * bazës, kërkesat te projekti i përdoruesit, dhe radha e hapave.
 *
 * ── katër format e një sinkronizimi ──────────────────────────────────────
 *
 * I zakonshmi (pa `menyra`, lidhja prej kohësh e vendosur) është ai i
 * përshkruar te `bashkimi.ts`: merr çka ndryshoi, zbatoje veç nëse kjo pajisje
 * mban një ndryshim të padërguar për të njëjtin regjistër, dërgo atë që mban.
 *
 * Tri të tjerat ekzistojnë për një dështim që nuk është hipotetik — një pajisje
 * e sapopastruar ose e sapoinstaluar që ngarkon bazën e vet të zbrazët mbi
 * historikun që cloud-i e mban prej muajsh:
 *
 * - **Pa vendim ende** (`lidhjaVerifikuar === false`): kjo pajisje shkarkon dhe
 *   nuk dërgon **asgjë**, dhe e thotë (`kerkohetVendim`). Një sinkronizim që
 *   vetëm lexon nuk humb dot asgjë.
 * - **`BASHKO`**: shkarkim i plotë ku cloud-i fiton çdo përplasje, pastaj
 *   dërgohet vetëm çka cloud-i nuk e ka dëgjuar kurrë. Të dyja anët mbijetojnë.
 * - **`MERR`**: kopja e cloud-it e zëvendëson atë që rri këtu. Shkarkimi kryhet
 *   **para** se të pastrohet çkado lokale, që një kërkesë e dështuar ta lërë
 *   bazën të paprekur.
 * - **`DERGO`**: kjo pajisje shpallet e vërteta dhe gjithçka këtu shkon lart.
 *   Ekrani e bën përdoruesin ta shkruajë fjalën për këtë.
 */

import {
  GJENDJA_BOSH,
  MENYRAT,
  celesiRreshtit,
  gjendjaLokale,
  mungojneNeCloud,
  ndryshimetLokale,
  numriLokal,
  permbledhjaELidhjes,
  planiIAplikimit,
  uidetLokale,
} from './bashkimi.ts';
import type {
  Gjendja,
  Menyra,
  PerDergim,
  PermbledhjaELidhjes,
  RreshtiSinkut,
} from './bashkimi.ts';
import { pajisjaKjo, stampaPajisjes } from './pajisja.ts';
import {
  gjendjaSink,
  onNdryshimLokal,
  pastroPerSink,
  shenoPezull,
  shenoTeDerguarat,
  zbatoPlanin,
} from './ruajtja.ts';
import { PREFIKSI_PAJISJES, STORI_META } from './skema.ts';
import {
  TABELA,
  eshteLidhur,
  lexoKonfigurimin,
  rest,
  ruajKonfigurimin,
  siguroSesionin,
} from './supabase.ts';
import type { Konfigurimi, Permbledhja } from './supabase.ts';
import type { Grupi, Loja, StoriSink } from './tipet.ts';

export { KOHA_PARA_SINKRONIZIMIT, MENYRAT } from './bashkimi.ts';
export type { Menyra, PermbledhjaELidhjes } from './bashkimi.ts';

/** PostgREST-i e pret përgjigjen te 1000 rreshta; kërkimi i më pakve e mban një
 * sinkronizim të parë te disa kërkesa të shpejta e jo te një e stërmadhe. */
const KUFIRI_SHKARKIMIT = 500;
const KUFIRI_DERGIMIT = 250;

/* ── Përkthimi i rreshtave ──────────────────────────────────────────────── */

/** `id` numerike → `uid`, për të dy nivelet e lidhjeve. Ndërtohet një herë për
 * kalim: kërkimi i secilës me radhë do të ishte një skanim për rresht të
 * dërguar. */
function uidetSipasId(gjendja: Gjendja): {
  grupet: Map<number, string>;
  lojerat: Map<number, string>;
} {
  const grupet = new Map<number, string>();
  const lojerat = new Map<number, string>();
  for (const grupi of gjendja.groups as Grupi[]) if (grupi.uid) grupet.set(grupi.id, grupi.uid);
  for (const loja of gjendja.games as Loja[]) if (loja.uid) lojerat.set(loja.id, loja.uid);
  return { grupet, lojerat };
}

/**
 * Kolonat e tabelës. `user_id` dërgohet e nuk i lihet parazgjedhjes së kolonës,
 * sepse një `insert` i shumëfishtë nëpër PostgREST i mbush çelësat e lënë jashtë
 * me `NULL` — dhe `NULL`-i është e vetmja vlerë që rregulli i sigurisë e refuzon.
 */
export function rreshtiPerServer(
  rr: PerDergim,
  userId: string,
  pajisja: { id: string; emri: string } | null,
): Record<string, unknown> {
  return {
    user_id: userId,
    store: rr.store,
    record_id: rr.uid,
    // Dërgohet për një projekt skripti i të cilit është më i vjetër se trigger-i
    // i orës; aty ku ai ekziston, e mbivendos me orën e vetë serverit — e cila
    // është tërë qëllimi i tij.
    updated_at: new Date(rr.perditesuar).toISOString(),
    deleted: rr.fshire,
    data: rr.fshire ? null : rr.data,
    ...(pajisja ? { device_id: pajisja.id, device_name: pajisja.emri } : {}),
  };
}

export function rreshtiNgaServeri(row: Record<string, unknown>): RreshtiSinkut {
  return {
    store: String(row?.store ?? ''),
    uid: String(row?.record_id ?? ''),
    perditesuar: Date.parse(String(row?.updated_at ?? '')),
    fshire: Boolean(row?.deleted),
    data: (row?.data as Record<string, unknown> | null) ?? null,
  };
}

/* ── Rrjeti ─────────────────────────────────────────────────────────────── */

async function shkarkoRreshtat(nga: string): Promise<RreshtiSinkut[]> {
  const kolonat = 'select=store,record_id,updated_at,deleted,data';
  const filtri = nga ? `&updated_at=gt.${encodeURIComponent(nga)}` : '';
  const rreshtat: RreshtiSinkut[] = [];

  for (let offset = 0; ; offset += KUFIRI_SHKARKIMIT) {
    const pjesa = (await rest(
      `${TABELA}?store=neq.${STORI_META}&${kolonat}${filtri}` +
        `&order=updated_at.asc,store.asc,record_id.asc&limit=${KUFIRI_SHKARKIMIT}&offset=${offset}`,
    )) as Array<Record<string, unknown>> | null;

    const lista = Array.isArray(pjesa) ? pjesa : [];
    rreshtat.push(...lista.map(rreshtiNgaServeri));
    if (lista.length < KUFIRI_SHKARKIMIT) return rreshtat;
  }
}

/**
 * Çdo çelës që mban kopja e cloud-it, varret brenda.
 *
 * Vetëm dy kolonat që e bëjnë çelësin: për një historik prej disa mijëra
 * regjistrash kjo është një listë vargjesh të shkurtra, e jo vetë historiku —
 * dhe pikërisht kjo e bën kontrollin të përballueshëm.
 */
export async function celesatCloud(): Promise<Set<string>> {
  const celesat = new Set<string>();

  for (let offset = 0; ; offset += KUFIRI_SHKARKIMIT) {
    const pjesa = (await rest(
      `${TABELA}?store=neq.${STORI_META}&select=store,record_id` +
        `&order=store.asc,record_id.asc&limit=${KUFIRI_SHKARKIMIT}&offset=${offset}`,
    )) as Array<{ store?: string; record_id?: string }> | null;

    const lista = Array.isArray(pjesa) ? pjesa : [];
    for (const rr of lista) {
      if (rr?.store && rr?.record_id) celesat.add(celesiRreshtit(rr.store, rr.record_id));
    }
    if (lista.length < KUFIRI_SHKARKIMIT) return celesat;
  }
}

/** Sa rreshta mban kopja e cloud-it — përgjigjja e pyetjes «a shkoi vërtet
 * ndonjë gjë atje lart?». */
export async function numeroCloud(): Promise<number | null> {
  // `limit=1` e mban trupin te një rresht; numri udhëton te koka. Me qëllim pa
  // një kokë `Range` krah tij: një interval që kërkon një rresht që tabela e
  // zbrazët nuk e ka kthehet me 416, dhe kopja e zbrazët është pikërisht gjendja
  // menjëherë pas butonit të fshirjes.
  const res = (await rest(`${TABELA}?store=neq.${STORI_META}&select=record_id&limit=1`, {
    headers: { Prefer: 'count=exact' },
    kthePergjigjen: true,
  })) as Response;

  // PostgREST-i e shkruan numrin te `Content-Range`, si `0-0/123`.
  const range = res.headers.get('content-range') || '';
  const numri = Number(range.split('/')[1]);
  return Number.isFinite(numri) ? numri : null;
}

async function dergoRreshtat(
  rreshtat: PerDergim[],
  k: Konfigurimi,
): Promise<Map<string, number>> {
  const kohet = new Map<string, number>();
  const pajisja = stampaPajisjes();

  for (let i = 0; i < rreshtat.length; i += KUFIRI_DERGIMIT) {
    const copa = rreshtat.slice(i, i + KUFIRI_DERGIMIT);
    const pergjigja = (await rest(
      `${TABELA}?on_conflict=user_id,store,record_id&select=store,record_id,updated_at`,
      {
        method: 'POST',
        body: copa.map((rr) => rreshtiPerServer(rr, k.userId, pajisja)),
        // Një `upsert`: i njëjti regjistër i redaktuar dy herë duhet ta
        // përditësojë rreshtin, e jo të bjerë te çelësi primar.
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      },
    )) as Array<Record<string, unknown>> | null;

    for (const row of Array.isArray(pergjigja) ? pergjigja : []) {
      const ts = Date.parse(String(row?.updated_at ?? ''));
      if (row?.store && row?.record_id && Number.isFinite(ts)) {
        kohet.set(celesiRreshtit(String(row.store), String(row.record_id)), ts);
      }
    }
  }

  return kohet;
}

/* ── Cila pajisje e bëri ────────────────────────────────────────────────── */

export type PajisjaERegjistruar = {
  id: string;
  emri: string;
  krijuar: number | null;
  sinkFundit: string | null;
  derguar: number;
  marre: number;
  rreshta: number;
  kjo: boolean;
};

/**
 * Rreshti i kësaj pajisjeje te projekti i përdoruesit: emri, kur sinkronizoi
 * së fundi, sa mban.
 *
 * Rri nën storin `meta`, të cilin vetë sinkronizimi e kalon pa e parë — pra
 * është llogari **për** historikun e jo pjesë e tij. Puna e tij është ekrani i
 * sinkronizimit te një pajisje **tjetër**: me një llogari të hyrë kudo, një
 * listë pajisjesh dhe çka bëri secila është e vetmja përgjigje e pyetjes «prej
 * nga erdhi kjo?».
 *
 * Përpjekje e mirë kudo: një pajisje që s'e nënshkruan dot veten sinkronizon
 * përsosmërisht.
 */
export async function regjistroPajisjen({
  derguar = 0,
  marre = 0,
  rreshta = 0,
}: { derguar?: number; marre?: number; rreshta?: number } = {}): Promise<void> {
  const k = await siguroSesionin();
  const pajisja = pajisjaKjo();
  if (!pajisja.id) return;

  await rest(`${TABELA}?on_conflict=user_id,store,record_id`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: [
      {
        user_id: k.userId,
        store: STORI_META,
        record_id: `${PREFIKSI_PAJISJES}${pajisja.id}`,
        deleted: false,
        data: {
          id: pajisja.id,
          emri: pajisja.emri,
          krijuar: pajisja.krijuar,
          sinkFundit: new Date().toISOString(),
          derguar,
          marre,
          rreshta,
        },
        device_id: pajisja.id,
        device_name: pajisja.emri,
      },
    ],
  });
}

/** Çdo pajisje që ka sinkronizuar ndonjëherë me këtë projekt, më e reja e para. */
export async function lexoPajisjet(): Promise<PajisjaERegjistruar[]> {
  const rreshtat = (await rest(
    `${TABELA}?store=eq.${STORI_META}&record_id=like.${encodeURIComponent(
      `${PREFIKSI_PAJISJES}*`,
    )}&select=record_id,updated_at,data&order=updated_at.desc`,
  )) as Array<{ record_id?: string; updated_at?: string; data?: Record<string, unknown> }> | null;

  const kjo = pajisjaKjo().id;

  return (Array.isArray(rreshtat) ? rreshtat : []).map((rr) => {
    const id = String(rr?.data?.id ?? String(rr?.record_id ?? '').slice(PREFIKSI_PAJISJES.length));
    return {
      id,
      emri: String(rr?.data?.emri ?? 'Pajisje pa emër'),
      krijuar: Number(rr?.data?.krijuar) || null,
      sinkFundit: String(rr?.data?.sinkFundit ?? rr?.updated_at ?? '') || null,
      derguar: Number(rr?.data?.derguar) || 0,
      marre: Number(rr?.data?.marre) || 0,
      rreshta: Number(rr?.data?.rreshta) || 0,
      kjo: id === kjo,
    };
  });
}

/** Heq një pajisje nga ajo listë — për atë që u shit, u riinstalua, ose thjesht
 * s'është më. Nuk e shkëput asgjë: rreshti është shënim për një pajisje, jo
 * qasja e saj. */
export async function harroPajisjen(id: string): Promise<void> {
  await rest(
    `${TABELA}?store=eq.${STORI_META}&record_id=eq.${encodeURIComponent(
      `${PREFIKSI_PAJISJES}${id}`,
    )}`,
    { method: 'DELETE', headers: { Prefer: 'return=minimal' } },
  );
}

/* ── Dy anët, para se të shkruhet gjë ───────────────────────────────────── */

/** Dy anët të numëruara kundër njëra-tjetrës, pa shkruar asgjë. */
export async function permbledhjaLidhjes(): Promise<PermbledhjaELidhjes> {
  const gjendja = await gjendjaSink();
  return permbledhjaELidhjes(gjendja, await celesatCloud());
}

/** Sa regjistra mban kjo pajisje, për një ekran që do t'i krahasojë me numrin e
 * cloud-it. */
export async function numeroLokal(): Promise<number> {
  return numriLokal(await gjendjaSink());
}

/**
 * Regjistrat për të cilët cloud-i nuk ka dëgjuar kurrë, shënuar sërish si të
 * padërguar që dërgimi i po këtij sinkronizimi t'i marrë me vete.
 *
 * Ekziston sepse flamuri nuk mjafton sapo të dyja anët të mos pajtohen — një
 * kopje e zbrazur nga diku tjetër, një rresht i humbur — dhe atëherë mospajtimi
 * bëhet i përhershëm: një regjistër me flamurin «i dërguar» nuk shikohet më
 * kurrë.
 */
async function riparoKopjen(gjendja: Gjendja): Promise<number> {
  return shenoPezull(mungojneNeCloud(gjendja, await celesatCloud()));
}

/** Riparimi me kërkesë, për ekranin që sapo i tregoi përdoruesit dy numra që
 * nuk përputhen. */
export async function riparoTani(): Promise<number> {
  return riparoKopjen(await gjendjaSink());
}

/** Sa shpesh numërohen të dyja anët kundër njëra-tjetrës. */
const NDERMJET_KONTROLLEVE = 24 * 60 * 60 * 1000;

/** Sa shpesh e rinënshkruan një pajisje rreshtin e vet kur s'ka lëvizur asgjë. */
const NDERMJET_SHENIMEVE = 60 * 60 * 1000;

/**
 * Një herë në ditë kontrollon se cloud-i mban së paku aq sa kjo pajisje, dhe e
 * riparon kur nuk mban.
 *
 * Kërkesa e parë është një numërim — një rresht dhe një kokë — dhe është e vetmja
 * që bie ditën e zakonshme. Lista e çelësave merret **vetëm** kur ai numër del i
 * shkurtër, që është i vetmi rast ku diçka mungon me siguri: cloud-i mund të
 * mbajë me të drejtë **më shumë** se kjo pajisje (varre që ajo i ka fshirë),
 * kurrë më pak.
 */
async function riparoNeseMungon(
  gjendja: Gjendja,
  k: Konfigurimi,
  anashkalo: boolean,
): Promise<number> {
  if (anashkalo) return 0;
  if (Date.now() - (Number(k.kontrolluarMe) || 0) < NDERMJET_KONTROLLEVE) return 0;

  try {
    const neCloud = await numeroCloud();
    // I shkruar para punës e jo pas: një kontroll që bie përgjysmë nuk duhet të
    // bjerë te çdo sinkronizim i mëpasshëm.
    ruajKonfigurimin({ kontrolluarMe: Date.now() });
    if (neCloud === null || neCloud >= numriLokal(gjendja)) return 0;
    return await riparoKopjen(gjendja);
  } catch {
    // Kontrolli nuk është sinkronizimi. Çkado që shkoi keq këtu, ndryshimet që
    // mban kjo pajisje e meritojnë dërgimin e vet.
    return 0;
  }
}

/* ── Vetë sinkronizimi ──────────────────────────────────────────────────── */

export type RezultatiSinkut = Permbledhja & {
  menyra: Menyra | null;
  riparuar: number;
  anashkaluar: number;
  shtyre: number;
  ndryshoi: boolean;
};

let nePritje: Promise<RezultatiSinkut> | null = null;

/**
 * Thirrjet që mbërrijnë sa zgjat një sinkronizim i bashkohen atij në vend që të
 * nisin një të dytë: sinkronizimi automatik nxitet nga disa gjëra njëherësh —
 * një ruajtje, skeda që rifiton fokusin, rrjeti që kthehet — dhe dy vrapime të
 * mbivendosura do t'i dërgonin të njëjtët rreshta dy herë e do të garonin mbi
 * shënjuesit.
 *
 * Një sinkronizim që përdoruesi e kërkoi me emër — «merre kopjen e cloud-it»,
 * «kjo pajisje është e vërteta» — nuk i përgjigjet kurrë me vrapimin e dikujt
 * tjetër: pret atë që është në ajër dhe pastaj bën punën e vet.
 */
export function sinkronizo(
  opsionet: { ngaFillimi?: boolean; menyra?: Menyra | null } = {},
): Promise<RezultatiSinkut> {
  if (nePritje && !opsionet.menyra) return nePritje;

  const paraardhesi = nePritje ? nePritje.catch(() => undefined) : Promise.resolve();
  const im = paraardhesi
    .then(() => ekzekuto(opsionet))
    .finally(() => {
      if (nePritje === im) nePritje = null;
    });

  nePritje = im;
  return im;
}

export function dukeSinkronizuar(): boolean {
  return nePritje !== null;
}

async function ekzekuto({
  ngaFillimi: kerkuar = false,
  menyra = null,
}: { ngaFillimi?: boolean; menyra?: Menyra | null } = {}): Promise<RezultatiSinkut> {
  const nisi = Date.now();

  try {
    const k = await siguroSesionin();
    if (!k.userId) throw new Error('Sesioni nuk ka përdorues — hyr sërish.');

    // I lidhur, por askush nuk ka thënë ende çka duhet bërë me atë që rri atje
    // lart. Vetëm lexim derisa ta thotë.
    const paVendim = !menyra && k.lidhjaVerifikuar === false;
    const ngaFillimi = Boolean(menyra) || kerkuar || Boolean(k.ngaFillimiTjeter);

    let gjendja = await gjendjaSink();

    // Tërë tabela e jo vetëm ndryshimet: e kërkojnë mënyrat, dhe e kërkon një
    // pajisje që nuk ka vendosur ende — shënjuesit e saj nuk thonë asgjë.
    const rreshtat = await shkarkoRreshtat(ngaFillimi || paVendim ? '' : k.pulledAt);

    // Pastrohet vetëm tani, me tërë kopjen e cloud-it në dorë: një shkarkim i
    // dështuar përgjysmë duhet ta lërë pajisjen ashtu si ishte, jo të zbrazët.
    if (menyra === MENYRAT.MERR) {
      await pastroPerSink();
      gjendja = GJENDJA_BOSH;
    }

    // T'i bashkohesh një kopjeje është çasti i vetëm kur një ndryshim lokal i
    // padërguar nuk është e vërteta më e re — është thjesht çka shkroi ky
    // shfletues para se të kishte ku ta dërgonte.
    const cloudFiton = menyra === MENYRAT.MERR || menyra === MENYRAT.BASHKO;
    const lokale = gjendjaLokale(gjendja);
    const plani = planiIAplikimit(
      rreshtat,
      { ...lokale, uidet: uidetLokale(gjendja) },
      { cloudFiton },
    );
    await zbatoPlanin(plani);

    const riparuar = await riparoNeseMungon(gjendja, k, ngaFillimi || paVendim);

    // Baza rilexohet: zbatimi sapo krijoi `id`-të numerike të regjistrave të
    // rinj, dhe pa to lidhjet `groupId`/`gameId` nuk përkthehen dot në `uid`.
    const pasZbatimit = await gjendjaSink();

    // Gjithçka që cloud-i e mban tashmë, nga shkarkimi që sapo mbaroi — pra një
    // bashkim mund të dërgojë çka mungon pa e pyetur projektin një herë të dytë.
    const perjashto =
      menyra === MENYRAT.BASHKO
        ? new Set([
            ...plani.celesat,
            ...rreshtat.map((rr) => celesiRreshtit(rr.store, rr.uid)),
          ])
        : plani.celesat;

    const perDergim: PerDergim[] =
      paVendim || menyra === MENYRAT.MERR
        ? []
        : ndryshimetLokale(pasZbatimit, {
            uidet: uidetSipasId(pasZbatimit),
            // Një shkarkim i plotë i ridërgon edhe të gjitha, që një kopje që
            // humbi rreshta të plotësohet nga kjo pajisje.
            gjithcka: ngaFillimi,
            perjashto,
          });

    const kohetServerit = await dergoRreshtat(perDergim, k);
    await shenoTeDerguarat(perDergim, kohetServerit);

    // Lëvizet vetëm nga rreshta që u panë vërtet. Ngritja e tij te «tani» do të
    // kapërcente çdo rresht që një pajisje tjetër e shkroi sa zgjati ky
    // sinkronizim — e vetmja klasë ndryshimesh që atëherë nuk do të shkarkohej
    // kurrë.
    const pulledAt = Math.max(plani.maxTs, Date.parse(k.pulledAt) || 0);

    const permbledhja: Permbledhja = {
      kur: new Date().toISOString(),
      gabim: null,
      marre: plani.shkruaj.length + plani.fshi.length,
      derguar: perDergim.length,
      // Mbahet te përmbledhja e ruajtur që ekrani të vazhdojë ta thotë «kjo
      // pajisje nuk ka vendosur» edhe pas një rifreskimi.
      kerkohetVendim: paVendim,
    };

    ruajKonfigurimin({
      pulledAt: pulledAt ? new Date(pulledAt).toISOString() : '',
      pushedAt: nisi,
      ngaFillimiTjeter: false,
      // Përgjigjja e pyetjes është ajo që e mbyll atë, dhe mbetet e mbyllur.
      ...(menyra ? { lidhjaVerifikuar: true } : {}),
      fundit: permbledhja,
    });

    // I fundit, dhe kurrë fatal: historiku ka lëvizur tashmë, dhe një pajisje që
    // s'e nënshkroi dot emrin e vet ka sinkronizuar përsosmërisht. Shkruhet kur
    // lëvizi diçka, dhe përndryshe së shumti një herë në orë.
    if (
      permbledhja.marre > 0 ||
      permbledhja.derguar > 0 ||
      Date.now() - (Number(k.pajisjaShenuarMe) || 0) > NDERMJET_SHENIMEVE
    ) {
      await regjistroPajisjen({
        derguar: permbledhja.derguar,
        marre: permbledhja.marre,
        rreshta: numriLokal(await gjendjaSink()),
      })
        .then(() => ruajKonfigurimin({ pajisjaShenuarMe: Date.now() }))
        .catch(() => undefined);
    }

    return {
      ...permbledhja,
      menyra,
      riparuar,
      anashkaluar: plani.anashkaluar,
      shtyre: plani.shtyre,
      ndryshoi: permbledhja.marre > 0,
    };
  } catch (err) {
    ruajKonfigurimin({
      fundit: {
        kur: new Date().toISOString(),
        gabim: (err as Error)?.message || 'Sinkronizimi dështoi.',
        marre: 0,
        derguar: 0,
      },
    });
    throw err;
  }
}

/**
 * Zbraz kopjen e cloud-it të këtij përdoruesi, pa e prekur bazën e asnjë
 * pajisjeje.
 *
 * Shënjuesit bien bashkë me të. Të lënë ashtu, kjo pajisje do ta quante veten të
 * freskët me një tabelë që nuk ka më asgjë brenda dhe nuk do ta ngarkonte kurrë
 * historikun e vet prapa.
 */
export async function fshiCloud(): Promise<void> {
  const k = await siguroSesionin();
  await rest(`${TABELA}?user_id=eq.${encodeURIComponent(k.userId)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });

  // Zbrazja me qëllim, pas dy pohimeve, **është** vendimi për kopjen — prandaj
  // pajisja nuk pyetet sërish.
  ruajKonfigurimin({
    pulledAt: '',
    pushedAt: 0,
    fundit: null,
    ngaFillimiTjeter: true,
    lidhjaVerifikuar: true,
  });
}

/** Sinkronizim nga e para herën tjetër, pa e prekur asgjë të ruajtur. */
export function rivendosKufijte(): Konfigurimi {
  return ruajKonfigurimin({ pulledAt: '', pushedAt: 0 });
}

/**
 * A pret ende diçka të dërgohet nga kjo pajisje.
 *
 * Lexohet një herë te nisja, sepse vetë fakti i mbijeton skedës: një raund i
 * shënuar te një kafene pa rrjetë është po aq i padërguar edhe pasi
 * aplikacioni mbyllet e rihapet.
 */
export async function kaTePadergaura(): Promise<boolean> {
  const { pezull } = gjendjaLokale(await gjendjaSink());
  return pezull.size > 0;
}

export function fundiISinkronizimit(): Permbledhja | null {
  return lexoKonfigurimin().fundit;
}

/** Storet, për një ekran që do t'i emërtojë numrat me fjalë. */
export const EMRAT_E_STOREVE: Record<StoriSink | string, string> = {
  groups: 'grupe',
  games: 'lojëra',
  rounds: 'raunde',
};

/* ── Vetvetiu, pa e prekur kush ─────────────────────────────────────────── */

/**
 * Një ndryshim rrallë vjen vetëm: ruajtja e një raundi e prek raundin dhe
 * ndonjëherë edhe lojën. Pritja e pak sekondave e kthen një breshëri në një
 * sinkronizim të vetëm në vend të një për shkrim.
 */
const PRITJA_PAS_NDRYSHIMIT = 4000;

/** Kthimi te skeda sinkronizon, por jo nëse sapo ka rënë një: ndërrimi mes dy
 * dritareve përndryshe do të nxirrte një kërkesë sa herë kalon miu. */
const FRESKIA = 60_000;

/** Sa shpesh kontrollon vetë një aplikacion i hapur e i dukshëm. Të tjerat janë
 * të gjitha ngjarje — një ruajtje, ndërrimi i skedës, rrjeti që kthehet — dhe
 * asnjëra nuk bie te pajisja që rri thjesht e hapur mbi tavolinë sa kohë pikët
 * shkruhen te telefoni tjetër. */
const INTERVALI = 10 * 60_000;

let kohaFundit = 0;
let afati: ReturnType<typeof setTimeout> | null = null;

function aMundNisim(): boolean {
  const k = lexoKonfigurimin();
  // Çelësi i ekranit e fik gjithçka këtu: disa njerëz i duan pikët te një bazë
  // vetëm në çastet që i zgjedhin vetë. Dhe një pajisje pa vendim lexon, prandaj
  // lejohet — `ekzekuto` kujdeset që të mos dërgojë asgjë.
  return eshteLidhur(k) && k.automatik !== false;
}

function provo(): void {
  if (!aMundNisim()) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  kohaFundit = Date.now();
  // Një sinkronizim automatik që dështon — wifi-ja e një kafeneje pas një portali
  // — nuk guxon ta rrëzojë aplikacionin: mbrëmja para syve është e plotë me a pa të.
  void sinkronizo().catch(() => undefined);
}

/**
 * Lidh sinkronizimin me jetën e skedës.
 *
 * Thirret një herë te `main.tsx`, si punëtori i shërbimit dhe matja, dhe për të
 * njëjtat arsye: nuk ka të bëjë me vizatimin, dhe `StrictMode` i thërret dy herë
 * efektet e një komponenti.
 */
export function nisAutomatikun(): void {
  if (typeof window === 'undefined') return;

  onNdryshimLokal(() => {
    if (!aMundNisim()) return;
    if (afati) clearTimeout(afati);
    afati = setTimeout(provo, PRITJA_PAS_NDRYSHIMIT);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (Date.now() - kohaFundit < FRESKIA) return;
    provo();
  });

  window.addEventListener('online', provo);
  setInterval(() => {
    if (document.visibilityState === 'visible') provo();
  }, INTERVALI);

  provo();
}
