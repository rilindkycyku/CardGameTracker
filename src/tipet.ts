/**
 * Tipet e të dhënave.
 *
 * Emrat e fushave janë ata të `logic.json`-it që doli nga tabela origjinale
 * (`playerNames`, `selectedPlayers`, `roundNumber`, `scores`) — ai skedar është
 * kontrata e të dhënave dhe provat maten kundër tij. Teksti që sheh përdoruesi
 * është shqip; skema jo, që të mos këputet lidhja me burimin.
 *
 * Tri fusha i ka çdo regjistër që sinkronizohet (pika 19), dhe asnjëra nuk vjen
 * nga ajo kontratë — prandaj janë shqip: `uid` (emri që i mbijeton pajisjes),
 * `perditesuar` (kur u prek së fundi, me orën e serverit sapo të ketë kaluar
 * një herë nga cloud-i) dhe `sinkPezull` («i ndryshuar këtu, ende i papranuar
 * atje»). Numri `id` mbetet ai që ishte: çelës lokal, dhe asgjë më shumë.
 */

/**
 * Çka luhet atë mbrëmje.
 *
 * Katër lojëra, një tavolinë. `bridzh` është numëruesi i pikëve — ai me të
 * cilin nisi gjithçka. `magarec` është loja e shkronjave: kush e humb raundin
 * merr një shkronjë, dhe kush e mbush fjalën „MAGAREC" e humb mbrëmjen.
 * `domina` është skeda e tretë e së njëjtës fletë: gurët e mbetur në dorë
 * shënohen si pikë, dhe luhet derisa dikujt t'i mbushen njëqind. `pishpirik`
 * erdhi nga tavolina e jo nga fleta, dhe është i vetmi ku fiton totali më i
 * madh.
 *
 * I njëjti grup dhe e njëjta bazë — prandaj rrinë te një aplikacion i vetëm e
 * jo te katër. Çka i ndan rri i tëri te `lojerat.ts`.
 *
 * Emri i fushës është shqip sepse nuk vjen nga `logic.json`: ai skedar njeh
 * vetëm bridzhin (dhe një skedë domine pa emër fushe), dhe kontrata me të janë
 * vetëm katër emrat e tij.
 */
export type LlojiILojes = 'bridzh' | 'magarec' | 'domina' | 'pishpirik';

/**
 * Kush fiton: totali më i vogël („poshtë") apo më i madhi („lart").
 *
 * Tri lojëra nga katër e fitojnë me më të voglin, dhe kjo është e kundërta e
 * asaj që pret syri te një tabelë pikësh — prandaj ekrani e thotë me fjalë.
 * Pishpiriku shkon nga ana tjetër, dhe pikërisht sepse është përjashtim, asnjë
 * renditje nuk e mbart drejtimin brenda vetes: i jepet.
 */
export type Drejtimi = 'poshte' | 'larte';

/**
 * Storet që sinkronizohen — dhe, meqë janë të gjithë, e tërë baza.
 *
 * Emrat janë ata të `objectStore`-ve, dhe të njëjtët udhëtojnë te kolona
 * `store` e tabelës së cloud-it. Një store i pesë i shtuar nesër duhet të hyjë
 * këtu me vetëdije: çka nuk është aty nuk del kurrë nga pajisja.
 */
export const STORET_SINK = ['groups', 'games', 'rounds'] as const;

export type StoriSink = (typeof STORET_SINK)[number];

/**
 * Çka i shton sinkronizimi një regjistri të çfarëdoshëm.
 *
 * `uid` është emri i tij i vërtetë sapo të ketë më shumë se një pajisje: `id`-ja
 * numerike e cakton baza lokale me `autoIncrement`, pra dy telefona e quajnë të
 * dy `1` grupin e vet. Lidhjet brenda pajisjes mbeten numerike — indekset dhe
 * rrugët lexohen njësoj — kurse jashtë saj udhëton vetëm `uid`-i.
 *
 * `perditesuar` nis si ora e pajisjes dhe bëhet ora e serverit sapo rreshti të
 * ketë kaluar një herë nga cloud-i: pa këtë, dy telefona me orë të pabarabarta
 * do të krahasoheshin me njësi të ndryshme.
 *
 * `sinkPezull` do të thotë «i ndryshuar këtu, ende i papranuar atje». Është
 * flamur e jo krahasim datash: një telefon me orë të gabuar prapë e di **që** e
 * ndryshoi diçka — gabon vetëm për kur.
 */
export type Sinkronizueshem = {
  uid: string;
  perditesuar?: number;
  sinkPezull?: boolean;
};

/**
 * Gurthemeli i një regjistri të fshirë.
 *
 * Fshirja duhet të udhëtojë si çdo ndryshim tjetër, përndryshe pajisja tjetër
 * do ta shihte regjistrin që mban ende si «diçka që cloud-i s'e ka» dhe do ta
 * ngarkonte sërish — pra fshirja do të zhbëhej vetvetiu te herën tjetër.
 * Prandaj mbetet një rresht, me çelësin `${store}:${uid}`.
 */
export type Varri = Sinkronizueshem & {
  celesi: string;
  store: StoriSink;
};

/** Një shoqëri që luan bashkë rregullisht. Radha e `playerNames` ka kuptim. */
export type Grupi = Sinkronizueshem & {
  id: number;
  /** Emri i grupit, p.sh. „Brigj". */
  name: string;
  /** Lista e plotë e lojtarëve të grupit, në radhën e futjes. */
  playerNames: string[];
};

