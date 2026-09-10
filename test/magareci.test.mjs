/**
 * Provat e magarecit.
 *
 * Rregulli është i shkurtër dhe pikërisht prandaj lehtë i prishur: një shkronjë
 * për raund, dhe kush e mbush fjalën e humb mbrëmjen. Këtu maten të dyja anët —
 * që shkronja të mos dalë dy herë nga një raund, dhe që fjala e mbushur të mos
 * kalojë pa u vënë re.
 *
 * Raundet shkruhen ashtu si i shkruan ekrani: humbësi `1`, të tjerët `0`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FJALA,
  SHKRONJAT,
  fjalaE,
  humbesiIRaundit,
  magareci,
  mbushur,
  pergjithshmetEMagarecit,
  raundetEMagarecit,
  raundiIHumbjes,
  renditjaEMagarecit,
  rreshtatEMagarecit,
  shkronjat,
} from '../src/magareci.ts';
import { llojiILojes, permbledhja, raundetELuajtura } from '../src/llogaritjet.ts';

const LOJTARET = ['meri', 'eri', 'miloti', 'rila', 'lumi'];

/** Raundet nga një listë humbësish: `['meri', 'eri']` → dy raunde. */
function raundet(players, humbesit) {
  return humbesit.map((humbesi, i) => ({
    id: i + 1,
    gameId: 1,
    roundNumber: i + 1,
    scores: raundiIHumbjes(players, humbesi),
  }));
}

test('fjala është MAGAREC, dhe shkronjat e saj janë shtatë', () => {
  assert.equal(FJALA, 'MAGAREC');
  assert.deepEqual(SHKRONJAT, ['M', 'A', 'G', 'A', 'R', 'E', 'C']);
});

test('humbësi merr një shkronjë, të tjerët zero', () => {
  const scores = raundiIHumbjes(LOJTARET, 'eri');

  assert.deepEqual(scores, { meri: 0, eri: 1, miloti: 0, rila: 0, lumi: 0 });
  assert.equal(humbesiIRaundit(LOJTARET, { scores }), 'eri');
});

test('zeroja e të tjerëve nuk është qelizë e zbrazët', () => {
  // Kush ishte te tavolina e luajti atë raund. Po të mbetej bosh, renditja do
  // ta quante pjesëmarrjen të pabarabartë te çdo lojë dhe do të nxirrte
  // shënimin e saj pa pasur nevojë.
  const lista = raundet(LOJTARET, ['meri', 'eri', 'meri']);
  const p = permbledhja(LOJTARET, lista);

  assert.equal(p.barabarte, true);
  for (const lojtari of LOJTARET) {
    assert.equal(p.luajtur[lojtari], 3, lojtari);
  }
});

test('shkronjat janë sa raundet e humbura', () => {
  const lista = raundet(LOJTARET, ['meri', 'eri', 'meri', 'lumi', 'meri']);

  assert.deepEqual(shkronjat(LOJTARET, lista), {
    meri: 3,
    eri: 1,
    miloti: 0,
    rila: 0,
    lumi: 1,
  });
});

test('një raund jep vetëm një shkronjë', () => {
  const lista = raundet(LOJTARET, ['meri', 'eri', 'rila']);
  const sa = shkronjat(LOJTARET, lista);
  const gjithsej = Object.values(sa).reduce((a, b) => a + b, 0);

  assert.equal(gjithsej, lista.length);
});

test('fjala mblidhet shkronjë për shkronjë', () => {
  assert.equal(fjalaE(0), '');
  assert.equal(fjalaE(1), 'M');
  assert.equal(fjalaE(3), 'MAG');
  assert.equal(fjalaE(7), 'MAGAREC');
  // Mbi shtatë nuk ka ku të shkojë, dhe nën zero as.
  assert.equal(fjalaE(9), 'MAGAREC');
  assert.equal(fjalaE(-2), '');
});

test('mbaron kur njërit i del fjala e plotë', () => {
  const shtate = ['lumi', 'meri', 'lumi', 'lumi', 'eri', 'lumi', 'lumi', 'lumi', 'lumi'];
  const lista = raundet(LOJTARET, shtate);

  assert.equal(magareci(LOJTARET, lista), 'lumi');
  assert.equal(mbushur(shkronjat(LOJTARET, lista).lumi), true);
});

test('gjashtë shkronja nuk e mbarojnë lojën', () => {
  const gjashte = ['lumi', 'lumi', 'lumi', 'lumi', 'lumi', 'lumi'];
  const lista = raundet(LOJTARET, gjashte);

  assert.equal(magareci(LOJTARET, lista), null);
  assert.equal(fjalaE(shkronjat(LOJTARET, lista).lumi), 'MAGARE');
});

test('magareci është ai që e mbushi i pari, jo i pari i listës', () => {
  // Raundet vijnë të përziera nga baza; radha e numrit e vendos, jo radha e
  // leximit. Këtu `eri` e mbush te raundi i shtatë, `meri` te i katërmbëdhjeti.
  const humbesit = [
    'eri', 'eri', 'eri', 'eri', 'eri', 'eri', 'eri',
    'meri', 'meri', 'meri', 'meri', 'meri', 'meri', 'meri',
  ];
  const lista = raundet(LOJTARET, humbesit);

  assert.equal(magareci(LOJTARET, [...lista].reverse()), 'eri');
});

