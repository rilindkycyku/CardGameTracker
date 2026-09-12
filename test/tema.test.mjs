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
  TEMA_E_PARAZGJEDHUR,
  lexoTemen,
  temaEZbatuar,
} from '../src/tema.ts';

test('hapja e parë është drita, me kërkesë të pronarit', () => {
  /*
   * Parazgjedhja e ndiqte telefonin, dhe tani e ndjek tavolinën. Kjo prekje e
   * lexon pikërisht atë vendim: nëse dikush e kthen te «sistemi» pa e pyetur,
   * bie këtu e nuk mbetet për t'u vënë re te një telefon i huaj.
   */
  assert.equal(TEMA_E_PARAZGJEDHUR, 'drite');
  assert.equal(lexoTemen(null), 'drite');
});

test('tema e ruajtur lexohet, dhe çdo tjetër lexohet parazgjedhja', () => {
  for (const { tema } of TEMAT) {
    assert.equal(lexoTemen(tema), tema);
  }

  // «sistemi» rri te lista, pra kush e zgjedh e merr sërish telefonin: ajo që
  // ndryshoi është vetëm se nuk vjen më vetvetiu.
  assert.equal(lexoTemen('sistemi'), 'sistemi');

  // Mungesa është hapja e parë; pjesa tjetër janë vlera që s'i shkruan ky kod —
  // një version i vjetër, ose dikush që e preku çelësin me dorë.
  for (const e_panjohur of ['', 'drit', 'DRITE', 'dark', '{"tema":"terr"}']) {
    assert.equal(
      lexoTemen(e_panjohur),
      TEMA_E_PARAZGJEDHUR,
      `«${e_panjohur}» nuk u lexua parazgjedhja`,
    );
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
  assert.ok(
    TEMAT.some(({ tema }) => tema === TEMA_E_PARAZGJEDHUR),
    'parazgjedhja duhet të dalë te çelësi, përndryshe nuk kthehesh dot te ajo',
  );

  const emrat = new Set(TEMAT.map(({ emri }) => emri));
  const ikonat = new Set(TEMAT.map(({ ikona }) => ikona));
  assert.equal(emrat.size, 3);
  assert.equal(ikonat.size, 3);

  const ikonat_e_shkruara = readFileSync(new URL('../src/ikonat.tsx', import.meta.url), 'utf8');
  for (const ikona of ikonat) {
    assert.match(ikonat_e_shkruara, new RegExp(`\\n\\s{2}${ikona}:`), `mungon ikona «${ikona}»`);
  }
});

test('ngjyra e shiritit është ajo e index.html-it', () => {
  /*
   * Meta e `index.html`-it mban parazgjedhjen, pra atë që del para se JS-i të
   * ngarkohet; `ndricimi.ts` e ndërron pastaj. Nëse ndërron njëra anë, shiriti
   * i aplikacionit të instaluar del me një ngjyrë që faqja nuk e ka askund —
   * dhe kjo nuk duket te asnjë ekran zhvillimi.
   */
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

  const metat = html.match(/<meta name="theme-color"[^>]*>/g) ?? [];
  assert.equal(metat.length, 1, 'një meta e vetme, dhe pa `media`');
  assert.ok(!metat[0].includes('media'), 'me `media` shiriti do të ndiqte telefonin');
  assert.match(metat[0], new RegExp(`content="${NGJYRAT_E_SHIRITIT[TEMA_E_PARAZGJEDHUR]}"`));

  // E njëjta gjë për skemën: parazgjedhja, jo «light dark».
  assert.match(html, /<meta name="color-scheme" content="light" \/>/);
});

test('ngjyra e territ është sfondi i tij te CSS-i', () => {
  // Shiriti dhe faqja bashkohen te qoshja e sipërme e ekranit: dy ngjyra aty
  // duken si dy faqe të ngjitura.
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
  const terri = css.slice(css.indexOf(":root[data-tema='terr']"));

  assert.match(terri.slice(0, 400), new RegExp(`--sfond: ${NGJYRAT_E_SHIRITIT.terr};`));
});

test('sistemi pyetet te një vend i vetëm', () => {
  /*
   * Terri vjen nga atributi e jo nga një pyetje e dytë drejt sistemit: dy
   * burime do të thoshin dy kopje tokenash (shih `ndricimi.ts`). Dhe tani që
   * parazgjedhja nuk është më ajo e telefonit, një `prefers-color-scheme` i
   * mbetur te CSS-i do ta kthente atë prapa për një çast te çdo hapje.
   */
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');

  assert.match(css, /:root\[data-tema='terr'\] \{/);
  // Vetëm rregullat, jo përmendjet te komentet: prandaj kreu i rreshtit.
  assert.equal(css.match(/^@media \(prefers-color-scheme/gm), null);
});

test('çelësi i ruajtjes nuk përplaset me atë të sinjalit', () => {
  // I njëjti `localStorage`, dy përdorues: sinjali i lidhjes dhe tema.
  const lidhja = readFileSync(new URL('../src/lidhja.ts', import.meta.url), 'utf8');

  assert.ok(CELESI_I_TEMES.length > 0);
  assert.ok(!lidhja.includes(`'${CELESI_I_TEMES}'`));
});
