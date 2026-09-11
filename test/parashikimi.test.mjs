/**
 * Provat e parashikimit.
 *
 * `logic.json` nuk ka kolonë „vendi më i mirë" — ajo pyetje nuk i bëhej dot një
 * flete — prandaj këtu nuk maten numra kundër saj. Ajo që merret prej tij janë
 * totalet e vërteta të mbrëmjeve, dhe mbi to kërkohen dy gjëra:
 *
 *   • rastet e vogla, të kontrolluara me dorë nga vetë rregulli i pikëzimit;
 *   • ligjet që një parashikim nuk guxon t'i thyejë kurrë — vendi i mundshëm
 *     nuk del jashtë intervalit, dhe më shumë raunde nuk e ngushtojnë atë.
 *
 * Ligjet janë ato që kapin gabimin e vërtetë: një shenjë e kthyer ose një
 * buxhet i ndarë gabim i thyen menjëherë, edhe atje ku një numër i shpikur do
 * të kishte kaluar.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  FITIMI_I_RAUNDIT,
  HUMBJA_E_RAUNDIT,
  parashikimi,
  parashikimiIBridzhit,
  parashikimiIMagarecit,
  raundetEMbetura,
  raundetMeTeShumta,
} from '../src/parashikimi.ts';
import { DENIMI_I_MBYLLUR, PIKET_E_MBYLLESIT } from '../src/pikezimi.ts';
import { FJALA } from '../src/magareci.ts';
import { permbledhja, raundetELojes } from '../src/llogaritjet.ts';

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

/** Totalet e vërteta të një grupi, ashtu si i nxjerr aplikacioni. */
function totaletE(grupi) {
  return permbledhja(grupi.players, raundetE(grupi)).totalet;
}

/* ── Kufijtë vijnë nga rregulli, jo nga kjo skedar ──────────────────────── */

test('kufijtë e raundit janë ata të pikëzimit', () => {
  assert.equal(FITIMI_I_RAUNDIT, PIKET_E_MBYLLESIT.hant);
  assert.equal(HUMBJA_E_RAUNDIT, DENIMI_I_MBYLLUR.hant);
  assert.ok(FITIMI_I_RAUNDIT < 0 && HUMBJA_E_RAUNDIT > 0);
});

/* ── Bridzhi, i kontrolluar me dorë ─────────────────────────────────────── */

const PLAYERS = ['alfa', 'beta', 'gama'];

test('me një raund, i dyti e arrin të parin vetëm brenda 240 pikëve', () => {
  // 180 − 100 = 80: mjafton një raund, ku beta mbyll hant (−40) dhe alfa s'hap (+200).
  const afer = parashikimiIBridzhit(
    PLAYERS,
    { alfa: 100, beta: 180, gama: 400 },
    1,
  );
  assert.deepEqual(afer.pretendentet, ['alfa', 'beta']);
  assert.equal(afer.rreshtat[1].raundetPerVendinEPare, 1);

  // 400 − 100 = 300: një raund s'e mbyll, dy po.
  assert.equal(afer.rreshtat[2].mundTeFitoje, false);
  assert.equal(afer.rreshtat[2].raundetPerVendinEPare, 2);
  assert.equal(
    parashikimiIBridzhit(PLAYERS, { alfa: 100, beta: 180, gama: 400 }, 2)
      .rreshtat[2].mundTeFitoje,
    true,
  );
});

test('diferenca saktësisht 240 mbyllet me një raund, 241 jo', () => {
  const me240 = parashikimiIBridzhit(['alfa', 'beta'], { alfa: 0, beta: 240 }, 1);
  assert.equal(me240.rreshtat[1].mundTeFitoje, true);
  assert.equal(me240.rreshtat[1].raundetPerVendinEPare, 1);

  const me241 = parashikimiIBridzhit(['alfa', 'beta'], { alfa: 0, beta: 241 }, 1);
  assert.equal(me241.rreshtat[1].mundTeFitoje, false);
  assert.equal(me241.rreshtat[1].raundetPerVendinEPare, 2);
});

test('totalet e skenarëve dalin nga kufijtë e raundit', () => {
  const p = parashikimiIBridzhit(PLAYERS, { alfa: 100, beta: 180, gama: 400 }, 3);
  const alfa = p.rreshtat[0];

  assert.equal(alfa.meIMiriTotali, 100 + 3 * FITIMI_I_RAUNDIT);
  assert.equal(alfa.meIKeqiTotali, 100 + 3 * HUMBJA_E_RAUNDIT);
});

