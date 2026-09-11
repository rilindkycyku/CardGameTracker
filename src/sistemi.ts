/**
 * Ajo që e bën shfletuesi e jo ne: fleta e ndarjes dhe tabela e fragmenteve.
 *
 * Rri jashtë listës së moduleve të provueshme (pika 1) me qëllim — e tërë puna
 * e tij është `navigator`, prandaj nuk ka çka të provohet pa shfletues.
 *
 * Ekziston sepse dy ekrane e kërkojnë të njëjtën gjë, dhe të dyve u dilte i
 * njëjti gabim: `catch`-i i heshtur. Kur shfletuesi nuk e lejon kopjimin — një
 * faqe pa `https`, një Safari që e kërkon prekjen, një lejë e mohuar — butoni
 * shtypej dhe nuk ndodhte kurrgjë, as mesazh as lidhje. Prandaj këtu kthehet
 * gjithmonë një përgjigje, dhe ekrani ka çka të thotë.
 */

/** Si përfundoi fleta e ndarjes së sistemit. */
export type PerfundimiINdarjes =
  /** Shkoi te një bisedë; nuk ka çka të bëhet tjetër. */
  | 'u-nda'
  /** Fleta u mbyll me dorë — as ajo nuk kërkon rrugë të dytë. */
  | 'anulua'
  /** Shfletuesi nuk e ka fletën, ose e hodhi poshtë. */
  | 'nuk-mundi';

/**
 * Fleta e ndarjes së sistemit.
 *
 * Anulimi ndahet nga dështimi sepse pas tij nuk guxon të vijë rruga e dytë:
 * kush e mbylli fletën nuk kërkoi asgjë, dhe një kopjim i heshtur do t'ia zinte
 * tabelën e fragmenteve pa e ditur.
 */
export async function ndajMeSistemin(cfare: ShareData): Promise<PerfundimiINdarjes> {
  if (!navigator.share) return 'nuk-mundi';

  try {
    await navigator.share(cfare);
    return 'u-nda';
  } catch (gabimi) {
    return gabimi instanceof DOMException && gabimi.name === 'AbortError'
      ? 'anulua'
      : 'nuk-mundi';
  }
}

/**
 * Kopjimi te tabela e fragmenteve. `false` kur shfletuesi nuk e lejoi.
 *
 * `navigator.clipboard` mungon fare jashtë një konteksti të sigurt, prandaj
 * kontrollohet para se të preket: pa këtë, thirrja do të kërcente me
 * `TypeError` dhe do të përzihej me mohimin e lejës — që është e njëjta gjë për
 * atë që shtypi butonin, por jo për atë që lexon kodin.
 */
export async function kopjoTekstin(teksti: string): Promise<boolean> {
  if (!navigator.clipboard) return false;

  try {
    await navigator.clipboard.writeText(teksti);
    return true;
  } catch {
    return false;
  }
}
