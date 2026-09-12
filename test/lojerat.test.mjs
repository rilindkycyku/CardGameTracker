/**
 * Provat e regjistrit të lojërave.
 *
 * Ky skedar mban atë që e ndan njërën lojë nga tjetra, dhe pikërisht prandaj një
 * gabim aty nuk duket si gabim: një shkronjë e përsëritur e lexon paketën e
 * dominës si bridzh, një drejtim i shkruar mbrapsht e shpall fitues atë që
 * mbeti i fundit. Të dyja dalin numra krejt të besueshëm në ekran.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DORA_E_PISHPIRIKUT,
  KUFIJTE_E_DOMINES,
  KUFIJTE_E_PISHPIRIKUT,
  KUFIRI_I_DOMINES,
  KUFIRI_I_PISHPIRIKUT,
  PIKET_E_PISHPIRIKUT,
  PIKET_E_PISHPIRIKUT_ME_FANT,
  LOJERAT,
  RADHA,
  arritiKufirin,
  llojiNgaShenja,
  rregullat,
} from '../src/lojerat.ts';
import { FJALA } from '../src/magareci.ts';

test('çdo lojë e regjistrit ka shkronjën e vet', () => {
  // Dy lojëra me të njëjtën shkronjë do të thoshte se një paketë e ndarë lexohet
  // si loja tjetër — me numra që duken të mirë dhe fitues të gabuar.
  const shenjat = RADHA.map((lloji) => LOJERAT[lloji].shenja);

  assert.equal(new Set(shenjat).size, shenjat.length);
  for (const shenja of shenjat) assert.equal(shenja.length, 1);
});

test('radha i mban të katërt, dhe secili e njeh veten', () => {
  assert.deepEqual(RADHA, ['bridzh', 'magarec', 'domina', 'pishpirik']);
  for (const lloji of RADHA) assert.equal(rregullat(lloji).lloji, lloji);
});

test('shkronja e paketës kthen llojin, dhe e panjohura kthen null', () => {
  assert.equal(llojiNgaShenja('b'), 'bridzh');
  assert.equal(llojiNgaShenja('m'), 'magarec');
  assert.equal(llojiNgaShenja('d'), 'domina');
  assert.equal(llojiNgaShenja('p'), 'pishpirik');

  // Një shkronjë e panjohur vjen nga një version më i ri. Leximi i saj si bridzh
  // do të tregonte pikët e një loje tjetër pa e thënë kush.
  assert.equal(llojiNgaShenja('x'), null);
  assert.equal(llojiNgaShenja(''), null);
});

test('vetëm bridzhi e numëron mbrëmjen me raunde', () => {
  // Gjatësia prej dy raundesh për lojtar është e bridzhit e vetëm; tri të tjerat
  // mbarojnë kur dikush e arrin kufirin e pikëve (pika 13).
  assert.equal(rregullat('bridzh').raundePerLojtar, 2);
  assert.equal(rregullat('magarec').raundePerLojtar, null);
  assert.equal(rregullat('domina').raundePerLojtar, null);
  assert.equal(rregullat('pishpirik').raundePerLojtar, null);
});

test('vetëm pishpiriku fitohet me totalin më të madh', () => {
  assert.equal(rregullat('pishpirik').drejtimi, 'larte');
  for (const lloji of ['bridzh', 'magarec', 'domina']) {
    assert.equal(rregullat(lloji).drejtimi, 'poshte');
  }
});

test('kufiri i magarecit është vetë fjala', () => {
  // Shtatë shkronjat janë i njëjti rregull parë nga ana e numrit, prandaj nuk
  // shkruhen dy herë: nëse fjala ndërrohet, kufiri e ndjek vetvetiu.
  assert.equal(rregullat('magarec').kufiriITotalit, FJALA.length);
});

test('kufiri arrihet nga totali, pavarësisht se kush e arrin', () => {
  assert.equal(arritiKufirin(KUFIRI_I_DOMINES, { alfa: 61, beta: 44 }), false);
  assert.equal(arritiKufirin(KUFIRI_I_DOMINES, { alfa: 100, beta: 44 }), true);
  assert.equal(arritiKufirin(KUFIRI_I_DOMINES, { alfa: 140, beta: 44 }), true);

  assert.equal(arritiKufirin(KUFIRI_I_PISHPIRIKUT, { alfa: 88, beta: 74 }), false);
  assert.equal(arritiKufirin(KUFIRI_I_PISHPIRIKUT, { alfa: 120, beta: 74 }), true);

  // `null` do të thotë «pa kufi»: as bridzhi, as një mbrëmje domine e nisur
  // pa kufi, nuk mbaron vetvetiu sado të rriten totalet.
  assert.equal(arritiKufirin(null, { alfa: 900 }), false);
});

test('kufijtë e zgjedhshëm i ka vetëm loja ku janë marrëveshje', () => {
  /*
   * Te domina e pishpiriku deri ku luhet e vendos tavolina para se të ndahen
   * letrat, prandaj ekrani i ofron. Te bridzhi mbaron numri i raundeve, dhe te
   * magareci fjala ka shtatë shkronja — një çelës «deri te pesë shkronja» do
   * të shpikte një lojë tjetër.
   */
  assert.deepEqual(rregullat('domina').kufijteEMundshem, KUFIJTE_E_DOMINES);
  assert.deepEqual(rregullat('pishpirik').kufijteEMundshem, KUFIJTE_E_PISHPIRIKUT);
  assert.deepEqual(rregullat('bridzh').kufijteEMundshem, []);
  assert.deepEqual(rregullat('magarec').kufijteEMundshem, []);

  // Parazgjedhja e secilës rri brenda listës që i ofrohet, që çelësi të mos
  // hapet me një vlerë që nuk e ka asnjë buton.
  for (const lloji of ['domina', 'pishpirik']) {
    const r = rregullat(lloji);
    assert.ok(r.kufijteEMundshem.includes(r.kufiriITotalit), lloji);
  }
});

