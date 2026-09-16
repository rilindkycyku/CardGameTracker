/**
 * Provat e orës së mbrëmjes.
 *
 * Ajo që matet këtu nuk është formatimi, është heshtja: kur numri nuk dihet ose
 * nuk qëndron, ekrani nuk guxon të shkruajë një orë të shpikur. Një fletë e
 * kthyer nga një kopje e vjetër, një mbrëmje e rihapur pas një jave dhe një
 * pajisje me orën prapa e nxjerrin të gjitha atë rast.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  KUFIRI_I_BESUESHEM,
  fjaliaEKohes,
  fundiIRaundeve,
  kohezgjatjaEMbremjes,
  ora,
  shkruajKohezgjatjen,
} from '../src/koha.ts';

/** Një vulë e ndërtuar me orën e vetë makinës, që prova të mos varet nga zona. */
const vula = (ore, minuta) => new Date(2026, 8, 15, ore, minuta, 0, 0).getTime();

const MINUTA = 60_000;

test('ora lexohet me orën e pajisjes dhe me dy shifra', () => {
  assert.equal(ora(vula(20, 45)), '20:45');
  assert.equal(ora(vula(9, 5)), '09:05');
  assert.equal(ora(vula(0, 0)), '00:00');
});

test('ora e një vule që mungon nuk shpikket', () => {
  // `createdAt` del zero te çdo lojë e kthyer nga një kopje pa atë fushë, dhe
  // «01:00» aty do të ishte orë që nuk e pa kush.
  assert.equal(ora(0), null);
  assert.equal(ora(undefined), null);
  assert.equal(ora(-5), null);
  assert.equal(ora(Number.NaN), null);
});

test('fundi i mbrëmjes është raundi i fundit i shënuar, jo i fundit i listës', () => {
  // Raundi 2 u redaktua sot, por `shkruarMe` mbetet ora kur u shënua vërtet —
  // prandaj fundi është raundi 3, edhe kur lista vjen e rirenditur.
  const raundet = [
    { roundNumber: 3, shkruarMe: vula(23, 55) },
    { roundNumber: 1, shkruarMe: vula(20, 50) },
    { roundNumber: 2, shkruarMe: vula(21, 30) },
  ];
  assert.equal(fundiIRaundeve(raundet), vula(23, 55));
});

test('raundet pa vulë e lënë fundin të panjohur', () => {
  assert.equal(fundiIRaundeve([]), null);
  assert.equal(fundiIRaundeve([{ roundNumber: 1 }, { roundNumber: 2 }]), null);
  // Një mbrëmje përgjysmë e vjetër: vetëm raundet e reja e mbajnë vulën.
  assert.equal(
    fundiIRaundeve([{ roundNumber: 1 }, { roundNumber: 2, shkruarMe: vula(22, 0) }]),
    vula(22, 0),
  );
});

test('mbrëmja që vazhdon matet deri tani, ajo e kryer deri te raundi i fundit', () => {
  const nisi = vula(20, 45);
  const fundi = vula(23, 55);
  const tani = vula(21, 45);

  assert.equal(kohezgjatjaEMbremjes(nisi, fundi, tani, false), 60);
  assert.equal(kohezgjatjaEMbremjes(nisi, fundi, tani, true), 190);
});

test('mbrëmja e kryer pa fund të njohur nuk nxjerr numër', () => {
  // Pa këtë, një fletë e vjetër do të «zgjaste» sa nga hapja e saj deri tani.
  assert.equal(kohezgjatjaEMbremjes(vula(20, 45), null, vula(23, 0), true), null);
  // Kurse ajo që vazhdon matet ende, sepse hapja dihet.
  assert.equal(kohezgjatjaEMbremjes(vula(20, 45), null, vula(21, 0), false), 15);
});

test('hapja që mungon e hesht numrin', () => {
  assert.equal(kohezgjatjaEMbremjes(0, vula(23, 0), vula(23, 0), true), null);
  assert.equal(kohezgjatjaEMbremjes(undefined, null, vula(23, 0), false), null);
});

test('ora e pajisjes e shkuar prapa nuk nxjerr kohëzgjatje negative', () => {
  assert.equal(kohezgjatjaEMbremjes(vula(21, 0), null, vula(20, 0), false), null);
});

test('mbi kufirin e besueshëm numri nuk shkruhet fare', () => {
  const nisi = vula(20, 0);
  const brenda = nisi + KUFIRI_I_BESUESHEM * MINUTA;
  const jashte = brenda + MINUTA;

  assert.equal(kohezgjatjaEMbremjes(nisi, brenda, brenda, true), KUFIRI_I_BESUESHEM);
  // Fleta e lënë hapur deri nesër, dhe ajo e rihapur pas një jave: të dyja.
  assert.equal(kohezgjatjaEMbremjes(nisi, jashte, jashte, true), null);
});

test('kohëzgjatja shkruhet si e thotë njeriu', () => {
  assert.equal(shkruajKohezgjatjen(0), 'sapo nisi');
  assert.equal(shkruajKohezgjatjen(45), '45 min');
  assert.equal(shkruajKohezgjatjen(60), '1 orë');
  assert.equal(shkruajKohezgjatjen(135), '2 orë e 15 min');
  assert.equal(shkruajKohezgjatjen(180), '3 orë');
});

test('fjalia e kohës thotë vetëm atë që dihet', () => {
  const nisi = vula(20, 45);
  const fundi = vula(23, 55);

  assert.equal(
    fjaliaEKohes(nisi, fundi, vula(22, 0), false),
    'nisi 20:45 · 1 orë e 15 min',
  );
  assert.equal(
    fjaliaEKohes(nisi, fundi, vula(23, 55), true),
    '20:45–23:55 · 3 orë e 10 min',
  );
  // Mbrëmje e kryer pa vulat e raundeve: mbetet ora e hapjes, e asgjë tjetër.
  assert.equal(fjaliaEKohes(nisi, null, vula(23, 55), true), 'nisi 20:45');
  // Pa hapje nuk ka çka të shkruhet.
  assert.equal(fjaliaEKohes(0, fundi, vula(23, 55), true), null);
});
