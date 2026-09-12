/**
 * Provat e kodit të bashkimit.
 *
 * Kodi shkruhet me dorë dhe diktohet me zë, prandaj gabimi i vërtetë tek ky
 * modul nuk është matematika — është `O` e lexuar si zero, ose një vijë e futur
 * ku nuk pritej. Provat maten kundër atyre.
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  ALFABETI,
  GJATESIA,
  PROVAT_E_VIZITORIT,
  adresaEBashkimit,
  idIStrehuesit,
  kodiNgaBajtet,
  lexoKodin,
  pritjaEProves,
  serverat,
  shfaqKodin,
  shpjegimi,
  veprimiPasGabimit,
} from '../src/kodi.ts';

test('alfabeti nuk mban shkronja që ngatërrohen', () => {
  assert.equal(ALFABETI.length, 32);
  for (const shkronja of ['I', 'L', 'O', 'U']) {
    assert.ok(!ALFABETI.includes(shkronja), `${shkronja} nuk duhet të rrijë`);
  }
  // Pa dyfishime: një alfabet me dy të njëjta do ta ulte hapësirën në heshtje.
  assert.equal(new Set(ALFABETI).size, 32);
});

test('bajtet bëhen kod, dhe asnjë shkronjë nuk anon', () => {
  assert.equal(kodiNgaBajtet(new Uint8Array(8)), '00000000');
  assert.equal(kodiNgaBajtet(new Uint8Array([31, 31, 31, 31, 31, 31, 31, 31])), 'ZZZZZZZZ');

  // Një bajt jep pikërisht tetë vlera për secilën shkronjë (256 = 32 × 8).
  const sa = new Map();
  for (let bajt = 0; bajt < 256; bajt++) {
    const shkronja = kodiNgaBajtet(new Uint8Array(8).fill(bajt))[0];
    sa.set(shkronja, (sa.get(shkronja) ?? 0) + 1);
  }
  assert.equal(sa.size, 32);
  for (const [shkronja, numri] of sa) assert.equal(numri, 8, shkronja);
});

test('bajte të pamjaftueshme nuk jepin kod gjysmak', () => {
  for (let sa = 0; sa < GJATESIA; sa++) {
    assert.equal(kodiNgaBajtet(new Uint8Array(sa)), null, `${sa} bajte`);
  }
});

test('kodi tregohet me vijë në mes', () => {
  assert.equal(shfaqKodin('A3F27KQM'), 'A3F2-7KQM');
});

test('kodi lexohet ashtu si shkruhet me nxitim', () => {
  const pritur = 'A3F27KQM';

  for (const shkrimi of [
    'A3F27KQM',
    'A3F2-7KQM',
    'a3f2-7kqm',
    '  A3F2 7KQM  ',
    'a3f2 7kqm',
    'A3F2—7KQM',
  ]) {
    assert.equal(lexoKodin(shkrimi), pritur, JSON.stringify(shkrimi));
  }
});

test('shkronjat që ngatërrohen kthehen prapa', () => {
  // `O` lexohet zero, `I` dhe `L` lexohen njësh — ashtu si i shkruan dora.
  assert.equal(lexoKodin('OOOOIIII'), '00001111');
  assert.equal(lexoKodin('ooooLLLL'), '00001111');
  assert.equal(lexoKodin('0O1I1L0O'), '00111100');
});

test('kodi nxjerrohet edhe nga adresa e plotë', () => {
  assert.equal(
    lexoKodin('http://192.168.1.5:5173/#/bashkohu/A3F27KQM'),
    'A3F27KQM',
  );
  // Ngjitja nga një bisedë sjell edhe tekst përreth.
  assert.equal(
    lexoKodin('shiko: http://192.168.1.5:5173/#/bashkohu/a3f27kqm faleminderit'),
    'A3F27KQM',
  );
  // Pa këtë hap, shkronjat e «bashkohu» do të hynin te kodi.
  assert.notEqual(lexoKodin('http://x/#/bashkohu/A3F27KQM'), null);
});

test('çka nuk është kod nuk lexohet', () => {
  for (const teksti of [
    '',
    '   ',
    'A3F27KQ',        // shtatë
    'A3F27KQMM',       // nëntë
    'A3F27KQU',        // `U` nuk rri te alfabeti
    'jo kod fare',
    'http://192.168.1.5:5173/#/loja/3',
    '--------',
  ]) {
    assert.equal(lexoKodin(teksti), null, JSON.stringify(teksti));
  }
});

test('çdo kod i lëshuar lexohet prapa i njëjti', () => {
  // Rrotullimi mbahet për tërë alfabetin, edhe pas shfaqjes me vijë.
  for (let i = 0; i < 32; i++) {
    const kodi = kodiNgaBajtet(new Uint8Array(8).fill(i));
    assert.equal(lexoKodin(kodi), kodi, kodi);
    assert.equal(lexoKodin(shfaqKodin(kodi)), kodi, kodi);
  }
});

test('emri te serveri mban parathënjen e aplikacionit', () => {
  // Reja publike e PeerJS-it i mban emrat në një hapësirë të përbashkët.
  assert.equal(idIStrehuesit('A3F27KQM'), 'bridzh-A3F27KQM');
});

test('adresa e bashkimit e pret hash-in e vjetër', () => {
  assert.equal(
    adresaEBashkimit('http://192.168.1.5:5173/#/loja/3', 'A3F27KQM'),
    'http://192.168.1.5:5173/#/bashkohu/A3F27KQM',
  );
  assert.equal(
    adresaEBashkimit('https://bridzh.example/nen/faqe/', 'A3F27KQM'),
    'https://bridzh.example/nen/faqe/#/bashkohu/A3F27KQM',
  );
});

/* ── Serveri i sinjalizimit ─────────────────────────────────────────────── */

