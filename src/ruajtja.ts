/**
 * Ruajtja — IndexedDB përmes `idb`.
 *
 * Baza rri te pajisja (pika 1): loja luhet rreth tavolinës dhe jo çdo mbrëmje
 * ka internet të mirë. Kjo do të thotë edhe se fshirja e të dhënave të
 * shfletuesit e merr me vete tërë historikun — prandaj kopja rezervë te
 * `kopja.ts` nuk është shtojcë, është pjesë e punës.
 *
 * Ruhen vetëm pikët e futura. Totalet, renditja dhe matrica nuk shkruhen
 * asnjëherë: llogariten sa herë lexohen, që redaktimi i një raundi të vjetër
 * të mos lërë prapa një total të ngrirë.
 *
 * ── çka i shtoi sinkronizimi (pika 19) ───────────────────────────────────
 *
 * Baza mbetet burimi i vetëm i së vërtetës, dhe asgjë këtu nuk e njeh rrjetin.
 * Ajo që ndryshoi është se çdo regjistër tani mban tri fusha më shumë:
 *
 *   • `uid` — emri që i mbijeton pajisjes. `id`-në numerike e cakton
 *     `autoIncrement`, pra dy telefona e quajnë të dy `1` grupin e vet.
 *   • `perditesuar` — kur u prek së fundi.
 *   • `sinkPezull` — «i ndryshuar këtu, ende i papranuar atje».
 *
 * Dhe një store i katërt, `fshirjet`: varret. Një fshirje duhet të udhëtojë si
 * çdo ndryshim tjetër, përndryshe pajisja tjetër do ta ngarkonte sërish
 * regjistrin që mban ende — pra fshirja do të zhbëhej vetvetiu.
 *
 * Shkrimet e përdoruesit e vënë flamurin; shkrimet që vijnë nga cloud-i
 * (`zbatoPlanin`) nuk e vënë, dhe pikërisht kjo ndarje e mban bashkimin të
 * ndershëm — përndryshe një rresht i mbërritur do të dërgohej sërish, dhe kjo
 * pa fund.
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

import { KOHA_PARA_SINKRONIZIMIT, celesiRreshtit } from './bashkimi.ts';
import type { Gjendja, Plani, ShkrimiSink } from './bashkimi.ts';
import type { FushatEGrupit, FushatELojes, FushatERaundit } from './bashkimi.ts';
import { PREFIKSAT, uidIRi } from './identiteti.ts';
import { STORET_SINK } from './tipet.ts';
import type { Grupi, LlojiILojes, Loja, Raundi, StoriSink, Varri } from './tipet.ts';

const EMRI = 'cardgametracker';
const VERSIONI = 2;

interface Skema extends DBSchema {
  groups: {
    key: number;
    value: Grupi;
    indexes: { uid: string };
  };
  games: {
    key: number;
    value: Loja;
    indexes: { groupId: number; uid: string };
  };
  rounds: {
    key: number;
    value: Raundi;
    indexes: { gameId: number; uid: string };
  };
  fshirjet: {
    key: string;
    value: Varri;
  };
}

let baza: Promise<IDBPDatabase<Skema>> | null = null;

/**
 * A duhet plotësuar ende `uid`-i i regjistrave të shkruar para sinkronizimit.
 *
 * Vihet nga hapi i migrimit dhe kryhet menjëherë pas hapjes, jashtë
 * transaksionit të versionit: një kursor që shkruan mbi çdo regjistër brenda
 * `upgrade`-it e mban atë transaksion hapur sa zgjat leximi i tërë bazës, dhe
 * ajo është pikërisht koha kur shfletuesi nuk duron.
 */
let duhetStampim = false;

/**
 * Dëgjuesit e «baza nuk hapet dot», për ekranin që duhet ta thotë me fjalë.
 *
 * Ka një shkak të vetëm të zakonshëm dhe një zgjidhje të vetme: një skedë tjetër
 * e mban bazën hapur te versioni i vjetër, prandaj migrimi pret. Pa këtë
 * njoftim faqja rri te «Duke lexuar…» pa fund, dhe askush nuk ka nga ta marrë
 * me mend se duhet mbyllur skeda tjetër.
 */
const degjuesitEBllokimit = new Set<(bllokuar: boolean) => void>();

export function onBllokimBaze(fn: (bllokuar: boolean) => void): () => void {
  degjuesitEBllokimit.add(fn);
  return () => degjuesitEBllokimit.delete(fn);
}

