/**
 * Tipet e të dhënave.
 *
 * Emrat e fushave janë ata të `logic.json`-it që doli nga tabela origjinale
 * (`playerNames`, `selectedPlayers`, `roundNumber`, `scores`) — ai skedar është
 * kontrata e të dhënave dhe provat maten kundër tij. Teksti që sheh përdoruesi
 * është shqip; skema jo, që të mos këputet lidhja me burimin.
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

/** Një shoqëri që luan bashkë rregullisht. Radha e `playerNames` ka kuptim. */
export type Grupi = {
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
export type Loja = {
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
export type Raundi = {
  id: number;
  gameId: number;
  roundNumber: number;
  scores: Record<string, number | null>;
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
