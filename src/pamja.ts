/**
 * Sa gjerë është ekrani — pyetja e vetme që CSS-i nuk e përgjigj dot vetë.
 *
 * Njeh `window`-in dhe `matchMedia`-n, prandaj rri jashtë listës së pikës 1,
 * krah `ndricimi.ts`. Ndryshimi nga ai është se atje gjerësia nuk hyn fare te
 * JS-i: temën e vë një atribut, dhe tokenat i lexon CSS-i.
 *
 * Këtu nuk mjafton CSS-i. Renditja dhe parashikimi bashkohen te një tabelë e
 * vetme sapo ekrani ka gjerësi (shih `Parashikimi.tsx`), dhe ajo nuk është
 * pamje tjetër e së njëjtës tabelë — është një tabelë me kolona të tjera e me
 * krye tjetër. CSS-i ose do ta vizatonte dy herë te pema — pra të njëjtët numra
 * dy herë te lexuesi i ekranit — ose do t'i fshihte kolonat, që nuk e heq dot
 * tabelën e dytë.
 *
 * `useSyncExternalStore` e mban vlerën të njëjtë mes vizatimeve: një `useState`
 * me `resize` do të vizatonte dy herë te hapja dhe do ta humbte ndryshimin që
 * vjen para se efekti të bjerë.
 */

import { useSyncExternalStore } from 'react';

/**
 * Gjerësia nga e cila pesë kolonat e tabelës së bashkuar hyjnë pa rrëshqitur.
 *
 * Ishte 48rem — pika ku hapet faqja — sepse atëherë ajo tabelë kërkonte 477
 * piksela dhe telefoni jep 356. Tani tabelat e ekranit të lojës shtrëngohen nën
 * 62rem, dhe nën 48rem edhe një hap më tej (`style.css`), pra e njëjta tabelë
 * kërkon 349: hyn te telefoni, dhe atje kursen 361 piksela lartësi, sepse
 * renditja dhe parashikimi ishin e njëjta listë lojtarësh e shkruar dy herë.
 *
 * 24rem (384px) është pragu i matur: me ajrin e faqes mbeten 352 piksela, pra
 * tabela hyn me pak vend për të tepërt. Nën të — telefonat e vjetër e të
 * vegjël, 375px e poshtë — ajo do të rrëshqiste anash pikërisht te tabela që
 * lexohet pas çdo raundi (pika 3), prandaj atje mbeten dy seksione si më parë.
 *
 * Numri varet nga ai shtrëngim, dhe prova `bashkimi qëndron mbi shtrëngimin e
 * tabelave` i lidh të dy: nëse shtrëngimi hiqet, ky prag duhet të ngjitet
 * sërish.
 */
export const PYETJA_E_GJERE = '(min-width: 24rem)';

function lista(): MediaQueryList | null {
  return window.matchMedia?.(PYETJA_E_GJERE) ?? null;
}

function abonohu(ndryshoi: () => void): () => void {
  const l = lista();
  if (!l) return () => {};
  l.addEventListener('change', ndryshoi);
  return () => l.removeEventListener('change', ndryshoi);
}

function lexo(): boolean {
  return lista()?.matches ?? false;
}

/**
 * A ka ekrani gjerësi sa për tabela të bashkuara.
 *
 * Vlera e serverit është `false` — pa `window` lexohet ngushtë, sepse ajo është
 * pamja që punon kudo.
 */
export function useEkranIGjere(): boolean {
  return useSyncExternalStore(abonohu, lexo, () => false);
}
