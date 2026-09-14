/**
 * Provat e mbledhjes së dorës.
 *
 * Kjo është aritmetika e vetme që e shkruan përdoruesi vetë, prandaj gabimi
 * këtu nuk bie te ekrani — bie te raundi, dhe raundi mbetet i shkruar. Provat
 * matin pikërisht kufijtë ku një llogaritëse zakonisht gabon: zeroja e parë,
 * «+» i shtypur dy herë, dhe fshirja prapa mbi një term të mbyllur.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ZBRAZET,
  bosh,
  fshiPrapa,
  nisNga,
  shkrimi,
  shtoShifren,
  shtoTermin,
  shuma,
} from '../src/mbledhja.ts';

/** Shtyp një varg shifrash njërën pas tjetrës. */
const shtyp = (m, shifrat) =>
  [...shifrat].reduce((gj, sh) => shtoShifren(gj, sh), m);

test('shifrat mblidhen te termi që po shkruhet', () => {
  const m = shtyp(ZBRAZET, '125');

  assert.equal(m.tani, '125');
  assert.equal(shuma(m), 125);
  assert.equal(shkrimi(m), '125');
});

test('«+» e mbyll termin dhe hap një të ri', () => {
  let m = shtoTermin(shtyp(ZBRAZET, '10'));
  m = shtyp(m, '15');

  assert.deepEqual(m.terma, [10]);
  assert.equal(shuma(m), 25);
  assert.equal(shkrimi(m), '10 + 15');
});

test('«+» pa term të shkruar nuk fut zero', () => {
  // Dy prekje radhazi janë gabim i shpeshtë me gishta të shpejtë; një zero e
  // futur aty do të dilte te rreshti i termave si letër që s'e pa kush.
  const nje = shtoTermin(shtyp(ZBRAZET, '10'));
  const dy = shtoTermin(nje);

  assert.deepEqual(dy, nje);
  assert.deepEqual(shtoTermin(ZBRAZET), ZBRAZET);
});

test('zeroja e parë zëvendësohet, jo zgjatet', () => {
  assert.equal(shtyp(ZBRAZET, '05').tani, '5');
  assert.equal(shtyp(ZBRAZET, '10').tani, '10');
});

test('termi nuk kalon katër shifra', () => {
  assert.equal(shtyp(ZBRAZET, '123456').tani, '1234');
});

test('fshirja prapa heq një shifër', () => {
  assert.equal(fshiPrapa(shtyp(ZBRAZET, '125')).tani, '12');
});

test('fshirja mbi term të mbyllur e kthen atë të tërin', () => {
  // Gabimi i shpeshtë është një shifër e keqe te termi që sapo u mbyll: ashtu
  // rregullohet me një prekje të dytë, jo duke e rishkruar.
  const m = fshiPrapa(shtoTermin(shtyp(ZBRAZET, '15')));

  assert.deepEqual(m.terma, []);
  assert.equal(m.tani, '15');
});

test('fshirja mbi asgjë nuk bën asgjë', () => {
  assert.deepEqual(fshiPrapa(ZBRAZET), ZBRAZET);
});

test('nis nga ajo që ka fusha, pa shenjë', () => {
  // Minusi te fushat ka butonin e vet; një dorë me letra nuk është negative.
  assert.deepEqual(nisNga('40'), { terma: [], tani: '40' });
  assert.deepEqual(nisNga('-40'), { terma: [], tani: '40' });
  assert.deepEqual(nisNga(''), ZBRAZET);
  assert.deepEqual(nisNga(null), ZBRAZET);
  assert.deepEqual(nisNga('-'), ZBRAZET);
});

test('numri i nisjes mbetet i shkruajtshëm', () => {
  // Term i mbyllur do të thoshte se fshirja prapa e heq të tërin; kush e hap
  // kutinë mbi një numër zakonisht do t'i ndërrojë një shifër.
  assert.equal(fshiPrapa(nisNga('125')).tani, '12');
});

test('bosh e ndan «asgjë» nga «zero»', () => {
  assert.equal(bosh(ZBRAZET), true);
  assert.equal(bosh(shtyp(ZBRAZET, '0')), false);
  assert.equal(shuma(shtyp(ZBRAZET, '0')), 0);
});
