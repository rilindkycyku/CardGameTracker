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

/**
 * Deri ku luhet pishpiriku: njëqind e një pikë, dhe këtu fiton më i madhi.
 *
 * Një dorë e plotë ndan njëzet e pesë pikë — njëzet e dy nga letrat (asi,
 * dama, mbreti, fanti e dhjeta nga një, dhjeta bastuni dy, dyshi lulja një)
 * dhe tri për shumicën e letrave — plus dhjetë për çdo pishpirik. Loja
 * vazhdon dorë pas dore derisa dikush t'i kalojë 101-shin.
 *
 * Aplikacioni nuk i njeh letrat dhe nuk ka pse t'i njohë: numri i një dore
 * numërohet te tavolina, ku janë letrat, e shkruhet ashtu si del. Kjo shumë
 * shërben vetëm si shënim nën fushat — një dorë që del 19 do të thotë se
 * dikujt i ka ikur një letër te numërimi.
 */
export const KUFIRI_I_PISHPIRIKUT = 101;

/** Sa pikë ndan një dorë pishpiriku pa pishpirikët — për shënimin nën fushat. */
export const DORA_E_PISHPIRIKUT = 25;

/** Sa vlen një pishpirik, dhe sa ai me fant. */
export const PIKET_E_PISHPIRIKUT = 10;
export const PIKET_E_PISHPIRIKUT_ME_FANT = 20;

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
   */
  kufiriITotalit: number | null;
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
    llogaritesi: true,
    shlyerja: true,
    parashikimi: true,
    rregulli: 'Pikët shënohen për raund, dhe fiton totali më i vogël.',
    shenimi: null,
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
    llogaritesi: false,
    shlyerja: false,
    parashikimi: true,
    rregulli: `Kush e humb raundin merr një shkronjë; kush e mbush ${FJALA}-in e humb mbrëmjen.`,
    shenimi: null,
  },
  domina: {
    lloji: 'domina',
    emri: 'Domina',
    shenja: 'd',
    drejtimi: 'poshte',
    njesia: 'pike',
    raundePerLojtar: null,
    kufiriITotalit: KUFIRI_I_DOMINES,
    llogaritesi: false,
    shlyerja: true,
    parashikimi: false,
    rregulli:
      `Secili shënon sa gurë i mbetën në dorë. Mbrëmja mbaron kur dikujt i `
      + `mbushen ${KUFIRI_I_DOMINES} pikë, dhe fiton totali më i vogël.`,
    shenimi: `Sa gurë i mbetën secilit në dorë. Mbrëmja mbaron te ${KUFIRI_I_DOMINES}.`,
  },
  pishpirik: {
    lloji: 'pishpirik',
    emri: 'Pishpirik',
    shenja: 'p',
    drejtimi: 'larte',
    njesia: 'pike',
    raundePerLojtar: null,
    kufiriITotalit: KUFIRI_I_PISHPIRIKUT,
    llogaritesi: false,
    shlyerja: false,
    parashikimi: false,
    rregulli:
      `Pikët e dorës shënohen ashtu si numërohen te tavolina — ${DORA_E_PISHPIRIKUT} `
      + `për dorë, plus ${PIKET_E_PISHPIRIKUT} për çdo pishpirik. Këtu fiton `
      + `totali më i madh: mbrëmja mbaron kur dikush arrin ${KUFIRI_I_PISHPIRIKUT}.`,
    shenimi:
      `Pikët e dorës: ${DORA_E_PISHPIRIKUT} gjithsej, plus ${PIKET_E_PISHPIRIKUT} `
      + `për çdo pishpirik. Fiton totali më i madh.`,
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
 * e një pikë fitimi. Drejtimi nuk hyn fare — kufiri arrihet nga poshtë te të
 * treja, sepse totalet vetëm rriten. Ajo që ndryshon është kuptimi: te dy të
 * parat ai që e arriti humbi, te e treta fitoi.
 */
export function arritiKufirin(
  lloji: LlojiILojes,
  totalet: Record<string, number>,
): boolean {
  const kufiri = LOJERAT[lloji].kufiriITotalit;
  if (kufiri === null) return false;

  return Object.values(totalet).some((total) => total >= kufiri);
}