function njoftoBllokimin(bllokuar: boolean): void {
  for (const fn of degjuesitEBllokimit) fn(bllokuar);
}

function db(): Promise<IDBPDatabase<Skema>> {
  baza ??= openDB<Skema>(EMRI, VERSIONI, {
    /*
     * Një skedë tjetër e mban bazën te versioni i vjetër. Pa këtë, hapja pret
     * pa fund dhe faqja rri e zbrazët pa thënë pse.
     */
    blocked() {
      njoftoBllokimin(true);
    },
    /*
     * Kjo skedë e mban bazën, dhe një skedë tjetër po e migron. Lidhja mbyllet
     * që ajo të vazhdojë: ky ekran do të lexonte gjithsesi me skemën e gabuar.
     */
    blocking(_iVjetri, _iRi, ngjarja) {
      (ngjarja.target as IDBPDatabase<Skema> | null)?.close();
      baza = null;
    },
    /*
     * Shfletuesi e mbylli lidhjen nën këmbët tona — ndodh kur sistemi liron
     * vend. Hapja tjetër e ngre sërish; pa këtë, çdo lexim i mëpasshëm do të
     * binte mbi një lidhje të vdekur.
     */
    terminated() {
      baza = null;
    },
    upgrade(baza, iVjetri, _iRi, tx) {
      if (iVjetri < 1) {
        baza.createObjectStore('groups', { keyPath: 'id', autoIncrement: true });

        const games = baza.createObjectStore('games', {
          keyPath: 'id',
          autoIncrement: true,
        });
        games.createIndex('groupId', 'groupId');

        const rounds = baza.createObjectStore('rounds', {
          keyPath: 'id',
          autoIncrement: true,
        });
        rounds.createIndex('gameId', 'gameId');
      }

      if (iVjetri < 2) {
        for (const store of STORET_SINK) {
          // Jo `unique`: derisa të kryhet stampimi, `uid`-i mungon te të gjithë,
          // dhe IndexedDB-ja i lë jashtë indeksit regjistrat pa çelës — pra një
          // indeks unik do të ishte premtim që s'mbahet dot gjatë asaj dritareje.
          // Unikësinë e mban vetë `uidIRi`.
          tx.objectStore(store).createIndex('uid', 'uid');
        }
        baza.createObjectStore('fshirjet', { keyPath: 'celesi' });
        if (iVjetri >= 1) duhetStampim = true;
      }
    },
  })
    .then(async (hapur) => {
      njoftoBllokimin(false);
      if (duhetStampim) {
        duhetStampim = false;
        // Jo fatale: pa `uid` një regjistër thjesht nuk sinkronizohet, kurse
        // mbrëmja para syve lexohet njësoj. Rrjeta e dytë rri te vetë shkrimet,
        // të cilat e plotësojnë `uid`-in që mungon sapo preket regjistri.
        await stampoTeVjetrat(hapur).catch(() => undefined);
      }
      return hapur;
    })
    .catch((err: unknown) => {
      // Premtimi i dështuar **nuk** mbahet: i ruajtur, ai do t'i kthehej çdo
      // leximi të mëpasshëm, dhe një dështim i çastit — kuota, një skedë që
      // bllokoi, një shfletues që e mbylli bazën — do ta linte aplikacionin të
      // vdekur derisa të rihapej skeda. Kështu leximi tjetër provon sërish.
      baza = null;
      throw err;
    });

  return baza;
}

/**
 * U vë `uid` dhe datë regjistrave që ekzistonin para sinkronizimit.
 *
 * Data është `KOHA_PARA_SINKRONIZIMIT` e jo «tani», dhe flamuri vihet: e para i
 * bën të humbin çdo krahasim kundër një rreshti që cloud-i e mban vërtet, dhe i
 * dyti bën që gjithsesi të arrijnë te një cloud që nuk i ka parë kurrë. Pa të
 * parën, një pajisje e dytë do t'i ngarkonte mbrëmjet e veta të vjetra mbi
 * redaktimet e vërteta të pajisjes së parë.
 */
async function stampoTeVjetrat(hapur: IDBPDatabase<Skema>): Promise<void> {
  const tx = hapur.transaction(STORET_SINK, 'readwrite');

  for (const store of STORET_SINK) {
    const dyqani = tx.objectStore(store);
    for (const rekordi of await dyqani.getAll()) {
      if (rekordi.uid) continue;
      rekordi.uid = uidIRi(PREFIKSAT[store]);
      rekordi.perditesuar = KOHA_PARA_SINKRONIZIMIT;
      rekordi.sinkPezull = true;
      await dyqani.put(rekordi as never);
    }
  }

  await tx.done;
}