test('parashikimi premtohet vetëm atje ku kufijtë e një raundi dihen', () => {
  // Bridzhi dhe magareci veçojnë saktësisht një lojtar për raund, prandaj një
  // raund ka kufij të numërueshëm. Te domina e pishpiriku një dorë u jep pikë
  // disave njëherësh, dhe sa — atë nuk e thotë rregulli (pika 12).
  assert.equal(rregullat('bridzh').parashikimi, true);
  assert.equal(rregullat('magarec').parashikimi, true);
  assert.equal(rregullat('domina').parashikimi, false);
  assert.equal(rregullat('pishpirik').parashikimi, false);
});

test('shlyerja vlen atje ku diferenca paguhet', () => {
  // Te magareci diferenca është në shkronja, te pishpiriku është rrugë drejt
  // 101-shit. As njëra as tjetra nuk nxirret nga xhepi.
  assert.equal(rregullat('bridzh').shlyerja, true);
  assert.equal(rregullat('domina').shlyerja, true);
  assert.equal(rregullat('magarec').shlyerja, false);
  assert.equal(rregullat('pishpirik').shlyerja, false);
});

test('llogaritësi mbetet i bridzhit, sepse vetëm ai ka formulë', () => {
  assert.equal(rregullat('bridzh').llogaritesi, true);
  for (const lloji of ['magarec', 'domina', 'pishpirik']) {
    assert.equal(rregullat(lloji).llogaritesi, false);
  }
});

