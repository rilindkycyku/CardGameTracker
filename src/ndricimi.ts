/**
 * Tema e zgjedhur, e vënë te faqja — dhe e mbajtur mend për herën tjetër.
 *
 * Njeh `document`-in, `localStorage`-in dhe `matchMedia`-n, prandaj rri jashtë
 * listës së moduleve që provohen me `node --test` (pika 1); vendimet — cilat
 * tema ka, si lexohet ajo e ruajtur, cila ngjyrë i takon secilës — rrinë te
 * `tema.ts`.
 *
 * Atributi te rrënja mban temën **e zbatuar** e jo atë të zgjedhur: CSS-i nuk
 * ka pse ta dijë se kush e zgjodhi terrin, telefoni apo njeriu. Kështu blloku i
 * tokenave të territ rri i shkruar një herë te `:root[data-tema='terr']`, dhe
 * «sistemi» zgjidhet këtu, ku ngjarja e ndërrimit lexohet gjithsesi.
 */

import { useEffect, useState } from 'react';

import {
  CELESI_I_TEMES,
  NGJYRAT_E_SHIRITIT,
  TEMA_E_PARAZGJEDHUR,
  lexoTemen,
  temaEZbatuar,
  type Tema,
} from './tema.ts';

const PYETJA_E_TERRIT = '(prefers-color-scheme: dark)';

/**
 * Tema e zgjedhur rri te moduli e jo te një komponent, sepse vihet te faqja
 * para se të vizatohet gjë (`main.tsx`) — shumë para se çelësi te fundfaqja të
 * ekzistojë.
 */
let zgjedhur: Tema = TEMA_E_PARAZGJEDHUR;

/** Çelësat në ekran që duan ta dinë kur ndërron. */
const degjuesit = new Set<(tema: Tema) => void>();

function sistemiNeTerr(): boolean {
  return window.matchMedia?.(PYETJA_E_TERRIT).matches ?? false;
}

/**
 * Shiriti i shfletuesit: një meta e vetme, pa `media`.
 *
 * Te `index.html` rri ajo e parazgjedhjes, që shiriti të jetë i saktë edhe para
 * se JS-i të ngarkohet; këtu vetëm i ndërrohet ngjyra. Metat me `media` do të
 * pyesnin sistemin, dhe një temë e zgjedhur me dorë do t'i linte pas — prandaj
 * po qe se ndonjë mbetet nga një version i vjetër i ruajtur te koshi, hiqet.
 */
function ngjyrosShiritin(ngjyra: string): void {
  for (const e_vjeter of document.querySelectorAll('meta[name="theme-color"][media]')) {
    e_vjeter.remove();
  }

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.append(meta);
  }

  meta.setAttribute('content', ngjyra);
}

function zbato(): void {
  const zbatuar = temaEZbatuar(zgjedhur, sistemiNeTerr());

  document.documentElement.dataset.tema = zbatuar;
  ngjyrosShiritin(NGJYRAT_E_SHIRITIT[zbatuar]);
}

/**
 * Lexon temën e ruajtur dhe e vë te faqja. Thirret një herë, te `main.tsx`,
 * para vizatimit të parë.
 *
 * Derisa vlen «sistemi», ndërrimi i temës së telefonit ndiqet drejtpërdrejt —
 * kush e ka telefonin te ndërrimi automatik mbrëmjeve e sheh faqen të ndërrojë
 * bashkë me të, pa e rihapur.
 */
export function nisTemen(): void {
  let ruajtur: string | null = null;
  try {
    ruajtur = window.localStorage.getItem(CELESI_I_TEMES);
  } catch {
    // Ruajtja e ndaluar (dritare private) do të thotë vetëm parazgjedhja.
  }

  zgjedhur = lexoTemen(ruajtur);
  zbato();

  window.matchMedia?.(PYETJA_E_TERRIT).addEventListener('change', () => {
    if (zgjedhur === 'sistemi') zbato();
  });
}

/** Zgjedhja e re: vihet te faqja, ruhet, dhe u thuhet çelësave në ekran. */
export function vendosTemen(tema: Tema): void {
  zgjedhur = tema;
  zbato();

  try {
    window.localStorage.setItem(CELESI_I_TEMES, tema);
  } catch {
    // E njëjta dritare private: tema vlen për këtë skedë e nuk mbahet mend.
  }

  for (const degjuesi of degjuesit) degjuesi(tema);
}

/** Tema e zgjedhur — për çelësin që e tregon cila rri e shtypur. */
export function useTema(): Tema {
  const [tema, cakto] = useState(zgjedhur);

  useEffect(() => {
    // Si te `useVersionIRi`: gjendja rimerret edhe këtu, sepse mes vizatimit të
    // parë dhe këtij efekti mund të ketë ndërruar.
    cakto(zgjedhur);
    degjuesit.add(cakto);

    return () => {
      degjuesit.delete(cakto);
    };
  }, []);

  return tema;
}