/* ── Shënimi i ndryshimeve ──────────────────────────────────────────────── */

const degjuesitLokale = new Set<() => void>();
const degjuesitEBazes = new Set<() => void>();

/**
 * «Diçka u shkrua **këtu**.» Sinkronizimi e dëgjon që ta nisë vetë pak sekonda
 * më vonë — një mbrëmje shkruan një raund çdo dy minuta, e jo pandërprerë.
 *
 * Ndahet nga ai poshtë me qëllim: një shkrim i ardhur nga cloud-i nuk guxon ta
 * nxisë një sinkronizim të ri, përndryshe dy pajisje do të ushqenin njëra-tjetrën
 * pa fund.
 */
export function onNdryshimLokal(fn: () => void): () => void {
  degjuesitLokale.add(fn);
  return () => degjuesitLokale.delete(fn);
}

/** «Baza ndryshoi», nga çfarëdo ane. Ekranet e dëgjojnë që një mbrëmje e
 * mbërritur nga telefoni tjetër të dalë pa u rifreskuar faqja. */
export function onBazaNdryshoi(fn: () => void): () => void {
  degjuesitEBazes.add(fn);
  return () => degjuesitEBazes.delete(fn);
}

function njofto(): void {
  for (const fn of degjuesitLokale) fn();
  for (const fn of degjuesitEBazes) fn();
}

function njoftoBazen(): void {
  for (const fn of degjuesitEBazes) fn();
}

/**
 * Shënon një regjistër si të ndryshuar këtu dhe ende të padërguar.
 *
 * Thirret vetëm nga shkrimet e përdoruesit. Ato që vijnë nga cloud-i shkruhen
 * nga `zbatoPlanin`, e cila e lë flamurin fikur me qëllim: një rresht i
 * mbërritur nuk i detyrohet cloud-it asgjë.
 */
function stampo<T extends object>(
  rekordi: T,
): T & { perditesuar: number; sinkPezull: boolean } {
  return Object.assign(rekordi, { perditesuar: Date.now(), sinkPezull: true });
}

/**
 * Rrjeta e dytë e `uid`-it.
 *
 * Stampimi i migrimit ua vë të gjithëve (`stampoTeVjetrat`), por ai është
 * përpjekje e mirë e jo garanci: mund të bjerë te kuota, ose te një skedë që e
 * mbylli faqen në mes. Prandaj çdo shkrim i përdoruesit e plotëson atë që
 * mungon — regjistri që preket e merr emrin e vet, dhe pa të nuk do të dilte
 * kurrë nga pajisja.
 */
function meUid<T extends { uid?: string }>(rekordi: T, store: StoriSink): T {
  if (!rekordi.uid) rekordi.uid = uidIRi(PREFIKSAT[store]);
  return rekordi;
}

/** Varri i një regjistri të sapofshirë — i shënuar si i padërguar, si çdo
 * ndryshim tjetër i kësaj pajisjeje. */
function varri(store: StoriSink, uid: string): Varri {
  return stampo({ celesi: celesiRreshtit(store, uid), store, uid });
}

/* ── Grupet ─────────────────────────────────────────────────────────────── */

export async function grupet(): Promise<Grupi[]> {
  return (await db()).getAll('groups');
}

export async function grupi(id: number): Promise<Grupi | undefined> {
  return (await db()).get('groups', id);
}

export async function shtoGrup(
  name: string,
  playerNames: string[],
): Promise<number> {
  const id = await (await db()).add('groups', stampo({
    uid: uidIRi(PREFIKSAT.groups),
    name,
    playerNames,
  }) as Grupi);
  njofto();
  return id as number;
}

export async function ruajGrup(grupi: Grupi): Promise<void> {
  await (await db()).put('groups', stampo(meUid(grupi, 'groups')));
  njofto();
}

/**
 * Fshin grupin bashkë me lojërat dhe raundet e tij.
 *
 * Të tria brenda një transaksioni: një fshirje gjysmake do të linte raunde pa
 * lojë dhe lojëra pa grup, të padukshme dhe të pafshira.
 */
