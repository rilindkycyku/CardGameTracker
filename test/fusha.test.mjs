/**
 * Provat e fushës së pikëve dhe të shenjës së saj.
 *
 * Kjo pjesë u shkrua sepse gaboi. Filtri i parë e kërkonte minusin vetëm në
 * krye të tekstit, dhe kur shenja shtypej para shifrave — fusha bosh, kursori
 * para „−" — shifrat dilnin „4−" dhe minusi bihej poshtë pa u vënë re. Në
 * ekran nuk dukej asgjë: thjesht ruhej +40 aty ku duhej −40.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  emratERinj,
  ndajEmrat,
  negative,
  ndrroShenjen,
  numri,
  pastro,
  pastroDaten,
} from '../src/fusha.ts';

test('shenja ndërrohet në të dy drejtimet', () => {
  assert.equal(ndrroShenjen('20'), '-20');
  assert.equal(ndrroShenjen('-20'), '20');
});

test('shenja mbi fushë bosh e përgatit atë për negativ', () => {
  // Pa këtë, shifrat e shtypura pas saj do të dilnin pozitive.
  assert.equal(ndrroShenjen(''), '-');
  assert.equal(ndrroShenjen(undefined), '-');
  assert.equal(ndrroShenjen('-'), '');
});

test('minusi njihet kudo qoftë, jo vetëm në krye', () => {
  // Kursori bie para „−" kur shenja shtypet e para: teksti del „4-".
  assert.equal(pastro('4-'), '-4');
  assert.equal(pastro('-4'), '-4');
  assert.equal(pastro('4-0'), '-40');
});

test('vetëm shifrat mbeten', () => {
  assert.equal(pastro('1a2b,3'), '123');
  assert.equal(pastro('1.5'), '15');
  assert.equal(pastro(' 20 '), '20');
  assert.equal(pastro(''), '');
});

test('një minus i vetëm mbetet gjendje e ndërmjetme, jo numër', () => {
  // Fusha tregon „−" derisa të vijnë shifrat; deri atëherë s’është e shënuar.
  assert.equal(pastro('-'), '-');
  assert.equal(numri('-'), null);
  assert.equal(negative('-'), true);
});

test('fusha e pashënuar dallohet nga zeroja', () => {
  assert.equal(numri(''), null);
  assert.equal(numri('   '), null);
  assert.equal(numri(undefined), null);
  assert.equal(numri('0'), 0);
});

test('numri lexohet me shenjë', () => {
  assert.equal(numri('-20'), -20);
  assert.equal(numri('100'), 100);
});

test('negative e lexon shenjën e fushës', () => {
  assert.equal(negative('-20'), true);
  assert.equal(negative('20'), false);
  assert.equal(negative(''), false);
  assert.equal(negative(undefined), false);
});

test('rrugëtimi i plotë: shifra, pastaj shenjë, jep pikët e mbylljes', () => {
  // Ashtu si te telefoni: shtypet 20, pastaj butoni i shenjës.
  let fusha = '';
  for (const shkronja of '20') fusha = pastro(fusha + shkronja);
  fusha = ndrroShenjen(fusha);

  assert.equal(fusha, '-20');
  assert.equal(numri(fusha), -20);
});

test('rrugëtimi i kundërt: shenjë e pastaj shifra, edhe me kursor para minusit', () => {
  let fusha = ndrroShenjen('');
  assert.equal(fusha, '-');

  // Shifra e parë bie para „−", sepse aty e lë kursorin butoni i shenjës.
  fusha = pastro('4' + fusha);
  assert.equal(fusha, '-4');

  // Pas saj kursori rri në fund, dhe shifrat shkojnë normalisht pas tij.
  fusha = pastro(fusha + '0');
  assert.equal(numri(fusha), -40);
});

/* ── Data ───────────────────────────────────────────────────────────────── */

test('vijat e datës dalin vetë sa shkruhen shifrat', () => {
  assert.equal(pastroDaten('1'), '1');
  assert.equal(pastroDaten('11'), '11');
  assert.equal(pastroDaten('110'), '11/0');
  assert.equal(pastroDaten('1109'), '11/09');
  assert.equal(pastroDaten('11092025'), '11/09/2025');
});

test('fshirja mbrapsht nuk ngec te vija', () => {
  // Teksti vjen pa shifrën e fundit; pa këtë, vija do të rikthehej menjëherë
  // dhe fusha nuk do të zbrazej kurrë.
  assert.equal(pastroDaten('11/'), '11');
  assert.equal(pastroDaten('11/09/'), '11/09');
  assert.equal(pastroDaten(''), '');
});

test('data nuk pranon as shkronja, as shifrën e nëntë', () => {
  assert.equal(pastroDaten('11a09b2025'), '11/09/2025');
  assert.equal(pastroDaten('110920259'), '11/09/2025');
});

/* ── Emrat e lojtarëve ──────────────────────────────────────────────────── */

test('emrat ndahen me presje, pikëpresje dhe rreshta të rinj', () => {
  assert.deepEqual(ndajEmrat('alfa, beta, gama, delta'), ['alfa', 'beta', 'gama', 'delta']);
  assert.deepEqual(ndajEmrat('alfa;beta'), ['alfa', 'beta']);
  assert.deepEqual(ndajEmrat('alfa\nbeta\r\ngama'), ['alfa', 'beta', 'gama']);
});

test('hapësira nuk është ndarës — emrat me dy fjalë mbeten një', () => {
  // Te fleta e vjetër ka skuadra si „alfa + zeta"; ndarja te hapësira do t'i
  // bënte tre lojtarë.
  assert.deepEqual(ndajEmrat('alfa + zeta, epsilon + delta'), ['alfa + zeta', 'epsilon + delta']);
});

test('hapësirat e tepërta shtypen, të zbrazëtat bien', () => {
  assert.deepEqual(ndajEmrat('  alfa  ,, beta  ,  '), ['alfa', 'beta']);
  assert.deepEqual(ndajEmrat('alfa    gama'), ['alfa gama']);
  assert.deepEqual(ndajEmrat(''), []);
  assert.deepEqual(ndajEmrat('   '), []);
});

test('i njëjti emër dy herë futet një herë', () => {
  assert.deepEqual(ndajEmrat('alfa, beta, alfa'), ['alfa', 'beta']);
});

test('emrat që i ka tashmë lista kapërcehen pa gabim', () => {
  // Ngjitja e tërë shoqërisë për të shtuar një emër duhet të shtojë atë të vetmin.
  assert.deepEqual(
    emratERinj('alfa, beta, gama, delta', ['alfa', 'beta', 'gama']),
    ['delta'],
  );
  assert.deepEqual(emratERinj('alfa', ['alfa']), []);
});

test('shkronjat e mëdha dallohen — «Beta» s’është «beta»', () => {
  // Te `logic.json` bashkëjetojnë „Lambda" e „alfa"; bashkimi i tyre do të
  // shkrinte dy lojtarë të ndryshëm në një.
  assert.deepEqual(emratERinj('Beta', ['beta']), ['Beta']);
});
