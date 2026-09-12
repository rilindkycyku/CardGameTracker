/**
 * Fundi i mbrëmjes — dhe dallimi mes «nuk shënohet më» e «nuk preket më».
 *
 * Dy pyetje që duken një, dhe ngatërrimi i tyre është gabimi i lehtë këtu:
 *
 * - **Mbaroi sipas rregullit.** Fjala e mbushur te magareci, dy raundet për
 *   lojtar te bridzhi (pika 13). Kjo e mbyll futjen e raundit: një raund i
 *   shënuar pas fundit do ta bënte fletën të gënjejë.
 * - **Përfundoi.** Mbrëmja është e kryer dhe nuk preket më — as raund i ri, as
 *   redaktim, as fshirje. Rregulli e vendos vetë, por vendimi i shkruar te
 *   `loja.mbyllur` e mbivendos në të dyja anët: `true` e mbyll një mbrëmje që u
 *   ndërpre herët, `false` e rihap një që rregulli e mbaroi — sepse një raund i
 *   shënuar gabim duhet të rregullohet edhe atëherë.
 *
 * Rri te një modul i vetin sepse e pyesin dy ekrane — loja dhe historiku i
 * grupit — dhe një kopje e dytë e këtij rregulli do të dilte jashtë sinkronie
 * pikërisht atje ku fleta thotë «përfundoi» e ekrani tjetër jo. Nuk njeh as
 * bazën, as React-in: lojë brenda, po a jo jashtë.
 */

import { llojiILojes, raundetELojes } from './llogaritjet.ts';
import { magareci } from './magareci.ts';
import type { Loja, Raundi } from './tipet.ts';

/**
 * A e ka mbaruar rregulli mbrëmjen, pa pyetur askënd.
 *
 * Bridzhi mbaron pas dy raundeve për lojtar; magareci kur dikujt i mbushet
 * fjala, e jo pas një numri raundesh — atij kufiri nuk i vihet dot (pika 13).
 * Një lojë pa asnjë lojtar nuk ka mbaruar: ajo as nuk ka nisur.
 */
export function mbaroiSipasRregullit(loja: Loja, raundet: Raundi[]): boolean {
  const players = loja.selectedPlayers;

  if (llojiILojes(loja) === 'magarec') {
    return magareci(players, raundet) !== null;
  }

  return players.length > 0 && raundet.length >= raundetELojes(players);
}

/**
 * A është e kryer mbrëmja — rregulli, ose vendimi i shkruar mbi të.
 *
 * `??` e jo `||`: `false` te `mbyllur` do të thotë «e rihapur me dorë» dhe duhet
 * ta mbysë rregullin, kurse mungesa do të thotë «vendos rregulli».
 */
export function perfundoiMbremja(loja: Loja, raundet: Raundi[]): boolean {
  return loja.mbyllur ?? mbaroiSipasRregullit(loja, raundet);
}
