/**
 * Prova e pikës ku renditja dhe parashikimi bashkohen te një tabelë.
 *
 * `pamja.ts` njeh `matchMedia`-n, prandaj vetë leximi provohet me shfletues.
 * Ajo që provohet këtu është pyetja, dhe kushti mbi të cilin ajo qëndron.
 *
 * Deri para pak ai kusht ishte hapja e faqes: tabela e bashkuar ka pesë kolona,
 * kërkonte 477 piksela, dhe telefoni jep 356 — pra bashkimi duhej të priste
 * 48rem-in, ku faqja hapet dhe panelat dalin dy për rresht. Tani tabelat e
 * ekranit të lojës shtrëngohen nën 62rem, dhe nën 48rem edhe një hap më tej,
 * pra e njëjta tabelë kërkon 349 dhe hyn edhe te telefoni — ku kursen 361
 * piksela lartësi, sepse renditja dhe parashikimi ishin e njëjta listë
 * lojtarësh e shkruar dy herë.
 *
 * Prandaj prova e dytë nuk pyet më «a ka hapur faqja?», por «mbi çka qëndron
 * ky prag?»: nëse bashkimi vjen para hapjes, shtrëngimi që e bën të mundur
 * duhet të jetë aty. Nëse dikush e heq atë rresht CSS-i, kjo bie — përndryshe
 * tabela që lexohet pas çdo raundi (pika 3) do të rrëshqiste anash në heshtje.
 */

import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

import { PYETJA_E_GJERE } from '../src/pamja.ts';

const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');

const pragu = Number(PYETJA_E_GJERE.match(/(\d+(?:\.\d+)?)rem/)[1]);

test('pyetja e ekranit të gjerë është pyetje mediash e vlefshme', () => {
  assert.match(PYETJA_E_GJERE, /^\(min-width: \d+(\.\d+)?rem\)$/);
});

test('bashkimi qëndron mbi shtrëngimin e tabelave', () => {
  if (pragu >= 48) {
    /*
     * Bashkimi pret hapjen e faqes, si më parë — dhe atëherë ai prag duhet të
     * jetë pikë e vërtetë e CSS-it, e jo numër i shpikur.
     */
    assert.ok(
      css.includes(`@media ${PYETJA_E_GJERE}`),
      `${PYETJA_E_GJERE} nuk gjendet te style.css`,
    );
    return;
  }

  /*
   * Bashkimi vjen para hapjes, pra qëndron mbi shtrëngimin e telefonit: ajri
   * anash i qelizave te 0.25rem, pikërisht ai që e ul tabelën nga 477 te 349.
   */
  const fillimi = css.indexOf('@media (width < 48rem)');
  assert.ok(fillimi > -1, 'mungon shtrëngimi i tabelave nën 48rem');

  const blloku = css.slice(fillimi, css.indexOf('\n}', fillimi));
  assert.match(blloku, /\.loja__pune \.tabela:not\(\.matrica\)/);
  assert.match(blloku, /padding-inline: 0\.25rem/);
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
