/**
 * Regjistri i lojërave — çka e ndan njërën nga tjetra, i shkruar një herë.
 *
 * Fleta e vjetër kishte katër skeda: „Brigj", „Domina", „Magarec" dhe pastaj
 * erdhi pishpiriku. E njëjta tavolinë, i njëjti grup, e njëjta bazë — prandaj
 * aplikacioni nuk u nda më katër, por mësoi se çka ndryshon mes tyre.
 *
 * Ajo që ndryshon rri e tëra këtu, dhe është e numërueshme: kush fiton (totali
 * më i vogël apo më i madhi), me çka mbaron mbrëmja, a ka llogaritës, a
 * shlyhet me para, a parashikohen vendet. Një `lloji === 'magarec'` i
 * shpërndarë nëpër dhjetë ekrane do të harrohej pikërisht atje ku ndryshon
 * vizatimi — dhe me katër lojëra ai numër bëhet dyzet.
 *
 * Ky skedar nuk njeh as bazën, as React-in, as `window`-in: importohet drejt
 * nga `node --test`, pa bundler. Nuk importon as `llogaritjet.ts`, që zinxhiri
 * i importeve të rrijë me një drejtim të vetëm.
 */

import { FJALA } from './magareci.ts';
import type { Drejtimi, LlojiILojes } from './tipet.ts';

/* ── Kufijtë e shkruar ──────────────────────────────────────────────────── */

/**
 * Deri ku luhet domina — dhe pse është kufi totali e jo numër raundesh.
 *
 * Te fleta e vjetër skeda „Domina" ka tetë rreshta raundesh për tre lojtarë,
 * pra rregulli i bridzhit (dy raunde për lojtar, gjashtë) nuk vlen atje. Ajo që
 * vlen është kufiri i pikëve: luhet derisa dikujt t'i mbushen njëqind, dhe
 * atëherë mbrëmja mbaron.
 *
 * Pikët janë dënim e jo fitim — te fleta, raundi i vetëm i shënuar u jep dy
 * lojtarëve 21 e 38 dhe të tretit asgjë, pra secili shkruan sa i mbetën në
 * dorë. Prandaj kush i mbush të parin njëqind e humb mbrëmjen, dhe fiton
 * totali më i vogël, njësoj si te bridzhi.
 */
export const KUFIRI_I_DOMINES = 100;

/** Kufijtë që i ofrohen dominës kur nis mbrëmja. */
export const KUFIJTE_E_DOMINES = [100, 250];

/**
 * Deri ku luhet pishpiriku, dhe këtu fiton më i madhi.
 *
 * Ky numër nuk vjen nga burimi i rregullave si të tjerët poshtë: ajo faqe jep
 * pikët e një dore, e jo fundin e mbrëmjes. Njëqind e njëzeta është ajo që e
 * thotë tavolina e pronarit; 101-shi e 151-shi qarkullojnë po aq gjerësisht.
 * Prandaj kufiri nuk u zgjodh fare: ky është vetëm parazgjedhja e çelësit, dhe
 * mbrëmja e mban të vetin (`Loja.kufiri`).
 */
export const KUFIRI_I_PISHPIRIKUT = 120;

/** Kufijtë që i ofrohen pishpirikut kur nis mbrëmja. */
export const KUFIJTE_E_PISHPIRIKUT = [101, 120, 151];

/**
 * Sa pikë ndan një dorë pishpiriku pa pishpirikët — për shënimin nën fushat.
 *
 * Njëzet e dy vijnë nga letrat: nga një për secilin as, dam, mbret, fant e
 * dhjetë, ku dhjeta e bastunit numëron dy e dyshi i lules një. Tri të tjerat i
 * merr kush ka shumicën e letrave — njëzet e shtatë a më shumë, dhe askush kur
 * tavolina ndahet baras.
 *
 * Aplikacioni nuk i njeh letrat dhe nuk ka pse t'i njohë: numri i një dore
 * numërohet te tavolina, ku janë letrat, e shkruhet ashtu si del. Kjo shumë
 * shërben vetëm si shënim nën fushat — një dorë që del 19 do të thotë se
 * dikujt i ka ikur një letër te numërimi.
 */
