import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  FORMATI,
  VERSIONI,
  RAUNDE_ME_TE_SHUMTA,
  lexoMbremjen,
  permbledhja,
  teRinjte,
} from '../src/sjellja.ts';

/** Një mbrëmje e mirë, si e nxjerr bridzh-online. */
function mbremje(shtesa = {}) {
  return JSON.stringify({
    formati: FORMATI,
    versioni: VERSIONI,
    lloji: 'bridzh',
    date: '2026-09-18',
    selectedPlayers: ['alfa', 'beta', 'gama'],
    raundet: [
      { alfa: -20, beta: 100, gama: 35 },
      { alfa: 45, beta: -40, gama: 200 },
    ],
    ...shtesa,
  });
}

test('një mbrëmje e mirë lexohet e tëra', () => {
  const e = lexoMbremjen(mbremje());

  assert.equal(e.ok, true);
  assert.equal(e.mbremja.lloji, 'bridzh');
  assert.equal(e.mbremja.date, '2026-09-18');
  assert.deepEqual(e.mbremja.selectedPlayers, ['alfa', 'beta', 'gama']);
  assert.equal(e.mbremja.raundet.length, 2);
  assert.equal(e.mbremja.raundet[0].alfa, -20);
});

test('pikët negative mbeten negative', () => {
  // −40-a e hantit është numri që e bën bridzhin bridzh; një lexim që i heq
  // shenjën do ta bënte mbyllësin të humbte.
  const e = lexoMbremjen(mbremje());
  assert.equal(e.mbremja.raundet[1].beta, -40);
});

test('çka nuk është JSON refuzohet me fjalë', () => {
  const e = lexoMbremjen('{jo json');
  assert.equal(e.ok, false);
  assert.match(e.gabimi, /lexohet/);
});

test('një formati tjetër nuk lexohet si ky', () => {
  // Kopja rezervë e Tavolinës është skedar tjetër, dhe nuk guxon të hyjë këtej:
  // ajo e zëvendëson bazën, kjo shton një mbrëmje.
  const kopja = JSON.stringify({ formati: 'cardgametracker', versioni: 1 });
  assert.equal(lexoMbremjen(kopja).ok, false);
});

test('një version i panjohur refuzohet, dhe thotë cili ishte', () => {
  const e = lexoMbremjen(mbremje({ versioni: 99 }));
  assert.equal(e.ok, false);
  assert.match(e.gabimi, /99/);
});

test('një lloj tjetër loje nuk lexohet bridzh', () => {
  for (const lloji of ['magarec', 'domina', 'pishpirik', 'diçka', undefined]) {
    assert.equal(lexoMbremjen(mbremje({ lloji })).ok, false, String(lloji));
  }
});

test('datat e pamundura refuzohen', () => {
  for (const date of ['2026-02-31', '2026-13-01', '18-09-2026', '2026-9-8', '', null]) {
    assert.equal(lexoMbremjen(mbremje({ date })).ok, false, String(date));
  }
  assert.equal(lexoMbremjen(mbremje({ date: '2024-02-29' })).ok, true);
});

test('lista e lojtarëve kontrollohet', () => {
  assert.equal(lexoMbremjen(mbremje({ selectedPlayers: [] })).ok, false);
  assert.equal(lexoMbremjen(mbremje({ selectedPlayers: ['alfa', 7] })).ok, false);
  assert.equal(lexoMbremjen(mbremje({ selectedPlayers: ['alfa', '  '] })).ok, false);
  assert.equal(lexoMbremjen(mbremje({ selectedPlayers: 'alfa' })).ok, false);
});

test('dy lojtarë me të njëjtin emër refuzohen', () => {
  const e = lexoMbremjen(mbremje({
    selectedPlayers: ['alfa', 'alfa'],
    raundet: [{ alfa: 10 }],
  }));
  assert.equal(e.ok, false);
  assert.match(e.gabimi, /njëjtin emër/);
});

test('një mbrëmje pa raunde nuk shtohet', () => {
  assert.equal(lexoMbremjen(mbremje({ raundet: [] })).ok, false);
  assert.equal(lexoMbremjen(mbremje({ raundet: 'jo' })).ok, false);
});

test('një raund me lojtar që nuk është te mbrëmja refuzohet', () => {
  // Përndryshe do të shkruhej një kolonë që nuk ekziston, dhe totali i tij nuk
  // do të dilte askund.
  const e = lexoMbremjen(mbremje({ raundet: [{ alfa: 10, delta: 20 }] }));
  assert.equal(e.ok, false);
  assert.match(e.gabimi, /nuk është te mbrëmja/);
});

test('një pikë që nuk është numër e rrëzon mbrëmjen e tërë', () => {
  for (const vlera of ['10', null, {}, Infinity, NaN]) {
    const e = lexoMbremjen(mbremje({ raundet: [{ alfa: vlera }] }));
    assert.equal(e.ok, false, String(vlera));
  }
});

test('një raund i zbrazët refuzohet', () => {
  assert.equal(lexoMbremjen(mbremje({ raundet: [{}] })).ok, false);
});

test('qeliza që mungon është e ligjshme — kush u ul vonë nuk ka shënuar', () => {
  const e = lexoMbremjen(mbremje({ raundet: [{ alfa: 10, beta: 20 }] }));
  assert.equal(e.ok, true);
  assert.equal('gama' in e.mbremja.raundet[0], false);
});

test('shumë raunde se një mbrëmje e vërtetë refuzohen', () => {
  const shume = Array.from({ length: RAUNDE_ME_TE_SHUMTA + 1 }, () => ({ alfa: 1 }));
  assert.equal(lexoMbremjen(mbremje({ raundet: shume })).ok, false);
});

test('përmbledhja e thotë çka po shtohet', () => {
  const e = lexoMbremjen(mbremje());
  assert.equal(permbledhja(e.mbremja), '2 raunde, 3 lojtarë, 2026-09-18');
});

test('lojtarët e panjohur tregohen, por nuk e ndalin sjelljen', () => {
  const e = lexoMbremjen(mbremje());
  assert.deepEqual(teRinjte(e.mbremja, ['alfa', 'beta']), ['gama']);
  assert.deepEqual(teRinjte(e.mbremja, ['alfa', 'beta', 'gama']), []);
});