export async function fshiGrup(groupId: number): Promise<void> {
  const tx = (await db()).transaction(
    ['groups', 'games', 'rounds', 'fshirjet'], 'readwrite',
  );
  const varret = tx.objectStore('fshirjet');
  const grupi = await tx.objectStore('groups').get(groupId);
  const lojerat = await tx.objectStore('games').index('groupId').getAll(groupId);

  for (const loja of lojerat) {
    const raundet = await tx.objectStore('rounds').index('gameId').getAll(loja.id);
    for (const raundi of raundet) {
      await tx.objectStore('rounds').delete(raundi.id);
      await varret.put(varri('rounds', raundi.uid));
    }
    await tx.objectStore('games').delete(loja.id);
    await varret.put(varri('games', loja.uid));
  }

  await tx.objectStore('groups').delete(groupId);
  if (grupi?.uid) await varret.put(varri('groups', grupi.uid));
  await tx.done;
  njofto();
}

/* ── Lojërat ────────────────────────────────────────────────────────────── */

export async function lojerat(groupId: number): Promise<Loja[]> {
  return (await db()).getAllFromIndex('games', 'groupId', groupId);
}

export async function loja(id: number): Promise<Loja | undefined> {
  return (await db()).get('games', id);
}

/**
 * Nis një lojë të re.
 *
 * `lloji` shkruhet gjithmonë, edhe kur është `bridzh`: lojërat e vjetra e kanë
 * fushën që mungon dhe lexohen bridzh gjithsesi, por një lojë e re që e thotë
 * vetë çka është nuk varet nga ai lexim.
 */
export async function shtoLoje(
  groupId: number,
  date: string,
  selectedPlayers: string[],
  lloji: LlojiILojes = 'bridzh',
  kufiri?: number,
): Promise<number> {
  const loja = stampo({
    uid: uidIRi(PREFIKSAT.games),
    groupId,
    date,
    selectedPlayers,
    createdAt: Date.now(),
    lloji,
  }) as Loja;

  // Kufiri shkruhet vetëm kur zgjidhet: një lojë pa të lexon parazgjedhjen e
  // llojit, dhe ashtu lexohen edhe të gjitha ato që u shkruan para se kjo fushë
  // të ekzistonte. Zeroja është zgjedhje e vërtetë — «pa kufi» — prandaj hyn.
  if (kufiri !== undefined) loja.kufiri = kufiri;

  const id = await (await db()).add('games', loja);
  njofto();
  return id as number;
}

export async function ruajLoje(loja: Loja): Promise<void> {
  await (await db()).put('games', stampo(meUid(loja, 'games')));
  njofto();
}

/** Fshin lojën bashkë me raundet e saj, dhe lë varrin e secilit. */
export async function fshiLoje(gameId: number): Promise<void> {
  const tx = (await db()).transaction(['games', 'rounds', 'fshirjet'], 'readwrite');
  const varret = tx.objectStore('fshirjet');
  const loja = await tx.objectStore('games').get(gameId);
  const raundet = await tx.objectStore('rounds').index('gameId').getAll(gameId);

  for (const raundi of raundet) {
    await tx.objectStore('rounds').delete(raundi.id);
    await varret.put(varri('rounds', raundi.uid));
  }
  await tx.objectStore('games').delete(gameId);
  if (loja?.uid) await varret.put(varri('games', loja.uid));
  await tx.done;
  njofto();
}

/* ── Raundet ────────────────────────────────────────────────────────────── */

export async function raundet(gameId: number): Promise<Raundi[]> {
  return (await db()).getAllFromIndex('rounds', 'gameId', gameId);
}

export async function shtoRaund(
  gameId: number,
  roundNumber: number,
  scores: Record<string, number | null>,
): Promise<number> {
  const id = await (await db()).add('rounds', stampo({
    uid: uidIRi(PREFIKSAT.rounds),
    gameId,
    roundNumber,
    scores,
    // Ora kur u luajt ky raund, dhe vetëm këtu vihet: `ruajRaund` e lë ashtu si
    // e gjeti, sepse një raund i ndrequr nesër u shënua sot (`koha.ts`).
    shkruarMe: Date.now(),
  }) as Raundi);
  njofto();
  return id as number;
}

export async function ruajRaund(raundi: Raundi): Promise<void> {
  await (await db()).put('rounds', stampo(meUid(raundi, 'rounds')));
  njofto();
}

export async function fshiRaund(id: number): Promise<void> {
  const tx = (await db()).transaction(['rounds', 'fshirjet'], 'readwrite');
  const raundi = await tx.objectStore('rounds').get(id);

  await tx.objectStore('rounds').delete(id);
  if (raundi?.uid) await tx.objectStore('fshirjet').put(varri('rounds', raundi.uid));
  await tx.done;
  njofto();
}

