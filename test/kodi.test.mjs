/**
 * Provat e kodit të bashkimit.
 *
 * Kodi shkruhet me dorë dhe diktohet me zë, prandaj gabimi i vërtetë tek ky
 * modul nuk është matematika — është `O` e lexuar si zero, ose një vijë e futur
 * ku nuk pritej. Provat maten kundër atyre.
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  ALFABETI,
  GJATESIA,
  adresaEBashkimit,
  idIStrehuesit,
  kodiNgaBajtet,
  lexoKodin,
  shfaqKodin,
} from '../src/kodi.ts';

test('alfabeti nuk mban shkronja që ngatërrohen', () => {
  assert.equal(ALFABETI.length, 32);
  for (const shkronja of ['I', 'L', 'O', 'U']) {
    assert.ok(!ALFABETI.includes(shkronja), `${shkronja} nuk duhet të rrijë`);
  }
  // Pa dyfishime: një alfabet me dy të njëjta do ta ulte hapësirën në heshtje.
  assert.equal(new Set(ALFABETI).size, 32);
});

test('bajtet bëhen kod, dhe asnjë shkronjë nuk anon', () => {
  assert.equal(kodiNgaBajtet(new Uint8Array(8)), '00000000');
  assert.equal(kodiNgaBajtet(new Uint8Array([31, 31, 31, 31, 31, 31, 31, 31])), 'ZZZZZZZZ');

  // Një bajt jep pikërisht tetë vlera për secilën shkronjë (256 = 32 × 8).
  const sa = new Map();
  for (let bajt = 0; bajt < 256; bajt++) {
    const shkronja = kodiNgaBajtet(new Uint8Array(8).fill(bajt))[0];
    sa.set(shkronja, (sa.get(shkronja) ?? 0) + 1);
  }
  assert.equal(sa.size, 32);
  for (const [shkronja, numri] of sa) assert.equal(numri, 8, shkronja);
});

test('bajte të pamjaftueshme nuk jepin kod gjysmak', () => {
  for (let sa = 0; sa < GJATESIA; sa++) {
    assert.equal(kodiNgaBajtet(new Uint8Array(sa)), null, `${sa} bajte`);
  }
});

test('kodi tregohet me vijë në mes', () => {
  assert.equal(shfaqKodin('A3F27KQM'), 'A3F2-7KQM');
});

test('kodi lexohet ashtu si shkruhet me nxitim', () => {
  const pritur = 'A3F27KQM';

  for (const shkrimi of [
    'A3F27KQM',
    'A3F2-7KQM',
    'a3f2-7kqm',
    '  A3F2 7KQM  ',
    'a3f2 7kqm',
    'A3F2—7KQM',
  ]) {
    assert.equal(lexoKodin(shkrimi), pritur, JSON.stringify(shkrimi));
  }
});

test('shkronjat që ngatërrohen kthehen prapa', () => {
  // `O` lexohet zero, `I` dhe `L` lexohen njësh — ashtu si i shkruan dora.
  assert.equal(lexoKodin('OOOOIIII'), '00001111');
  assert.equal(lexoKodin('ooooLLLL'), '00001111');
  assert.equal(lexoKodin('0O1I1L0O'), '00111100');
});

test('kodi nxjerrohet edhe nga adresa e plotë', () => {
  assert.equal(
    lexoKodin('http://192.168.1.5:5173/#/bashkohu/A3F27KQM'),
    'A3F27KQM',
  );
  // Ngjitja nga një bisedë sjell edhe tekst përreth.
  assert.equal(
    lexoKodin('shiko: http://192.168.1.5:5173/#/bashkohu/a3f27kqm faleminderit'),
    'A3F27KQM',
  );
  // Pa këtë hap, shkronjat e «bashkohu» do të hynin te kodi.
  assert.notEqual(lexoKodin('http://x/#/bashkohu/A3F27KQM'), null);
});

test('çka nuk është kod nuk lexohet', () => {
  for (const teksti of [
    '',
    '   ',
    'A3F27KQ',        // shtatë
    'A3F27KQMM',       // nëntë
    'A3F27KQU',        // `U` nuk rri te alfabeti
    'jo kod fare',
    'http://192.168.1.5:5173/#/loja/3',
    '--------',
  ]) {
    assert.equal(lexoKodin(teksti), null, JSON.stringify(teksti));
  }
});

test('çdo kod i lëshuar lexohet prapa i njëjti', () => {
  // Rrotullimi mbahet për tërë alfabetin, edhe pas shfaqjes me vijë.
  for (let i = 0; i < 32; i++) {
    const kodi = kodiNgaBajtet(new Uint8Array(8).fill(i));
    assert.equal(lexoKodin(kodi), kodi, kodi);
    assert.equal(lexoKodin(shfaqKodin(kodi)), kodi, kodi);
  }
});

test('emri te serveri mban parathënjen e aplikacionit', () => {
  // Reja publike e PeerJS-it i mban emrat në një hapësirë të përbashkët.
  assert.equal(idIStrehuesit('A3F27KQM'), 'bridzh-A3F27KQM');
});

test('adresa e bashkimit e pret hash-in e vjetër', () => {
  assert.equal(
    adresaEBashkimit('http://192.168.1.5:5173/#/loja/3', 'A3F27KQM'),
    'http://192.168.1.5:5173/#/bashkohu/A3F27KQM',
  );
  assert.equal(
    adresaEBashkimit('https://bridzh.example/nen/faqe/', 'A3F27KQM'),
    'https://bridzh.example/nen/faqe/#/bashkohu/A3F27KQM',
  );
});
