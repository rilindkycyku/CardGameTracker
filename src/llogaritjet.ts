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

import type { Grupi, Loja, Raundi, RreshtiRenditjes } from './tipet.ts';

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
export function totalet(
  players: string[],
  rounds: Raundi[],
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const player of players) totals[player] = 0;

  for (const raundi of rounds) {
    for (const player of players) {
      const pike = raundi.scores[player];
      if (typeof pike === 'number' && Number.isFinite(pike)) {
        totals[player] = (totals[player] ?? 0) + pike;
      }
    }
  }

  return totals;
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

/** A ka ky raund së paku një pikë të futur për ndonjë prej lojtarëve? */
export function eshteIMbushur(players: string[], raundi: Raundi): boolean {
  return players.some((player) => typeof raundi.scores[player] === 'number');
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

/** Data e sotme si `YYYY-MM-DD`, në kohën e pajisjes. */
export function sot(tani: Date = new Date()): string {
  const dy = (n: number) => String(n).padStart(2, '0');
  return `${tani.getFullYear()}-${dy(tani.getMonth() + 1)}-${dy(tani.getDate())}`;
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
  const sa: Record<string, number> = {};
  for (const player of players) sa[player] = 0;

  for (const raundi of rounds) {
    for (const player of players) {
      if (typeof raundi.scores[player] === 'number') {
        sa[player] = (sa[player] ?? 0) + 1;
      }
    }
  }

  return sa;
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
  const sa = raundetELuajtura(players, rounds);
  const vlerat = players.map((player) => sa[player] ?? 0);

  return vlerat.every((v) => v === vlerat[0]);
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
