/**
 * Fundi i mbrëmjes — dhe dallimi mes «nuk shënohet më» e «nuk preket më».
 *
 * Dy pyetje që duken një, dhe ngatërrimi i tyre është gabimi i lehtë këtu:
 *
 * - **Mbaroi sipas rregullit.** Fjala e mbushur te magareci, dy raundet për
 *   lojtar te bridzhi, njëqind pikët te domina, njëqind e një te pishpiriku
 *   (pika 13). Kjo e mbyll futjen e raundit: një raund i shënuar pas fundit do
 *   ta bënte fletën të gënjejë.
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

import { llojiILojes, raundetELojes, totalet } from './llogaritjet.ts';
import { arritiKufirin, rregullat } from './lojerat.ts';
import type { Loja, Raundi } from './tipet.ts';

/**
 * Deri te sa pikë luhet kjo mbrëmje — vendi i vetëm ku zgjidhet.
 *
 * Kufiri ka dy burime, dhe radha mes tyre nuk ndryshon: mbrëmja e ka të vetin
 * nëse u zgjodh një kur nisi, përndryshe vlen parazgjedhja e lojës. `0` do të
 * thotë «pa kufi», dhe kthehet `null` — pra e njëjta gjë si te një lojë që
 * kufi nuk ka fare, dhe e njëjta rrugë poshtë.
 *
 * Lexohet me `??` e jo me `||`, si `mbyllur`: zeroja është zgjedhje e jo
 * mungesë, dhe një `||` do ta lexonte si «nuk u zgjodh» — pra do ta mbyllte
 * mbrëmjen që u nis pikërisht për të mos u mbyllur vetvetiu.
 */
export function kufiriILojes(loja: {
  lloji?: Loja['lloji'];
  kufiri?: number;
}): number | null {
  const i_zgjedhuri = loja.kufiri;
  if (i_zgjedhuri === undefined) {
    return rregullat(llojiILojes(loja)).kufiriITotalit;
  }

  return i_zgjedhuri > 0 ? i_zgjedhuri : null;
}

/**
 * A e ka mbaruar rregulli mbrëmjen, pa pyetur askënd.
 *
 * Fundi vjen nga dy anë, dhe secila lojë e ka vetëm njërën:
 *
 * - **Nga raundet.** Bridzhi mbaron pasi tavolina rrotullohet dy herë, pra dy
 *   raunde për lojtar. Ky është i vetmi që numërohet me raunde.
 * - **Nga totali.** Shtatë shkronjat e magarecit, pikët e dominës dhe ato të
 *   pishpirikut janë i njëjti rregull parë nga numri: sapo dikush e arrin
 *   kufirin, mbrëmja mbaron. Ajo që ndryshon është kuptimi — te dy të parat ai
 *   e humbi mbrëmjen, te e treta e fitoi — dhe atë e thotë ekrani, jo ky
 *   funksion.
 *
 *   Te dy lojërat e fundit vetë kufiri është marrëveshje tavoline e jo rregull
 *   loje, prandaj mbrëmja e mban të vetin dhe `kufiriILojes` e zgjedh. Një
 *   mbrëmje e nisur «pa kufi» nuk mbaron kurrë vetvetiu: atë e mbyll dora.
 *
 * Një lojë pa asnjë lojtar nuk ka mbaruar: ajo as nuk ka nisur.
 */
export function mbaroiSipasRregullit(loja: Loja, raundet: Raundi[]): boolean {
  const players = loja.selectedPlayers;
  if (players.length === 0) return false;

  const lloji = llojiILojes(loja);
  const rregulli = rregullat(lloji);

  if (rregulli.raundePerLojtar !== null) {
    return raundet.length >= raundetELojes(players);
  }

  return arritiKufirin(kufiriILojes(loja), totalet(players, raundet));
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