const KATER = ['alfa', 'beta', 'gama', 'delta'];

test('mbylljet e të tjerëve ndahen — një mbyllës për raund', () => {
  /*
   * Alfa prin me 100. Po s'hapi një raund shkon te 300, dhe të tjerëve u
   * mjafton nga një mbyllje e vetme për të rënë nën të (320 − 40 = 280, e kështu
   * me radhë). Por mbyllje ka vetëm një për raund, prandaj brenda një raundi
   * atë e bën vetëm njëri: alfa bie te vendi i dytë, jo te i katërti.
   */
  const p = parashikimiIBridzhit(
    KATER,
    { alfa: 100, beta: 320, gama: 330, delta: 335 },
    1,
  );

  assert.equal(p.rreshtat[0].player, 'alfa');
  assert.equal(p.rreshtat[0].meIKeqi, 2);
});

test('me tre raunde ka tri mbyllje, dhe të tre e kalojnë', () => {
  // Njësoj si më sipër, por alfa ngjitet te 700 dhe secilit prapë i mjafton një
  // mbyllje. Tani mbyllje ka tri — pra alfa bie deri te vendi i katërt.
  const p = parashikimiIBridzhit(
    KATER,
    { alfa: 100, beta: 720, gama: 730, delta: 735 },
    3,
  );

  assert.equal(p.rreshtat[0].player, 'alfa');
  assert.equal(p.rreshtat[0].meIKeqi, 4);
});

test('barazimi numërohet si i njëjti vend', () => {
  const p = parashikimiIBridzhit(['alfa', 'beta'], { alfa: 50, beta: 50 }, 0);
  assert.deepEqual(
    p.rreshtat.map((r) => r.vendi),
    [1, 1],
  );
  assert.deepEqual(p.pretendentet, ['alfa', 'beta']);
});

/* ── Magareci, i kontrolluar me dorë ────────────────────────────────────── */

test('shkronjat nuk kthehen prapa — vendi më i mirë është ai i tanishëm', () => {
  const p = parashikimiIMagarecit(PLAYERS, { alfa: 1, beta: 3, gama: 6 }, 2);

  for (const rreshti of p.rreshtat) {
    assert.equal(rreshti.meIMiriTotali, rreshti.totali);
  }

  // Beta ka 3, alfa 1: dy raunde të humbura nga alfa i barazojnë.
  assert.equal(p.rreshtat[1].player, 'beta');
  assert.equal(p.rreshtat[1].mundTeFitoje, true);
  assert.equal(p.rreshtat[1].raundetPerVendinEPare, 2);

  // Gama ka 6: i duhen 5 shkronja nga alfa dhe 3 nga beta.
  assert.equal(p.rreshtat[2].raundetPerVendinEPare, 5 + 3);
  assert.equal(p.rreshtat[2].mundTeFitoje, false);
});

test('kush prin me shumë s\'e humb dot vendin brenda pak raundeve', () => {
  const p = parashikimiIMagarecit(PLAYERS, { alfa: 1, beta: 3, gama: 6 }, 2);
  assert.equal(p.rreshtat[0].player, 'alfa');
  assert.equal(p.rreshtat[0].iSigurt, true);

  // Me tre raunde alfa arrin te 4 dhe e kalon betën, pra nuk është më i sigurt.
  const me3 = parashikimiIMagarecit(PLAYERS, { alfa: 1, beta: 3, gama: 6 }, 3);
  assert.equal(me3.rreshtat[0].iSigurt, false);
  assert.equal(me3.rreshtat[0].meIKeqi, 2);
});

test('shkronjat ndalen te fjala e plotë', () => {
  const p = parashikimiIMagarecit(['alfa', 'beta'], { alfa: 0, beta: 5 }, 5);
  assert.equal(p.rreshtat[1].meIKeqiTotali, FJALA.length);
});

test('raundet e mbetura kanë kufi, dhe ai kufi i pret raundet e zgjedhura', () => {
  // Të dy te gjashta: secili mund të arrijë te gjashta (aty janë), pastaj një
  // raund i vetëm e mbyll mbrëmjen.
  assert.equal(raundetMeTeShumta(['alfa', 'beta'], { alfa: 6, beta: 6 }), 1);
  assert.equal(raundetMeTeShumta(['alfa', 'beta'], { alfa: 6, beta: 5 }), 2);
  // Pa asnjë shkronjë: të dy deri te gjashta (6 + 6), dhe një raund e mbyll.
  assert.equal(raundetMeTeShumta(['alfa', 'beta'], { alfa: 0, beta: 0 }), 13);

  const p = parashikimiIMagarecit(['alfa', 'beta'], { alfa: 6, beta: 6 }, 5);
  assert.equal(p.raunde, 1);
});