/* ── Numërimet ──────────────────────────────────────────────────────────── */

/**
 * Sa lojëra ka secili grup, dhe sa raunde ka secila lojë.
 *
 * Ekranet e listave i duan vetëm numrat. Leximi i vetë regjistrave do të
 * shpaketonte çdo objekt `scores` të çdo raundi vetëm që të matej gjatësia e
 * vargut — dhe një mbrëmje e vetme ka dhjetëra raunde. `index.count()` e nxjerr
 * numrin nga vetë indeksi, pa i prekur regjistrat.
 *
 * Të gjitha numërimet hyjnë në një transaksion të vetëm, jo në një për çdo
 * çelës, sepse hapja e transaksionit është pjesa e shtrenjtë.
 */
/** Sa lojëra ka secili nga këta grupe. */
export async function numriILojerave(
  groupIds: number[],
): Promise<Record<number, number>> {
  if (groupIds.length === 0) return {};

  const tx = (await db()).transaction('games', 'readonly');
  const index = tx.store.index('groupId');

  const cifte = await Promise.all(
    groupIds.map(async (id) => [id, await index.count(id)] as const),
  );

  await tx.done;
  return Object.fromEntries(cifte);
}

/**
 * Raundet e disa lojërave njëherësh, të ndara sipas lojës.
 *
 * Historiku i grupit tregon renditjen përfundimtare të secilës mbrëmje, prandaj
 * i duhen vetë raundet e jo vetëm sa janë. Leximi bëhet brenda një transaksioni
 * të vetëm: hapja e transaksionit është pjesa e shtrenjtë, jo vetë kërkesat.
 */
export async function raundetELojerave(
  gameIds: number[],
): Promise<Record<number, Raundi[]>> {
  if (gameIds.length === 0) return {};

  const tx = (await db()).transaction('rounds', 'readonly');
  const index = tx.store.index('gameId');

  const cifte = await Promise.all(
    gameIds.map(async (id) => [id, await index.getAll(id)] as const),
  );

  await tx.done;
  return Object.fromEntries(cifte);
}

/* ── Kopja rezervë ──────────────────────────────────────────────────────── */

/** Gjithçka që ka baza, për ta shkruar në skedar. */
export async function gjithcka(): Promise<{
  groups: Grupi[];
  games: Loja[];
  rounds: Raundi[];
}> {
  const baza = await db();
  const [groups, games, rounds] = await Promise.all([
    baza.getAll('groups'),
    baza.getAll('games'),
    baza.getAll('rounds'),
  ]);

  return { groups, games, rounds };
}

/**
 * Zëvendëson tërë bazën me përmbajtjen e një kopjeje.
 *
 * Zëvendësim e jo bashkim: `id`-të e kopjes ruhen ashtu si janë, që lidhjet
 * `groupId`/`gameId` të mbeten të vlefshme. Një bashkim do t'i rinumëronte dhe
 * do të kërkonte rilidhjen e gjithçkaje — punë me shumë mundësi gabimi për një
 * veprim që bëhet një herë, kur pajisja ndërrohet.
 */
export async function zevendeso(kopja: {
  groups: Grupi[];
  games: Loja[];
  rounds: Raundi[];
}): Promise<void> {
  const tx = (await db()).transaction(
    ['groups', 'games', 'rounds', 'fshirjet'], 'readwrite',
  );

  await Promise.all([
    tx.objectStore('groups').clear(),
    tx.objectStore('games').clear(),
    tx.objectStore('rounds').clear(),
    // Varret e mbetura do të fshinin te pajisjet e tjera pikërisht regjistrat që
    // kjo kopje sapo i ktheu.
    tx.objectStore('fshirjet').clear(),
  ]);

  // Gjithçka që vjen nga një skedar shënohet si e ndryshuar këtu dhe e
  // padërguar: cloud-i nuk e di se çka ndodhi, dhe kthimi i një kopjeje është
  // pikërisht vendimi «kjo pajisje e ka të vërtetën».
  for (const grupi of kopja.groups) await tx.objectStore('groups').put(stampo(grupi));
  for (const loja of kopja.games) await tx.objectStore('games').put(stampo(loja));
  for (const raundi of kopja.rounds) await tx.objectStore('rounds').put(stampo(raundi));

  await tx.done;
  njofto();
}

/* ── Ana e sinkronizimit ────────────────────────────────────────────────── */

