/**
 * Rregullat e bashkimit mes kësaj pajisjeje dhe cloud-it — dhe vetëm ato.
 *
 * Forma e gjësë, para hollësive:
 *
 * - Çdo ndryshim lokal mbetet i shënuar `sinkPezull` — «ende i padërguar» —
 *   derisa cloud-i ta pranojë. Fshirja lë një varr (`Varri`) me të njëjtin
 *   flamur, pra edhe ajo udhëton si çdo ndryshim tjetër.
 * - Çdo regjistër mban `perditesuar`. Sapo të ketë kaluar një herë nga cloud-i,
 *   ai numër është ora që i dha **serveri**, e lexuar prapa nga vetë dërgimi:
 *   kështu dy pajisje nuk krahasohen kurrë me dy orë të ndryshme.
 * - Ana e cloud-it është një tabelë e vetme me rreshta
 *   `(store, record_id, updated_at, deleted, data)` — tri storet e bazës të
 *   sheshuara si rreshta JSON-i. Një tabelë e vetme do të thotë se një fushë e
 *   re te `Loja` nuk kërkon migrim te projekti i askujt.
 * - Një sinkronizim merr çka ka ndryshuar që nga hera e fundit, e zbaton veç
 *   nëse kjo pajisje mban një ndryshim të padërguar për të njëjtin regjistër,
 *   dhe pastaj dërgon atë që mban. **Fiton pajisja e fundit që sinkronizon, për
 *   çdo regjistër.**
 * - **Përveç sinkronizimit të parë të një pajisjeje sapo të lidhur**, e cila
 *   nuk dërgon fare asgjë derisa përdoruesit t'i tregohet çka rri atje lart dhe
 *   ai të thotë çka duhet bërë me të (`MENYRAT`).
 *
 * Ajo zgjedhje është e ndershme këtu e nuk është shkurtore: një shoqëri e vetme
 * me telefonin dhe tabletin e vet, ku dy pajisje që redaktojnë **të njëjtin
 * raund** brenda të njëjtit minut nuk është skenar i vërtetë. I vërtetë është
 * telefoni që shënon mbrëmjen dhe tableti që e hap të nesërmen — dhe ajo
 * bashkohet vetvetiu, sepse `uid`-et e ndryshme nuk përplasen kurrë.
 *
 * ── pse `uid` e jo `id` ───────────────────────────────────────────────────
 *
 * Baza lokale i numëron regjistrat me `autoIncrement`, pra dy telefona e quajnë
 * të dy `1` grupin e vet. Prandaj jashtë pajisjes udhëton vetëm `uid`-i, edhe
 * te lidhjet: një lojë e cloud-it e mban `groupUid` e jo `groupId`, dhe një
 * raund `gameUid`. Përkthimi mes të dyve bëhet te `sinkronizimi.ts`, ku dihen
 * numrat; këtu dihen vetëm emrat.
 *
 * Një rresht fëmijë, prindin e të cilit kjo pajisje nuk e njeh ende, **shtyhet**
 * e nuk hidhet: shënjuesi i shkarkimit nuk kalon mbi të, prandaj kthehet te
 * sinkronizimi tjetër — kur prindi ka gjasë të ketë mbërritur. Pa këtë, një
 * raund i mbërritur para lojës së vet do të humbte në heshtje.
 *
 * Nuk njeh as bazën, as React-in, as rrjetin, as `window`-in (pika 1): objekte
 * brenda, objekte jashtë. Ana që prek bazën dhe `fetch`-in rri te
 * `sinkronizimi.ts` dhe `supabase.ts`.
 */

import { RADHA } from './lojerat.ts';
import { STORET_SINK } from './tipet.ts';
import type { Grupi, LlojiILojes, Loja, Raundi, StoriSink, Varri } from './tipet.ts';

/**
 * Ora që u vishet regjistrave që ekzistonin para sinkronizimit: më e vjetra që
 * ka, e jo «tani».
 *
 * Një mbrëmje e shënuar vjet nuk ka `perditesuar`, dhe diçka duhet zgjedhur
 * ndryshe nuk krahasohet dot me asgjë. «Tani» është përgjigjja tunduese dhe e
 * gabuara: te pajisja e dytë ajo do t'i bënte regjistrat e saj të duken më të
 * rinj se ata që cloud-i i mban prej muajsh. E datuar te fillimi, një regjistër
 * i pastampuar humb çdo krahasim dhe nuk fiton asgjë që nuk duhej: çka cloud-i
 * e mban për të njëjtin `uid` është përkufizimisht redaktim i mëvonshëm, kurse
 * çka cloud-i s'e ka parë kurrë ngarkohet gjithsesi.
 */