test('raundet e mbetura dalin nga vetë loja, e nuk hamendësohen', () => {
  const players = ['alfa', 'beta', 'gama', 'delta'];
  const pike = { alfa: 100, beta: 180, gama: 400, delta: 420 };

  // Bridzhi: dy raunde për lojtar, minus ato të luajtura.
  assert.equal(raundetELojes(players), 8);
  assert.equal(raundetEMbetura('bridzh', players, pike, 0), 8);
  assert.equal(raundetEMbetura('bridzh', players, pike, 5), 3);
  assert.equal(raundetEMbetura('bridzh', players, pike, 8), 0);
  // Një raund i tepërt nuk e kthen numrin nën zero.
  assert.equal(raundetEMbetura('bridzh', players, pike, 9), 0);

  // Magareci nuk e njeh atë kufi — atje numri vjen nga shkronjat.
  const sa = { alfa: 1, beta: 3, gama: 6, delta: 0 };
  assert.equal(
    raundetEMbetura('magarec', players, sa, 4),
    raundetMeTeShumta(players, sa),
  );
});

test('kufiri i bridzhit nuk e mbyll një mbrëmje magareci', () => {
  /*
   * Dy raunde për lojtar është rregull i bridzhit dhe vetëm i tij. Një mbrëmje
   * magareci me tre lojtarë e kalon lehtë atë numër — shkronjat ndahen, dhe
   * fjala mbushet kur mbushet — prandaj raundet e mbetura nuk guxojnë të bien
   * në zero vetëm sepse janë luajtur `2 × lojtarë`.
   */
  const players = ['alfa', 'beta', 'gama'];
  const sa = { alfa: 2, beta: 3, gama: 1 };

  assert.equal(raundetELojes(players), 6);
  assert.equal(raundetEMbetura('bridzh', players, sa, 6), 0);

  // Njëzet raunde të luajtura, dhe magareci vazhdon: askush s'e ka fjalën plot.
  for (const luajtur of [0, 6, 7, 20]) {
    assert.ok(
      raundetEMbetura('magarec', players, sa, luajtur) > 0,
      `magareci u mbyll pas ${luajtur} raundesh`,
    );
  }

  // Dhe mbaron vetëm atëherë kur mbushet fjala, sado pak raunde të jenë luajtur.
  assert.equal(
    raundetEMbetura('magarec', players, { ...sa, beta: FJALA.length }, 0),
    0,
  );
});

test('pas mbushjes së fjalës nuk ka më raunde', () => {
  const sa = { alfa: 2, beta: FJALA.length };
  assert.equal(raundetMeTeShumta(['alfa', 'beta'], sa), 0);

  const p = parashikimiIMagarecit(['alfa', 'beta'], sa, 3);
  assert.equal(p.raunde, 0);
  assert.deepEqual(p.pretendentet, ['alfa']);
  assert.equal(p.rreshtat[1].raundetPerVendinEPare, null);
});

/* ── Hyrja e vetme ──────────────────────────────────────────────────────── */

test('lloji i lojës e zgjedh llogarinë, si te `llojiILojes`', () => {
  const sa = { alfa: 1, beta: 3, gama: 6 };

  assert.deepEqual(
    parashikimi('magarec', PLAYERS, sa, 2),
    parashikimiIMagarecit(PLAYERS, sa, 2),
  );
  assert.deepEqual(
    parashikimi('bridzh', PLAYERS, sa, 2),
    parashikimiIBridzhit(PLAYERS, sa, 2),
  );
});

/* ── Ligjet, mbi totalet e vërteta të `logic.json`-it ───────────────────── */

/**
 * Të njëjtat mbrëmje, lexuar si magarec.
 *
 * Numrat e `logic.json`-it janë pikë bridzhi — me qindra — dhe ato nuk hyjnë te
 * llogaria e magarecit, ku totali është shkronjë nga zero në shtatë. Prandaj
 * mbrëmja lexohet sërish: raundin e humb ai që mori më shumë pikë atë raund,
 * dhe numërimi ndalet sapo dikujt i mbushet fjala. Dalin shpërndarje shkronjash
 * që vijnë nga lojëra të vërteta e jo nga numra të shpikur.
 */