export const DORA_E_PISHPIRIKUT = 25;

/**
 * Sa vlen një pishpirik, dhe sa ai me fant.
 *
 * Të dy numrat vijnë nga rregullat e vetë lojës (pishpirik.com): dhjetë kur
 * letra e luajtur përputhet me atë të vetme mbi tavolinë, dhe **pesëmbëdhjetë**
 * kur ajo letër është fant. Njëzet qarkullon nëpër shumë faqe të tjera për
 * pishtin turk — mos e „rregullo" atje pa e parë burimin.
 */
export const PIKET_E_PISHPIRIKUT = 10;
export const PIKET_E_PISHPIRIKUT_ME_FANT = 15;

/* ── Rregullat e një loje ───────────────────────────────────────────────── */

/** Çka duhet të dijë një ekran për lojën që po vizaton. */
export type Rregullat = {
  lloji: LlojiILojes;
  /** Emri ashtu si shkruhet në ekran. */
  emri: string;
  /**
   * Lloji brenda paketës — një shkronjë, sepse çdo bajt është pikë te kodi QR.
   *
   * Shkronjat nuk ndërrohen kurrë pasi të jenë shkruar: një adresë e ndarë dje
   * te një bisedë lexohet sot, dhe një shkronjë e riciklituar do të tregonte
   * lojën e gabuar pa e thënë kush (pika 7).
   */
  shenja: string;
  /** Kush fiton: totali më i vogël apo më i madhi. */
  drejtimi: Drejtimi;
  /** Çka mat numri i një lojtari — pikë, apo shkronja të fjalës. */
  njesia: 'pike' | 'shkronja';
  /**
   * Sa raunde për lojtar zgjat mbrëmja, ose `null` kur gjatësia nuk numërohet
   * me raunde. Vetëm bridzhi e ka: tavolina rrotullohet saktësisht dy herë.
   */
  raundePerLojtar: number | null;
  /**
   * Totali që e mbyll mbrëmjen sapo dikush e arrin, ose `null` kur s'ka të
   * tillë. Shtatë shkronjat e magarecit janë pikërisht ky kufi, parë nga ana e
   * numrit.
   *
   * Është parazgjedhje e jo ligj: mbrëmja mund ta mbajë të vetin (`Loja.kufiri`),
   * dhe `kufiriILojes()` te `fundi.ts` është vendi i vetëm ku zgjidhet cili nga
   * të dy vlen.
   */
  kufiriITotalit: number | null;
  /**
   * Kufijtë që i ofrohen kësaj loje te ekrani, ose bosh kur nuk zgjidhet.
   *
   * Bosh do të thotë se kufiri nuk është marrëveshje tavoline: bridzhi mbaron
   * me raundet, dhe te magareci fjala ka shtatë shkronja — një çelës që të
   * lejon „deri te pesë shkronja" do të shpikte një lojë tjetër.
   */
  kufijteEMundshem: number[];
  /** A ka llogaritës raundi — vetëm bridzhi, sepse vetëm ai ka formulë. */
  llogaritesi: boolean;
  /** A shlyhet diferenca mes lojtarëve me para, pra a vizatohet matrica. */
  shlyerja: boolean;
  /** A parashikohen vendet — kërkon kufij të numërueshëm për një raund. */
  parashikimi: boolean;
  /** Rregulli me një fjali, për ekranin ku zgjidhet çka luhet. */
  rregulli: string;
  /**
   * Shënimi i shkurtër nën fushat e raundit, ose `null` kur s'ka çka të thuhet.
   *
   * Rri i ndarë nga `rregulli` sepse lexohet te një vend tjetër: blloku i futjes
   * përdoret dhjetëra herë në mbrëmje (pika 6), dhe tri rreshta të fjetur mbi
   * rreshtin e ngjitur poshtë do t'i hanin ekranin pikërisht kur tastiera është
   * hapur. Një rresht mjafton: çka pritet të jetë ai numër.
   */
  shenimi: string | null;
  /**
   * Rregullat e plota, një fjali për rresht — ato që deri tani rrinin te
   * README-ja, pra jashtë telefonit që i mban pikët.
   *
   * Ekzistojnë sepse tavolina i kërkon rrallë por i kërkon vërtet: kush luan
   * pishpirik një herë në muaj nuk e mban mend nëse fanti e bën pishpirikun 10
   * apo 15, dhe përgjigjja nuk guxon të jetë «hape README-në te GitHub-i».
   * Rrinë te një `<details>` i mbledhur (pika 6: blloku i futjes nuk ndahet me
   * askënd), dhe vijnë prej këtu e jo prej ekranit, që një lojë e pestë të mos
   * kërkojë vizatim të ri (pika 16).
   *
   * Numrat e tyre janë të rregullit — 51-shi i hapjes, 25-a e dorës — kurrë
   * kufiri i mbrëmjes: atë e zgjedh tavolina, dhe një numër i ngrirë këtu do të
   * gënjente pikërisht atë që sapo e zgjodhi vetë (pika 13).
   */
  hollesite: string[];
};

