/**
 * Provat e fundit të mbrëmjes.
 *
 * Dy pyetje që duken një — «nuk shënohet më» dhe «nuk preket më» — dhe pikërisht
 * atje ku ngatërrohen, fleta ose gënjen ose mbetet e ngrirë: një mbrëmje e
 * mbyllur gabimisht që nuk rihapet dot, ose një raund i tetë i shënuar mbi një
 * lojë të mbaruar.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { mbaroiSipasRregullit, perfundoiMbremja } from '../src/fundi.ts';
import { KUFIRI_I_DOMINES, KUFIRI_I_PISHPIRIKUT } from '../src/lojerat.ts';

/** Një lojë bridzhi me katër veta: tetë raunde, dy për lojtar. */
function bridzh(mbyllur) {
  const loja = {
    id: 1,
    groupId: 1,
    date: '2026-09-11',
    selectedPlayers: ['alfa', 'beta', 'gama', 'delta'],
    createdAt: 0,
  };
  if (mbyllur !== undefined) loja.mbyllur = mbyllur;
  return loja;
}

/** Raunde bridzhi pa asnjë kuptim përveç numrit të tyre. */
function raunde(sa) {
  return Array.from({ length: sa }, (_, i) => ({
    id: i + 1,
    gameId: 1,
    roundNumber: i + 1,
    scores: { alfa: 10, beta: 20, gama: 30, delta: -20 },
  }));
}

/** Një mbrëmje magareci ku `humbesit` i marrin shkronjat me radhë. */
function magarec(humbesit, mbyllur) {
  const players = ['alfa', 'beta', 'gama'];
  const loja = {
    id: 2,
    groupId: 1,
    date: '2026-09-11',
    selectedPlayers: players,
    createdAt: 0,
    lloji: 'magarec',
  };
  if (mbyllur !== undefined) loja.mbyllur = mbyllur;

  const rounds = humbesit.map((humbesi, i) => ({
    id: i + 1,
    gameId: 2,
    roundNumber: i + 1,
    scores: Object.fromEntries(players.map((p) => [p, p === humbesi ? 1 : 0])),
  }));

  return [loja, rounds];
}

test('bridzhi mbaron te dy raundet për lojtar, e jo para', () => {
  assert.equal(mbaroiSipasRregullit(bridzh(), raunde(7)), false);
  assert.equal(mbaroiSipasRregullit(bridzh(), raunde(8)), true);
});

test('një lojë pa lojtarë nuk ka mbaruar — ajo as nuk ka nisur', () => {
  const loja = { ...bridzh(), selectedPlayers: [] };
  assert.equal(mbaroiSipasRregullit(loja, []), false);
});

test('magareci mbaron kur mbushet fjala, jo pas një numri raundesh', () => {
  // Gjashtë shkronja te i njëjti lojtar: fjala ka shtatë, prandaj vazhdon.
  const [loja, gjashte] = magarec(Array(6).fill('alfa'));
  assert.equal(mbaroiSipasRregullit(loja, gjashte), false);

  const [i_shtati, shtate] = magarec(Array(7).fill('alfa'));
  assert.equal(mbaroiSipasRregullit(i_shtati, shtate), true);
});

test('kufiri i bridzhit nuk e mbyll një mbrëmje magareci', () => {
  // Tre lojtarë do të thoshin gjashtë raunde te bridzhi; te magareci asgjë.
  const [loja, rounds] = magarec(['alfa', 'beta', 'gama', 'alfa', 'beta', 'gama']);
  assert.equal(mbaroiSipasRregullit(loja, rounds), false);
});

test('mbyllja me dorë e mbyll një mbrëmje që rregulli nuk e mbaroi', () => {
  assert.equal(perfundoiMbremja(bridzh(), raunde(3)), false);
  assert.equal(perfundoiMbremja(bridzh(true), raunde(3)), true);
});

test('rihapja e mbyt rregullin, e jo vetëm mbylljen me dorë', () => {
  // `false` do të thotë «e rihapur me dorë», prandaj nuk lexohet si mungesë:
  // pa këtë dallim një lojë e mbaruar do të mbyllej sërish menjëherë, dhe
  // raundi i shënuar gabim nuk do të rregullohej dot kurrë.
  assert.equal(perfundoiMbremja(bridzh(), raunde(8)), true);
  assert.equal(perfundoiMbremja(bridzh(false), raunde(8)), false);
});