test('pa `VITE_PEER_SERVER` nuk shkruhet asnjë server', () => {
  // Zbrazët do të thotë reja publike, dhe atë e di PeerJS-i vetë. Një host i
  // shkruar këtu do të ishte një i tretë i ri pa e thënë kush.
  for (const asgje of [undefined, null, '', '   ', ',,', 42]) {
    assert.deepEqual(serverat(asgje), [], JSON.stringify(asgje));
  }
});

test('porta e thotë a është TLS, kur skema nuk e thotë', () => {
  // Serveri i provave rri pa TLS te një portë e vetja…
  assert.deepEqual(serverat('localhost:9000'), [
    { host: 'localhost', port: 9000, path: '/', secure: false },
  ]);

  // …kurse një server publik pa portë lexohet 443, pra me TLS. Deri tani
  // `secure` rrinte `false` gjithmonë, dhe ky rast nuk lidhej dot fare.
  assert.deepEqual(serverat('peer.shembull.org'), [
    { host: 'peer.shembull.org', port: 443, path: '/', secure: true },
  ]);

  assert.deepEqual(serverat('peer.shembull.org:443/rruga'), [
    { host: 'peer.shembull.org', port: 443, path: '/rruga', secure: true },
  ]);
});

test('skema e thënë e mposht portën', () => {
  assert.deepEqual(serverat('http://localhost:9000/myapp'), [
    { host: 'localhost', port: 9000, path: '/myapp', secure: false },
  ]);
  assert.deepEqual(serverat('https://peer.shembull.org'), [
    { host: 'peer.shembull.org', port: 443, path: '/', secure: true },
  ]);
  // Skema e thotë edhe portën e parazgjedhur, kur ajo mungon.
  assert.deepEqual(serverat('http://peer.shembull.org'), [
    { host: 'peer.shembull.org', port: 80, path: '/', secure: false },
  ]);
});

test('serverat lexohen si listë, dhe radha ruhet', () => {
  // Radha është ajo e provave: i pari i pari, pastaj i dyti.
  const lista = serverat('a.shembull.org, http://localhost:9000\nb.shembull.org:8443');

  assert.deepEqual(lista.map((njeri) => njeri.host), [
    'a.shembull.org',
    'localhost',
    'b.shembull.org',
  ]);
  assert.deepEqual(lista.map((njeri) => njeri.port), [443, 9000, 8443]);
  assert.deepEqual(lista.map((njeri) => njeri.secure), [true, false, false]);
});

