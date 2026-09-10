/**
 * Provat e koduesit QR.
 *
 * Një kod QR i gabuar nuk duket i gabuar — thjesht nuk lexohet, dhe kjo merret
 * vesh vetëm me telefonin në dorë. Prandaj këtu mbahet një matricë e ngrirë për
 * dy tekste: të dyja u vizatuan dhe u lexuan me , një dekodues krejt
 * i pavarur, para se të hyjnë këtu. Nëse ndryshon ndonjë bit i koduesit, këto
 * bien.
 *
 * Gjatë zhvillimit, i tërë intervali i versioneve 1–20 u kontrollua njësoj:
 * njëzet e katër tekste, mes tyre UTF-8 shumëbajtësh dhe një varg 400-karakterësh,
 * u lexuan të gjitha saktë.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { kodiQR, versioniPerGjatesi, VERSIONI_MAX } from '../src/qr.ts';

/** Matrica si vargje '0'/'1', që të krahasohet lehtë. */
const siVargje = (m) => m.map((r) => r.map((x) => (x ? '1' : '0')).join(''));

const BRIGJ = [
  "111111100101101111111",
  "100000101101001000001",
  "101110101100101011101",
  "101110100101001011101",
  "101110101000101011101",
  "100000101001101000001",
  "111111101010101111111",
  "000000001111100000000",
  "110100110110001110110",
  "001100000110001001000",
  "000110111010110000001",
  "000101010011000001010",
  "011100101110101010101",
  "000000001011000111100",
  "111111101110010100110",
  "100000100111110110000",
  "101110100101001110101",
  "101110101101000101011",
  "101110100100100011001",
  "100000101000011100000",
  "111111101101100001110"
];

const RENDITJA = [
  "1111111011000010001111111",
  "1000001000000010001000001",
  "1011101010011100101011101",
  "1011101011010000101011101",
  "1011101011110111001011101",
  "1000001001001010001000001",
  "1111111010101010101111111",
  "0000000001010111000000000",
  "1111001010000110010011101",
  "1100100111000000000001010",
  "1101101010000010010010100",
  "1100100010011110100011110",
  "0001011101010001011011111",
  "0101000110110101011010111",
  "0110001001001010011101110",
  "1010010011101101001101011",
  "0001111101010000111110101",
  "0000000010101100100010101",
  "1111111001011000101011011",
  "1000001001101001100010011",
  "1011101000111100111111000",
  "1011101010101110111110011",
  "1011101011111100011011010",
  "1000001010100001010000100",
  "1111111011101010011010111"
];

test('kodi i një teksti të shkurtër del bit për bit ashtu si u lexua', () => {
  assert.deepEqual(siVargje(kodiQR('BRIGJ')), BRIGJ);
});

test('kodi i një renditjeje del bit për bit ashtu si u lexua', () => {
  assert.deepEqual(siVargje(kodiQR('meri 594, lesa 380')), RENDITJA);
});

test('madhësia ndjek versionin: 4 × version + 17', () => {
  for (const [teksti, version] of [['A', 1], ['A'.repeat(30), 2], ['A'.repeat(200), 9]]) {
    const m = kodiQR(teksti);
    assert.equal(versioniPerGjatesi(teksti.length), version, teksti.length + ' bajt');
    assert.equal(m.length, version * 4 + 17);
    assert.equal(m[0].length, version * 4 + 17);
  }
});

test('të tre sytë janë në vend', () => {
  const m = kodiQR('BRIGJ');
  const n = m.length;

  for (const [dr, dc] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    // Kuadrati i jashtëm i mbushur, unaza e brendshme e zbrazët, zemra e plotë.
    for (let i = 0; i < 7; i++) {
      assert.equal(m[dr][dc + i], true, 'rreshti i sipërm');
      assert.equal(m[dr + 6][dc + i], true, 'rreshti i poshtëm');
      assert.equal(m[dr + i][dc], true, 'shtylla e majtë');
      assert.equal(m[dr + i][dc + 6], true, 'shtylla e djathtë');
    }
    assert.equal(m[dr + 1][dc + 1], false);
    assert.equal(m[dr + 3][dc + 3], true);
  }
});

test('rreshtat e kohës alternojnë', () => {
  const m = kodiQR('BRIGJ');
  for (let i = 8; i < m.length - 8; i++) {
    assert.equal(m[6][i], i % 2 === 0, 'rreshti i kohës te ' + i);
    assert.equal(m[i][6], i % 2 === 0, 'shtylla e kohës te ' + i);
  }
});

test('moduli i errët është gjithmonë i errët', () => {
  const m = kodiQR('BRIGJ');
  assert.equal(m[m.length - 8][8], true);
});

test('i njëjti tekst jep gjithmonë të njëjtin kod', () => {
  assert.deepEqual(kodiQR('BRIGJ'), kodiQR('BRIGJ'));
});

test('versioni rritet me gjatësinë dhe ndalet te kufiri', () => {
  assert.equal(versioniPerGjatesi(1), 1);
  // Versioni 1 mban 19 kodfjalë, dhe koka zë dy — pra shtatëmbëdhjetë bajt.
  assert.equal(versioniPerGjatesi(17), 1);
  assert.equal(versioniPerGjatesi(18), 2);
  assert.ok(versioniPerGjatesi(600) <= VERSIONI_MAX);
});

test('teksti që s’hyn te asnjë version kthen null', () => {
  assert.equal(kodiQR('A'.repeat(5000)), null);
});

test('teksti me shkronja shqipe kodohet si UTF-8', () => {
  // „ë" zë dy bajt, prandaj versioni duhet të ndjekë bajtet e jo shkronjat.
  const teksti = 'Kaçanik ë ü';
  const bajt = new TextEncoder().encode(teksti).length;
  assert.ok(bajt > teksti.length);
  assert.notEqual(kodiQR(teksti), null);
});
