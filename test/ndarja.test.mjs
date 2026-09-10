/**
 * Provat e ndarjes së rezultatit.
 *
 * Gjendja shkon nga një telefon te tjetri brenda vetë adresës, prandaj ajo
 * adresë është e vetmja gjë që mban rezultatin gjatë rrugës. Nëse paketimi
 * këput një emër me presje ose e humb një total, kush skanon shikon numra të
 * gabuar dhe nuk ka nga t'i kontrollojë.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  paketo,
  shpaketo,
  pamjaELojes,
  adresaEPamjes,
  tekstiINdarjes,
  VERSIONI,
} from '../src/ndarja.ts';

const PAMJA = {
  grupi: 'Brigj',
  data: '2026-03-08',
  raunde: 7,
  totalet: [
    ['meri', 594],
    ['lesa', 380],
    ['lila', 237],
    ['rila', 91],
  ],
};

test('pamja mbijeton paketimin e kthimin', () => {
  assert.deepEqual(shpaketo(paketo(PAMJA)), PAMJA);
});

test('paketa është e sigurt për një adresë', () => {
  // Asgjë që do t’i duhej ikje brenda hash-it, dhe asgjë që e rrit kodin QR.
  assert.match(paketo(PAMJA), /^[A-Za-z0-9_-]+$/);
});

test('emrat me presje, dy pika e shenja mbijetojnë', () => {
  // Te fleta e vjetër ka skuadra si „meri + mil"; një ndarës brenda emrit do
  // ta këpusë paketën në vendin e gabuar.
  const pamja = {
    ...PAMJA,
    totalet: [
      ['meri + mil', 120],
      ['a,b', -20],
      ['c:d', 0],
      ['ë ü ç', 33],
      ['e|f', 5],
    ],
  };

  assert.deepEqual(shpaketo(paketo(pamja)), pamja);
});

test('totalet negative dhe zeroja kalojnë ashtu si janë', () => {
  const pamja = { ...PAMJA, totalet: [['a', -205], ['b', 0], ['c', 1000]] };
  assert.deepEqual(shpaketo(paketo(pamja)).totalet, pamja.totalet);
});

test('dy lojtarë me të njëjtin total mbajnë radhën', () => {
  const pamja = { ...PAMJA, totalet: [['a', 0], ['b', 0]] };
  assert.deepEqual(shpaketo(paketo(pamja)).totalet, [['a', 0], ['b', 0]]);
});

test('teksti i gjymtë refuzohet, jo lexohet përgjysmë', () => {
  const plote = paketo(PAMJA);

  assert.equal(shpaketo(''), null);
  assert.equal(shpaketo('jo-base64!!'), null);
  assert.equal(shpaketo(plote.slice(0, 8)), null);
  assert.equal(shpaketo(plote.slice(4)), null);
});

test('versioni i panjohur refuzohet', () => {
  const i_huaj = paketo(PAMJA).replace(/^./, '');
  assert.equal(shpaketo(i_huaj), null);
  // Dhe versioni rri i shkruar te paketa, që kjo provë të ketë kuptim.
  assert.equal(VERSIONI, 1);
});

test('data e formës së gabuar refuzohet', () => {
  const gabim = { ...PAMJA, data: '8 mars 2026' };
  assert.equal(shpaketo(paketo(gabim)), null);
});

test('pamja pa asnjë lojtar refuzohet', () => {
  assert.equal(shpaketo(paketo({ ...PAMJA, totalet: [] })), null);
});

test('pamja e një loje merr totalet e lojtarëve të saj', () => {
  const loja = {
    id: 1,
    groupId: 1,
    date: '2026-03-08',
    selectedPlayers: ['meri', 'lesa'],
    createdAt: 0,
  };

  assert.deepEqual(pamjaELojes('Brigj', loja, { meri: 594, lesa: 380 }, 7), {
    grupi: 'Brigj',
    data: '2026-03-08',
    raunde: 7,
    totalet: [['meri', 594], ['lesa', 380]],
  });
});

test('adresa e pamjes nuk dyfishon pjerrësa', () => {
  for (const rrenja of [
    'https://bridzh.app',
    'https://bridzh.app/',
    'https://bridzh.app/#/loja/3',
    'https://bridzh.app/#',
  ]) {
    const adresa = adresaEPamjes(rrenja, PAMJA);
    assert.match(adresa, /^https:\/\/bridzh\.app\/#\/shiko\/[A-Za-z0-9_-]+$/, rrenja);
  }
});

test('adresa e pamjes lexohet prapa', () => {
  const adresa = adresaEPamjes('https://bridzh.app', PAMJA);
  const kodi = adresa.slice(adresa.indexOf('/#/shiko/') + '/#/shiko/'.length);
  assert.deepEqual(shpaketo(kodi), PAMJA);
});

test('teksti i ndarjes i mban emrat dhe totalet', () => {
  const teksti = tekstiINdarjes(PAMJA, [
    { rank: 1, player: 'rila', total: 91 },
    { rank: 2, player: 'meri', total: 594 },
  ]);

  assert.match(teksti, /Brigj/);
  assert.match(teksti, /2026-03-08/);
  assert.match(teksti, /1\. rila 91/);
  assert.match(teksti, /2\. meri 594/);
});

test('paketa e një loje me gjashtë lojtarë mbetet e shkurtër', () => {
  // Nën dyqind bajt do të thotë kod QR nën versionin 10, që skanohet ende nga
  // ekrani i një telefoni. Raundet do ta shumëfishonin këtë.
  const gjashte = {
    grupi: 'Brigj',
    data: '2026-03-08',
    raunde: 11,
    totalet: [
      ['meri', 918], ['eri', 874], ['Arboni', 186],
      ['gjigji', 774], ['Miloti', 968], ['rila', 887],
    ],
  };

  assert.ok(paketo(gjashte).length < 200, `${paketo(gjashte).length} karaktere`);
  assert.deepEqual(shpaketo(paketo(gjashte)), gjashte);
});

test('adresa e prerë refuzohet, jo lexohet me numra të gabuar', () => {
  // Pa nënshkrim, prerja e katër karaktereve e kthente totalin e lojtarit të
  // fundit nga 105 në 0 — dhe atë lojtar në fitues. Kjo pamje shërben për t’u
  // shlyer mes vete: një numër i gabuar në heshtje është më i keq se një
  // lidhje që thotë hapur «nuk lexohem».
  const pamja = {
    grupi: 'Brigj',
    data: '2026-09-10',
    raunde: 2,
    totalet: [['meri', 42], ['Miloti', 200], ['rila', 105]],
  };
  const plote = paketo(pamja);

  assert.deepEqual(shpaketo(plote), pamja);
  for (const sa of [1, 2, 3, 4, 8, 12]) {
    assert.equal(shpaketo(plote.slice(0, -sa)), null, `−${sa} karaktere`);
  }
});

test('një total i ndryshuar me dorë refuzohet', () => {
  // Nënshkrimi nuk mbron nga dashakeqi — kushdo e rillogarit — por e kap
  // ndryshimin e rastit, atë që bëhet duke redaktuar adresën me gisht.
  const pamja = { grupi: 'A', data: '2026-01-01', raunde: 1, totalet: [['a', 10]] };
  const plote = paketo(pamja);

  let ndryshuar = null;
  for (let i = plote.length - 1; i >= 0; i--) {
    const shkronja = plote[i] === 'A' ? 'B' : 'A';
    const kandidati = plote.slice(0, i) + shkronja + plote.slice(i + 1);
    if (shpaketo(kandidati) !== null) {
      ndryshuar = kandidati;
      break;
    }
  }

  assert.equal(ndryshuar, null, 'asnjë karakter i ndërruar nuk duhet të kalojë');
});
