/**
 * Provat e kopjes rezervë.
 *
 * Kthimi i një kopjeje e zëvendëson tërë bazën. Nëse leximi pranon një skedar
 * gjysmak, veprimi që duhej të shpëtonte historikun e fshin atë — prandaj këtu
 * provohet më shumë refuzimi sesa pranimi.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ndertoKopjen,
  lexoKopjen,
  emriISkedarit,
  permbledhja,
  FORMATI,
} from '../src/kopja.ts';

const GRUPI = { id: 1, name: 'Brigj', playerNames: ['alfa', 'beta', 'delta'] };
const LOJA = {
  id: 1,
  groupId: 1,
  date: '2026-03-08',
  selectedPlayers: ['alfa', 'beta'],
  createdAt: 1700000000000,
};
const RAUNDI = {
  id: 1,
  gameId: 1,
  roundNumber: 1,
  scores: { alfa: -20, beta: 100 },
};

const teksti = (o) => JSON.stringify(o);
const kopjaEPlote = () => ndertoKopjen([GRUPI], [LOJA], [RAUNDI]);

test('kopja e nxjerrë lexohet pa humbje', () => {
  const dala = lexoKopjen(teksti(kopjaEPlote()));

  assert.equal(dala.ok, true);
  assert.deepEqual(dala.kopja.groups, [GRUPI]);
  assert.deepEqual(dala.kopja.games, [LOJA]);
  assert.deepEqual(dala.kopja.rounds, [RAUNDI]);
});

test('lloji i lojës mbijeton kthimin', () => {
  const magarec = { ...LOJA, id: 2, lloji: 'magarec' };
  const dala = lexoKopjen(teksti(ndertoKopjen([GRUPI], [LOJA, magarec], [RAUNDI])));

  assert.equal(dala.ok, true);
  // Loja e vjetër del ashtu si hyri — pa fushë, e jo me një `undefined` të
  // shtuar rrugës — dhe ajo e re e mban llojin e vet.
  assert.deepEqual(dala.kopja.games, [LOJA, magarec]);
});

test('mbyllja e mbrëmjes mbijeton kthimin, edhe rihapja', () => {
  const mbyllur = { ...LOJA, id: 2, mbyllur: true };
  // `false` nuk është mungesë: do të thotë «e rihapur me dorë», dhe po të
  // hidhej si e tillë, rregulli do ta mbyllte sërish menjëherë pas kthimit.
  const rihapur = { ...LOJA, id: 3, mbyllur: false };
  const dala = lexoKopjen(
    teksti(ndertoKopjen([GRUPI], [LOJA, mbyllur, rihapur], [RAUNDI])),
  );

  assert.equal(dala.ok, true);
  assert.deepEqual(dala.kopja.games, [LOJA, mbyllur, rihapur]);
});

test('lloji i panjohur refuzohet, jo lexohet si bridzh', () => {
  // Do të vinte nga një version më i ri. I vizatuar si bridzh, shkronjat ose
  // pikët e tij do të dilnin pikë bridzhi pa e thënë kush — dhe te një lojë ku
  // fiton totali më i madh, edhe fituesi do të dilte i gabuar.
  const i_huaj = { ...LOJA, lloji: 'remi' };
  const dala = lexoKopjen(teksti(ndertoKopjen([GRUPI], [i_huaj], [])));

  assert.equal(dala.ok, false);
  assert.match(dala.gabimi, /lloji/i);
});

test('kopja mban formatin, versionin dhe kohën e nxjerrjes', () => {
  const kopja = ndertoKopjen([], [], [], new Date('2026-03-08T21:15:00Z'));

  assert.equal(kopja.format, FORMATI);
  assert.equal(kopja.version, 1);
  assert.equal(kopja.exportedAt, '2026-03-08T21:15:00.000Z');
});

test('pikët `null` mbijetojnë kthimin', () => {
  const meNull = ndertoKopjen(
    [GRUPI],
    [LOJA],
    [{ ...RAUNDI, scores: { alfa: null, beta: 100 } }],
  );
  const dala = lexoKopjen(teksti(meNull));

  assert.equal(dala.ok, true);
  assert.equal(dala.kopja.rounds[0].scores.alfa, null);
});

test('teksti që nuk është JSON refuzohet', () => {
  const dala = lexoKopjen('kjo s\'është JSON');

  assert.equal(dala.ok, false);
  assert.match(dala.gabimi, /JSON/);
});

test('skedari i një aplikacioni tjetër refuzohet', () => {
  const dala = lexoKopjen(teksti({ format: 'diçka-tjetër', version: 1 }));

  assert.equal(dala.ok, false);
  assert.match(dala.gabimi, /nuk është kopje/);
});

test('versioni i panjohur refuzohet, jo lexohet gabim', () => {
  const dala = lexoKopjen(teksti({ ...kopjaEPlote(), version: 99 }));

  assert.equal(dala.ok, false);
  assert.match(dala.gabimi, /Versioni/);
});

test('lista që mungon refuzohet', () => {
  const pa = { ...kopjaEPlote() };
  delete pa.rounds;

  const dala = lexoKopjen(teksti(pa));

  assert.equal(dala.ok, false);
  assert.match(dala.gabimi, /listave/);
});

test('një lojë pa grupin e vet refuzohet', () => {
  // Do të mbetej e padukshme: asnjë ekran nuk e nxjerr një lojë pa grup.
  const dala = lexoKopjen(
    teksti(ndertoKopjen([GRUPI], [{ ...LOJA, groupId: 77 }], [])),
  );

  assert.equal(dala.ok, false);
  assert.match(dala.gabimi, /grup që s'gjendet/);
});

test('një raund pa lojën e vet refuzohet', () => {
  const dala = lexoKopjen(
    teksti(ndertoKopjen([GRUPI], [LOJA], [{ ...RAUNDI, gameId: 77 }])),
  );

  assert.equal(dala.ok, false);
  assert.match(dala.gabimi, /lojë që s'gjendet/);
});

test('pikët jo-numerike refuzohen', () => {
  const dala = lexoKopjen(
    teksti(
      ndertoKopjen([GRUPI], [LOJA], [{ ...RAUNDI, scores: { alfa: 'njëzet' } }]),
    ),
  );

  assert.equal(dala.ok, false);
  assert.match(dala.gabimi, /jo-numerike/);
});

test('grupi i dëmtuar refuzohet', () => {
  const dala = lexoKopjen(
    teksti({ ...kopjaEPlote(), groups: [{ id: 1, name: 'Brigj' }] }),
  );

  assert.equal(dala.ok, false);
  assert.match(dala.gabimi, /grup/);
});

test('kopja e zbrazët është e vlefshme', () => {
  // Një bazë pa asgjë është gjendje e ligjshme, jo skedar i dëmtuar.
  const dala = lexoKopjen(teksti(ndertoKopjen([], [], [])));

  assert.equal(dala.ok, true);
  assert.deepEqual(dala.kopja.groups, []);
});

test('emri i skedarit mban datën me dy shifra', () => {
  assert.equal(emriISkedarit(new Date(2026, 2, 8)), 'tavolina-2026-03-08.json');
});

test('përmbledhja e numëron shumësin shqip', () => {
  assert.equal(permbledhja(ndertoKopjen([GRUPI], [LOJA], [RAUNDI])), '1 grup · 1 lojë · 1 raund');
  assert.equal(
    permbledhja(ndertoKopjen([GRUPI, GRUPI], [LOJA, LOJA], [])),
    '2 grupe · 2 lojëra · 0 raunde',
  );
});

test('kopja i pranon të katër llojet e lojërave', () => {
  // Një kopje e nxjerrë nga një telefon ku luhet edhe domina duhet të kthehet e
  // tëra; refuzimi i një loje do të thoshte humbje e tërë historikut.
  for (const lloji of ['bridzh', 'magarec', 'domina', 'pishpirik']) {
    const loja = { ...LOJA, lloji };
    const dala = lexoKopjen(teksti(ndertoKopjen([GRUPI], [loja], [])));

    assert.equal(dala.ok, true, lloji);
    assert.equal(dala.kopja.games[0].lloji, lloji, lloji);
  }
});
