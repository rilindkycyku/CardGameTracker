/**
 * Magareci — loja e shkronjave.
 *
 * Rregulli i tërë hyn në një fjali: kush e humb raundin merr një shkronjë, dhe
 * kush e mbush fjalën **MAGAREC** e humb mbrëmjen. Një shkronjë për raund, jo
 * më shumë, derisa njërit t'i dalë fjala e plotë.
 *
 * Te fleta e vjetër kjo ishte një rrjet i vizatuar me dorë: shkronjat poshtë
 * njëra-tjetrës në kolonën e parë, emrat përsipër, dhe një X te qeliza sa herë
 * dikush humbte. Ky skedar është ajo fletë, e bërë llogari.
 *
 * Shkronjat nuk kanë vend të vetin te baza: raundi i magarecit është një raund
 * si çdo tjetër — humbësi merr `1`, të tjerët `0`. Prandaj totali është numri i
 * shkronjave, dhe renditja, kopja rezervë e ndarja e rezultatit punojnë ashtu
 * si punonin, pa asnjë rrugë të dytë. Vetë shkronjat nuk ruhen askund: dilnin
 * nga numri sa herë lexohen, si çdo vlerë tjetër e derivuar.
 *
 * Ky skedar nuk njeh as bazën, as React-in, as `window`-in: importohet drejt
 * nga `node --test`, pa bundler.
 */

import { permbledhja, renditja } from './llogaritjet.ts';
import type { Raundi, RreshtiRenditjes } from './tipet.ts';

/** Fjala që mbushet. Shtatë shkronja, prandaj shtatë humbje. */
export const FJALA = 'MAGAREC';

/** Shkronjat një nga një — rreshtat e rrjetit, në radhën e fletës. */
export const SHKRONJAT: string[] = [...FJALA];

/* ── Raundi ─────────────────────────────────────────────────────────────── */

/**
 * Raundi si pikë: humbësi merr `1`, të tjerët `0`.
 *
 * Të tjerët marrin zero e jo asgjë, sepse ata e luajtën atë raund — dhe një
 * qelizë e zbrazët do të thoshte «nuk ishte te tavolina». Pa këtë dallim,
 * `raundetELuajtura` do t'i numëronte të gjithë sikur të kishin ardhur vonë
 * dhe renditja do të dilte me shënimin e pjesëmarrjes së pabarabartë te çdo
 * lojë.
 *
 * Kush nuk është te lista nuk merr shkronjë: humbësi vjen nga butonat e
 * ekranit, dhe ata i vizaton pikërisht kjo listë.
 */
export function raundiIHumbjes(
  players: string[],
  humbesi: string,
): Record<string, number | null> {
  const scores: Record<string, number | null> = {};
  for (const player of players) scores[player] = player === humbesi ? 1 : 0;
  return scores;
}

/** Kush e humbi këtë raund, ose `null` nëse s'ka shkronjë te ai. */
export function humbesiIRaundit(
  players: string[],
  raundi: Raundi,
): string | null {
  for (const player of players) {
    const pike = raundi.scores[player];
    if (typeof pike === 'number' && pike >= 1) return player;
  }

  return null;
}

/* ── Shkronjat ──────────────────────────────────────────────────────────── */

/**
 * Sa shkronja ka secili — dritare mbi `permbledhja`, si `totalet`.
 *
 * Mbledhja rri në një vend të vetëm te tërë projekti; kjo vetëm e quan me emrin
 * që ka këtu.
 */
export function shkronjat(
  players: string[],
  rounds: Raundi[],
): Record<string, number> {
  return permbledhja(players, rounds).totalet;
}

/** Fjala e mbledhur deri tani: `3` → „MAG". Mbi shtatë nuk ka ku të shkojë. */
export function fjalaE(sa: number): string {
  if (!Number.isFinite(sa) || sa <= 0) return '';
  return FJALA.slice(0, Math.min(Math.trunc(sa), FJALA.length));
}

/** A e ka mbushur fjalën ky numër shkronjash? */
export function mbushur(sa: number): boolean {
  return Number.isFinite(sa) && sa >= FJALA.length;
}

/**
 * Kush doli magarec, ose `null` nëse loja vazhdon.
 *
 * Raundet lexohen sipas numrit e jo sipas radhës së leximit, dhe kthehet i pari
 * që e mbushi fjalën. Me një shkronjë për raund dy të tillë nuk ka; por një
 * raund i redaktuar me dorë ose një kopje e ardhur nga jashtë mund t'i sjellë,
 * dhe atëherë mbrëmja ka mbaruar te i pari — jo te ai që rastis të jetë i pari
 * te lista e emrave.
 */
export function magareci(players: string[], rounds: Raundi[]): string | null {
  const sa: Record<string, number> = {};

  for (const raundi of [...rounds].sort((a, b) => a.roundNumber - b.roundNumber)) {
    for (const player of players) {
      const pike = raundi.scores[player];
      if (typeof pike !== 'number' || !Number.isFinite(pike)) continue;

      sa[player] = (sa[player] ?? 0) + pike;
      if (mbushur(sa[player]!)) return player;
    }
  }

  return null;
}

/**
 * Raundet me shkronjën që solli secili.
 *
 * Lista e raundeve tregon „raundi 4 — eri mori R", jo një kolonë me `1` e `0`.
 * Shkronja nuk rri te raundi: del nga sa herë e kishte humbur ai lojtar deri
 * atëherë, prandaj fshirja e një raundi të mesit i rinumëron vetvetiu të gjitha
 * ato që vijnë pas — ashtu si totali te bridzhi.
 */