test('mbyllja nuk i prek raundet e shënuara', () => {
  // Rregulli mbetet ai që është edhe nën një mbyllje me dorë: mbyllja thotë
  // vetëm se fleta nuk preket më, jo se loja mbaroi sipas rregullit.
  assert.equal(mbaroiSipasRregullit(bridzh(true), raunde(3)), false);
  assert.equal(mbaroiSipasRregullit(bridzh(false), raunde(8)), true);
});

/* ── Lojërat që mbarojnë me pikë ─────────────────────────────────────────── */

/** Një mbrëmje me pikë të dhëna raund pas raundi, te lloji i kërkuar. */
function meKufi(lloji, raundet) {
  const players = ['alfa', 'beta', 'gama'];
  const loja = {
    id: 3,
    groupId: 1,
    date: '2026-09-11',
    selectedPlayers: players,
    createdAt: 0,
    lloji,
  };

  return [
    loja,
    raundet.map((scores, i) => ({
      id: i + 1,
      gameId: 3,
      roundNumber: i + 1,
      scores,
    })),
  ];
}

test('domina mbaron kur dikujt i mbushen pikët, e jo me raunde', () => {
  // Njëqind pikë dënimi: kush i mbush e humb mbrëmjen, dhe fiton totali më i
  // vogël — njësoj si te bridzhi, por fundi vjen nga numri e jo nga raundet.
  const nen = [
    { alfa: 40, beta: 12, gama: 0 },
    { alfa: 45, beta: 20, gama: 0 },
  ];
  const [loja, raundet] = meKufi('domina', nen);
  assert.equal(mbaroiSipasRregullit(loja, raundet), false);

  const [tjetra, plot] = meKufi('domina', [
    ...nen,
    { alfa: KUFIRI_I_DOMINES - 85, beta: 10, gama: 0 },
  ]);
  assert.equal(mbaroiSipasRregullit(tjetra, plot), true);
});

test('kufiri i bridzhit nuk e mbyll një mbrëmje domine', () => {
  // Tre lojtarë do të thoshin gjashtë raunde te bridzhi. Te domina gjashtë
  // raunde me pikë të vogla nuk e mbyllin asgjë — dhe kjo është e vërteta e
  // tavolinës: luhet derisa dikujt t'i mbushen pikët.
  const [loja, raundet] = meKufi(
    'domina',
    Array.from({ length: 6 }, () => ({ alfa: 5, beta: 4, gama: 0 })),
  );

  assert.equal(raundet.length, 6);
  assert.equal(mbaroiSipasRregullit(loja, raundet), false);
});

test('pishpiriku mbaron kur dikush arrin 101', () => {
  const [loja, nen] = meKufi('pishpirik', [
    { alfa: 45, beta: 30, gama: 25 },
    { alfa: 50, beta: 40, gama: 20 },
  ]);
  assert.equal(mbaroiSipasRregullit(loja, nen), false);

  const [tjetra, plot] = meKufi('pishpirik', [
    { alfa: 45, beta: 30, gama: 25 },
    { alfa: 50, beta: 40, gama: 20 },
    { alfa: KUFIRI_I_PISHPIRIKUT - 95, beta: 10, gama: 5 },
  ]);
  assert.equal(mbaroiSipasRregullit(tjetra, plot), true);
});

test('mbyllja e hershme dhe rihapja punojnë edhe te lojërat me kufi pikësh', () => {
  const [loja, raundet] = meKufi('domina', [{ alfa: 30, beta: 10, gama: 0 }]);

  assert.equal(perfundoiMbremja(loja, raundet), false);
  assert.equal(perfundoiMbremja({ ...loja, mbyllur: true }, raundet), true);

  const [mbaruar, plot] = meKufi('domina', [{ alfa: 120, beta: 10, gama: 0 }]);
  assert.equal(perfundoiMbremja(mbaruar, plot), true);
  assert.equal(perfundoiMbremja({ ...mbaruar, mbyllur: false }, plot), false);
});
