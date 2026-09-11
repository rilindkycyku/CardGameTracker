/**
 * Llogaritjet e derivuara: totalet, renditja, matrica e shlyerjes dhe rrjedha
 * e totaleve raund pas raundi.
 *
 * Asnjë nga këto vlera nuk ruhet në bazë. Ruhen vetëm pikët e futura; gjithçka
 * tjetër llogaritet sa herë lexohet. Nëse një raund i vjetër redaktohet, nuk ka
 * total të ngrirë diku që të mbetet pas — kjo është arsyeja e vetme e rregullit.
 *
 * Ky skedar nuk njeh as bazën, as React-in, as `window`-in: importohet drejt nga
 * `node --test`, pa bundler.
 */

import type {
  Grupi,
  LlojiILojes,
  Loja,
  Raundi,
  RreshtiRenditjes,
} from './tipet.ts';

/** Raundet sipas numrit, që rrjedha e totaleve të mos varet nga radha e leximit. */
export function sipasRadhes(rounds: Raundi[]): Raundi[] {
  return [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);
}

/**
 * `total[lojtari]` = shuma e pikëve të futura.
 *
 * Një qelizë e zbrazët nuk është zero e futur me dorë, por raund që s'është
 * shënuar ende; të dyja mblidhen njësoj, prandaj `null` thjesht kapërcehet.
 */
/** Ajo që një kalim i vetëm mbi raundet e jep. */
export type Permbledhja = {
  /** Shuma e pikëve për secilin lojtar. Qeliza e zbrazët nuk numërohet zero. */
  totalet: Record<string, number>;
  /** Sa raunde ka shënuar secili. */
  luajtur: Record<string, number>;
  /** A kanë shënuar të gjithë të njëjtin numër raundesh? */
  barabarte: boolean;
};

/**
 * Totalet, raundet e luajtura dhe barazia e pjesëmarrjes — me një kalim.
 *
 * Ekrani i lojës i donte të tri, dhe më parë i merrte veç: `totalet`,
 * `raundetELuajtura`, dhe `pjesemarrjeEBarabarte` që brenda e thërriste sërish
 * `raundetELuajtura` mbi një listë të filtruar. Katër kalime mbi të njëjtat
 * raunde, ku një mjafton.
 *
 * Filtri i atij kalimi të katërt — `raundet.filter(eshteIMbushur)` — nuk mund
 * ta ndryshonte kurrë përgjigjen: një raund pa asnjë pikë nuk i shton njërit
 * numërimin, prandaj heqja e tij i lë të gjitha numërimet ashtu si ishin. Prova
 * `filtrimi i raundeve bosh nuk e ndryshon pjesëmarrjen` e mban këtë të matur.
 *
 * Ky është i vetmi vend te projekti që i mbledh pikët. `totalet` dhe
 * `raundetELuajtura` rrinë si dritare mbi këtë — dy kopje të të njëjtës mbledhje
 * do të dilnin jashtë sinkronie pikërisht atje ku numri duhet të jetë i njëjti.
 */
export function permbledhja(players: string[], rounds: Raundi[]): Permbledhja {
  const totalet: Record<string, number> = {};
  const luajtur: Record<string, number> = {};

  for (const player of players) {
    totalet[player] = 0;
    luajtur[player] = 0;
  }

  for (const raundi of rounds) {
    for (const player of players) {
      const pike = raundi.scores[player];
      if (typeof pike !== 'number') continue;

      luajtur[player] = (luajtur[player] ?? 0) + 1;
      // `Number.isFinite` mbron nga `Infinity` e `NaN` që mund të hyjnë nga një
      // kopje rezervë e prishur; numërimi i raundeve i njeh gjithsesi si pikë.
      if (Number.isFinite(pike)) totalet[player] = (totalet[player] ?? 0) + pike;
    }
  }

  const numrat = players.map((player) => luajtur[player] ?? 0);

  return {
    totalet,
    luajtur,
    barabarte: numrat.every((v) => v === numrat[0]),
  };
}

/** Vetëm totalet. Dritare mbi `permbledhja`, që mbledhja të rrijë në një vend. */
export function totalet(
  players: string[],
  rounds: Raundi[],
): Record<string, number> {
  return permbledhja(players, rounds).totalet;
}

