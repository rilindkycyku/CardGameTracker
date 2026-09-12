/**
 * Provat e emrave që i mbijetojnë pajisjes.
 *
 * `uid`-i është i vetmi emër me të cilin një regjistër njihet mes dy telefonave
 * (pika 19). Dy regjistra me të njëjtin do të shkriheshin në një; një `uid` i
 * ardhur nga jashtë dhe i papranuar do të bëhej çelës i një `objectStore`-i.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { PREFIKSAT, emriIMenduar, uidIRi, uidIVlefshem } from '../src/identiteti.ts';

test('çdo store ka parathënjen e vet, dhe asnjë nuk përsëritet', () => {
  const vlerat = Object.values(PREFIKSAT);
  assert.equal(new Set(vlerat).size, vlerat.length);
  assert.deepEqual(Object.keys(PREFIKSAT), ['groups', 'games', 'rounds']);
});

test('`uid`-et e reja nuk përsëriten', () => {
  const sa = 5000;
  const parë = new Set();
  for (let i = 0; i < sa; i++) parë.add(uidIRi(PREFIKSAT.rounds));
  assert.equal(parë.size, sa);
});

test('një `uid` i vetin lexohet, dhe çka vjen nga jashtë kontrollohet', () => {
  for (const prefiksi of Object.values(PREFIKSAT)) {
    assert.equal(uidIVlefshem(uidIRi(prefiksi)), true);
  }

  // Alfabet i ngushtë, si te çdo fushë e shpaketuar (pika 7): rreshtat vijnë nga
  // një bazë që e administron vetë përdoruesi.
  for (const i of ['', 'pa-parathenje', 'grup_', 'grup_abc', 'grup_a/b', 'grup_a b', null, 7, {}]) {
    assert.equal(uidIVlefshem(i), false, `u pranua ${String(i)}`);
  }
});

test('emri i parë i një pajisjeje del nga shfletuesi dhe sistemi', () => {
  // Radha ka rëndësi: çdo shfletues Chromium thotë edhe „Chrome", dhe Edge thotë
  // edhe „Chromium".
  const edge =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36 Edg/120';
  assert.equal(emriIMenduar(edge), 'Edge në Windows');

  const androidi =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36';
  assert.equal(emriIMenduar(androidi), 'Chrome në Android');

  const iphone =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile Safari/604.1';
  assert.equal(emriIMenduar(iphone), 'Safari në iPhone');
});

test('pa asgjë për të lexuar, pajisja prapë ka emër', () => {
  // Lista nuk tregon kurrë një rresht pa emër.
  assert.equal(emriIMenduar(''), 'Pajisje');
  assert.equal(emriIMenduar(undefined), 'Pajisje');
});