test('një copë pa host nuk e rrëzon tërë listën', () => {
  // Një presje e tepërt ose një `:9000` i mbetur nuk ka pse ta lërë mbrëmjen
  // pa asnjë server.
  assert.deepEqual(serverat(':9000, peer.shembull.org, /vetem/shteg'), [
    { host: 'peer.shembull.org', port: 443, path: '/', secure: true },
  ]);
});

/* ── Kur lidhja nuk kapet ───────────────────────────────────────────────── */

test('vetëm gabimet që provat nuk i ndreqin e ndalin lidhjen', () => {
  // Rrjeti, priza dhe serveri kthehen vetë — dhe pikërisht ata e linin kodin
  // të vdekur derisa dikush ta rihapte skedën.
  for (const lloji of [
    'network',
    'server-error',
    'socket-error',
    'socket-closed',
    'ssl-unavailable',
    'peer-unavailable',
    'webrtc',
    'disconnected',
    '',
  ]) {
    assert.equal(veprimiPasGabimit(lloji), 'prape', lloji);
  }

  for (const lloji of ['browser-incompatible', 'invalid-id', 'invalid-key']) {
    assert.equal(veprimiPasGabimit(lloji), 'ndal', lloji);
  }

  assert.equal(veprimiPasGabimit('unavailable-id'), 'kodTjeter');
});

test('pritja largohet, dhe pastaj rri', () => {
  // Dështimi i parë është zakonisht priza e telefonit që hyri në xhep, dhe ajo
  // kthehet në çast; pas të pestit shkaku nuk është më i çastit.
  const shkallet = [1, 2, 3, 4, 5, 6].map(pritjaEProves);
  assert.deepEqual(shkallet, [1000, 2000, 4000, 8000, 15000, 30000]);

  // Pas fundit nuk ngjitet më: gjysmë ore mes provave do të ishte sa të mos
  // provohej fare.
  for (const shume of [7, 20, 500]) {
    assert.equal(pritjaEProves(shume), 30000, String(shume));
  }

  // Dhe asnjë vlerë nuk del nën të parën, sado keq të thirret.
  for (const pak of [0, -3]) assert.equal(pritjaEProves(pak), 1000, String(pak));

  // Rritëse: një pritje që bie do t'i shtonte kërkesat pikërisht kur serveri
  // po lëngon.
  for (let i = 1; i < shkallet.length; i++) {
    assert.ok(shkallet[i] > shkallet[i - 1], `shkalla ${i}`);
  }
});

test('ana që shikon provon disa herë, jo pa fund', () => {
  // Telefoni që shikon zakonisht nuk është ai që e nisi mbrëmjen: kur paneli u
  // mbyll, provat e pafundme vetëm pinë baterinë e dikujt që nuk ka çka pret.
  assert.ok(PROVAT_E_VIZITORIT >= 3 && PROVAT_E_VIZITORIT <= 10);
});

test('asnjë gabim nuk del me emrin e tipit në ekran', () => {
  const llojet = [
    'browser-incompatible',
    'network',
    'server-error',
    'socket-error',
    'socket-closed',
    'ssl-unavailable',
    'peer-unavailable',
    'invalid-id',
    'invalid-key',
    'webrtc',
    'unavailable-id',
    'ndonje-gje-e-re',
    '',
  ];

  for (const lloji of llojet) {
    const teksti = shpjegimi(lloji);
    assert.ok(teksti.length > 0, lloji);
    // Emrat e tipeve janë anglisht dhe me vija; ekrani është shqip.
    assert.ok(!teksti.includes('-'), `${lloji}: ${teksti}`);
    assert.ok(!teksti.toLowerCase().includes(lloji.toLowerCase()) || lloji === '', lloji);
  }
});