/**
 * Renditja: totali më i vogël fiton, prandaj ngjitshëm.
 *
 * Barazimet nuk trajtohen veçmas — `sort` i JavaScript-it është i qëndrueshëm,
 * prandaj dy totale të njëjta mbeten në radhën e lojtarëve, dhe vendi është
 * thjesht pozicioni. Kështu vepron edhe tabela origjinale.
 */
export function renditja(
  players: string[],
  totals: Record<string, number>,
): RreshtiRenditjes[] {
  return [...players]
    .sort((a, b) => (totals[a] ?? 0) - (totals[b] ?? 0))
    .map((player, i) => ({ rank: i + 1, player, total: totals[player] ?? 0 }));
}

/**
 * `matrica[i][j] = total[i] − total[j]`. Diagonalja është gjithmonë 0.
 *
 * Vlera pozitive do të thotë se lojtari i rreshtit ka aq pikë më shumë se ai i
 * shtyllës. Meqë fiton totali më i vogël, „më shumë pikë" është ana që paguan —
 * prandaj shenja lexohet si diferencë, jo si epërsi.
 */
export function matricaEShlyerjes(
  players: string[],
  totals: Record<string, number>,
): Record<string, Record<string, number>> {
  const matrica: Record<string, Record<string, number>> = {};

  for (const i of players) {
    matrica[i] = {};
    for (const j of players) {
      matrica[i]![j] = (totals[i] ?? 0) - (totals[j] ?? 0);
    }
  }

  return matrica;
}

/** Sa i del një lojtari kundrejt një tjetri. */
export type ShlyerjaENjerit = {
  /** Tjetri — ai me të cilin shlyhet. */
  player: string;
  /**
   * `total[vetja] − total[tjetri]`.
   *
   * Pozitive do të thotë që vetja ka aq pikë më shumë, pra ana që paguan —
   * njësoj si te matrica, dhe për të njëjtën arsye: shenja është diferencë, jo
   * epërsi.
   */
  diferenca: number;
};

/**
 * Rreshti i matricës për një lojtar të vetëm.
 *
 * Matrica N×N e thotë të tërën, por në një telefon lexohet keq: kush shikon
 * rezultatin e ndarë do vetëm rreshtin e vet — *sa i dal unë kujt*. Ky funksion
 * është pikërisht ai rresht, pa qelizën e vetvetes.
 *
 * Radha shkon nga diferenca më e madhe te më e vogla, pra së pari ata që u
 * paguhet dhe pastaj ata që paguajnë. Kjo nuk është radha e renditjes me
 * qëllim: kur shlyhet, pyetja e parë është sa nxirret nga xhepi.
 */
export function shlyerjaEVetes(
  vetja: string,
  players: string[],
  totals: Record<string, number>,
): ShlyerjaENjerit[] {
  return players
    .filter((player) => player !== vetja)
    .map((player) => ({
      player,
      diferenca: (totals[vetja] ?? 0) - (totals[player] ?? 0),
    }))
    .sort((a, b) => b.diferenca - a.diferenca);
}

/** A ka ky raund së paku një pikë të futur për ndonjë prej lojtarëve? */
export function eshteIMbushur(players: string[], raundi: Raundi): boolean {
  return players.some((player) => typeof raundi.scores[player] === 'number');
}

/**
 * Sa herë përzien secili te një lojë **bridzhi** — dhe prandaj sa raunde ka ajo.
 *
 * Mbrëmja mbaron kur tavolina ka bërë dy rrotullime të plota: secili i ka
 * përzier letrat dy herë. Kjo nuk është marrëveshje e mbrëmjes — është vetë
 * rregulli i lojës, dhe fleta origjinale e dëshmon: te `logic.json` çdo mbrëmje
 * bridzhi ka saktësisht dy raunde për lojtar.
 *
 * Magareci nuk e ka këtë kufi. Atje mbrëmja mbaron kur dikujt i mbushet fjala,
 * prandaj mund të zgjasë edhe shumë më gjatë se dy rrotullime, edhe të mbarojë
 * te raundi i shtatë. Përzierja rrotullohet te të dyja lojërat; vetëm numërimi
 * i raundeve është i bridzhit.
 */
