/**
 * Teksti i një fushe pikësh, dhe shenja e tij.
 *
 * Fusha e pikëve është `type="text"` e jo `type="number"`, dhe kjo nuk është
 * rastësi: tastiera `inputMode="numeric"` e Androidit ka vetëm shifra — pa
 * minus — prandaj pikët e mbylljes (−20 dhe −40, ato që futen në çdo raund) nuk
 * shkruheshin dot fare në telefon. Shenjën e vendos një buton më vete, dhe një
 * fushë numerike do ta hidhte poshtë vlerën e ndërmjetme „−" para se të vinin
 * shifrat.
 *
 * Këtu rri vetëm përpunimi i tekstit, pa React dhe pa DOM, që `node --test` ta
 * masë drejtpërdrejt. Një gabim aty nuk duket në ekran — thjesht ruan pikë me
 * shenjë të gabuar, dhe totali i mbrëmjes del përmbys.
 */

/** A është kjo fushë e vendosur në negativ? */
export function negative(teksti: string | undefined): boolean {
  return (teksti ?? '').startsWith('-');
}

/**
 * Mban vetëm shifrat, dhe minusin nëse gjendet kudo qoftë.
 *
 * Minusi kërkohet kudo e jo vetëm në krye. Kur shenja shtypet para shifrave,
 * fusha mbetet me „−" të vetëm dhe kursori shkon aty ku e lë gishti — shpesh
 * para tij. Shifrat atëherë dalin „4−", dhe një filtër që e kërkon minusin në
 * krye do ta hidhte poshtë pikërisht shenjën që përdoruesi sapo e vuri.
 */
export function pastro(teksti: string): string {
  const shenja = teksti.includes('-') ? '-' : '';
  return shenja + teksti.replace(/[^0-9]/g, '');
}

/**
 * Ndërron shenjën e një teksti.
 *
 * Fusha e zbrazët bëhet „−", që shifrat e shtypura pas saj të dalin negative pa
 * u kthyer njëherë pozitive.
 */
export function ndrroShenjen(teksti: string | undefined): string {
  const tani = teksti ?? '';
  return tani.startsWith('-') ? tani.slice(1) : `-${tani}`;
}

/** Teksti i një fushe si numër, ose `null` nëse s’është shënuar ende. */
export function numri(teksti: string | undefined): number | null {
  if (teksti === undefined || teksti.trim() === '') return null;
  const n = Number(teksti);
  return Number.isFinite(n) ? Math.round(n) : null;
}
