/**
 * Provat e llogaritjeve, të matura kundër `logic.json`-it.
 *
 * Ai skedar doli nga tabela origjinale e Google Sheets-it dhe çdo numër aty u
 * kontrollua kundër formulave të saj. Prandaj këtu nuk shpiken pritje të reja:
 * merren grupet ashtu si janë dhe kërkohet që kodi të nxjerrë të njëjtat
 * totale, të njëjtën renditje dhe të njëjtën matricë.
 *
 * Dy fusha të skedarit nuk përdoren, sepse dolën të cunguara nga nxjerrja e
 * automatizuar dhe jo nga tabela:
 *
 *   • `domina_1.standings` — ka vetëm një rresht nga tre lojtarë;
 *   • `brigj_4_merged_teams.settlement_matrix` — rreshti i dytë quhet `null`.
 *
 * Totalet e të dyve janë të plota dhe provohen normalisht.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  dataMeNumra,
  dataNgaNumrat,
  dataShqip,
  eshteIMbushur,
  lojeratESortuara,
  matricaEShlyerjes,
  permbledhja,
  perziersiIRaundit,
  pjesemarrjeEBarabarte,
  RAUNDE_PER_LOJTAR,
  raundetELojes,
  raundetELuajtura,
  raundiNeVijim,
  renditja,
  renditjaELojes,
  sipasRadhes,
  sot,
  tabelaEPergjithshme,
  totalet,
} from '../src/llogaritjet.ts';

const burimi = JSON.parse(
  readFileSync(new URL('./logic.json', import.meta.url), 'utf8'),
);

/** Raundet e `logic.json`-it në formën që pret kodi. */
function raundetE(grupi) {
  return grupi.rounds.map((r, i) => ({
    id: i + 1,
    gameId: 1,
    roundNumber: r.round,
    scores: r.scores ?? {},
  }));
}

/** Grupet me `standings` të plotë — pra pa nxjerrjen e cunguar të `domina_1`-it. */
const ME_RENDITJE_TE_PLOTE = burimi.groups.filter(
  (g) => g.standings.length === g.players.length,
);

test('totalet përputhen me tabelën origjinale për çdo grup', () => {
  for (const grupi of burimi.groups) {
    const dala = totalet(grupi.players, raundetE(grupi));
    assert.deepEqual(dala, grupi.totals, `totalet e ${grupi.id}`);
  }
});

test('renditja është ngjitshëm sipas totalit — më i vogli fiton', () => {
  for (const grupi of ME_RENDITJE_TE_PLOTE) {
    const dala = renditja(grupi.players, totalet(grupi.players, raundetE(grupi)));
    assert.deepEqual(dala, grupi.standings, `renditja e ${grupi.id}`);
  }
});

test('renditja e mban radhën e lojtarëve kur totalet janë të barabarta', () => {
  // `brigj_4` i ka të dy skuadrat me 0: vendi vjen nga radha, jo nga emri.
  const dala = renditja(['alfa + zeta', 'epsilon + delta'], {
    'alfa + zeta': 0,
    'epsilon + delta': 0,
  });
  assert.deepEqual(dala, [
    { rank: 1, player: 'alfa + zeta', total: 0 },
    { rank: 2, player: 'epsilon + delta', total: 0 },
  ]);
});

test('matrica e shlyerjes është diferenca e totaleve, me diagonale zero', () => {
  const meMatriceTePlote = burimi.groups.filter((g) =>
    g.players.every((p) => g.settlement_matrix[p]),
  );

  for (const grupi of meMatriceTePlote) {
    const dala = matricaEShlyerjes(
      grupi.players,
      totalet(grupi.players, raundetE(grupi)),
    );

    for (const i of grupi.players) {
      for (const j of grupi.players) {
        assert.equal(
          dala[i][j],
          grupi.settlement_matrix[i][j],
          `${grupi.id}: ${i} → ${j}`,
        );
      }
      assert.equal(dala[i][i], 0, `${grupi.id}: diagonalja e ${i}`);
    }
  }
});