/**
 * Të katër lojërat, dhe çka i ndan.
 *
 * Dy të parat erdhën nga dy skedat e para të fletës; domina nga e treta, dhe
 * pishpiriku nga tavolina e jo nga fleta — atë skedë nuk e pati kurrë.
 *
 * Pishpiriku është i vetmi ku fiton totali më i madh, dhe kjo nuk është
 * hollësi: gjysma e ekranit e lexon `drejtimi`-n para se të shkruajë «fitoi».
 * Prandaj rri fushë e shkruar e jo `lloji === 'pishpirik'` diku brenda një
 * renditjeje.
 */
export const LOJERAT: Record<LlojiILojes, Rregullat> = {
  bridzh: {
    lloji: 'bridzh',
    emri: 'Bridzh',
    shenja: 'b',
    drejtimi: 'poshte',
    njesia: 'pike',
    raundePerLojtar: 2,
    kufiriITotalit: null,
    kufijteEMundshem: [],
    llogaritesi: true,
    shlyerja: true,
    parashikimi: true,
    rregulli: 'Pikët shënohen për raund, dhe fiton totali më i vogël.',
    /*
     * Bridzhi e mori shënimin i fundit, dhe kjo tregon diçka: llogaritësi hapet
     * i pari (pika 3), prandaj numrat e mbylljes rrinë të shkruar brenda tij e
     * rruga e shpeshtë nuk e kërkon këtë rresht fare. Kush i shkruan pikët me
     * dorë — raundi që rregulli nuk e mbulon — nuk i kishte askund.
     */
    shenimi: 'Pikët e secilit për këtë raund. Fiton totali më i vogël.',
    hollesite: [
      'Hapja lejohet me 51 pikë kombinimesh nga një dorë me 14 letra.',
      'Mbyllja bëhet kur lojtari i ka hedhur të gjitha letrat dhe e mbyll '
        + 'raundin me letrën e fundit, pa i mbetur asnjë në dorë.',
      'Hant — mbylli pa hedhur e pa shitur asnjë letër: mbyllësi −40, kush nuk '
        + 'kishte hapur +200, kush kishte hapur 2 × pikët që i mbetën në dorë.',
      'Normal — kishte hapur më parë: mbyllësi −20, kush nuk kishte hapur +100, '
        + 'kush kishte hapur pikët që i mbetën në dorë.',
      '„I hapur" është ai që ka hedhur së paku një letër ose i ka shitur një '
        + 'letër dikujt atë raund.',
      'Mbrëmja mbaron pas dy raundeve për lojtar, pra kur tavolina rrotullohet '
        + 'dy herë.',
    ],
  },
  magarec: {
    lloji: 'magarec',
    // Emri shkruhet si fjalë e jo si `FJALA`: ai emër del te një çelës krah tri
    // të tjerëve dhe te një listë pikësh e ngjitur në një bisedë, ku «MAGAREC»
    // me shkronja të mëdha lexohet si britmë. Vetë fjala që mbushet mbetet e
    // madhe atje ku është rregull — te rrjeti dhe te etiketa e lojës.
    emri: 'Magarec',
    shenja: 'm',
    drejtimi: 'poshte',
    njesia: 'shkronja',
    raundePerLojtar: null,
    kufiriITotalit: FJALA.length,
    kufijteEMundshem: [],
    llogaritesi: false,
    shlyerja: false,
    parashikimi: true,
    rregulli: `Kush e humb raundin merr një shkronjë; kush e mbush ${FJALA}-in e humb mbrëmjen.`,
    shenimi: 'Prek emrin e atij që e humbi raundin — ai merr shkronjën e radhës.',
    hollesite: [
      `Kush e humb raundin merr shkronjën e radhës nga ${FJALA}.`,
      `Fjala ka ${FJALA.length} shkronja, dhe kush e mbush e humb mbrëmjen; loja `
        + 'mbaron aty.',
      'Raundi ka një pyetje të vetme, prandaj ka edhe një prekje të vetme: '
        + 'emri i humbësit e ruan raundin.',
      'Shkronjat nuk ruhen veças — dalin nga raundet. Prandaj fshirja ose '
        + 'ndërrimi i një raundi të mesit i rinumëron vetvetiu të gjitha pas tij.',
      'Shlyerje nuk ka: shkronjat nuk paguhen me para.',
    ],
  },
  domina: {
    lloji: 'domina',
    emri: 'Domina',
    shenja: 'd',
    drejtimi: 'poshte',
    njesia: 'pike',
    raundePerLojtar: null,
    kufiriITotalit: KUFIRI_I_DOMINES,
    kufijteEMundshem: KUFIJTE_E_DOMINES,
    llogaritesi: false,
    shlyerja: true,
    parashikimi: false,
    /*
     * Kufiri nuk shkruhet te këto dy rreshta, edhe pse do të rrinte mirë.
     *
     * Ai zgjidhet për çdo mbrëmje (`Loja.kufiri`), dhe një numër i ngrirë këtu
     * do të thoshte «mbaron te 100» mbi një mbrëmje të nisur deri te 250 — pra
     * do të gënjente pikërisht atë që sapo e zgjodhi vetë. Numrin e vërtetë e
     * thotë çelësi krah këtij teksti, dhe rreshti «Deri te …» te ekrani i lojës.
     */
    rregulli:
      'Secili shënon sa gurë i mbetën në dorë, dhe fiton totali më i vogël. '
      + 'Deri ku luhet e thotë çelësi sipër.',
    shenimi: 'Sa gurë i mbetën secilit në dorë. Fiton totali më i vogël.',
    hollesite: [
      'Kur mbaron dora, secili shënon sa gurë i mbetën në dorë — pra pikët janë '
        + 'dënim e jo fitim.',
      'Kush nuk mbeti me asnjë gur shënon zero.',
      'Mbrëmja mbaron kur dikush e arrin kufirin e zgjedhur për atë mbrëmje, dhe '
        + 'pikërisht ai e humb.',
      'Fiton totali më i vogël, dhe diferencat shlyhen nga matrica.',
    ],
  },
  pishpirik: {
    lloji: 'pishpirik',
    emri: 'Pishpirik',
    shenja: 'p',
    drejtimi: 'larte',
    njesia: 'pike',
    raundePerLojtar: null,
    kufiriITotalit: KUFIRI_I_PISHPIRIKUT,
    kufijteEMundshem: KUFIJTE_E_PISHPIRIKUT,
    llogaritesi: false,
    shlyerja: false,
    parashikimi: false,
    rregulli:
      `Pikët e dorës shënohen ashtu si numërohen te tavolina — ${DORA_E_PISHPIRIKUT} `
      + `për dorë, plus ${PIKET_E_PISHPIRIKUT} për çdo pishpirik. Këtu fiton `
      + `totali më i madh; deri ku luhet e thotë çelësi sipër.`,
    shenimi:
      `Pikët e dorës: ${DORA_E_PISHPIRIKUT} gjithsej, plus ${PIKET_E_PISHPIRIKUT} `
      + `për çdo pishpirik (${PIKET_E_PISHPIRIKUT_ME_FANT} me fant). Fiton totali `
      + `më i madh.`,
    hollesite: [
      `Një dorë e plotë ndan ${DORA_E_PISHPIRIKUT} pikë: nga një për secilin as, `
        + 'dam, mbret, fant e dhjetë — ku dhjeta e bastunit vlen dy dhe dyshi i '
        + 'lules një — plus tri për shumicën e letrave.',
      'Shumica është 27 letra a më shumë, dhe kur tavolina ndahet baras ato tri '
        + 'pikë nuk i merr askush.',
      `Një pishpirik — letra e luajtur përputhet me atë të vetme mbi tavolinë — `
        + `vlen ${PIKET_E_PISHPIRIKUT} pikë, dhe ${PIKET_E_PISHPIRIKUT_ME_FANT} `
        + 'kur ajo letër është fant.',
      'Pikët numërohen te tavolina e shkruhen ashtu si dalin: aplikacioni nuk i '
        + 'njeh letrat, prandaj llogaritës nuk ka.',
      'Këtu fiton totali më i madh, dhe mbrëmja mbaron kur dikush e arrin '
        + 'kufirin e zgjedhur — pra ai që e arrin, fiton.',
    ],
  },
};