export type RaundiIMagarecit = {
  id: number;
  roundNumber: number;
  /** Kush e humbi, ose `null` nëse ai raund s'ka shkronjë. */
  humbesi: string | null;
  /** Shkronja që i solli ai raund, ose `''` kur fjala kishte mbaruar. */
  shkronja: string;
};

export function raundetEMagarecit(
  players: string[],
  rounds: Raundi[],
): RaundiIMagarecit[] {
  const sa: Record<string, number> = {};

  return [...rounds]
    .sort((a, b) => a.roundNumber - b.roundNumber)
    .map((raundi) => {
      const humbesi = humbesiIRaundit(players, raundi);
      if (humbesi === null) {
        return { id: raundi.id, roundNumber: raundi.roundNumber, humbesi, shkronja: '' };
      }

      sa[humbesi] = (sa[humbesi] ?? 0) + 1;

      return {
        id: raundi.id,
        roundNumber: raundi.roundNumber,
        humbesi,
        shkronja: SHKRONJAT[sa[humbesi]! - 1] ?? '',
      };
    });
}

/* ── Rrjeti ─────────────────────────────────────────────────────────────── */

/** Një kolonë e rrjetit — një lojtar, dhe sa e ka fjalën. */
export type RreshtiMagarecit = {
  player: string;
  /** Sa shkronja ka marrë, pra sa raunde ka humbur. */
  shkronja: number;
  /** Fjala e tij deri tani, p.sh. „MAGA". */
  fjala: string;
  /** A e mbushi fjalën. */
  magarec: boolean;
};

/**
 * Rrjeti nga vetë numrat, jo nga raundet.
 *
 * Merr numrat e gatshëm sepse i njëjti rrjet vizatohet edhe te pamja
 * vetëm-lexim, dhe atje raundet nuk kalojnë fare — paketa mban vetëm totalet.
 * Meqë shkronja është pikërisht totali, ajo pamje e nxjerr rrjetin e plotë nga
 * ato pak bajte.
 */
export function rreshtatEMagarecit(
  players: string[],
  sa: Record<string, number>,
): RreshtiMagarecit[] {
  return players.map((player) => {
    const shkronja = Math.max(0, Math.trunc(sa[player] ?? 0));

    return {
      player,
      shkronja,
      fjala: fjalaE(shkronja),
      magarec: mbushur(shkronja),
    };
  });
}

/**
 * Renditja e magarecit — më pak shkronja, më mirë.
 *
 * E njëjta `renditja` e bridzhit, mbi numrin e shkronjave. Nuk ka rregull të
 * dytë: te kjo lojë „fiton totali më i vogël" nuk është e kundërta e pritjes,
 * është vetë loja.
 */
export function renditjaEMagarecit(
  players: string[],
  rounds: Raundi[],
): RreshtiRenditjes[] {
  return renditja(players, shkronjat(players, rounds));
}

/* ── Tabela e grupit ────────────────────────────────────────────────────── */

/** Një rresht i tabelës së grupit për magarecin. */
export type RreshtiPergjithshemMagarec = {
  player: string;
  /** Sa mbrëmje magareci ka luajtur. */
  lojera: number;
  /** Në sa prej tyre e mbushi fjalën. */
  magarec: number;
  /** Sa shkronja ka marrë gjithsej. */
  shkronja: number;
  /** Shkronja për lojë. E pandarë, që ta rrumbullakosë vetë ekrani. */
  mesatarja: number;
};

/**
 * Përmbledhja e magarecave të një grupi.
 *
 * Ndahet nga tabela e bridzhit sepse numrat nuk janë të njëjtë lloji: aty
 * mblidhen pikë me qindra, këtu shkronja nga zero në shtatë. Një kolonë e
 * vetme „mesatarja" mbi të dyja do të ishte numër pa kuptim.
 *
 * Kufijtë janë ata të `tabelaEPergjithshme`: numërohen vetëm mbrëmjet me së
 * paku një raund, dhe brenda tyre vetëm ata që ishin te tavolina. Kush u shtua
 * e u ngrit pa luajtur asnjë raund nuk e ka atë mbrëmje askund.
 *
 * Radha: më pak herë magarec i pari, dhe kur janë të barabartë, më pak shkronja
 * për lojë.
 */
export function pergjithshmetEMagarecit(
  lojerat: { selectedPlayers: string[]; raundet: Raundi[] }[],
): RreshtiPergjithshemMagarec[] {
  const mbledhur = new Map<
    string,
    { lojera: number; magarec: number; shkronja: number }
  >();

  for (const loja of lojerat) {
    const p = permbledhja(loja.selectedPlayers, loja.raundet);
    const luajtur = loja.selectedPlayers.filter((x) => (p.luajtur[x] ?? 0) > 0);
    if (luajtur.length === 0) continue;

    const humbesi = magareci(luajtur, loja.raundet);

    for (const player of luajtur) {
      const rreshti = mbledhur.get(player) ?? {
        lojera: 0,
        magarec: 0,
        shkronja: 0,
      };

      rreshti.lojera += 1;
      rreshti.shkronja += Math.max(0, p.totalet[player] ?? 0);
      if (player === humbesi) rreshti.magarec += 1;

      mbledhur.set(player, rreshti);
    }
  }

  return [...mbledhur.entries()]
    .map(([player, r]) => ({
      player,
      lojera: r.lojera,
      magarec: r.magarec,
      shkronja: r.shkronja,
      mesatarja: r.shkronja / r.lojera,
    }))
    .sort((a, b) => a.magarec - b.magarec || a.mesatarja - b.mesatarja);
}
