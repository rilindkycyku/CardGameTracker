/**
 * Provat e ndarjes së rezultatit.
 *
 * Gjendja shkon nga një telefon te tjetri brenda vetë adresës, prandaj ajo
 * adresë është e vetmja gjë që mban rezultatin gjatë rrugës. Nëse paketimi
 * këput një emër me presje ose e humb një total, kush skanon shikon numra të
 * gabuar dhe nuk ka nga t'i kontrollojë.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  paketo,
  shpaketo,
  pamjaELojes,
  adresaEPamjes,
  tekstiINdarjes,
  VERSIONI,
} from '../src/ndarja.ts';
import { ne64Tekst, nenshkruaj } from '../src/paketa.ts';

const PAMJA = {
  grupi: 'Brigj',
  lloji: 'bridzh',
  kufiri: null,
  data: '2026-03-08',
  raunde: 7,
  totalet: [
    ['alfa', 594],
    ['beta', 380],
    ['gama', 237],
    ['delta', 91],
  ],
};

test('pamja mbijeton paketimin e kthimin', () => {
  assert.deepEqual(shpaketo(paketo(PAMJA)), PAMJA);
});

test('paketa është e sigurt për një adresë', () => {
  // Asgjë që do t’i duhej ikje brenda hash-it, dhe asgjë që e rrit kodin QR.
  assert.match(paketo(PAMJA), /^[A-Za-z0-9_-]+$/);
});

test('emrat me presje, dy pika e shenja mbijetojnë', () => {
  // Te fleta e vjetër ka skuadra si „alfa + zeta"; një ndarës brenda emrit do
  // ta këpusë paketën në vendin e gabuar.
  const pamja = {
    ...PAMJA,
    totalet: [
      ['alfa + zeta', 120],
      ['a,b', -20],
      ['c:d', 0],
      ['ë ü ç', 33],
      ['e|f', 5],
    ],
  };

  assert.deepEqual(shpaketo(paketo(pamja)), pamja);
});

test('paketa e shkruar me ikjen e vjetër lexohet ende', () => {
  // Ikja u ngushtua te tri shenjat e ndarësve, dhe kjo e mban të matur se
  // ngushtimi nuk e ndau leximin nga shkrimi: një adresë e shkruar nga versioni
  // i djeshëm — ku çdo hapësirë ishte `%20` — lexohet njësoj si sot.
  const trupi =
    '2|b|Shoq%C3%ABria%20e%20mbr%C3%ABmjes|2026-03-08|7|alfa%20%2B%20zeta:594,b%C3%ABta:380';

  assert.deepEqual(shpaketo(ne64Tekst(nenshkruaj(trupi))), {
    grupi: 'Shoqëria e mbrëmjes',
    lloji: 'bridzh',
    kufiri: null,
    data: '2026-03-08',
    raunde: 7,
    totalet: [['alfa + zeta', 594], ['bëta', 380]],
  });
});

test('emrat shqip nuk e fryjnë paketën me ikje të panevojshme', () => {
  // Trupi kalon nëpër base64 para adresës, prandaj vetëm ndarësit kërkojnë
  // ikje. Kur u ikte të gjithave, një `ë` zinte gjashtë bajte në vend të dy dhe
  // paketa dilte një e gjashta më e gjatë — dhe ajo e gjashta del te modulet e
  // kodit QR, pikërisht atje ku kodi duhet skanuar nga ekrani i një telefoni.
  const pamja = {
    ...PAMJA,
    grupi: 'Shoqëria e mbrëmjes',
    totalet: [
      ['Gëzim', 120],
      ['Përparim', 200],
      ['alfa + zeta', 40],
    ],
  };

  const kodi = paketo(pamja);

  assert.deepEqual(shpaketo(kodi), pamja);
  // Me `encodeURIComponent` kjo paketë dilte 148 karaktere; tani del 114.
  assert.ok(kodi.length <= 120, `paketa doli ${kodi.length} karaktere`);
});

test('totalet negative dhe zeroja kalojnë ashtu si janë', () => {
  const pamja = { ...PAMJA, totalet: [['a', -205], ['b', 0], ['c', 1000]] };
  assert.deepEqual(shpaketo(paketo(pamja)).totalet, pamja.totalet);
});

test('dy lojtarë me të njëjtin total mbajnë radhën', () => {
  const pamja = { ...PAMJA, totalet: [['a', 0], ['b', 0]] };
  assert.deepEqual(shpaketo(paketo(pamja)).totalet, [['a', 0], ['b', 0]]);
});

test('teksti i gjymtë refuzohet, jo lexohet përgjysmë', () => {
  const plote = paketo(PAMJA);

  assert.equal(shpaketo(''), null);
  assert.equal(shpaketo('jo-base64!!'), null);
  assert.equal(shpaketo(plote.slice(0, 8)), null);
  assert.equal(shpaketo(plote.slice(4)), null);
});

test('versioni i panjohur refuzohet', () => {
  const i_huaj = paketo(PAMJA).replace(/^./, '');
  assert.equal(shpaketo(i_huaj), null);
  // Dhe versioni rri i shkruar te paketa, që kjo provë të ketë kuptim.
  assert.equal(VERSIONI, 2);
});

test('magareci paketohet si magarec, jo si bridzh', () => {
  // Numri është i njëjti bajt te të dyja lojërat — pikë a shkronja — prandaj
  // pa këtë fushë ana që shikon do t'i vizatonte shkronjat si pikë.
  const pamja = {
    grupi: 'Brigj',
    lloji: 'magarec',
    kufiri: null,
    data: '2026-09-10',
    raunde: 9,
    totalet: [['alfa', 7], ['epsilon', 2]],
  };

  assert.deepEqual(shpaketo(paketo(pamja)), pamja);
});

test('adresa e versionit të parë lexohet ende, si bridzh', () => {
  // Ajo adresë rri te një bisedë e dje; versioni 1 nuk e mbante llojin sepse
  // atëherë kishte vetëm bridzh.
  const trupi = '1|Brigj|2026-03-08|7|alfa:594,beta:380';
  const i_vjeter = ne64Tekst(nenshkruaj(trupi));

  assert.deepEqual(shpaketo(i_vjeter), {
    grupi: 'Brigj',
    lloji: 'bridzh',
    kufiri: null,
    data: '2026-03-08',
    raunde: 7,
    totalet: [['alfa', 594], ['beta', 380]],
  });
});

test('adresa e versionit të parë e prerë refuzohet ende', () => {
  const plote = ne64Tekst(nenshkruaj('1|Brigj|2026-03-08|7|alfa:594,beta:105'));

  for (const sa of [1, 2, 3, 4, 8]) {
    assert.equal(shpaketo(plote.slice(0, -sa)), null, `−${sa} karaktere`);
  }
});

test('lloji i panjohur brenda paketës refuzohet', () => {
  const trupi = '2|x|Brigj|2026-03-08|7|alfa:594';
  assert.equal(shpaketo(ne64Tekst(nenshkruaj(trupi))), null);
});

test('data e formës së gabuar refuzohet', () => {
  const gabim = { ...PAMJA, data: '8 mars 2026' };
  assert.equal(shpaketo(paketo(gabim)), null);
});

test('pamja pa asnjë lojtar refuzohet', () => {
  assert.equal(shpaketo(paketo({ ...PAMJA, totalet: [] })), null);
});

test('pamja e një loje merr totalet e lojtarëve të saj', () => {
  const loja = {
    id: 1,
    groupId: 1,
    date: '2026-03-08',
    selectedPlayers: ['alfa', 'beta'],
    createdAt: 0,
  };

  assert.deepEqual(pamjaELojes('Brigj', loja, { alfa: 594, beta: 380 }, 7), {
    grupi: 'Brigj',
    lloji: 'bridzh',
    kufiri: null,
    data: '2026-03-08',
    raunde: 7,
    totalet: [['alfa', 594], ['beta', 380]],
  });
});

test('pamja e një loje magareci e mban llojin e saj', () => {
  const loja = {
    id: 2,
    groupId: 1,
    date: '2026-09-10',
    selectedPlayers: ['alfa', 'beta'],
    createdAt: 0,
    lloji: 'magarec',
  };

  assert.equal(pamjaELojes('Brigj', loja, { alfa: 7, beta: 3 }, 10).lloji, 'magarec');
});

test('adresa e pamjes nuk dyfishon pjerrësa', () => {
  for (const rrenja of [
    'https://bridzh.app',
    'https://bridzh.app/',
    'https://bridzh.app/#/loja/3',
    'https://bridzh.app/#',
  ]) {
    const adresa = adresaEPamjes(rrenja, PAMJA);
    assert.match(adresa, /^https:\/\/bridzh\.app\/#\/shiko\/[A-Za-z0-9_-]+$/, rrenja);
  }
});

test('adresa e pamjes lexohet prapa', () => {
  const adresa = adresaEPamjes('https://bridzh.app', PAMJA);
  const kodi = adresa.slice(adresa.indexOf('/#/shiko/') + '/#/shiko/'.length);
  assert.deepEqual(shpaketo(kodi), PAMJA);
});

test('teksti i ndarjes i mban emrat dhe totalet', () => {
  const teksti = tekstiINdarjes(PAMJA, [
    { rank: 1, player: 'delta', total: 91 },
    { rank: 2, player: 'alfa', total: 594 },
  ]);

  assert.match(teksti, /Brigj/);
  // Data me fjalë: teksti shkon te një bisedë, e lexohet pa faqen.
  assert.match(teksti, /8 mars 2026/);
  assert.doesNotMatch(teksti, /2026-03-08/);
  // Te bridzhi numri vjen me gjithsejin, që të thotë edhe sa ka mbetur.
  assert.match(teksti, /7 nga 8 raunde/);
  assert.match(teksti, /1\. delta 91/);
  assert.match(teksti, /2\. alfa 594/);
});

test('teksti i magarecit nuk e shpik një gjithsej raundesh', () => {
  // Magareci mbaron kur mbushet fjala, e jo pas dy raundeve për lojtar.
  const teksti = tekstiINdarjes({ ...PAMJA, lloji: 'magarec', raunde: 10 }, [
    { rank: 1, player: 'delta', total: 0 },
  ]);

  assert.match(teksti, /10 raunde/);
  assert.doesNotMatch(teksti, /nga \d+ raunde/);
});

test('teksti i magarecit shkruan fjalën, jo numrin', () => {
  // «3» nuk thotë asgjë vetëm; «MAG» e thotë sa i ka mbetur.
  const teksti = tekstiINdarjes(
    { ...PAMJA, lloji: 'magarec', raunde: 10 },
    [
      { rank: 1, player: 'delta', total: 0 },
      { rank: 2, player: 'alfa', total: 3 },
      { rank: 3, player: 'lumi', total: 7 },
    ],
  );

  assert.match(teksti, /Magarec/);
  assert.match(teksti, /1\. delta —/);
  assert.match(teksti, /2\. alfa MAG/);
  assert.match(teksti, /3\. lumi MAGAREC/);
});

test('paketa e një loje me gjashtë lojtarë mbetet e shkurtër', () => {
  // Nën dyqind bajt do të thotë kod QR nën versionin 10, që skanohet ende nga
  // ekrani i një telefoni. Raundet do ta shumëfishonin këtë.
  const gjashte = {
    grupi: 'Brigj',
    lloji: 'bridzh',
    kufiri: null,
    data: '2026-03-08',
    raunde: 11,
    totalet: [
      ['alfa', 918], ['epsilon', 874], ['Lambda', 186],
      ['jota', 774], ['Mi', 968], ['delta', 887],
    ],
  };

  assert.ok(paketo(gjashte).length < 200, `${paketo(gjashte).length} karaktere`);
  assert.deepEqual(shpaketo(paketo(gjashte)), gjashte);
});

test('adresa e prerë refuzohet, jo lexohet me numra të gabuar', () => {
  // Pa nënshkrim, prerja e katër karaktereve e kthente totalin e lojtarit të
  // fundit nga 105 në 0 — dhe atë lojtar në fitues. Kjo pamje shërben për t’u
  // shlyer mes vete: një numër i gabuar në heshtje është më i keq se një
  // lidhje që thotë hapur «nuk lexohem».
  const pamja = {
    grupi: 'Brigj',
    lloji: 'bridzh',
    kufiri: null,
    data: '2026-09-10',
    raunde: 2,
    totalet: [['alfa', 42], ['Mi', 200], ['delta', 105]],
  };
  const plote = paketo(pamja);

  assert.deepEqual(shpaketo(plote), pamja);
  for (const sa of [1, 2, 3, 4, 8, 12]) {
    assert.equal(shpaketo(plote.slice(0, -sa)), null, `−${sa} karaktere`);
  }
});

test('një total i ndryshuar me dorë refuzohet', () => {
  // Nënshkrimi nuk mbron nga dashakeqi — kushdo e rillogarit — por e kap
  // ndryshimin e rastit, atë që bëhet duke redaktuar adresën me gisht.
  const pamja = {
    grupi: 'A',
    lloji: 'bridzh',
    data: '2026-01-01',
    raunde: 1,
    totalet: [['a', 10]],
  };
  const plote = paketo(pamja);

  let ndryshuar = null;
  for (let i = plote.length - 1; i >= 0; i--) {
    const shkronja = plote[i] === 'A' ? 'B' : 'A';
    const kandidati = plote.slice(0, i) + shkronja + plote.slice(i + 1);
    if (shpaketo(kandidati) !== null) {
      ndryshuar = kandidati;
      break;
    }
  }

  assert.equal(ndryshuar, null, 'asnjë karakter i ndërruar nuk duhet të kalojë');
});

/* ── Lojërat e reja brenda paketës ───────────────────────────────────────── */

