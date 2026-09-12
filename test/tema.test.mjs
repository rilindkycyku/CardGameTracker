/**
 * Provat e ndriçimit.
 *
 * Tema është e vetmja gjë e pamjes që e zgjedh përdoruesi, dhe një gabim aty
 * nuk bie: faqja hapet, thjesht hapet e gabuar. Dy rreziqe ka, dhe të dyat
 * maten këtu — një vlerë e ruajtur që nuk lexohet dot më e lë ekranin te
 * parazgjedhja pa e thënë, dhe ngjyrat e shiritit të shfletuesit, që rrinë
 * shkruar te tri skedarë, dalin jashtë sinkronie sapo preket njëri.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  CELESI_I_TEMES,
  NGJYRAT_E_SHIRITIT,
  TEMAT,
  lexoTemen,
  temaEZbatuar,
} from '../src/tema.ts';

test('tema e ruajtur lexohet, dhe çdo tjetër lexohet «sistemi»', () => {
  for (const { tema } of TEMAT) {
    assert.equal(lexoTemen(tema), tema);
  }

  // Mungesa është hapja e parë; pjesa tjetër janë vlera që s'i shkruan ky kod —
  // një version i vjetër, ose dikush që e preku çelësin me dorë.
  for (const e_panjohur of [null, '', 'drit', 'DRITE', 'dark', '{"tema":"terr"}']) {
    assert.equal(lexoTemen(e_panjohur), 'sistemi', `«${e_panjohur}» nuk u lexua sistemi`);
  }
});

test('«sistemi» e ndjek telefonin, dy të tjerat jo', () => {
  assert.equal(temaEZbatuar('sistemi', true), 'terr');
  assert.equal(temaEZbatuar('sistemi', false), 'drite');

  // Kjo është e tërë pika e zgjedhjes: kush e zgjodhi dritën e ka dritën edhe
  // kur telefoni rri në terr, dhe anasjelltas.
  assert.equal(temaEZbatuar('drite', true), 'drite');
  assert.equal(temaEZbatuar('terr', false), 'terr');
});

test('çdo temë del te çelësi, me emrin dhe ikonën e vet', () => {
  assert.equal(TEMAT.length, 3);
  assert.equal(TEMAT[0].tema, 'sistemi', 'sistemi rri i pari: aty kthehesh');

  const emrat = new Set(TEMAT.map(({ emri }) => emri));
  const ikonat = new Set(TEMAT.map(({ ikona }) => ikona));
  assert.equal(emrat.size, 3);
  assert.equal(ikonat.size, 3);

  const ikonat_e_shkruara = readFileSync(new URL('../src/ikonat.tsx', import.meta.url), 'utf8');
  for (const ikona of ikonat) {
    assert.match(ikonat_e_shkruara, new RegExp(`\\n\\s{2}${ikona}:`), `mungon ikona «${ikona}»`);
  }
});

test('ngjyrat e shiritit janë ato të index.html-it', () => {
  /*
   * Metat e `index.html`-it e pyesin sistemin, prandaj `ndricimi.ts` i
   * zëvendëson me një të vetme sapo tema zgjidhet me dorë. Nëse ndërron njëra
   * anë, shiriti i aplikacionit të instaluar del me një ngjyrë që faqja nuk e
   * ka askund — dhe kjo nuk duket te asnjë ekran zhvillimi.
   */
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

  const ngjyra = (skema) => {
    const gjetur = html.match(
      new RegExp(`theme-color"\\s+content="(#[0-9a-f]{6})"\\s+media="\\(prefers-color-scheme: ${skema}\\)"`),
    );
    assert.ok(gjetur, `mungon meta e temës për «${skema}»`);
    return gjetur[1];
  };

  assert.equal(NGJYRAT_E_SHIRITIT.drite, ngjyra('light'));
  assert.equal(NGJYRAT_E_SHIRITIT.terr, ngjyra('dark'));
});

test('sfondi i territ shkruhet një herë te CSS-i', () => {
  /*
   * Blloku i territ dhe rreshti që mbulon çastin para JS-it e duan të njëjtën
   * ngjyrë. I shkruar dy herë, ndërrimi i njërit do ta linte hapjen e faqes me
   * një sfond që s'i takon asnjë teme — dhe vetëm për një çast, pra i padukshëm
   * te çdo provë që shikon ekranin e mbaruar.
   */
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');

  assert.match(css, /--sfond-i-territ: (#[0-9a-f]{6});/);
  assert.equal(css.match(/--sfond-i-territ: #[0-9a-f]{6};/g).length, 1);
  assert.equal(css.match(/var\(--sfond-i-territ\)/g).length, 2);

  // Terri vjen nga atributi, e jo nga një pyetje e dytë drejt sistemit: dy
  // burime do të thoshte dy kopje tokenash (shih `ndricimi.ts`).
  assert.match(css, /:root\[data-tema='terr'\] \{/);
  // Vetëm rregulli, jo përmendjet te komentet: prandaj kreu i rreshtit.
  assert.equal(css.match(/^@media \(prefers-color-scheme: dark\)/gm).length, 1);
});

test('çelësi i ruajtjes nuk përplaset me atë të sinjalit', () => {
  // I njëjti `localStorage`, dy përdorues: sinjali i lidhjes dhe tema.
  const lidhja = readFileSync(new URL('../src/lidhja.ts', import.meta.url), 'utf8');

  assert.ok(CELESI_I_TEMES.length > 0);
  assert.ok(!lidhja.includes(`'${CELESI_I_TEMES}'`));
});
