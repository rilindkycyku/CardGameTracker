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

/** Një pikë e grafikut: totali i secilit lojtar pas atij raundi. */
export type HapiKumulativ = {
  roundNumber: number;
  totals: Record<string, number>;
};

/**
 * Totalet e mbledhura raund pas raundi, për grafikun.
 *
 * Merren vetëm raundet që kanë të paktën një pikë të futur: raundet e zbrazëta
 * në fund të fletës janë vende të lira për t'u mbushur, jo raunde me zero.
 */
export function totaletKumulative(
  players: string[],
  rounds: Raundi[],
): HapiKumulativ[] {
  const rrjedha: HapiKumulativ[] = [];
  const running: Record<string, number> = {};
  for (const player of players) running[player] = 0;

  for (const raundi of sipasRadhes(rounds)) {
    if (!eshteIMbushur(players, raundi)) continue;

    for (const player of players) {
      const pike = raundi.scores[player];
      if (typeof pike === 'number' && Number.isFinite(pike)) {
        running[player] = (running[player] ?? 0) + pike;
      }
    }

    rrjedha.push({ roundNumber: raundi.roundNumber, totals: { ...running } });
  }

  return rrjedha;
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