export const KOHA_PARA_SINKRONIZIMIT = 1;

/**
 * Një orë që `Date` e lexon dot.
 *
 * `new Date(x).toISOString()` **hedh** `RangeError` për çdo numër jashtë
 * ±8.64e15, dhe ajo thirrje bie te ndërtimi i çdo rreshti që dërgohet. Pra një
 * regjistër i vetëm i dëmtuar — një `perditesuar` i shkruar gabim nga një
 * version i ardhshëm, ose një bazë e prekur me dorë — nuk do ta ndalte veten,
 * do ta ndalte **çdo** dërgim të asaj pajisjeje, përgjithmonë dhe pa shpjegim.
 *
 * Zeroja është zgjedhja e sigurt: rreshti niset gjithsesi, dhe orën e vërtetë ia
 * vë trigger-i i serverit sapo ta pranojë.
 */
const KUFIRI_I_ORES = 8.64e15;

export function oraEVlefshme(ms: unknown): number {
  const i = Number(ms);
  return Number.isFinite(i) && Math.abs(i) <= KUFIRI_I_ORES ? i : 0;
}

/** Çelësi i një regjistri te të dyja anët: `${store}:${uid}`. */
export function celesiRreshtit(store: string, uid: string): string {
  return `${store}:${uid}`;
}

/** Radha e zbatimit: prindi para fëmijës. Fshirja shkon anasjelltas. */
const RADHA_E_STOREVE: readonly StoriSink[] = STORET_SINK;

/* ── Format ─────────────────────────────────────────────────────────────── */

export type FushatEGrupit = { name: string; playerNames: string[] };

export type FushatELojes = {
  groupUid: string;
  date: string;
  selectedPlayers: string[];
  createdAt: number;
  lloji?: LlojiILojes;
  kufiri?: number;
  mbyllur?: boolean;
};

export type FushatERaundit = {
  gameUid: string;
  roundNumber: number;
  scores: Record<string, number | null>;
};

export type Fushat = FushatEGrupit | FushatELojes | FushatERaundit;

/** Një rresht i tabelës së cloud-it, ashtu si e lexon e si e shkruan ky modul. */
export type RreshtiSinkut = {
  store: string;
  uid: string;
  perditesuar: number;
  fshire: boolean;
  data: Record<string, unknown> | null;
};

/** Fotografia e gjithçkaje që mban kjo pajisje, ashtu si ia jep sinkronizimi. */
export type Gjendja = {
  groups: Grupi[];
  games: Loja[];
  rounds: Raundi[];
  varret: Varri[];
};

export const GJENDJA_BOSH: Gjendja = { groups: [], games: [], rounds: [], varret: [] };

/** Regjistrat e një storeje, me tipin e duhur. */
export function rekordetE(gjendja: Gjendja, store: StoriSink): Array<Grupi | Loja | Raundi> {
  if (store === 'groups') return gjendja.groups;
  if (store === 'games') return gjendja.games;
  return gjendja.rounds;
}

/* ── Leximi i asaj që vjen nga jashtë ───────────────────────────────────── */

