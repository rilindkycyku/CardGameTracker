/**
 * Tipet e të dhënave.
 *
 * Emrat e fushave janë ata të `logic.json`-it që doli nga tabela origjinale
 * (`playerNames`, `selectedPlayers`, `roundNumber`, `scores`) — ai skedar është
 * kontrata e të dhënave dhe provat maten kundër tij. Teksti që sheh përdoruesi
 * është shqip; skema jo, që të mos këputet lidhja me burimin.
 */

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
};

/** Një raund brenda një loje: një numër për secilin lojtar, ose asgjë ende. */
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
