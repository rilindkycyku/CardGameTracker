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
 * E njëjta pikë ku panelat e ekranit të lojës dalin dy për rresht.
 *
 * Nën të rri telefoni në portret, ku pesë kolona nuk hyjnë pa rrëshqitur — dhe
 * renditja është pikërisht ajo që lexohet pas çdo raundi (pika 3), prandaj një
 * rrëshqitje anash aty do të kushtonte më shumë se kursimi i lartësisë. Mbi të
 * rrinë tableta, telefoni i kthyer anash dhe kompjuteri.
 */
export const PYETJA_E_GJERE = '(min-width: 48rem)';

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