export const RAUNDE_PER_LOJTAR = 2;

/**
 * Sa raunde ka një lojë bridzhi me këta lojtarë.
 *
 * Numri nuk ruhet askund, si asnjë vlerë e derivuar (pika 2): del nga lista e
 * lojtarëve sa herë lexohet. Prandaj kur dikush ulet ose ngrihet mes lojës
 * (pika 5), mbrëmja zgjatet ose shkurtohet vetvetiu — dhe ashtu ndodh edhe te
 * tavolina, ku rrotullimi i letrave ndjek kë ka aty.
 *
 * Vetëm bridzhi e thërret. Të dy vendet që e përdorin e ndajnë llojin para se
 * ta bëjnë — `Loja` dhe `raundetEMbetura` — sepse te magareci ky numër nuk do të
 * thoshte asgjë.
 */
export function raundetELojes(players: string[]): number {
  return players.length * RAUNDE_PER_LOJTAR;
}

/**
 * Kush i përzien letrat te një raund.
 *
 * Radha e `selectedPlayers` është radha e tavolinës — te fleta e vjetër emrat
 * rrinin në atë radhë sepse ashtu uleshin — dhe përzierja kalon një vend çdo
 * raund: raundi i parë te i pari i listës, i dyti te i dyti, dhe pas të fundit
 * nis prapë nga kreu.
 *
 * Dy raunde për lojtar (`raundetELojes`) do të thotë pikërisht se kjo radhë
 * bën dy rrotullime të plota, dhe pastaj mbrëmja mbaron. Të dyja janë i njëjti
 * rregull, parë nga dy anë.
 *
 * Kur dikush shtohet ose hiqet mes lojës (pika 5), radha rillogaritet mbi
 * listën e tanishme. Kjo është e vërteta e tavolinës: kush u ngrit nuk përzien
 * më, dhe kush u ul hyn te radha. Raundet e shkuara nuk preken — ai numër nuk
 * ruhet askund.
 */
export function perziersiIRaundit(
  players: string[],
  roundNumber: number,
): string | null {
  if (players.length === 0 || !Number.isFinite(roundNumber)) return null;

  const i = (Math.trunc(roundNumber) - 1) % players.length;
  return players[(i + players.length) % players.length] ?? null;
}

/** Numri i raundit të radhës — një më shumë se më i larti i shënuar. */
export function raundiNeVijim(rounds: Raundi[]): number {
  return rounds.reduce((max, r) => Math.max(max, r.roundNumber), 0) + 1;
}

/**
 * Emri i lojës ashtu si shfaqet te historiku: data e shkruar shqip.
 *
 * Data mbahet si `YYYY-MM-DD` dhe ndahet me dorë. `new Date('2026-03-08')` do
 * ta lexonte si UTC dhe në Kosovë do të dilte një ditë më herët gjatë dimrit.
 */
export function dataShqip(date: string): string {
  const [vit, muaj, dite] = date.split('-').map(Number);
  if (!vit || !muaj || !dite) return date;
  const MUAJT = [
    'janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor',
    'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor',
  ];
  return `${dite} ${MUAJT[muaj - 1]} ${vit}`;
}

/**
 * `YYYY-MM-DD` → `dd/mm/vvvv`, ashtu si shkruhet data këtu.
 *
 * Fusha e datës ishte `type="date"`, dhe atë e vizaton shfletuesi sipas gjuhës
 * së vet: një telefon me anglishten amerikane e nxjerr muajin i pari, prandaj
 * 11 shtatori dilte „09/11" dhe lexohej 9 nëntor. Radha nuk vendoset dot me
 * HTML, prandaj fusha u bë tekst dhe radha shkruhet këtu.
 *
 * Në bazë data mbetet `YYYY-MM-DD` — renditja e historikut varet nga ajo.
 */
export function dataMeNumra(date: string): string {
  const [vit, muaj, dite] = date.split('-');
  if (!vit || !muaj || !dite) return date;

  return `${dite}/${muaj}/${vit}`;
}