test('matrica është antisimetrike', () => {
  const totals = { a: 594, b: 380, c: 91 };
  const m = matricaEShlyerjes(['a', 'b', 'c'], totals);

  for (const i of ['a', 'b', 'c']) {
    for (const j of ['a', 'b', 'c']) {
      // `+ 0` heq `-0`-in që del nga mohimi i diagonales; ±0 janë i njëjti numër.
      assert.equal(m[i][j] + 0, -m[j][i] + 0, `${i}/${j}`);
    }
  }
});

test('një qelizë e zbrazët nuk numërohet si zero e futur', () => {
  // `domina_1` e ka `kapa` me `null` në raundin e vetëm të shënuar.
  const grupi = burimi.groups.find((g) => g.id === 'domina_1');
  const dala = totalet(grupi.players, raundetE(grupi));

  assert.equal(dala.kapa, 0);
  assert.equal(dala.alfa, 21);
  assert.equal(dala.delta, 38);
});

test('eshteIMbushur dallon raundin e shënuar nga vendi i lirë', () => {
  const players = ['a', 'b'];
  const bosh = { id: 1, gameId: 1, roundNumber: 1, scores: {} };
  const vetemNull = { id: 2, gameId: 1, roundNumber: 2, scores: { a: null, b: null } };
  const njeri = { id: 3, gameId: 1, roundNumber: 3, scores: { a: -20, b: null } };

  assert.equal(eshteIMbushur(players, bosh), false);
  assert.equal(eshteIMbushur(players, vetemNull), false);
  assert.equal(eshteIMbushur(players, njeri), true);
});

test('raundi në vijim vjen pas më të lartit, jo pas numrit të raundeve', () => {
  assert.equal(raundiNeVijim([]), 1);
  assert.equal(
    raundiNeVijim([
      { id: 1, gameId: 1, roundNumber: 1, scores: {} },
      { id: 2, gameId: 1, roundNumber: 2, scores: {} },
    ]),
    3,
  );
  // Pasi fshihet raundi i mesit, numri i radhës mbetet pas atij të fundit.
  assert.equal(
    raundiNeVijim([
      { id: 1, gameId: 1, roundNumber: 1, scores: {} },
      { id: 3, gameId: 1, roundNumber: 7, scores: {} },
    ]),
    8,
  );
});

test('sipasRadhes nuk e ndryshon vargun e dhënë', () => {
  const raundet = [
    { id: 1, gameId: 1, roundNumber: 3, scores: {} },
    { id: 2, gameId: 1, roundNumber: 1, scores: {} },
  ];
  const dala = sipasRadhes(raundet);

  assert.deepEqual(dala.map((r) => r.roundNumber), [1, 3]);
  assert.deepEqual(raundet.map((r) => r.roundNumber), [3, 1]);
});

test('data shqip nuk rrëshqet një ditë prapa', () => {
  // `new Date('2026-01-08')` lexohet si UTC dhe në Kosovë do të jepte 7 janar.
  assert.equal(dataShqip('2026-01-08'), '8 janar 2026');
  assert.equal(dataShqip('2026-12-31'), '31 dhjetor 2026');
});

test('data del ditë/muaj/vit, jo muaj/ditë/vit', () => {
  // Kjo është vetë arsyeja pse fusha nuk është më `type="date"`: një telefon
  // me anglishten amerikane e vizatonte 11 shtatorin si „09/11".
  assert.equal(dataMeNumra('2025-09-11'), '11/09/2025');
  assert.equal(dataMeNumra('2026-01-08'), '08/01/2026');
  // Vlera që nuk lexohet kthehet ashtu si erdhi, e nuk shpiket.
  assert.equal(dataMeNumra('sot'), 'sot');
});

test('data e shkruar me dorë lexohet prapa te `YYYY-MM-DD`', () => {
  assert.equal(dataNgaNumrat('11/09/2025'), '2025-09-11');
  assert.equal(dataNgaNumrat('08/01/2026'), '2026-01-08');
  // Vijat nuk kërkohen — numërohen vetëm shifrat.
  assert.equal(dataNgaNumrat('11092025'), '2025-09-11');
});

test('data që nuk ekziston nuk kalon te muaji tjetër', () => {
  assert.equal(dataNgaNumrat('31/02/2025'), null);
  assert.equal(dataNgaNumrat('29/02/2025'), null);
  assert.equal(dataNgaNumrat('29/02/2024'), '2024-02-29');
  assert.equal(dataNgaNumrat('29/02/2100'), null);
  assert.equal(dataNgaNumrat('29/02/2000'), '2000-02-29');
  assert.equal(dataNgaNumrat('00/09/2025'), null);
  assert.equal(dataNgaNumrat('11/13/2025'), null);
});

