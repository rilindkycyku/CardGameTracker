/**
 * Provat e punës pa internet.
 *
 * Një punëtor shërbimi i shkruar gabim nuk duket i gabuar: faqja hapet, numrat
 * dalin, dhe vetëm nesër — te tavolina, pa wifi — shihet se mungonte një skedar,
 * ose se koshi i vjetër po shërben një ekran që nuk ekziston më. Prandaj
 * vendimet e tij rrinë te `sherbimi.ts` dhe maten këtu, e jo te ngjarjet e
 * shfletuesit.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  emriIKoshit,
  koshetEVjetra,
  precachja,
  strategjia,
} from '../src/sherbimi.ts';

/** Manifesti i ndërtimit, ashtu si e shkruan Vite-ja. */
const MANIFESTI = {
  'index.html': {
    file: 'assets/index-abc123.js',
    src: 'index.html',
    isEntry: true,
    css: ['assets/index-def456.css'],
    dynamicImports: ['node_modules/peerjs/dist/bundler.mjs'],
  },
  'node_modules/peerjs/dist/bundler.mjs': {
    file: 'assets/bundler-ghi789.js',
    isDynamicEntry: true,
    imports: ['index.html'],
  },
};

test('koshi e mban versionin te emri i vet', () => {
  // Versioni hyn te emri që ndërtimi i ri të nisë me kosh krejt të ri: një
  // `index.html` i ri që tregon te skedarë të hashuar do të mbetej gjysmak mbi
  // koshin e vjetër, dhe ajo gjendje nuk kapet dot me sy.
  assert.equal(emriIKoshit('1.8.0'), 'tavolina-1.8.0');
  assert.notEqual(emriIKoshit('1.8.0'), emriIKoshit('1.7.0'));
});

test('fshihen vetëm koshët e vjetër të këtij aplikacioni', () => {
  const emrat = ['tavolina-1.6.0', 'tavolina-1.7.0', 'dikush-tjeter-v2'];

  assert.deepEqual(koshetEVjetra(emrat, 'tavolina-1.7.0'), ['tavolina-1.6.0']);
  // Koshi i dikujt tjetër te e njëjta origjinë nuk është i yni për ta hequr.
  assert.ok(!koshetEVjetra(emrat, 'tavolina-1.7.0').includes('dikush-tjeter-v2'));
});

test('ruhen skedarët e hyrjes, dhe ata të `public/`-ut që i jepen', () => {
  const lista = precachja(MANIFESTI, ['/', '/ikona.svg']);

  assert.ok(lista.includes('/'));
  assert.ok(lista.includes('/ikona.svg'));
  assert.ok(lista.includes('/assets/index-abc123.js'));
  assert.ok(lista.includes('/assets/index-def456.css'));
});

test('copa e `peerjs`-it nuk hyn te lista e instalimit', () => {
  /*
   * Ky nuk është kursim bajtesh, është kushti nën të cilin ajo varësi qëndron
   * fare (pika 7 e pika 10): ngarkohet vetëm kur përdoruesi e nis mënyrën me
   * kod. Një punëtor që e shkarkon me instalimin do ta thyente atë kusht
   * pikërisht atje ku nuk duket — te rrjeti, e jo te ekrani.
   */
  const lista = precachja(MANIFESTI, []);

  assert.ok(!lista.some((rruga) => rruga.includes('bundler')));
  assert.equal(lista.length, 2);
});

test('lista nuk përsërit asgjë, edhe kur dy hyrje e ndajnë të njëjtën copë', () => {
  const manifesti = {
    'index.html': {
      file: 'assets/index-abc123.js',
      isEntry: true,
      imports: ['e-perbashketa.js'],
    },
    'tjetra.html': {
      file: 'assets/tjetra-xyz.js',
      isEntry: true,
      imports: ['e-perbashketa.js'],
    },
    'e-perbashketa.js': { file: 'assets/e-perbashketa-123.js' },
  };

  const lista = precachja(manifesti, ['/']);

  assert.equal(new Set(lista).size, lista.length);
  assert.ok(lista.includes('/assets/e-perbashketa-123.js'));
});

/* ── Strategjia ─────────────────────────────────────────────────────────── */

const RRENJA = 'https://tavolina.example';

test('çdo navigim kthen shellin, sepse rrugët janë me hash', () => {
  for (const url of [RRENJA, `${RRENJA}/`, `${RRENJA}/?nga=whatsapp`]) {
    assert.equal(
      strategjia({ url, metoda: 'GET', navigim: true }, RRENJA),
      'shelli',
      url,
    );
  }
});

test('skedarët e faqes merren nga koshi', () => {
  assert.equal(
    strategjia(
      { url: `${RRENJA}/assets/index-abc123.js`, metoda: 'GET', navigim: false },
      RRENJA,
    ),
    'koshi',
  );
});

test('kërkesat jashtë origjinës nuk preken fare', () => {
  /*
   * Serveri i sinjalizimit dhe relenjat TURN janë e vetmja shmangje e pikës 1,
   * dhe rrinë të rrethuara. Një punëtor që i lexon a i ruan do ta zgjeronte atë
   * shmangje pa e thënë kush — dhe pikërisht te trafiku që shkon jashtë
   * pajisjes.
   */
  for (const url of [
    'https://0.peerjs.com/peerjs/id',
    'https://tavolina.example.evil/assets/index.js',
    'https://tjetri.example/',
  ]) {
    assert.equal(
      strategjia({ url, metoda: 'GET', navigim: false }, RRENJA),
      'anashkalo',
      url,
    );
  }
});

test('vetëm `GET` kalon nëpër koshin', () => {
  for (const metoda of ['POST', 'PUT', 'DELETE', 'HEAD']) {
    assert.equal(
      strategjia({ url: `${RRENJA}/diçka`, metoda, navigim: false }, RRENJA),
      'anashkalo',
      metoda,
    );
  }
});
