/**
 * Provat e regjistrit të lojërave.
 *
 * Ky skedar mban atë që e ndan njërën lojë nga tjetra, dhe pikërisht prandaj një
 * gabim aty nuk duket si gabim: një shkronjë e përsëritur e lexon paketën e
 * dominës si bridzh, një drejtim i shkruar mbrapsht e shpall fitues atë që
 * mbeti i fundit. Të dyja dalin numra krejt të besueshëm në ekran.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  KUFIRI_I_DOMINES,
  KUFIRI_I_PISHPIRIKUT,
  LOJERAT,
  RADHA,
  arritiKufirin,
  llojiNgaShenja,
  rregullat,
} from '../src/lojerat.ts';
import { FJALA } from '../src/magareci.ts';

test('çdo lojë e regjistrit ka shkronjën e vet', () => {
  // Dy lojëra me të njëjtën shkronjë do të thoshte se një paketë e ndarë lexohet
  // si loja tjetër — me numra që duken të mirë dhe fitues të gabuar.
  const shenjat = RADHA.map((lloji) => LOJERAT[lloji].shenja);

  assert.equal(new Set(shenjat).size, shenjat.length);
  for (const shenja of shenjat) assert.equal(shenja.length, 1);
});

test('radha i mban të katërt, dhe secili e njeh veten', () => {
  assert.deepEqual(RADHA, ['bridzh', 'magarec', 'domina', 'pishpirik']);
  for (const lloji of RADHA) assert.equal(rregullat(lloji).lloji, lloji);
});

test('shkronja e paketës kthen llojin, dhe e panjohura kthen null', () => {
  assert.equal(llojiNgaShenja('b'), 'bridzh');
  assert.equal(llojiNgaShenja('m'), 'magarec');
  assert.equal(llojiNgaShenja('d'), 'domina');
  assert.equal(llojiNgaShenja('p'), 'pishpirik');

  // Një shkronjë e panjohur vjen nga një version më i ri. Leximi i saj si bridzh
  // do të tregonte pikët e një loje tjetër pa e thënë kush.
  assert.equal(llojiNgaShenja('x'), null);
  assert.equal(llojiNgaShenja(''), null);
});

test('vetëm bridzhi e numëron mbrëmjen me raunde', () => {
  // Gjatësia prej dy raundesh për lojtar është e bridzhit e vetëm; tri të tjerat
  // mbarojnë kur dikush e arrin kufirin e pikëve (pika 13).
  assert.equal(rregullat('bridzh').raundePerLojtar, 2);
  assert.equal(rregullat('magarec').raundePerLojtar, null);
  assert.equal(rregullat('domina').raundePerLojtar, null);
  assert.equal(rregullat('pishpirik').raundePerLojtar, null);
});

test('vetëm pishpiriku fitohet me totalin më të madh', () => {
  assert.equal(rregullat('pishpirik').drejtimi, 'larte');
  for (const lloji of ['bridzh', 'magarec', 'domina']) {
    assert.equal(rregullat(lloji).drejtimi, 'poshte');
  }
});

test('kufiri i magarecit është vetë fjala', () => {
  // Shtatë shkronjat janë i njëjti rregull parë nga ana e numrit, prandaj nuk
  // shkruhen dy herë: nëse fjala ndërrohet, kufiri e ndjek vetvetiu.
  assert.equal(rregullat('magarec').kufiriITotalit, FJALA.length);
});

test('kufiri arrihet nga totali, pavarësisht se kush e arrin', () => {
  assert.equal(arritiKufirin('domina', { alfa: 61, beta: 44 }), false);
  assert.equal(arritiKufirin('domina', { alfa: KUFIRI_I_DOMINES, beta: 44 }), true);
  assert.equal(arritiKufirin('domina', { alfa: 140, beta: 44 }), true);

  assert.equal(arritiKufirin('pishpirik', { alfa: 88, beta: 74 }), false);
  assert.equal(
    arritiKufirin('pishpirik', { alfa: KUFIRI_I_PISHPIRIKUT, beta: 74 }),
    true,
  );

  // Bridzhi nuk ka kufi totali fare: mbrëmja e tij mbaron me raundet.
  assert.equal(arritiKufirin('bridzh', { alfa: 900 }), false);
});

test('parashikimi premtohet vetëm atje ku kufijtë e një raundi dihen', () => {
  // Bridzhi dhe magareci veçojnë saktësisht një lojtar për raund, prandaj një
  // raund ka kufij të numërueshëm. Te domina e pishpiriku një dorë u jep pikë
  // disave njëherësh, dhe sa — atë nuk e thotë rregulli (pika 12).
  assert.equal(rregullat('bridzh').parashikimi, true);
  assert.equal(rregullat('magarec').parashikimi, true);
  assert.equal(rregullat('domina').parashikimi, false);
  assert.equal(rregullat('pishpirik').parashikimi, false);
});

test('shlyerja vlen atje ku diferenca paguhet', () => {
  // Te magareci diferenca është në shkronja, te pishpiriku është rrugë drejt
  // 101-shit. As njëra as tjetra nuk nxirret nga xhepi.
  assert.equal(rregullat('bridzh').shlyerja, true);
  assert.equal(rregullat('domina').shlyerja, true);
  assert.equal(rregullat('magarec').shlyerja, false);
  assert.equal(rregullat('pishpirik').shlyerja, false);
});

test('llogaritësi mbetet i bridzhit, sepse vetëm ai ka formulë', () => {
  assert.equal(rregullat('bridzh').llogaritesi, true);
  for (const lloji of ['magarec', 'domina', 'pishpirik']) {
    assert.equal(rregullat(lloji).llogaritesi, false);
  }
});