test('data e papërfunduar nuk lexohet si datë', () => {
  assert.equal(dataNgaNumrat(''), null);
  assert.equal(dataNgaNumrat('11/09'), null);
  assert.equal(dataNgaNumrat('11/09/202'), null);
});

test('sot e shkruan datën lokale me dy shifra', () => {
  assert.equal(sot(new Date(2026, 0, 8, 2, 30)), '2026-01-08');
  assert.equal(sot(new Date(2026, 11, 31, 23, 59)), '2026-12-31');
});

test('lojërat renditen më e reja e para, ora ndan ato të së njëjtës ditë', () => {
  const lojerat = [
    { id: 1, groupId: 1, date: '2026-03-01', selectedPlayers: [], createdAt: 100 },
    { id: 2, groupId: 1, date: '2026-03-08', selectedPlayers: [], createdAt: 200 },
    { id: 3, groupId: 1, date: '2026-03-08', selectedPlayers: [], createdAt: 300 },
  ];

  assert.deepEqual(lojeratESortuara(lojerat).map((l) => l.id), [3, 2, 1]);
});

/* ── Pjesëmarrja e pabarabartë ──────────────────────────────────────────── */

/** Një lojë ku `delta` ulet te tavolina vetëm në raundin e tretë. */
const HYRI_VONE = {
  players: ['alfa', 'beta', 'delta'],
  rounds: [
    { id: 1, gameId: 1, roundNumber: 1, scores: { alfa: 100, beta: -20 } },
    { id: 2, gameId: 1, roundNumber: 2, scores: { alfa: -20, beta: 100 } },
    { id: 3, gameId: 1, roundNumber: 3, scores: { alfa: 50, beta: 40, delta: -20 } },
  ],
};

test('raundet e luajtura numërojnë vetëm ato me pikë të shënuara', () => {
  const sa = raundetELuajtura(HYRI_VONE.players, HYRI_VONE.rounds);

  assert.deepEqual(sa, { alfa: 3, beta: 3, delta: 1 });
});

test('pika zero numërohet si raund i luajtur', () => {
  // Zeroja është pikë e shënuar, jo qelizë e zbrazët.
  const sa = raundetELuajtura(
    ['a', 'b'],
    [{ id: 1, gameId: 1, roundNumber: 1, scores: { a: 0, b: null } }],
  );

  assert.deepEqual(sa, { a: 1, b: 0 });
});

test('pjesëmarrja e pabarabartë kapet', () => {
  assert.equal(pjesemarrjeEBarabarte(HYRI_VONE.players, HYRI_VONE.rounds), false);
});

test('pjesëmarrja e barabartë nuk jep alarm të rremë', () => {
  for (const grupi of burimi.groups) {
    const raundet = raundetE(grupi).filter((r) =>
      grupi.players.some((p) => typeof r.scores[p] === 'number'),
    );
    // `domina_1` e ka `kapa` me `null` — atje pabarazia është e vërtetë.
    if (grupi.id === 'domina_1') continue;

    assert.equal(
      pjesemarrjeEBarabarte(grupi.players, raundet),
      true,
      `pjesëmarrja e ${grupi.id}`,
    );
  }
});

test('totali nuk ndryshon nga hyrja e vonë — mbetet shuma e pikëve', () => {
  // Rregulli i `logic.json`-it nuk preket: konteksti shtohet krahas tij, jo në
  // vend të tij.
  const t = totalet(HYRI_VONE.players, HYRI_VONE.rounds);

  assert.deepEqual(t, { alfa: 130, beta: 120, delta: -20 });
  assert.equal(renditja(HYRI_VONE.players, t)[0].player, 'delta');
});


/* ── Tabela e përgjithshme e grupit ─────────────────────────────────────── */