/**
 * Një lojë e vetme — një mbrëmje. Një grup ka shumë lojëra, edhe dy në të
 * njëjtën ditë.
 *
 * `selectedPlayers` është fotografia e atyre që luajtën atë natë. Raundet dhe
 * renditja mbahen mbi këtë listë, jo mbi `playerNames` të grupit — kështu një
 * lojtar i shtuar ose i hequr më vonë nuk i prek lojërat e kaluara.
 */
export type Loja = Sinkronizueshem & {
  id: number;
  groupId: number;
  /** Data e lojës, `YYYY-MM-DD`. */
  date: string;
  selectedPlayers: string[];
  /** Ora e krijimit — ndan dy lojëra të së njëjtës ditë dhe u jep radhën. */
  createdAt: number;
  /**
   * Çka u luajt. Mungon te lojërat e shkruara para se të vinte magareci, dhe
   * atëherë lexohet `bridzh` — `llojiILojes()` e bën këtë leximin e vetëm.
   */
  lloji?: LlojiILojes;
  /**
   * Deri te sa pikë luhet kjo mbrëmje — kur loja e ka atë pyetje.
   *
   * Domina luhet deri te njëqind a dyqind e pesëdhjetë, dhe pishpiriku deri te
   * njëqind e një, njëqind e njëzet a njëqind e pesëdhjetë e një: kufiri nuk
   * është rregull i lojës, është marrëveshje e tavolinës para se të ndahen
   * letrat. Prandaj rri te loja e jo te regjistri.
   *
   * Tri gjendje, si te `mbyllur` dhe për të njëjtën arsye — që mungesa të mos
   * ngatërrohet me zgjedhjen:
   *
   *   • **mungon** → vlen kufiri i parazgjedhur i asaj loje (`lojerat.ts`).
   *     Kështu lexohen të gjitha lojërat e shkruara para se kjo fushë të
   *     ekzistonte, dhe ato nuk ndërrojnë kuptim.
   *   • **numër** → pikërisht ai kufi, i zgjedhur te ekrani kur nisi mbrëmja.
   *   • **`0`** → pa kufi fare: luhet derisa shoqëria të ngrihet, dhe fleta
   *     mbyllet me dorë (pika 15).
   *
   * Bridzhi dhe magareci nuk e shkruajnë kurrë: i pari mbaron me raundet, dhe
   * te i dyti kufiri është vetë fjala — shtatë shkronja, e jo marrëveshje.
   */
  kufiri?: number;
  /**
   * A është mbyllur mbrëmja me dorë — dhe pse fusha ka tri gjendje e jo dy.
   *
   * Mungon te shumica: atëherë vendos rregulli, pra fjala e mbushur te magareci
   * ose dy raundet për lojtar te bridzhi. `true` e mbyll edhe një mbrëmje që
   * rregulli nuk e ka mbaruar — shoqëria u ngrit herët, dhe fleta mbyllet aty
   * ku është. `false` është e kundërta dhe pikërisht aq e nevojshme: një lojë e
   * mbaruar sipas rregullit rihapet vetëm nëse mungesa e mbylljes mund të thotë
   * «e rihapur», e jo thjesht «s'është prekur».
   *
   * Nuk është vlerë e derivuar (pika 2) — asnjë raund nuk e jep. Është vendim.
   */
  mbyllur?: boolean;
};

/**
 * Një raund brenda një loje: një numër për secilin lojtar, ose asgjë ende.
 *
 * Te magareci i njëjti varg mban shkronjat: humbësi i raundit merr `1`, të
 * tjerët `0`. Kështu totali është numri i shkronjave, renditja mbetet ajo që
 * është — fiton më i vogli — dhe raundet, kopja rezervë e ndarja e rezultatit
 * nuk kanë nevojë për një rrugë të dytë.
 */
export type Raundi = Sinkronizueshem & {
  id: number;
  gameId: number;
  roundNumber: number;
  scores: Record<string, number | null>;
  /**
   * Ora kur u shënua ky raund — dhe, te i fundit, ora kur mbaroi mbrëmja.
   *
   * Vihet një herë, kur raundi shkruhet, dhe nuk preket më nga redaktimi:
   * `perditesuar` thotë «kur u prek së fundi», kurse kjo thotë «kur u luajt».
   * Një raund i ndrequr të nesërmen do ta shtynte të parën e jo këtë, dhe
   * pikërisht ai dallim e mban kohëzgjatjen të ndershme (`koha.ts`).
   *
   * Mungon te çdo raund i shkruar para se kjo të vinte; atëherë mbrëmja e ka
   * fundin të panjohur, dhe ekrani hesht në vend që ta hamendësojë.
   */
  shkruarMe?: number;
};

/** Një rresht i renditjes. I njëjti nga si te `standings` i `logic.json`-it. */
export type RreshtiRenditjes = {
  rank: number;
  player: string;
  total: number;
};

/** Kopja rezervë e tërë bazës, ashtu si shkruhet në skedar. */
export type Kopja = {
  format: 'cardgametracker';
  version: 1;
  exportedAt: string;
  groups: Grupi[];
  games: Loja[];
  rounds: Raundi[];
};
