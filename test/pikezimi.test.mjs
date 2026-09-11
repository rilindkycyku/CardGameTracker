/**
 * Provat e llogaritësit të raundit.
 *
 * Rregullat maten kundër raundeve të vërteta të `logic.json`-it: merret një
 * raund i shënuar dikur me dorë, rindërtohet se çfarë ndodhi në tavolinë, dhe
 * kërkohet që llogaritësi të nxjerrë pikërisht ata numra. Nëse rregullat janë
 * kuptuar gabim, kjo bie këtu e jo te mbrëmja e radhës.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  piketERaundit,
  shpjegimi,
  PIKET_E_MBYLLESIT,
  DENIMI_I_MBYLLUR,
  SHUMEZUESI_I_DORES,
} from '../src/pikezimi.ts';

test('hant: mbyllësi −40, të mbyllurit +200, të hapurit dora dyfish', () => {
  // brigj_1, raundi 3: delta mbylli hant; alfa e gama s'kishin hapur fare;
  // beta kishte hapur dhe i mbetën 71 pikë në dorë → 2 × 71 = 142.
  const dala = piketERaundit(
    ['alfa', 'beta', 'gama', 'delta'],
    'delta',
    'hant',
    {
      alfa: { mbyllur: true, dora: 0 },
      beta: { mbyllur: false, dora: 71 },
      gama: { mbyllur: true, dora: 0 },
    },
  );

  assert.deepEqual(dala, { alfa: 200, beta: 142, gama: 200, delta: -40 });
});

test('normal: mbyllësi −20, të mbyllurit +100, të hapurit dora një herë', () => {
  // brigj_1, raundi 1: alfa mbylli pasi kishte hapur; beta s'kishte hapur;
  // gama e delta kishin hapur, me 30 e 27 pikë në dorë.
  const dala = piketERaundit(
    ['alfa', 'beta', 'gama', 'delta'],
    'alfa',
    'normal',
    {
      beta: { mbyllur: true, dora: 0 },
      gama: { mbyllur: false, dora: 30 },
      delta: { mbyllur: false, dora: 27 },
    },
  );

  assert.deepEqual(dala, { alfa: -20, beta: 100, gama: 30, delta: 27 });
});

test('raundi me gjashtë lojtarë del njësoj si te fleta', () => {
  // brigj_3, raundi 2: epsilon mbylli pasi kishte hapur; Mi s'kishte hapur fare;
  // katër të tjerët mbetën me 16, 28, 20 e 5 pikë në dorë.
  const dala = piketERaundit(
    ['alfa', 'epsilon', 'Lambda', 'jota', 'Mi', 'delta'],
    'epsilon',
    'normal',
    {
      alfa: { mbyllur: false, dora: 16 },
      Lambda: { mbyllur: false, dora: 28 },
      jota: { mbyllur: false, dora: 20 },
      Mi: { mbyllur: true, dora: 0 },
      delta: { mbyllur: false, dora: 5 },
    },
  );

  assert.deepEqual(dala, {
    alfa: 16,
    epsilon: -20,
    Lambda: 28,
    jota: 20,
    Mi: 100,
    delta: 5,
  });
});

test('llogaritësi i mbulon të gjitha raundet e shënuara, veç dy përjashtimeve', () => {
  // Çdo raund i `logic.json`-it duhet të dalë nga rregullat: një mbyllës me −40
  // ose −20, dhe të tjerët me dënim fiks ose me dorën e tyre. Dy raunde nuk
  // dalin, dhe kjo është arsyeja pse futja me dorë mbetet gjithmonë e mundur:
  //
  //   • brigj_3 raundi 1 — mbyllësi ka −50, që s'e jep asnjë nga dy mbylljet;
  //   • domina_1 raundi 1 — raund i papërfunduar, pa asnjë mbyllës.
  const burimi = JSON.parse(
    readFileSync(new URL('./logic.json', import.meta.url), 'utf8'),
  );

  const jashteRregullave = [];

  for (const grupi of burimi.groups) {
    for (const raundi of grupi.rounds) {
      const shenuar = Object.entries(raundi.scores).filter(
        ([, v]) => typeof v === 'number',
      );
      if (shenuar.length === 0) continue;

      const mbyllesit = shenuar.filter(([, v]) => v === -40 || v === -20);
      if (mbyllesit.length !== 1) {
        jashteRregullave.push(`${grupi.id} r${raundi.round}`);
        continue;
      }

      const [mbyllesi, piketEMbylljes] = mbyllesit[0];
      const lloji = piketEMbylljes === -40 ? 'hant' : 'normal';

      // Gjendjet rindërtohen nga vetë pikët: dënimi fiks do të thotë „nuk hapi",
      // çdo numër tjetër është dora e pjesëtuar me shumëzuesin e llojit.
      const gjendjet = {};
      for (const [player, pike] of shenuar) {
        if (player === mbyllesi) continue;
        gjendjet[player] =
          pike === DENIMI_I_MBYLLUR[lloji]
            ? { mbyllur: true, dora: 0 }
            : { mbyllur: false, dora: pike / SHUMEZUESI_I_DORES[lloji] };
      }

      const dala = piketERaundit(
        shenuar.map(([p]) => p),
        mbyllesi,
        lloji,
        gjendjet,
      );

      assert.deepEqual(
        dala,
        Object.fromEntries(shenuar),
        `${grupi.id} r${raundi.round}`,
      );
    }
  }

  assert.deepEqual(jashteRregullave, ['brigj_3 r1', 'domina_1 r1']);
});

test('lojtari pa gjendje të dhënë llogaritet i mbyllur', () => {
  // Gjendja me të cilën nis raundi është „i mbyllur"; kush s'preket mbetet aty.
  const dala = piketERaundit(['a', 'b', 'c'], 'a', 'normal', {});

  assert.deepEqual(dala, { a: -20, b: 100, c: 100 });
});

test('dora e një lojtari të mbyllur nuk numërohet', () => {
  const dala = piketERaundit(['a', 'b'], 'a', 'hant', {
    b: { mbyllur: true, dora: 95 },
  });

  assert.equal(dala.b, 200);
});

test('dora negative ose e paplotë nuk jep pikë negative', () => {
  const dala = piketERaundit(['a', 'b', 'c'], 'a', 'normal', {
    b: { mbyllur: false, dora: -5 },
    c: { mbyllur: false, dora: Number.NaN },
  });

  assert.equal(dala.b, 0);
  assert.equal(dala.c, 0);
});

test('dora rrumbullakohet para se të shumëzohet', () => {
  const dala = piketERaundit(['a', 'b'], 'a', 'hant', {
    b: { mbyllur: false, dora: 10.6 },
  });

  assert.equal(dala.b, 22);
});

test('vetëm mbyllësi merr pikë negative kur të tjerët kanë dorë', () => {
  const players = ['a', 'b', 'c'];
  const dala = piketERaundit(players, 'b', 'hant', {
    a: { mbyllur: false, dora: 12 },
    c: { mbyllur: false, dora: 3 },
  });

  assert.equal(dala.b, -40);
  for (const p of ['a', 'c']) assert.ok(dala[p] >= 0, `${p} nuk duhet negativ`);
});

test('hanti dënon më rëndë se mbyllja e zakonshme', () => {
  assert.ok(PIKET_E_MBYLLESIT.hant < PIKET_E_MBYLLESIT.normal);
  assert.ok(DENIMI_I_MBYLLUR.hant > DENIMI_I_MBYLLUR.normal);
  assert.ok(SHUMEZUESI_I_DORES.hant > SHUMEZUESI_I_DORES.normal);
});

test('shpjegimi e tregon nga vjen numri', () => {
  assert.equal(shpjegimi('normal', { mbyllur: true, dora: 0 }), 'nuk hapi · 100');
  assert.equal(shpjegimi('hant', { mbyllur: true, dora: 0 }), 'nuk hapi · 200');
  assert.equal(shpjegimi('normal', { mbyllur: false, dora: 30 }), 'dora 30');
  assert.equal(
    shpjegimi('hant', { mbyllur: false, dora: 71 }),
    '2 × dora 71 = 142',
  );
});