/** Tri mbrëmje të një grupi, si blloqet e njëpasnjëshme te fleta e vjetër. */
const TRI_MBREMJE = [
  {
    selectedPlayers: ['beta', 'gama', 'delta'],
    raundet: [
      { id: 1, gameId: 1, roundNumber: 1, scores: { beta: -20, gama: 100, delta: 50 } },
    ],
  },
  {
    selectedPlayers: ['beta', 'gama', 'delta'],
    raundet: [
      { id: 2, gameId: 2, roundNumber: 1, scores: { beta: 100, gama: -20, delta: 60 } },
    ],
  },
  {
    selectedPlayers: ['beta', 'gama'],
    raundet: [
      { id: 3, gameId: 3, roundNumber: 1, scores: { beta: -20, gama: 40 } },
    ],
  },
];

test('tabela e përgjithshme mbledh lojërat, fitoret dhe mesataren', () => {
  const tabela = tabelaEPergjithshme(TRI_MBREMJE);

  assert.deepEqual(tabela, [
    { player: 'beta', lojera: 3, fitore: 2, totali: 60, mesatarja: 20 },
    { player: 'gama', lojera: 3, fitore: 1, totali: 120, mesatarja: 40 },
    { player: 'delta', lojera: 2, fitore: 0, totali: 110, mesatarja: 55 },
  ]);
});

test('radha është sipas fitoreve, pastaj sipas mesatares më të vogël', () => {
  const tabela = tabelaEPergjithshme([
    {
      selectedPlayers: ['a', 'b', 'c'],
      raundet: [{ id: 1, gameId: 1, roundNumber: 1, scores: { a: -20, b: 10, c: 90 } }],
    },
    {
      selectedPlayers: ['a', 'b', 'c'],
      raundet: [{ id: 2, gameId: 2, roundNumber: 1, scores: { a: 90, b: -20, c: 10 } }],
    },
  ]);

  // `a` dhe `b` kanë nga një fitore; `b` ka mesatare më të vogël, prandaj i pari.
  assert.deepEqual(tabela.map((r) => [r.player, r.fitore, r.mesatarja]), [
    ['b', 1, -5],
    ['a', 1, 35],
    ['c', 0, 50],
  ]);
});

test('një lojë pa asnjë pikë nuk i jep fitore askujt', () => {
  // Të gjitha totalet zero do ta bënin „fitues" të parin e listës pa u luajtur
  // asnjë letër.
  const tabela = tabelaEPergjithshme([
    { selectedPlayers: ['a', 'b'], raundet: [] },
    {
      selectedPlayers: ['a', 'b'],
      raundet: [{ id: 1, gameId: 1, roundNumber: 1, scores: { a: null, b: null } }],
    },
  ]);

  assert.deepEqual(tabela, []);
});

test('kush u shtua e nuk luajti nuk e merr atë lojë', () => {
  const tabela = tabelaEPergjithshme([
    {
      selectedPlayers: ['a', 'b', 'c'],
      raundet: [{ id: 1, gameId: 1, roundNumber: 1, scores: { a: -20, b: 30 } }],
    },
  ]);

  assert.deepEqual(tabela.map((r) => r.player), ['a', 'b']);
  // Dhe nuk e fiton dot me zero pikë, edhe pse zeroja është më e vogël se −20.
  assert.equal(tabela[0].player, 'a');
});

test('mesatarja mbetet e pandarë, që ta rrumbullakosë ekrani', () => {
  const tabela = tabelaEPergjithshme([
    { selectedPlayers: ['a'], raundet: [{ id: 1, gameId: 1, roundNumber: 1, scores: { a: 106 } }] },
    { selectedPlayers: ['a'], raundet: [{ id: 2, gameId: 2, roundNumber: 1, scores: { a: 181 } }] },
  ]);

  assert.equal(tabela[0].mesatarja, 143.5);
});

test('grupi pa asnjë lojë jep tabelë të zbrazët', () => {
  assert.deepEqual(tabelaEPergjithshme([]), []);
});

test('renditja e një loje merr vetëm ata që shënuan', () => {
  const rend = renditjaELojes(
    ['beta', 'gama', 'delta'],
    [{ id: 1, gameId: 1, roundNumber: 1, scores: { beta: -20, gama: 100 } }],
  );

  assert.deepEqual(rend, [
    { rank: 1, player: 'beta', total: -20 },
    { rank: 2, player: 'gama', total: 100 },
  ]);
});