/**
 * Gjithçka që mban kjo pajisje, varret brenda — hyrja e vetme e bashkimit te
 * baza.
 *
 * Një transaksion i vetëm për të katërt storet: hapja e transaksionit është
 * pjesa e shtrenjtë, jo vetë leximet, dhe një fotografi e marrë me katër
 * transaksione do të mund të shihte gjendje të ndryshme te secili.
 */
export async function gjendjaSink(): Promise<Gjendja> {
  const tx = (await db()).transaction(
    ['groups', 'games', 'rounds', 'fshirjet'], 'readonly',
  );
  const [groups, games, rounds, varret] = await Promise.all([
    tx.objectStore('groups').getAll(),
    tx.objectStore('games').getAll(),
    tx.objectStore('rounds').getAll(),
    tx.objectStore('fshirjet').getAll(),
  ]);
  await tx.done;
  return { groups, games, rounds, varret };
}

/**
 * Shkruan atë që zbriti nga cloud-i, dhe fshin atë që aty është fshirë.
 *
 * Gjithçka brenda një transaksioni, dhe me prindin para fëmijës — plani vjen i
 * renditur ashtu (`bashkimi.ts`). `id`-ja numerike zgjidhet këtu e jo te plani:
 * një grup i mbërritur për herë të parë e merr të vetën nga `autoIncrement`, dhe
 * vetëm pas asaj dihet çka të shkruhet te `groupId` i lojërave që e ndjekin.
 *
 * Asgjë e shkruar këtu nuk merr flamurin `sinkPezull`: ka ardhur nga cloud-i,
 * pra nuk i detyrohet cloud-it asgjë. Ora që mbahet është ajo e rreshtit — e
 * serverit — që jehona e tij te sinkronizimi tjetër të njihet dhe të kapërcehet.
 */
export async function zbatoPlanin(plani: Plani): Promise<void> {
  if (plani.shkruaj.length === 0 && plani.fshi.length === 0) return;

  const tx = (await db()).transaction(
    ['groups', 'games', 'rounds', 'fshirjet'], 'readwrite',
  );
  const varret = tx.objectStore('fshirjet');

  const ekzistuesit = {
    groups: new Map<string, Grupi>(),
    games: new Map<string, Loja>(),
    rounds: new Map<string, Raundi>(),
  };
  for (const store of STORET_SINK) {
    for (const rekordi of await tx.objectStore(store).getAll()) {
      if (rekordi.uid) (ekzistuesit[store] as Map<string, typeof rekordi>).set(rekordi.uid, rekordi);
    }
  }

  const idEGrupit = (uid: string) => ekzistuesit.groups.get(uid)?.id;
  const idELojes = (uid: string) => ekzistuesit.games.get(uid)?.id;

  for (const rreshti of plani.shkruaj) {
    const rekordi = rekordiPerBaze(rreshti, ekzistuesit, idEGrupit, idELojes);
    // Prindi i panjohur e ka shtyrë rreshtin që te plani; kjo është rrjeta e
    // dytë, për rastin kur prindi u fshi mes leximit dhe shkrimit.
    if (!rekordi) continue;

    if (rekordi.id === undefined) {
      const { id: _hiqe, ...iRi } = rekordi;
      void _hiqe;
      const id = (await tx.objectStore(rreshti.store).add(iRi as never)) as number;
      (ekzistuesit[rreshti.store] as Map<string, unknown>).set(rreshti.uid, { ...iRi, id });
    } else {
      await tx.objectStore(rreshti.store).put(rekordi as never);
      (ekzistuesit[rreshti.store] as Map<string, unknown>).set(rreshti.uid, rekordi);
    }

    // Ekziston sërish, prandaj një varr i mbetur këtu do të dilte prapë dhe do
    // ta fshinte kudo.
    await varret.delete(celesiRreshtit(rreshti.store, rreshti.uid));
  }

  for (const rreshti of plani.fshi) {
    const ekzistuesi = (ekzistuesit[rreshti.store] as Map<string, { id: number }>).get(rreshti.uid);
    if (ekzistuesi) await tx.objectStore(rreshti.store).delete(ekzistuesi.id);
    (ekzistuesit[rreshti.store] as Map<string, unknown>).delete(rreshti.uid);
    // Varri mbahet edhe këtu, por i padërguar nuk është: fshirjen e bëri dikush
    // tjetër. Rri që ora e tij të përputhet me jehonën e rreshtit të cloud-it.
    await varret.put({
      celesi: celesiRreshtit(rreshti.store, rreshti.uid),
      store: rreshti.store,
      uid: rreshti.uid,
      perditesuar: rreshti.perditesuar,
      sinkPezull: false,
    });
  }

  await tx.done;
  njoftoBazen();
}