test('secili raund e thotë shkronjën që solli', () => {
  const lista = raundet(LOJTARET, ['meri', 'eri', 'meri']);

  assert.deepEqual(raundetEMagarecit(LOJTARET, lista), [
    { id: 1, roundNumber: 1, humbesi: 'meri', shkronja: 'M' },
    { id: 2, roundNumber: 2, humbesi: 'eri', shkronja: 'M' },
    { id: 3, roundNumber: 3, humbesi: 'meri', shkronja: 'A' },
  ]);
});

test('fshirja e një raundi i rinumëron shkronjat e mëpasme', () => {
  // Shkronja nuk rri e ruajtur askund: del nga sa herë e kishte humbur ai
  // lojtar deri atëherë, prandaj heqja e raundit të parë e kthen «A»-në në «M».
  const lista = raundet(LOJTARET, ['meri', 'eri', 'meri']);
  const pa_te_paren = lista.filter((r) => r.roundNumber !== 1);

  assert.deepEqual(
    raundetEMagarecit(LOJTARET, pa_te_paren).map((r) => r.shkronja),
    ['M', 'M'],
  );
});

test('rrjeti del nga vetë numrat', () => {
  // Pamja vetëm-lexim nuk i ka raundet fare — paketa mban totalet. Meqë
  // shkronja është totali, i njëjti rrjet vizatohet nga ato pak bajte.
  const rreshtat = rreshtatEMagarecit(['meri', 'eri'], { meri: 7, eri: 2 });

  assert.deepEqual(rreshtat, [
    { player: 'meri', shkronja: 7, fjala: 'MAGAREC', magarec: true },
    { player: 'eri', shkronja: 2, fjala: 'MA', magarec: false },
  ]);
});

test('rrjeti i një lojtari pa shkronja rri i zbrazët', () => {
  assert.deepEqual(rreshtatEMagarecit(['rila'], {}), [
    { player: 'rila', shkronja: 0, fjala: '', magarec: false },
  ]);
});

test('prin ai me më pak shkronja', () => {
  const lista = raundet(LOJTARET, ['meri', 'meri', 'eri']);
  const rendituar = renditjaEMagarecit(LOJTARET, lista);

  assert.equal(rendituar[0].rank, 1);
  assert.equal(rendituar[0].total, 0);
  assert.equal(rendituar.at(-1).player, 'meri');
  assert.equal(rendituar.at(-1).total, 2);
});

test('kush u ul te raundi i pestë nuk merr shkronja për raundet e shkuara', () => {
  const kater = raundet(['meri', 'eri'], ['meri', 'eri', 'meri', 'meri']);
  const pese = {
    id: 5,
    gameId: 1,
    roundNumber: 5,
    scores: raundiIHumbjes(['meri', 'eri', 'lumi'], 'lumi'),
  };
  const lista = [...kater, pese];
  const players = ['meri', 'eri', 'lumi'];

  assert.deepEqual(shkronjat(players, lista), { meri: 3, eri: 1, lumi: 1 });
  assert.equal(raundetELuajtura(players, lista).lumi, 1);
});

test('tabela e grupit numëron mbrëmjet, magarecat dhe shkronjat', () => {
  const players = ['meri', 'eri'];
  const lojerat = [
    // Meri e mbush fjalën; eri mbetet me një shkronjë.
    {
      selectedPlayers: players,
      raundet: raundet(players, [
        'meri', 'meri', 'meri', 'eri', 'meri', 'meri', 'meri', 'meri',
      ]),
    },
    // Një mbrëmje e shkurtër, e papërfunduar.
    { selectedPlayers: players, raundet: raundet(players, ['eri', 'eri']) },
  ];

  assert.deepEqual(pergjithshmetEMagarecit(lojerat), [
    { player: 'eri', lojera: 2, magarec: 0, shkronja: 3, mesatarja: 1.5 },
    { player: 'meri', lojera: 2, magarec: 1, shkronja: 7, mesatarja: 3.5 },
  ]);
});

test('mbrëmja pa asnjë raund nuk hyn te tabela e grupit', () => {
  // Të gjithë me zero shkronja do t'i jepnin vendin e parë të parit të listës,
  // pa u ndarë asnjë letër. I njëjti kufi si te tabela e bridzhit.
  assert.deepEqual(
    pergjithshmetEMagarecit([{ selectedPlayers: ['meri', 'eri'], raundet: [] }]),
    [],
  );
});

test('lojërat e vjetra pa fushën `lloji` lexohen bridzh', () => {
  assert.equal(llojiILojes({}), 'bridzh');
  assert.equal(llojiILojes({ lloji: 'bridzh' }), 'bridzh');
  assert.equal(llojiILojes({ lloji: 'magarec' }), 'magarec');
});