test('numrat e pishpirikut janë ata të rregullave të tij', () => {
  /*
   * Këta tre numra dalin te ekrani si shënim nën fushat, prandaj një numër i
   * gabuar aty nuk prish asnjë llogari — mëson gabim një tavolinë të tërë.
   *
   * Burimi është pishpirik.com: njëzet e pesë pikë për dorë (njëzet e dy nga
   * letrat, tri për shumicën), dhjetë për një pishpirik, dhe pesëmbëdhjetë kur
   * letra që e bën është fant. Pesëmbëdhjeta është ajo që ngatërrohet: faqet e
   * pishtit turk shkruajnë njëzet, dhe ai numër hyri një herë edhe këtu.
   */
  assert.equal(DORA_E_PISHPIRIKUT, 25);
  assert.equal(PIKET_E_PISHPIRIKUT, 10);
  assert.equal(PIKET_E_PISHPIRIKUT_ME_FANT, 15);

  // Dhe shënimi që lexon përdoruesi i mban të tre, e nuk ka numra të vetët.
  const shenimi = rregullat('pishpirik').shenimi;
  for (const numri of [25, 10, 15]) {
    assert.match(shenimi, new RegExp(String(numri)), `mungon ${numri}`);
  }
});

/* ── Rregullat e shkruara për tavolinën ─────────────────────────────────── */

test('çdo lojë i ka rregullat e veta të shkruara', () => {
  /*
   * Deri tani ato rrinin te README-ja, pra jashtë telefonit. Një lojë e pestë e
   * shtuar nesër pa këtë fushë do të dilte me një panel të zbrazët — dhe ajo
   * nuk duket si gabim, duket si lojë pa rregulla.
   */
  for (const lloji of RADHA) {
    const r = rregullat(lloji);
    assert.ok(r.hollesite.length >= 3, `${lloji}: shumë pak rreshta`);
    assert.ok(r.shenimi, `${lloji}: pa shënim nën fushat`);

    for (const rreshti of r.hollesite) {
      assert.match(rreshti, /\S/);
      // Çdo rresht është fjali e mbyllur: paneli lexohet si tekst, jo si listë
      // fjalësh të prera.
      assert.match(rreshti, /\.$/, `${lloji}: rreshti nuk mbaron me pikë`);
    }
  }
});

test('kufiri i mbrëmjes nuk shkruhet te teksti i rregullave', () => {
  /*
   * Deri ku luhet e zgjedh tavolina për çdo mbrëmje (pika 13), prandaj një
   * numër i ngrirë te teksti do të thoshte «mbaron te 100» mbi një fletë të
   * nisur deri te 250 — pra do të gënjente pikërisht atë që sapo e zgjodhi
   * vetë. Numrat e rregullit (51-shi, 25-a, 10-a) nuk preken nga kjo: ata nuk
   * ndryshojnë nga mbrëmja në mbrëmje.
   */
  for (const lloji of RADHA) {
    const r = rregullat(lloji);
    const teksti = [r.rregulli, r.shenimi ?? '', ...r.hollesite].join(' ');
    const kufijte = [...r.kufijteEMundshem];

    for (const kufiri of kufijte) {
      assert.doesNotMatch(
        teksti,
        new RegExp(`(^|[^0-9])${kufiri}([^0-9]|$)`),
        `${lloji}: kufiri ${kufiri} rri i shkruar te teksti`,
      );
    }
  }
});

test('rregullat e pishpirikut i mbajnë të tre numrat e dorës', () => {
  // I njëjti kusht si te shënimi, por te teksti i gjatë: aty shkruhet edhe
  // pse fanti e ndryshon numrin, dhe ai është rreshti që pyetet te tavolina.
  const teksti = rregullat('pishpirik').hollesite.join(' ');

  for (const numri of [DORA_E_PISHPIRIKUT, PIKET_E_PISHPIRIKUT, PIKET_E_PISHPIRIKUT_ME_FANT]) {
    assert.match(teksti, new RegExp(String(numri)), `mungon ${numri}`);
  }
});

test('rregullat e magarecit e numërojnë fjalën nga vetë fjala', () => {
  // `MAGAREC` shkruhet një herë (`magareci.ts`); një numër i shkruar me dorë
  // këtu do të mbetej shtatë edhe po t'i ndërrohej fjala.
  const teksti = rregullat('magarec').hollesite.join(' ');

  assert.match(teksti, new RegExp(FJALA));
  assert.match(teksti, new RegExp(String(FJALA.length)));
});