function eshteNumer(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function vargEmrash(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  if (v.some((x) => typeof x !== 'string')) return null;
  return v as string[];
}

/**
 * Fushat e një rreshti të ardhur nga cloud-i, ose `null` nëse nuk lexohen.
 *
 * Kontrollohet fushë për fushë, me të njëjtën ashpërsi si te `kopja.ts` dhe për
 * të njëjtën arsye: rreshtat vijnë nga një bazë që e administron vetë
 * përdoruesi, ku një `insert` i shkruar me dorë te SQL Editor-i mund të jetë
 * çfarëdo. Një raund me pikë jo-numerike do të dilte `NaN` te totali dhe do të
 * lexohej si mbrëmje e humbur pa e thënë kush.
 *
 * `lloji` i panjohur e rrëzon rreshtin e nuk lexohet bridzh (pika 16): do të
 * vinte nga një version më i ri, dhe te pishpiriku fiton totali më i madh — pra
 * një lexim „si bridzh" do të shpallte fitues atë që mbeti i fundit.
 */
export function fushatENjeRreshti(store: string, data: unknown): Fushat | null {
  if (typeof data !== 'object' || data === null) return null;
  const o = data as Record<string, unknown>;

  if (store === 'groups') {
    const playerNames = vargEmrash(o.playerNames);
    if (typeof o.name !== 'string' || !playerNames) return null;
    return { name: o.name, playerNames };
  }

  if (store === 'games') {
    const selectedPlayers = vargEmrash(o.selectedPlayers);
    if (typeof o.groupUid !== 'string' || !o.groupUid) return null;
    if (typeof o.date !== 'string' || !selectedPlayers) return null;

    const loja: FushatELojes = {
      groupUid: o.groupUid,
      date: o.date,
      selectedPlayers,
      createdAt: eshteNumer(o.createdAt) ? o.createdAt : 0,
    };

    if (o.lloji !== undefined && o.lloji !== null) {
      const lloji = RADHA.find((l) => l === o.lloji);
      if (!lloji) return null;
      loja.lloji = lloji;
    }
    if (o.kufiri !== undefined && o.kufiri !== null) {
      if (!eshteNumer(o.kufiri) || o.kufiri < 0 || !Number.isInteger(o.kufiri)) return null;
      loja.kufiri = o.kufiri;
    }
    // `false` nuk është mungesë: do të thotë «e rihapur me dorë» (pika 15).
    if (typeof o.mbyllur === 'boolean') loja.mbyllur = o.mbyllur;

    return loja;
  }

  if (store === 'rounds') {
    if (typeof o.gameUid !== 'string' || !o.gameUid) return null;
    if (!eshteNumer(o.roundNumber) || typeof o.scores !== 'object' || o.scores === null) return null;

    const scores: Record<string, number | null> = {};
    for (const [emri, pike] of Object.entries(o.scores as Record<string, unknown>)) {
      if (pike === null) scores[emri] = null;
      else if (eshteNumer(pike)) scores[emri] = pike;
      else return null;
    }

    return { gameUid: o.gameUid, roundNumber: o.roundNumber, scores };
  }

  return null;
}

/**
 * Çka del nga pajisja për një regjistër: fushat e tij, me lidhjet e përkthyera
 * në `uid`.
 *
 * `id`, `uid`, `perditesuar` e `sinkPezull` nuk hyjnë te trupi: të parat dy
 * rrinë te çelësi i rreshtit, e treta te kolona e orës, dhe e katërta është
 * llogari e kësaj pajisjeje — dërgimi i saj do t'i thoshte pajisjes tjetër ta
 * dërgojë sërish, përgjithmonë.
 *
 * Kthen `null` kur prindi nuk njihet, pra kur baza është e cunguar: një lojë pa
 * grup do të mbërrinte te pajisja tjetër si rresht që nuk zbatohet dot kurrë.
 */
export function teDhenatPerCloud(
  store: StoriSink,
  rekordi: Grupi | Loja | Raundi,
  uidet: { grupet?: Map<number, string>; lojerat?: Map<number, string> } = {},
): Fushat | null {
  if (store === 'groups') {
    const g = rekordi as Grupi;
    return { name: g.name, playerNames: g.playerNames };
  }

  if (store === 'games') {
    const l = rekordi as Loja;
    const groupUid = uidet.grupet?.get(l.groupId);
    if (!groupUid) return null;

    const fushat: FushatELojes = {
      groupUid,
      date: l.date,
      selectedPlayers: l.selectedPlayers,
      createdAt: l.createdAt,
    };
    if (l.lloji !== undefined) fushat.lloji = l.lloji;
    if (l.kufiri !== undefined) fushat.kufiri = l.kufiri;
    if (l.mbyllur !== undefined) fushat.mbyllur = l.mbyllur;
    return fushat;
  }

  const r = rekordi as Raundi;
  const gameUid = uidet.lojerat?.get(r.gameId);
  if (!gameUid) return null;
  return { gameUid, roundNumber: r.roundNumber, scores: r.scores };
}

/* ── Ana lokale ─────────────────────────────────────────────────────────── */

/**
 * `${store}:${uid}` → çka mban kjo pajisje për të: ora, dhe a pret ende dërgim.
 * Fshirjet brenda. E tërë ana lokale, ashtu si e sheh bashkimi.
 *
 * Një regjistër i datuar saktësisht `KOHA_PARA_SINKRONIZIMIT` është përjashtimi
 * i vetëm nga «i padërguari fiton». Është i shënuar që të **arrijë** te një
 * cloud që nuk e ka pasur kurrë, por data e tij është vendmbajtëse e jo
 * redaktim që e bëri kush — pra kundër një rreshti që cloud-i e ka vërtet, ai
 * duhet të humbasë.
 */
export function gjendjaLokale(gjendja: Gjendja): {
  kohet: Map<string, number>;
  pezull: Set<string>;
} {
  const kohet = new Map<string, number>();
  const pezull = new Set<string>();

  const shto = (store: string, uid: string, rekordi: { perditesuar?: number; sinkPezull?: boolean }) => {
    const celesi = celesiRreshtit(store, uid);
    const koha = Number(rekordi.perditesuar) || 0;
    kohet.set(celesi, koha);
    if (rekordi.sinkPezull && koha !== KOHA_PARA_SINKRONIZIMIT) pezull.add(celesi);
  };

  for (const store of RADHA_E_STOREVE) {
    for (const rekordi of rekordetE(gjendja, store)) {
      if (rekordi.uid) shto(store, rekordi.uid, rekordi);
    }
  }
  for (const varri of gjendja.varret) {
    if (varri.store && varri.uid) shto(varri.store, varri.uid, varri);
  }

  return { kohet, pezull };
}

/** `uid`-et që kjo pajisje i njeh, sipas storeje — prindërit e mundshëm. */
export function uidetLokale(gjendja: Gjendja): Record<StoriSink, Set<string>> {
  const dala = { groups: new Set<string>(), games: new Set<string>(), rounds: new Set<string>() };
  for (const store of RADHA_E_STOREVE) {
    for (const rekordi of rekordetE(gjendja, store)) {
      if (rekordi.uid) dala[store].add(rekordi.uid);
    }
  }
  return dala;
}

/** Çdo çelës që kjo pajisje mban, varret brenda. */
export function celesatLokale(gjendja: Gjendja): Set<string> {
  const celesat = new Set<string>();
  for (const store of RADHA_E_STOREVE) {
    for (const rekordi of rekordetE(gjendja, store)) {
      if (rekordi.uid) celesat.add(celesiRreshtit(store, rekordi.uid));
    }
  }
  for (const varri of gjendja.varret) {
    if (varri.store && varri.uid) celesat.add(celesiRreshtit(varri.store, varri.uid));
  }
  return celesat;
}

/** Sa regjistra mban kjo pajisje, me të njëjtat njësi me të cilat cloud-i i
 * numëron rreshtat e vet. */
export function numriLokal(gjendja: Gjendja): number {
  return (
    gjendja.groups.length + gjendja.games.length + gjendja.rounds.length + gjendja.varret.length
  );
}

/** `${store}:${uid}` → sa ka nga secili store, për një përmbledhje që lexohet
 * me fjalë («2 grupe, 31 lojëra») e jo si numër i thatë rreshtash. */
export function sipasStorit(celesat: Iterable<string>): Record<string, number> {
  const numrat: Record<string, number> = {};
  for (const celesi of celesat) {
    const teksti = String(celesi);
    const ndarja = teksti.indexOf(':');
    // Çka s'ka store para vetes nuk është nga këta çelësa fare — dhe një prerje
    // mbi një varg pa dy pika do të shpikte një emër storeje nga vetë `uid`-i.
    if (ndarja <= 0) continue;
    const store = teksti.slice(0, ndarja);
    numrat[store] = (numrat[store] ?? 0) + 1;
  }
  return numrat;
}

/**
 * Emri i një storeje me fjalë, në njëjës a shumës sipas numrit.
 *
 * Shqipja e ndan atë ndarje si çdo gjuhë tjetër — «1 grup», «2 grupe» — dhe një
 * shumës i ngrirë do të lexohej si gabim përkthimi pikërisht te ekrani që i
 * kërkon përdoruesit të vendosë mbi numrat që sheh.
 */
const NJESITE: Record<string, [string, string]> = {
  groups: ['grup', 'grupe'],
  games: ['lojë', 'lojëra'],
  rounds: ['raund', 'raunde'],
};

export function njesiaEStorit(store: string, sa: number): string {
  const cifti = NJESITE[store];
  if (!cifti) return String(store);
  return `${sa} ${sa === 1 ? cifti[0] : cifti[1]}`;
}

/**
 * A mban kjo pajisje ende ndonjë gjë të vetën.
 *
 * Nuk është e njëjta gjë me „e zbrazët": një shfletues i sapopastruar mund të
 * mbajë ende regjistra të datuar `KOHA_PARA_SINKRONIZIMIT`. Pyetja e vërtetë
 * është a ka diçka këtu me datë të vetën.
 *
 * Vendos vetëm se cila mënyrë **ofrohet e para** kur një pajisje takon një
 * kopje cloud-i. Zgjedhjen e bën përdoruesi.
 */
export function pajisjaPaTeDhena(gjendja: Gjendja): boolean {
  if (gjendja.varret.length > 0) return false;
  for (const store of RADHA_E_STOREVE) {
    for (const rekordi of rekordetE(gjendja, store)) {
      if ((Number(rekordi.perditesuar) || 0) > KOHA_PARA_SINKRONIZIMIT) return false;
    }
  }
  return true;
}

/* ── Çka i detyrohet kjo pajisje cloud-it ───────────────────────────────── */

/** Një rresht që del nga pajisja. */
export type PerDergim = {
  store: StoriSink;
  uid: string;
  perditesuar: number;
  fshire: boolean;
  data: Fushat | null;
};

/**
 * Çdo regjistër dhe varr që pret ende të arrijë te cloud-i.
 *
 * Pritja është flamur (`sinkPezull`), jo krahasim datash. Një pajisje me orë të
 * gabuar prapë e di shumë mirë **që** ndryshoi diçka — gabon vetëm për kur.
 *
 * `gjithcka` e shpërfill flamurin dhe i dërgon të gjithë: rruga «ngarkoje
 * gjithçka sërish», për një kopje cloud-i që humbi rreshta ose që nuk e mbaroi
 * kurrë një sinkronizim të parë të ndërprerë.
 *
 * `perjashto` mban rreshtat që ky sinkronizim sapo i zbatoi nga cloud-i: janë,
 * përkufizimisht, ndryshime që kjo pajisje nuk i bëri, dhe kthimi i tyre prapa
 * do të ishte një shkrim për rresht pa asnjë arsye.
 */
export function ndryshimetLokale(
  gjendja: Gjendja,
  {
    uidet = { grupet: new Map<number, string>(), lojerat: new Map<number, string>() },
    gjithcka = false,
    perjashto = new Set<string>(),
  }: {
    uidet?: { grupet: Map<number, string>; lojerat: Map<number, string> };
    gjithcka?: boolean;
    perjashto?: Set<string>;
  } = {},
): PerDergim[] {
  const rreshtat: PerDergim[] = [];

  for (const store of RADHA_E_STOREVE) {
    for (const rekordi of rekordetE(gjendja, store)) {
      if (!rekordi.uid) continue;
      if (!gjithcka && !rekordi.sinkPezull) continue;
      if (perjashto.has(celesiRreshtit(store, rekordi.uid))) continue;

      const data = teDhenatPerCloud(store, rekordi, uidet);
      // Prindi i panjohur do të thotë bazë e cunguar; një rresht i tillë nuk
      // zbatohet dot as te pajisja tjetër, prandaj nuk niset fare.
      if (!data) continue;

      rreshtat.push({
        store,
        uid: rekordi.uid,
        perditesuar: Number(rekordi.perditesuar) || 0,
        fshire: false,
        data,
      });
    }
  }

  for (const varri of gjendja.varret) {
    if (!varri.store || !varri.uid) continue;
    if (!gjithcka && !varri.sinkPezull) continue;
    if (perjashto.has(celesiRreshtit(varri.store, varri.uid))) continue;
    rreshtat.push({
      store: varri.store,
      uid: varri.uid,
      perditesuar: Number(varri.perditesuar) || 0,
      fshire: true,
      data: null,
    });
  }

  return rreshtat;
}

/**
 * Regjistrat për të cilët cloud-i nuk ka dëgjuar kurrë, çkado që beson kjo
 * pajisje për ta.
 *
 * Çdo rregull tjetër këtu e pyet **pajisjen** se çka i detyrohet: një flamur që
 * e vë kur ndryshon diçka dhe e heq kur cloud-i e pranon. Kjo mjafton derisa të
 * dyja anët të mos pajtohen — një kopje e zbrazur nga diku tjetër, një rresht i
 * humbur — dhe atëherë mospajtimi bëhet i përhershëm, sepse një regjistër me
 * flamurin «i dërguar» nuk shikohet më kurrë.
 *
 * Prandaj kjo e pyet anën tjetër. Çelësat janë përgjigjja e vetë cloud-it, dhe
 * çka mungon prej andej i detyrohet — çkado që thotë flamuri.
 */
export function mungojneNeCloud(
  gjendja: Gjendja,
  celesat: Set<string>,
): Array<{ store: StoriSink; uid: string }> {
  const munguara: Array<{ store: StoriSink; uid: string }> = [];

  for (const store of RADHA_E_STOREVE) {
    for (const rekordi of rekordetE(gjendja, store)) {
      if (!rekordi.uid || rekordi.sinkPezull) continue;
      if (celesat.has(celesiRreshtit(store, rekordi.uid))) continue;
      munguara.push({ store, uid: rekordi.uid });
    }
  }
  for (const varri of gjendja.varret) {
    if (!varri.store || !varri.uid || varri.sinkPezull) continue;
    if (celesat.has(celesiRreshtit(varri.store, varri.uid))) continue;
    munguara.push({ store: varri.store, uid: varri.uid });
  }

  return munguara;
}

/* ── Çka bëhet me atë që zbriti ─────────────────────────────────────────── */

export type ShkrimiSink = {
  store: StoriSink;
  uid: string;
  perditesuar: number;
  fushat: Fushat;
};

export type FshirjaSink = { store: StoriSink; uid: string; perditesuar: number };

export type Plani = {
  shkruaj: ShkrimiSink[];
  fshi: FshirjaSink[];
  /** Çelësat që preku ky plan — pra ata që nuk ka pse t'i dërgojë prapa. */
  celesat: Set<string>;
  /** Rreshta që nuk u zbatuan sepse s'kishte çka të zbatohej. */
  anashkaluar: number;
  /** Rreshta që presin prindin e vet — kthehen te sinkronizimi tjetër. */
  shtyre: number;
  /** Çelësat e tyre, që thirrësi të dijë a janë të njëjtët si herën e kaluar. */
  shtyreCelesat: string[];
  /** Shënjuesi i ri i shkarkimit. Nuk e kalon kurrë rreshtin më të hershëm që u
   * shty: përndryshe ai nuk do të rishkarkohej më kurrë. */
  maxTs: number;
};

/**
 * Çka bëhet me atë që zbriti: shkruhet, fshihet, ose lihet kopja lokale ashtu
 * si është sepse ajo është e reja (dhe do të dërgohet pak rreshta më poshtë).
 *
 * Dy rregulla, dhe asnjëri nuk e krahason orën e një pajisjeje me atë të një
 * tjetre:
 *
 * 1. **Ndryshimi lokal i padërguar fiton.** Mbahet, kapërcehet këtu, dhe
 *    dërgohet pak më poshtë. Pra rregulli mes pajisjeve është «fiton e fundit
 *    që sinkronizon» e jo «fiton ajo që e ka orën më përpara», dhe asgjë e
 *    shkruar te kjo pajisje nuk hidhet para se të jetë dërguar.
 * 2. **Përndryshe fiton rreshti i cloud-it.** Ka saktësisht një rresht për
 *    regjistër, pra ai mban gjithmonë gjendjen e fundit që dërgoi kush; dhe një
 *    shkarkim rritës kthen vetëm çka ndryshoi që nga shënjuesi i kësaj pajisjeje.
 *
 * Krahasimi i vetëm që mbetet është barazia, dhe ajo do të thotë «ky është
 * rreshti im që po kthehet»: çdo dërgim e shënon orën me të cilën përfundoi
 * rreshti, prandaj jehona përputhet deri te milisekondi dhe kapërcehet.
 *
 * `lejoShtyrjen` e mban shënjuesin nën rreshtin më të hershëm që pret prindin e
 * vet — sjellja e zakonshme, dhe ajo që bën që një raund i mbërritur para lojës
 * së vet të kthehet herën tjetër. Me `false` ata rreshta numërohen thjesht si të
 * kapërcyer dhe shënjuesi kalon mbi ta. Kjo nuk është zgjedhje stili: një rresht
 * cloud-i prindi i të cilit **nuk ekziston më** nuk zbatohet dot kurrë, dhe me
 * shtyrjen gjithmonë të lejuar ai do ta mbante shënjuesin në vend përgjithmonë —
 * pra sinkronizimi do të pushonte së ecuri fare, në heshtje, dhe asnjë mbrëmje e
 * re nuk do të zbriste më. Thirrësi e fik pas disa provave të kota.
 *
 * `cloudFiton` e heq rregullin 1 për një sinkronizim të vetëm. Nuk është për
 * punën e përditshme — është për çastin kur një pajisje i bashkohet një kopjeje
 * që nuk e ka takuar kurrë (`MENYRAT.BASHKO`/`MENYRAT.MERR`), ku «i padërguar»
 * nuk do të thotë më shumë se «i shkruar para se ky shfletues të kishte ku ta
 * dërgonte».
 */
export function planiIAplikimit(
  rreshtat: RreshtiSinkut[],
  {
    kohet,
    pezull = new Set<string>(),
    uidet,
  }: {
    kohet: Map<string, number>;
    pezull?: Set<string>;
    uidet: Record<StoriSink, Set<string>>;
  },
  {
    cloudFiton = false,
    lejoShtyrjen = true,
  }: { cloudFiton?: boolean; lejoShtyrjen?: boolean } = {},
): Plani {
  const shkruaj: ShkrimiSink[] = [];
  const fshi: FshirjaSink[] = [];
  let anashkaluar = 0;
  let shtyre = 0;
  const shtyreCelesat: string[] = [];
  let maxTs = 0;
  let mePakShtyre = Infinity;

  // `uid`-et që do të njihen deri te radha e këtij storeje: ata që i mban tashmë
  // pajisja, plus ata që ky plan i shkruan pak më sipër. Prandaj një grup dhe
  // loja e tij e mbërritur bashkë zbatohen te i njëjti sinkronizim.
  const njohur: Record<StoriSink, Set<string>> = {
    groups: new Set(uidet.groups),
    games: new Set(uidet.games),
    rounds: new Set(uidet.rounds),
  };

  const prindiIPanjohur = (store: StoriSink, fushat: Fushat): boolean => {
    if (store === 'games') return !njohur.groups.has((fushat as FushatELojes).groupUid);
    if (store === 'rounds') return !njohur.games.has((fushat as FushatERaundit).gameUid);
    return false;
  };

  // Një store që ky aplikacion nuk e njeh shpërfillet e nuk shkruhet: rreshtat
  // vijnë nga një bazë që e administron vetë përdoruesi, dhe një gabim shtypjeje
  // te një `insert` me dorë nuk ka pse ta çojë atë tekst te çelësi i një
  // `objectStore`-i. Shënjuesi kalon mbi të gjithsesi — është i llogaritur.
  for (const rr of rreshtat) {
    if (RADHA_E_STOREVE.includes(rr?.store as StoriSink)) continue;
    if (Number.isFinite(rr?.perditesuar)) maxTs = Math.max(maxTs, rr.perditesuar);
    anashkaluar++;
  }

  // Store pas storeje, prindi para fëmijës.
  for (const store of RADHA_E_STOREVE) {
    for (const rr of rreshtat) {
      if (rr?.store !== store) continue;
      if (!rr.uid || !Number.isFinite(rr.perditesuar)) {
        anashkaluar++;
        continue;
      }

      const celesi = celesiRreshtit(store, rr.uid);

      // Ende i padërguar nga këtu: versioni i kësaj pajisjeje është ai që po
      // del, pra ajo që zbriti është lajm i raundit të kaluar sado e re të
      // thotë ora e saj.
      if (!cloudFiton && pezull.has(celesi)) {
        maxTs = Math.max(maxTs, rr.perditesuar);
        anashkaluar++;
        continue;
      }

      const lokal = kohet.get(celesi);
      if (lokal !== undefined && lokal === rr.perditesuar) {
        maxTs = Math.max(maxTs, rr.perditesuar);
        anashkaluar++;
        continue;
      }

      if (rr.fshire) {
        maxTs = Math.max(maxTs, rr.perditesuar);
        // Fshirje për diçka që kjo pajisje nuk e ka pasur kurrë: s'ka çka
        // fshihet, dhe një varr për një regjistër që s'ekzistoi është zhurmë.
        if (lokal === undefined) anashkaluar++;
        else fshi.push({ store, uid: rr.uid, perditesuar: rr.perditesuar });
        continue;
      }

      const fushat = fushatENjeRreshti(store, rr.data);
      if (!fushat) {
        maxTs = Math.max(maxTs, rr.perditesuar);
        anashkaluar++;
        continue;
      }

      if (prindiIPanjohur(store, fushat)) {
        shtyre++;
        shtyreCelesat.push(celesi);
        // Shënjuesi nuk kalon mbi të: kthehet herën tjetër, kur prindi ka gjasë
        // të ketë mbërritur. Kur thirrësi e ka parë të njëjtin rresht të mbetur
        // disa herë me radhë, prindi nuk po vjen — dhe atëherë shënjuesi kalon,
        // sepse një jetimë e përhershme nuk vlen sa një sinkronizim i ngrirë.
        if (lejoShtyrjen) mePakShtyre = Math.min(mePakShtyre, rr.perditesuar);
        else maxTs = Math.max(maxTs, rr.perditesuar);
        continue;
      }

      maxTs = Math.max(maxTs, rr.perditesuar);
      njohur[store].add(rr.uid);
      shkruaj.push({ store, uid: rr.uid, perditesuar: rr.perditesuar, fushat });
    }
  }

  // Fëmija fshihet para prindit, që të mos mbetet një raund pa lojë sa zgjat
  // transaksioni.
  fshi.reverse();

  const celesat = new Set<string>([
    ...shkruaj.map((rr) => celesiRreshtit(rr.store, rr.uid)),
    ...fshi.map((rr) => celesiRreshtit(rr.store, rr.uid)),
  ]);

  if (mePakShtyre !== Infinity) maxTs = Math.min(maxTs, mePakShtyre - 1);

  return { shkruaj, fshi, celesat, anashkaluar, shtyre, shtyreCelesat, maxTs };
}

/* ── Kur një pajisje i bashkohet një kopjeje ────────────────────────────── */

/** Tri përgjigjet e pyetjes «kjo pajisje dhe kopja e cloud-it nuk përputhen —
 * cila është e vërteta?». */
export const MENYRAT = {
  /** Mbaji të dyja: cloud-i fiton kudo ku regjistri ekziston te të dyja anët,
   * dhe çka e ka vetëm kjo pajisje ngarkohet. Përgjigjja e sigurt, dhe ajo që
   * ofrohet e para. */
  BASHKO: 'bashko',
  /** Merre kopjen e cloud-it dhe hiq çka ka këtu. Për pajisjen e re, ose atë që
   * u pastrua. */
  MERR: 'merr',
  /** Kjo pajisje është e vërteta: gjithçka këtu shkon lart, mbi çka mban
   * cloud-i. Ekrani e bën përdoruesin ta shkruajë fjalën për këtë. */
  DERGO: 'dergo',
} as const;

export type Menyra = (typeof MENYRAT)[keyof typeof MENYRAT];

export type PermbledhjaELidhjes = {
  lokal: number;
  cloud: number;
  teNjejta: number;
  vetemLokale: number;
  vetemCloud: number;
  lokalSipasStorit: Record<string, number>;
  cloudSipasStorit: Record<string, number>;
  paTeDhena: boolean;
  rekomandimi: Menyra;
};

/**
 * Dy anët të numëruara kundër njëra-tjetrës, pa shkruar asgjë.
 *
 * Kjo është ajo që i tregohet një pajisjeje sapo të lidhur para se t'i lejohet
 * të dërgojë. Arsyeja pse ekziston nuk është hipotetike: një tablet i pastruar,
 * i rilidhur, do të ngarkonte bazën e vet të zbrazët mbi historikun e një viti
 * te çdo pajisje tjetër. Askush nuk pyetet kurrë, sepse askujt nuk i tregohen
 * numrat.
 */
export function permbledhjaELidhjes(
  gjendja: Gjendja,
  cloud: Set<string>,
): PermbledhjaELidhjes {
  const lokale = celesatLokale(gjendja);

  let teNjejta = 0;
  for (const celesi of lokale) if (cloud.has(celesi)) teNjejta++;

  const paTeDhena = pajisjaPaTeDhena(gjendja);

  return {
    lokal: lokale.size,
    cloud: cloud.size,
    teNjejta,
    vetemLokale: lokale.size - teNjejta,
    vetemCloud: cloud.size - teNjejta,
    lokalSipasStorit: sipasStorit(lokale),
    cloudSipasStorit: sipasStorit(cloud),
    paTeDhena,
    // Ofrohet e para, kurrë nuk zbatohet vetvetiu. Një cloud i zbrazët s'ka çka
    // humb; një pajisje pa asgjë të vetën s'ka çka mbron; çdo gjë tjetër i mban
    // të dyja anët.
    rekomandimi: cloud.size === 0 ? MENYRAT.DERGO : paTeDhena ? MENYRAT.MERR : MENYRAT.BASHKO,
  };
}