/**
 * `dd/mm/vvvv` → `YYYY-MM-DD`, ose `null` kur data nuk qëndron.
 *
 * Vijat nuk kërkohen: numërohen vetëm shifrat, sepse fusha i vendos vetë sa
 * shkruhet. Data që nuk ekziston — 31 shkurti — kthen `null` e jo muajin
 * tjetër: një lojë e shkruar te një datë e shpikur do të rrinte te historiku
 * pa u vënë re kurrë.
 */
export function dataNgaNumrat(teksti: string): string | null {
  const shifrat = teksti.replace(/\D/g, '');
  if (shifrat.length !== 8) return null;

  const dite = Number(shifrat.slice(0, 2));
  const muaj = Number(shifrat.slice(2, 4));
  const vit = Number(shifrat.slice(4, 8));

  if (vit < 1000 || muaj < 1 || muaj > 12) return null;
  if (dite < 1 || dite > ditetEMuajit(vit, muaj)) return null;

  const dy = (n: number) => String(n).padStart(2, '0');
  return `${vit}-${dy(muaj)}-${dy(dite)}`;
}

/**
 * Sa ditë ka muaji.
 *
 * Pa `Date`, për të njëjtën arsye si te `dataShqip`: ajo lexon UTC-në dhe
 * kthimi mbrapsht do të shtonte një ditë pikërisht atje ku po kontrollohet.
 */
function ditetEMuajit(vit: number, muaj: number): number {
  const DITET = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (muaj === 2 && (vit % 4 === 0 && (vit % 100 !== 0 || vit % 400 === 0))) {
    return 29;
  }

  return DITET[muaj - 1] ?? 0;
}

/** Data e sotme si `YYYY-MM-DD`, në kohën e pajisjes. */
export function sot(tani: Date = new Date()): string {
  const dy = (n: number) => String(n).padStart(2, '0');
  return `${tani.getFullYear()}-${dy(tani.getMonth() + 1)}-${dy(tani.getDate())}`;
}

/**
 * Çka u luajt atë mbrëmje.
 *
 * Lojërat e shkruara para se të vinte magareci nuk e kanë fushën fare, prandaj
 * mungesa lexohet `bridzh`. Ky është vendi i vetëm ku bëhet ai lexim: një
 * `loja.lloji ?? 'bridzh'` i shpërndarë nëpër ekrane do të harrohej pikërisht
 * atje ku ndryshon vizatimi.
 */
export function llojiILojes(loja: { lloji?: LlojiILojes }): LlojiILojes {
  return loja.lloji === 'magarec' ? 'magarec' : 'bridzh';
}

/** Lojërat e një grupi, më e reja e para. */
export function lojeratESortuara(games: Loja[]): Loja[] {
  return [...games].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
  );
}

/** Lojtarët e grupit që nuk janë ende në një lojë — për zgjedhjen e lojtarëve. */
export function lojtaretEMbetur(grupi: Grupi, selected: string[]): string[] {
  return grupi.playerNames.filter((emri) => !selected.includes(emri));
}

/* ── Pjesëmarrja e pabarabartë ──────────────────────────────────────────── */

/**
 * Sa raunde ka shënuar secili lojtar.
 *
 * Kur dikush ulet te tavolina në raundin e pestë, totali i tij nis nga zero
 * ndërsa të tjerët janë me qindra pikë — dhe meqë fiton totali më i vogël, ai
 * del i pari pa luajtur asgjë. Numri nuk është i gabuar: totali është shuma e
 * pikëve, pikë. Ajo që mungon është konteksti, prandaj ky funksion e nxjerr atë
 * dhe faqja e shfaq krah renditjes.
 */
export function raundetELuajtura(
  players: string[],
  rounds: Raundi[],
): Record<string, number> {
  return permbledhja(players, rounds).luajtur;
}

/**
 * A kanë luajtur të gjithë të njëjtin numër raundesh?
 *
 * Kur jo, renditja dhe matrica krahasojnë totale të mbledhura mbi baza të
 * ndryshme — ende të sakta si numra, por jo më si radhë. Faqja e thotë këtë me
 * fjalë; nuk i ndryshon numrat.
 */