/** Një regjistër i bazës nga një rresht i cloud-it: fushat e tij, plus `id`-ja
 * lokale (e vjetra kur e njohim, e pacaktuar kur është i ri) dhe lidhja e
 * përkthyer nga `uid` te numër. */
function rekordiPerBaze(
  rreshti: ShkrimiSink,
  ekzistuesit: {
    groups: Map<string, Grupi>;
    games: Map<string, Loja>;
    rounds: Map<string, Raundi>;
  },
  idEGrupit: (uid: string) => number | undefined,
  idELojes: (uid: string) => number | undefined,
): (Partial<{ id: number }> & Record<string, unknown>) | null {
  const perbashket = {
    uid: rreshti.uid,
    perditesuar: rreshti.perditesuar,
    sinkPezull: false,
  };

  if (rreshti.store === 'groups') {
    const f = rreshti.fushat as FushatEGrupit;
    const id = ekzistuesit.groups.get(rreshti.uid)?.id;
    return { ...(id === undefined ? {} : { id }), ...perbashket, name: f.name, playerNames: f.playerNames };
  }

  if (rreshti.store === 'games') {
    const f = rreshti.fushat as FushatELojes;
    const groupId = idEGrupit(f.groupUid);
    if (groupId === undefined) return null;
    const id = ekzistuesit.games.get(rreshti.uid)?.id;
    const loja: Record<string, unknown> = {
      ...(id === undefined ? {} : { id }),
      ...perbashket,
      groupId,
      date: f.date,
      selectedPlayers: f.selectedPlayers,
      createdAt: f.createdAt,
    };
    // Fushat e zgjedhshme shkruhen vetëm kur vijnë: një `undefined` i shtuar
    // rrugës do ta ndërronte «mungon» në diçka tjetër te `??` (pikat 13 e 15).
    if (f.lloji !== undefined) loja.lloji = f.lloji;
    if (f.kufiri !== undefined) loja.kufiri = f.kufiri;
    if (f.mbyllur !== undefined) loja.mbyllur = f.mbyllur;
    return loja;
  }

  const f = rreshti.fushat as FushatERaundit;
  const gameId = idELojes(f.gameUid);
  if (gameId === undefined) return null;
  const id = ekzistuesit.rounds.get(rreshti.uid)?.id;
  const raundi: Record<string, unknown> = {
    ...(id === undefined ? {} : { id }),
    ...perbashket,
    gameId,
    roundNumber: f.roundNumber,
    scores: f.scores,
  };
  // Si te loja: shkruhet vetëm kur vjen. Një raund i shënuar nga një pajisje e
  // vjetër nuk e ka, dhe ajo mungesë do të thotë «nuk dihet» (`koha.ts`).
  if (f.shkruarMe !== undefined) raundi.shkruarMe = f.shkruarMe;
  return raundi;
}

/**
 * Heq flamurin «i padërguar» nga gjithçka që cloud-i sapo e pranoi, dhe merr
 * orën që i dha serveri.
 *
 * Baza rilexohet brenda: përdoruesi nuk pushon së shkruari sa zgjat një kërkesë,
 * dhe një regjistër i redaktuar mes dërgimit e këtij çasti duhet të mbetet i
 * shënuar — përndryshe ai redaktim do të rrinte përgjithmonë te kjo pajisje, i
 * besuar si i dërguar. Krahasimi i `perditesuar` kundër asaj që u dërgua është
 * mënyra se si ndahen të dyja.
 */
export async function shenoTeDerguarat(
  derguar: Array<{ store: StoriSink; uid: string; perditesuar: number; fshire: boolean }>,
  kohet: Map<string, number>,
): Promise<number> {
  if (derguar.length === 0) return 0;

  const tx = (await db()).transaction(
    ['groups', 'games', 'rounds', 'fshirjet'], 'readwrite',
  );
  let numri = 0;

  for (const rreshti of derguar) {
    const celesi = celesiRreshtit(rreshti.store, rreshti.uid);
    const koha = kohet.get(celesi) ?? rreshti.perditesuar;

    if (rreshti.fshire) {
      const varri = await tx.objectStore('fshirjet').get(celesi);
      if (!varri || (Number(varri.perditesuar) || 0) !== rreshti.perditesuar) continue;
      await tx.objectStore('fshirjet').put({ ...varri, perditesuar: koha, sinkPezull: false });
      numri++;
      continue;
    }

    const dyqani = tx.objectStore(rreshti.store);
    const rekordi = await dyqani.index('uid').get(rreshti.uid);
    if (!rekordi || (Number(rekordi.perditesuar) || 0) !== rreshti.perditesuar) continue;
    await dyqani.put({ ...rekordi, perditesuar: koha, sinkPezull: false } as never);
    numri++;
  }

  await tx.done;
  return numri;
}

