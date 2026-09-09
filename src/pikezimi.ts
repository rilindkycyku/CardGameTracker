/**
 * Rregullat e pikëzimit të Bridzhit kosovar — llogaritësi i raundit.
 *
 * Aplikacioni nuk i njeh letrat. Ai që mbyll raundin e di vetë sa ka mbetur në
 * dorë secili; kjo skedar vetëm e kthen atë në numrat e raundit, që të mos
 * shumëzohet e mblidhet me kokë në ora dy të natës.
 *
 * Dy mbyllje, dy gjendje lojtari:
 *
 *   hant   — mbyllësi s'kishte hedhur as shitur asnjë letër më parë
 *            mbyllësi −40 · të tjerët të mbyllur +200 · të hapur 2 × dora
 *   normal — mbyllësi kishte hapur më parë
 *            mbyllësi −20 · të tjerët të mbyllur +100 · të hapur 1 × dora
 *
 * „I mbyllur" është lojtari që s'ka hedhur e s'ka shitur asnjë letër atë raund;
 * „i hapur" ai që ka hedhur së paku një. Dënimi i të mbyllurit është fiks,
 * prandaj dora e tij as nuk pyetet.
 */

/** Mbyllje e ftohtë („hant") ose e zakonshme. */
export type LlojiMbylljes = 'hant' | 'normal';

/** Gjendja e një lojtari që nuk e mbylli raundin. */
export type GjendjaLojtarit = {
  /** I mbyllur — s'ka hedhur e s'ka shitur asnjë letër këtë raund. */
  mbyllur: boolean;
  /** Shuma e letrave që i mbetën në dorë. Merret parasysh vetëm kur ka hapur. */
  dora: number;
};

/** Pikët e mbyllësit sipas llojit të mbylljes. */
export const PIKET_E_MBYLLESIT: Record<LlojiMbylljes, number> = {
  hant: -40,
  normal: -20,
};

/** Dënimi i lojtarit që s'hapi fare. */
export const DENIMI_I_MBYLLUR: Record<LlojiMbylljes, number> = {
  hant: 200,
  normal: 100,
};

/** Sa herë numërohet dora e lojtarit që kishte hapur. */
export const SHUMEZUESI_I_DORES: Record<LlojiMbylljes, number> = {
  hant: 2,
  normal: 1,
};

/**
 * Pikët e një raundi për të gjithë lojtarët.
 *
 * `gjendjet` mban vetëm lojtarët që nuk mbyllën; mbyllësi merr pikët e tij nga
 * lloji i mbylljes. Një lojtar pa gjendje të dhënë llogaritet i mbyllur, sepse
 * ajo është gjendja me të cilën nis raundi.
 */
export function piketERaundit(
  players: string[],
  mbyllesi: string,
  lloji: LlojiMbylljes,
  gjendjet: Record<string, GjendjaLojtarit>,
): Record<string, number> {
  const pike: Record<string, number> = {};

  for (const player of players) {
    if (player === mbyllesi) {
      pike[player] = PIKET_E_MBYLLESIT[lloji];
      continue;
    }

    const gjendja = gjendjet[player] ?? { mbyllur: true, dora: 0 };

    pike[player] = gjendja.mbyllur
      ? DENIMI_I_MBYLLUR[lloji]
      : SHUMEZUESI_I_DORES[lloji] * Math.max(0, Math.round(gjendja.dora || 0));
  }

  return pike;
}

/** Shpjegimi i një rreshti të llogaritësit, që numri të mos dalë pa arsye. */
export function shpjegimi(
  lloji: LlojiMbylljes,
  gjendja: GjendjaLojtarit,
): string {
  if (gjendja.mbyllur) {
    return `nuk hapi · ${DENIMI_I_MBYLLUR[lloji]}`;
  }

  const shumezuesi = SHUMEZUESI_I_DORES[lloji];
  const dora = Math.max(0, Math.round(gjendja.dora || 0));

  return shumezuesi === 1
    ? `dora ${dora}`
    : `${shumezuesi} × dora ${dora} = ${shumezuesi * dora}`;
}
