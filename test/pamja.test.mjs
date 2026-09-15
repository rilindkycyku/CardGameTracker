/**
 * Prova e pikës ku tabelat bashkohen.
 *
 * `pamja.ts` njeh `matchMedia`-n, prandaj vetë leximi provohet me shfletues.
 * Ajo që provohet këtu është pyetja: ajo duhet të jetë e njëjta pikë ku faqja
 * hapet dhe panelat dalin dy për rresht. Nëse dikush e ndërron njërën pa
 * tjetrën, tabela e bashkuar del te një gjerësi për të cilën faqja nuk është
 * hapur ende — pesë kolona brenda 47rem, pra emra të prerë ose një rrëshqitje
 * anash pikërisht te tabela që lexohet pas çdo raundi.
 */

import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

import { PYETJA_E_GJERE } from '../src/pamja.ts';

const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');

test('pyetja e ekranit të gjerë është një pikë e vërtetë e CSS-it', () => {
  assert.match(PYETJA_E_GJERE, /^\(min-width: \d+(\.\d+)?rem\)$/);
  assert.ok(
    css.includes(`@media ${PYETJA_E_GJERE}`),
    `${PYETJA_E_GJERE} nuk gjendet te style.css`,
  );
});

test('tabela bashkohet vetëm pasi faqja të jetë hapur', () => {
  /*
   * `.faqja--gjere` e ngre faqen nga 47rem sapo ekrani kalon një pikë. Tabela e
   * bashkuar duhet të presë atë pikë e jo të vijë para saj, sepse gjerësinë e
   * pesë kolonave e jep faqja e jo ekrani.
   */
  const pikat = [...css.matchAll(/@media \(min-width: (\d+(?:\.\d+)?)rem\)/g)]
    .map((p) => Number(p[1]));
  const kur = Number(PYETJA_E_GJERE.match(/(\d+(?:\.\d+)?)rem/)[1]);

  assert.ok(pikat.length > 0);
  assert.equal(kur, Math.min(...pikat), 'bashkimi nis te pika e parë e faqes');
});

test('pamja.ts nuk njeh as bazën, as React-in', () => {
  /*
   * Njeh `window`-in, prandaj rri jashtë listës së pikës 1 — por atje ku rri,
   * rri i vetëm: një hook që lexon bazën ose vizaton do ta fuste gjerësinë e
   * ekranit te vende ku ajo nuk ka çka të kërkojë.
   */
  const burimi = readFileSync(new URL('../src/pamja.ts', import.meta.url), 'utf8');
  const importet = [...burimi.matchAll(/^import .* from '(.+)';$/gm)].map((m) => m[1]);

  assert.deepEqual(importet, ['react']);
  assert.ok(!burimi.includes('idb'));
  assert.ok(!burimi.includes('document'));
});