/**
 * I shënon sërish si të padërguar regjistrat që cloud-i nuk i ka.
 *
 * Ora lihet pikërisht ashtu si është: çka thotë regjistri për **kur** ndryshoi
 * mbetet e vërtetë, dhe bashkimi vendoset si më parë. Korrigjohet vetëm besimi
 * «cloud-i e ka këtë», sepse ajo është pjesa që doli e gabuar.
 */
export async function shenoPezull(
  munguara: Array<{ store: StoriSink; uid: string }>,
): Promise<number> {
  if (munguara.length === 0) return 0;

  const tx = (await db()).transaction(
    ['groups', 'games', 'rounds', 'fshirjet'], 'readwrite',
  );
  let numri = 0;

  for (const { store, uid } of munguara) {
    const celesi = celesiRreshtit(store, uid);
    const varri = await tx.objectStore('fshirjet').get(celesi);
    if (varri) {
      await tx.objectStore('fshirjet').put({ ...varri, sinkPezull: true });
      numri++;
      continue;
    }
    const dyqani = tx.objectStore(store);
    const rekordi = await dyqani.index('uid').get(uid);
    if (!rekordi) continue;
    await dyqani.put({ ...rekordi, sinkPezull: true } as never);
    numri++;
  }

  await tx.done;
  return numri;
}

/**
 * Sa gjatë mbahet varri i një regjistri të fshirë.
 *
 * Varret rriten dhe nuk zvogëlohen kurrë vetvetiu: një shoqëri që fshin një
 * mbrëmje të gabuar çdo muaj për pesë vjet mbart gjashtëdhjetë rreshta që nuk i
 * lexon kush. Vetë ato janë të vogla, por rriten **për gjithmonë**, dhe kjo është
 * e vetmja gjë te kjo bazë që nuk ka kufi.
 *
 * Tre muaj janë shumë më gjatë se sa i duhet një fshirjeje për të mbërritur te
 * pajisja tjetër. Nëse ajo pajisje ka qenë e fikur më gjatë, ajo prapë nuk e
 * ringjall regjistrin: kur varri i kalon të tre muajt ai hiqet vetëm nga kjo
 * pajisje, kurse rreshti i cloud-it mbetet aty ku është dhe vazhdon ta thotë se
 * regjistri është fshirë.
 */
const MOSHA_E_VARREVE = 90 * 24 * 60 * 60 * 1000;

/**
 * Heq varret e vjetra që cloud-i i ka pranuar tashmë.
 *
 * Vetëm ata: një varr ende i padërguar është një fshirje që nuk ka mbërritur
 * askund, dhe heqja e tij do ta zhbënte atë fshirje te çdo pajisje tjetër.
 */
export async function pastroVarretEVjetra(tani = Date.now()): Promise<number> {
  const tx = (await db()).transaction('fshirjet', 'readwrite');
  let sa = 0;

  for (const varri of await tx.store.getAll()) {
    if (varri.sinkPezull) continue;
    if (tani - (Number(varri.perditesuar) || 0) < MOSHA_E_VARREVE) continue;
    await tx.store.delete(varri.celesi);
    sa++;
  }

  await tx.done;
  return sa;
}

/**
 * Zbraz tërë bazën lokale — për «merre kopjen e cloud-it».
 *
 * Thirret vetëm pasi shkarkimi ka mbaruar, me rreshtat në dorë: një kërkesë e
 * dështuar në gjysmë duhet ta lërë pajisjen pikërisht ashtu si ishte, e jo të
 * zbrazët.
 */
export async function pastroPerSink(): Promise<void> {
  const tx = (await db()).transaction(
    ['groups', 'games', 'rounds', 'fshirjet'], 'readwrite',
  );
  await Promise.all([
    tx.objectStore('groups').clear(),
    tx.objectStore('games').clear(),
    tx.objectStore('rounds').clear(),
    tx.objectStore('fshirjet').clear(),
  ]);
  await tx.done;
}