test('paketa e mban llojin e dominës dhe të pishpirikut', () => {
  // Numri është i njëjti bajt te të katër lojërat. Pa këtë fushë, `88` te një
  // paketë pishpiriku do të lexohej pikë bridzhi — dhe fituesi do të dilte ai
  // me më pak, pra pikërisht i fundit.
  for (const lloji of ['domina', 'pishpirik']) {
    const dala = shpaketo(paketo({ ...PAMJA, lloji }));
    assert.equal(dala.lloji, lloji, lloji);
    assert.deepEqual(dala.totalet, PAMJA.totalet, lloji);
  }
});

test('secila lojë merr shkronjën e vet brenda trupit', () => {
  const shenjat = new Set();

  for (const lloji of ['bridzh', 'magarec', 'domina', 'pishpirik']) {
    const trupi = Buffer.from(
      paketo({ ...PAMJA, lloji }).replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf8');

    shenjat.add(trupi.split('|')[1]);
  }

  assert.equal(shenjat.size, 4);
});

test('teksti i pishpirikut e shkruan emrin e lojës dhe raundet e thjeshta', () => {
  // «5 nga 8 raunde» vlen vetëm te bridzhi: vetëm atje gjatësia numërohet me
  // raunde. Dhe pa emrin e lojës, një listë e ngjitur te një bisedë do të
  // lexohej bridzh — ku fiton ai me më pak.
  const teksti = tekstiINdarjes(
    { ...PAMJA, lloji: 'pishpirik', raunde: 5 },
    [
      { rank: 1, player: 'beta', total: 88 },
      { rank: 2, player: 'alfa', total: 41 },
    ],
  );

  assert.match(teksti, /Pishpirik/);
  assert.match(teksti, /5 raunde/);
  assert.doesNotMatch(teksti, /nga \d+ raunde/);
  assert.match(teksti, /1\. beta 88/);
});

/* ── Kufiri i mbrëmjes brenda fushës së llojit ───────────────────────────── */

test('kufiri i mbrëmjes udhëton bashkë me llojin', () => {
  // Ana që shikon nuk ka nga ta dijë ndryshe se deri ku luhej — dhe pa të,
  // rreshti «edhe 39 deri te 100» do të shkruante kufirin e parazgjedhur mbi
  // një mbrëmje që u nis deri te 250.
  for (const [lloji, kufiri] of [
    ['domina', 100],
    ['domina', 250],
    ['pishpirik', 120],
    ['domina', 0],
  ]) {
    const pamja = { ...PAMJA, lloji, kufiri };
    assert.deepEqual(shpaketo(paketo(pamja)), pamja, `${lloji} ${kufiri}`);
  }
});

test('bridzhi dhe magareci mbeten një shkronjë e vetme', () => {
  /*
   * Kjo është arsyeja pse kufiri hipi te fusha e llojit e nuk u bë fushë e
   * vetja: paketat e tyre mbeten fjalë për fjalë ato që ishin, prandaj një
   * aplikacion i djeshëm i lexon si më parë. Një fushë e shtuar do t'i kishte
   * refuzuar të gjitha.
   */
  for (const lloji of ['bridzh', 'magarec']) {
    const trupi = Buffer.from(
      paketo({ ...PAMJA, lloji, kufiri: null })
        .replace(/-/g, '+')
        .replace(/_/g, '/'),
      'base64',
    ).toString('utf8');

    assert.equal(trupi.split('|')[1].length, 1, lloji);
  }
});

test('shifrat e pabesueshme te lloji refuzohen', () => {
  // Fusha vjen nga kushdo që të tregon një kod QR. Alfabeti rri i ngushtë këtu
  // si kudo tjetër: një shkronjë, dhe së shumti katër shifra.
  for (const fusha of ['d12345', 'd-1', 'd 100', 'dd', 'd1e3', '1', 'D100']) {
    const trupi = `2|${fusha}|Brigj|2026-03-08|4|alfa:12`;
    assert.equal(shpaketo(ne64Tekst(nenshkruaj(trupi))), null, fusha);
  }
});