export function pjesemarrjeEBarabarte(
  players: string[],
  rounds: Raundi[],
): boolean {
  return permbledhja(players, rounds).barabarte;
}

/* ── Tabela e përgjithshme e grupit ─────────────────────────────────────── */

/** Një rresht i tabelës së përgjithshme: një lojtar, mbi të gjitha lojërat. */
export type RreshtiPergjithshem = {
  player: string;
  /** Sa lojëra ka luajtur — jo sa herë është shënuar te lista. */
  lojera: number;
  /** Në sa prej tyre ka dalë i pari. */
  fitore: number;
  /** Shuma e totaleve të të gjitha lojërave. */
  totali: number;
  /** Totali mesatar për lojë. I pandarë, që ta rrumbullakosë vetë ekrani. */
  mesatarja: number;
};

/**
 * Përmbledhja e një grupi mbi të gjitha lojërat e tij.
 *
 * Fleta e vjetër e kishte një bllok renditjeje për çdo mbrëmje dhe asgjë që
 * t'i lidhte; kush kishte fituar më shumë mbahej mend me gojë. Kjo është ajo
 * llogari, e bërë nga vetë raundet.
 *
 * Dy kufij e mbajnë të ndershme:
 *
 *   • Numërohen vetëm lojërat me së paku një pikë të shënuar. Një lojë e hapur
 *     e pa nisur ka të gjitha totalet zero, të gjithë të barabartë — dhe do t'i
 *     jepte fitoren të parit të listës pa u luajtur asnjë letër.
 *
 *   • Brenda një loje merren vetëm ata që shënuan. Kush u shtua te tavolina e
 *     u ngrit pa luajtur nuk e ka atë lojë as te „lojëra", as te mesatarja —
 *     dhe nuk e fiton dot atë me zero pikë.
 *
 * Radha: më shumë fitore i pari, dhe kur fitoret janë të barabarta, mesatarja
 * më e vogël — sepse fiton totali më i vogël. Barazimi i plotë e mban radhën e
 * paraqitjes, si te `renditja`.
 */
export function tabelaEPergjithshme(
  lojerat: { selectedPlayers: string[]; raundet: Raundi[] }[],
): RreshtiPergjithshem[] {
  const mbledhur = new Map<
    string,
    { lojera: number; fitore: number; totali: number }
  >();

  for (const loja of lojerat) {
    const luajtur = raundetELuajtura(loja.selectedPlayers, loja.raundet);
    const shenuan = loja.selectedPlayers.filter((p) => (luajtur[p] ?? 0) > 0);
    if (shenuan.length === 0) continue;

    const totalat = totalet(shenuan, loja.raundet);
    const fituesi = renditja(shenuan, totalat)[0]?.player;

    for (const player of shenuan) {
      const rreshti = mbledhur.get(player) ?? {
        lojera: 0,
        fitore: 0,
        totali: 0,
      };

      rreshti.lojera += 1;
      rreshti.totali += totalat[player] ?? 0;
      if (player === fituesi) rreshti.fitore += 1;

      mbledhur.set(player, rreshti);
    }
  }

  return [...mbledhur.entries()]
    .map(([player, r]) => ({
      player,
      lojera: r.lojera,
      fitore: r.fitore,
      totali: r.totali,
      mesatarja: r.totali / r.lojera,
    }))
    .sort((a, b) => b.fitore - a.fitore || a.mesatarja - b.mesatarja);
}

/**
 * Renditja përfundimtare e një loje, për ta parë pa e hapur atë.
 *
 * Merren vetëm lojtarët që shënuan — njësoj si te tabela e përgjithshme, dhe
 * për të njëjtën arsye.
 */
export function renditjaELojes(
  selectedPlayers: string[],
  raundet: Raundi[],
): RreshtiRenditjes[] {
  const luajtur = raundetELuajtura(selectedPlayers, raundet);
  const shenuan = selectedPlayers.filter((p) => (luajtur[p] ?? 0) > 0);
  if (shenuan.length === 0) return [];

  return renditja(shenuan, totalet(shenuan, raundet));
}