test('renditja e një loje të panisur është e zbrazët, jo e barabartë', () => {
  assert.deepEqual(renditjaELojes(['a', 'b'], []), []);
});

test('renditja e lojës përputhet me atë të `logic.json`-it', () => {
  // E njëjta llogari si brenda lojës, vetëm e thirrur nga historiku i grupit.
  for (const grupi of ME_RENDITJE_TE_PLOTE) {
    const raundet = raundetE(grupi);
    if (!raundet.some((r) => grupi.players.some((p) => typeof r.scores[p] === 'number'))) {
      continue;
    }

    assert.deepEqual(
      renditjaELojes(grupi.players, raundet),
      grupi.standings,
      `renditja e ${grupi.id}`,
    );
  }
});

test('një lojë e hapur e paluajtur nuk renditet, edhe pse fleta e rendit', () => {
  // `brigj_4_merged_teams` s'ka asnjë pikë, por `logic.json` i jep të dyja
  // skuadrat me 0 dhe „alfa + zeta" të parë — vend i fituar nga radha e listës,
  // jo nga loja. Këtu ajo lojë thjesht nuk ka renditje.
  const grupi = burimi.groups.find((g) => g.id === 'brigj_4_merged_teams');

  assert.deepEqual(grupi.standings.map((r) => r.total), [0, 0]);
  assert.deepEqual(renditjaELojes(grupi.players, raundetE(grupi)), []);
});


/* ── Një kalim i vetëm mbi raundet ──────────────────────────────────────── */

test('permbledhja jep të njëjtat numra si tri thirrjet e vjetra', () => {
  const players = ['alfa', 'epsilon', 'Lambda', 'jota'];
  const raundet = [
    { id: 1, gameId: 1, roundNumber: 1, scores: { alfa: 22, epsilon: 14, Lambda: -20, jota: 18 } },
    { id: 2, gameId: 1, roundNumber: 2, scores: { alfa: 20, epsilon: 20, Lambda: -2 } },
    { id: 3, gameId: 1, roundNumber: 3, scores: {} },
    { id: 4, gameId: 1, roundNumber: 4, scores: { alfa: 0, epsilon: null, jota: 5 } },
  ];

  const p = permbledhja(players, raundet);

  assert.deepEqual(p.totalet, totalet(players, raundet));
  assert.deepEqual(p.luajtur, raundetELuajtura(players, raundet));
  assert.equal(p.barabarte, pjesemarrjeEBarabarte(players, raundet));

  // Dhe numrat vetë, të shkruar me dorë: zeroja shënohet, `null`-i jo.
  assert.deepEqual(p.totalet, { alfa: 42, epsilon: 34, Lambda: -22, jota: 23 });
  assert.deepEqual(p.luajtur, { alfa: 3, epsilon: 2, Lambda: 2, jota: 2 });
  assert.equal(p.barabarte, false);
});

test('filtrimi i raundeve bosh nuk e ndryshon pjesëmarrjen', () => {
  /*
   * Ekrani i lojës filtronte raundet bosh para se të pyetej për pjesëmarrjen.
   * Ai kalim u hoq, sepse nuk mund ta ndryshonte përgjigjen: një raund pa asnjë
   * pikë nuk i shton njërit numërimin. Kjo provë e mban atë arsyetim të matur —
   * nëse dikush e prek numërimin, ajo bie.
   */
  const players = ['alfa', 'epsilon', 'Lambda'];

  const rastet = [
    [],
    [{ id: 1, gameId: 1, roundNumber: 1, scores: {} }],
    [
      { id: 1, gameId: 1, roundNumber: 1, scores: { alfa: 10, epsilon: 10, Lambda: 10 } },
      { id: 2, gameId: 1, roundNumber: 2, scores: {} },
      { id: 3, gameId: 1, roundNumber: 3, scores: { alfa: null, epsilon: null, Lambda: null } },
    ],
    [
      { id: 1, gameId: 1, roundNumber: 1, scores: { alfa: 10 } },
      { id: 2, gameId: 1, roundNumber: 2, scores: {} },
      { id: 3, gameId: 1, roundNumber: 3, scores: { epsilon: 5, Lambda: 5 } },
    ],
  ];

  for (const raundet of rastet) {
    const pa_filtër = pjesemarrjeEBarabarte(players, raundet);
    const me_filtër = pjesemarrjeEBarabarte(
      players,
      raundet.filter((r) => eshteIMbushur(players, r)),
    );

    assert.equal(pa_filtër, me_filtër, JSON.stringify(raundet));
    assert.deepEqual(
      raundetELuajtura(players, raundet),
      raundetELuajtura(players, raundet.filter((r) => eshteIMbushur(players, r))),
    );
  }
});