/** Lojërat në radhën që dalin te çelësi — bridzhi i pari, si te fleta. */
export const RADHA: LlojiILojes[] = ['bridzh', 'magarec', 'domina', 'pishpirik'];

/** Rregullat e një lloji. Hyrja e vetme te tabela e mësipërme. */
export function rregullat(lloji: LlojiILojes): Rregullat {
  return LOJERAT[lloji];
}

/**
 * Lloji nga shkronja e paketës, ose `null` kur shkronja nuk njihet.
 *
 * `null` do të thotë refuzim i tërë paketës, dhe kjo është e qëllimshme: një
 * shkronjë e panjohur vjen nga një version më i ri, dhe leximi i saj si bridzh
 * do t'i tregonte shkronjat ose pikët e një loje tjetër pa e thënë kush.
 */
export function llojiNgaShenja(shenja: string): LlojiILojes | null {
  return RADHA.find((lloji) => LOJERAT[lloji].shenja === shenja) ?? null;
}

/**
 * A e ka arritur ndonjë total kufirin që e mbyll mbrëmjen.
 *
 * Të tri lojërat me kufi e ndajnë këtë llogari, edhe pse kufijtë e tyre nuk
 * kanë të bëjnë me njëri-tjetrin: shtatë shkronja, njëqind pikë dënimi, njëqind
 * e njëzet pikë fitimi. Drejtimi nuk hyn fare — kufiri arrihet nga poshtë te të
 * treja, sepse totalet vetëm rriten. Ajo që ndryshon është kuptimi: te dy të
 * parat ai që e arriti humbi, te e treta fitoi.
 *
 * Kufiri jepet e nuk merret nga regjistri: ai i regjistrit është vetëm
 * parazgjedhje, dhe mbrëmja mund ta ketë të vetin. `null` do të thotë «pa
 * kufi» — as loja pa të, as mbrëmja që u nis ashtu, nuk mbarojnë vetvetiu.
 */
export function arritiKufirin(
  kufiri: number | null,
  totalet: Record<string, number>,
): boolean {
  if (kufiri === null) return false;

  return Object.values(totalet).some((total) => total >= kufiri);
}