function shkronjatE(grupi) {
  const sa = Object.fromEntries(grupi.players.map((player) => [player, 0]));

  for (const raundi of raundetE(grupi)) {
    if (Object.values(sa).some((x) => x >= FJALA.length)) break;

    let humbesi = null;
    for (const player of grupi.players) {
      const pike = raundi.scores[player];
      if (typeof pike !== 'number') continue;
      if (humbesi === null || pike > raundi.scores[humbesi]) humbesi = player;
    }

    if (humbesi !== null) sa[humbesi] += 1;
  }

  return sa;
}

/** Të dyja llogaritë, secila mbi numrat që i takojnë. */
const LLOGARITE = [
  ['bridzh', parashikimiIBridzhit, totaletE],
  ['magarec', parashikimiIMagarecit, shkronjatE],
];

test('vendi i tanishëm rri mes vendit më të mirë dhe atij më të keq', () => {
  for (const grupi of burimi.groups) {
    for (const [emri, llogaria, numrat] of LLOGARITE) {
      const totalat = numrat(grupi);

      for (const raunde of [0, 1, 2, 5]) {
        for (const r of llogaria(grupi.players, totalat, raunde).rreshtat) {
          assert.ok(
            r.meIMiri <= r.vendi && r.vendi <= r.meIKeqi,
            `${grupi.name} · ${emri} · ${raunde} raunde · ${r.player}: ` +
              `${r.meIMiri} ≤ ${r.vendi} ≤ ${r.meIKeqi}`,
          );
          assert.ok(r.meIMiri >= 1 && r.meIKeqi <= grupi.players.length);
        }
      }
    }
  }
});

test('pa raunde të mbetura, parashikimi është vetë renditja', () => {
  for (const grupi of burimi.groups) {
    for (const [, llogaria, numrat] of LLOGARITE) {
      const totalat = numrat(grupi);

      for (const r of llogaria(grupi.players, totalat, 0).rreshtat) {
        assert.equal(r.meIMiri, r.vendi);
        assert.equal(r.meIKeqi, r.vendi);
      }
    }
  }
});

test('më shumë raunde nuk e ngushtojnë kurrë intervalin', () => {
  for (const grupi of burimi.groups) {
    for (const [emri, llogaria, numrat] of LLOGARITE) {
      const totalat = numrat(grupi);

      for (let raunde = 0; raunde < 8; raunde += 1) {
        const tani = llogaria(grupi.players, totalat, raunde);
        const pastaj = llogaria(grupi.players, totalat, raunde + 1);

        for (let i = 0; i < tani.rreshtat.length; i += 1) {
          const a = tani.rreshtat[i];
          const b = pastaj.rreshtat[i];

          assert.equal(a.player, b.player);
          assert.ok(
            b.meIMiri <= a.meIMiri && b.meIKeqi >= a.meIKeqi,
            `${grupi.name} · ${emri} · ${a.player} te raundi ${raunde}`,
          );
        }
      }
    }
  }
});

test('kush prin e arrin vendin e parë pa asnjë raund, dhe e arrin kush thotë se e arrin', () => {
  for (const grupi of burimi.groups) {
    for (const [emri, llogaria, numrat] of LLOGARITE) {
      const totalat = numrat(grupi);

      const p = llogaria(grupi.players, totalat, 0);
      assert.equal(p.rreshtat[0].raundetPerVendinEPare, 0);
      assert.ok(p.pretendentet.includes(p.rreshtat[0].player));

      for (const r of p.rreshtat) {
        const sa = r.raundetPerVendinEPare;
        if (sa === null || sa === 0) continue;

        assert.equal(
          llogaria(grupi.players, totalat, sa).rreshtat.find(
            (x) => x.player === r.player,
          ).mundTeFitoje,
          true,
          `${grupi.name} · ${emri} · ${r.player}: ${sa} raunde s'mjaftuan`,
        );
        assert.equal(
          llogaria(grupi.players, totalat, sa - 1).rreshtat.find(
            (x) => x.player === r.player,
          ).mundTeFitoje,
          false,
          `${grupi.name} · ${emri} · ${r.player}: ${sa - 1} raunde mjaftonin`,
        );
      }
    }
  }
});

test('numra të prishur nuk e rrëzojnë parashikimin', () => {
  const pa = parashikimiIBridzhit(PLAYERS, { alfa: 100 }, Number.NaN);
  assert.equal(pa.raunde, 0);
  assert.equal(pa.rreshtat.length, PLAYERS.length);

  assert.equal(parashikimiIBridzhit(PLAYERS, {}, -5).raunde, 0);
  assert.equal(parashikimiIMagarecit(PLAYERS, {}, 2.7).raunde, 2);
});