/* ── Kush përzien letrat ────────────────────────────────────────────────── */

test('përzierja nis nga i pari i listës dhe kalon një vend për raund', () => {
  const players = ['alfa', 'beta', 'gama'];

  assert.equal(perziersiIRaundit(players, 1), 'alfa');
  assert.equal(perziersiIRaundit(players, 2), 'beta');
  assert.equal(perziersiIRaundit(players, 3), 'gama');
  // Pas të fundit nis prapë nga kreu.
  assert.equal(perziersiIRaundit(players, 4), 'alfa');
  assert.equal(perziersiIRaundit(players, 7), 'alfa');
});

test('përzierja ndjek radhën e tavolinës te çdo grup i `logic.json`-it', () => {
  for (const grupi of burimi.groups) {
    for (const raundi of grupi.rounds) {
      assert.equal(
        perziersiIRaundit(grupi.players, raundi.round),
        grupi.players[(raundi.round - 1) % grupi.players.length],
      );
    }
  }
});

test('pa lojtarë ose me numër të prishur nuk ka përzierës', () => {
  assert.equal(perziersiIRaundit([], 3), null);
  assert.equal(perziersiIRaundit(['alfa'], Number.NaN), null);
  // Numri i raundit nuk shkon nën një, por një bazë e prishur mund ta sjellë.
  assert.equal(perziersiIRaundit(['alfa', 'beta'], 0), 'beta');
  assert.equal(perziersiIRaundit(['alfa', 'beta'], -1), 'alfa');
});

/* ── Sa raunde ka një lojë ──────────────────────────────────────────────── */

test('loja ka dy raunde për lojtar', () => {
  assert.equal(RAUNDE_PER_LOJTAR, 2);
  assert.equal(raundetELojes(['alfa', 'beta', 'gama']), 6);
  assert.equal(raundetELojes(['alfa', 'beta', 'gama', 'delta']), 8);
  assert.equal(raundetELojes([]), 0);
});

test('çdo mbrëmje bridzhi e `logic.json`-it ka saktësisht dy raunde për lojtar', () => {
  /*
   * Ky rregull nuk u shpik: fleta origjinale e dëshmon. Dy grupe rrinë jashtë,
   * dhe asnjëri nuk e kundërshton atë:
   *
   *   • `brigj_4_merged_teams` — kolonat janë çifte („alfa + zeta"), pra dy
   *     kolona nga katër veta. Tetë raundet e tij janë pikërisht dy për njeri,
   *     dhe kjo e përforcon rregullin në vend që ta thyejë.
   *   • `domina_1` — nuk është bridzh fare.
   */
  const çiftet = /\s\+\s/;
  const bridzhet = burimi.groups.filter(
    (g) => !g.id.startsWith('domina'),
  );

  assert.ok(bridzhet.length >= 5);

  for (const grupi of bridzhet) {
    const veta = grupi.players.reduce(
      (sa, emri) => sa + emri.split(çiftet).length,
      0,
    );

    assert.equal(
      grupi.rounds.length,
      veta * RAUNDE_PER_LOJTAR,
      `${grupi.id}: ${grupi.rounds.length} raunde nga ${veta} veta`,
    );
  }
});

test('sa raunde janë mbetur — dhe secili i përzien dy herë', () => {
  const players = ['alfa', 'beta', 'gama'];
  const gjithsej = raundetELojes(players);

  // Dy rrotullime të plota të tavolinës, dhe asnjë vend nuk përsëritet brenda një.
  const perziersit = [];
  for (let raundi = 1; raundi <= gjithsej; raundi += 1) {
    perziersit.push(perziersiIRaundit(players, raundi));
  }

  for (const player of players) {
    assert.equal(
      perziersit.filter((x) => x === player).length,
      RAUNDE_PER_LOJTAR,
    );
  }
});
