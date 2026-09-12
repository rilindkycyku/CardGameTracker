/*
 * Prova e shtresës së rrjetit, me shfletues dhe me një Supabase të rremë.
 *
 * NUK bie me `npm test`: kërkon Playwright dhe një ndërtim të gatshëm, dhe të
 * dyja rrinë jashtë varësive (pika 10). Bie me dorë, dhe rruga është:
 *
 *   node test/deshmitare/supabase-i-rreme.mjs &
 *   npm run build && npx vite preview --port 4173 &
 *   node test/deshmitare/rrjeti.mjs
 *
 * Provon pikërisht atë që `node --test` nuk e prek dot: hyrjen me fjalëkalim,
 * njohjen e një tabele që nuk ekziston (PGRST205), verifikimin pas skriptit,
 * dërgimin me `upsert` dhe orën e lexuar prapa, shkarkimin rritës, dhe bashkimin
 * mes dy pajisjeve që nuk e kanë parë kurrë njëra-tjetrën.
 */
import { chromium } from 'playwright';

const BAZA = 'http://127.0.0.1:4173/';
const shfletuesi = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});

const hap = async () => {
  const f = await (await shfletuesi.newContext()).newPage();
  f.on('pageerror', (e) => console.log('FAQJA:', String(e).slice(0, 160)));
  return f;
};

await fetch('http://127.0.0.1:54321/rivendos', { method: 'POST' });

const a = await hap();
await a.goto(`${BAZA}#/sinkronizimi`);
await a.waitForSelector('input[type="url"]');

// 1. Një grup, shkruar drejt te baza: forma provohet gjetiu, dhe këtu na
// intereson vetëm shtresa e rrjetit.
await a.goto(BAZA);
await a.waitForSelector('text=Ende asnjë grup');
await a.evaluate(async () => {
  const b = await new Promise((z) => {
    const k = indexedDB.open('cardgametracker');
    k.onsuccess = () => z(k.result);
  });
  await new Promise((z, h) => {
    const tx = b.transaction('groups', 'readwrite');
    tx.objectStore('groups').add({
      uid: 'grup_provaenjerrjetit', name: 'Brigj',
      playerNames: ['alfa', 'beta', 'gama'],
      perditesuar: Date.now(), sinkPezull: true,
    });
    tx.oncomplete = z; tx.onerror = h;
  });
  b.close();
});
await a.reload();
await a.waitForTimeout(800);

const baza = await a.evaluate(async () => {
  const b = await new Promise((z) => {
    const k = indexedDB.open('cardgametracker');
    k.onsuccess = () => z(k.result);
  });
  const lexo = (s) => new Promise((z) => {
    const q = b.transaction(s).objectStore(s).getAll();
    q.onsuccess = () => z(q.result);
  });
  return (await lexo('groups')).map((g) => `${g.uid} pezull=${g.sinkPezull}`);
});
console.log('0. baza e pajisjes A:        ', baza);

// 2. Hyrje te projekti i rremë.
await a.goto(`${BAZA}#/sinkronizimi`);
await a.waitForSelector('input[type="url"]');
await a.fill('input[type="url"]', 'http://127.0.0.1:54321');
await a.fill('input[placeholder^="sb_publishable"]', 'sb_publishable_provë123');
await a.fill('input[type="email"]', 'une@shembull.dev');
await a.fill('input[type="password"]', 'fjalekalimi');
await a.click('button:has-text("Hyr")');
await a.waitForTimeout(1500);

let teksti = (await a.textContent('body')) || '';
console.log('1. tabela që mungon u kap? ', teksti.includes('Projekti pret skriptin'));
console.log('   ka SQL Editor + kopjo?  ', teksti.includes('Hap SQL Editor-in') && teksti.includes('Kopjo skriptin'));

// 3. «Run» te SQL Editor-i.
await a.evaluate(() => fetch('http://127.0.0.1:54321/ngrije', { method: 'POST' }));
await a.click('button:has-text("E ekzekutova")');
await a.waitForTimeout(2500);

teksti = (await a.textContent('body')) || '';
console.log('2. pas skriptit kaloi te gjendja?', teksti.includes('Gjendja'));
console.log('   TRUPI A:', teksti.replace(/\s+/g, ' ').slice(0, 420));

// 4. Vendimi i pajisjes së parë: dërgo.
if (teksti.includes('Kjo pajisje sapo u lidh')) {
  await a.click('button:has-text("Dërgo këtë pajisje")');
  await a.fill('input[type="text"] >> nth=-1', 'ZEVENDESO');
  await a.click('button:has-text("Vazhdo")');
  await a.waitForTimeout(2500);
}
await a.waitForTimeout(1500);

const cloud = await a.evaluate(() =>
  fetch('http://127.0.0.1:54321/gjendja').then((r) => r.json()));
console.log('3. rreshta te projekti:      ', cloud.rreshta);

// 5. Pajisje e dytë, krejt e pastër: a i merr mbrëmjet?
const b = await hap();
await b.goto(`${BAZA}#/sinkronizimi`);
await b.waitForSelector('input[type="url"]');
await b.fill('input[type="url"]', 'http://127.0.0.1:54321');
await b.fill('input[placeholder^="sb_publishable"]', 'sb_publishable_provë123');
await b.fill('input[type="email"]', 'une@shembull.dev');
await b.fill('input[type="password"]', 'fjalekalimi');
await b.click('button:has-text("Hyr")');
await b.waitForTimeout(2500);

teksti = (await b.textContent('body')) || '';
console.log('   TRUPI B:', teksti.replace(/\s+/g, ' ').slice(0, 420));
if (teksti.includes('Kjo pajisje sapo u lidh')) {
  await b.click('button:has-text("Merr projektin")');
  await b.fill('input[type="text"] >> nth=-1', 'ZEVENDESO');
  await b.click('button:has-text("Vazhdo")');
  await b.waitForTimeout(2500);
}

await b.goto(BAZA);
await b.waitForTimeout(1500);
teksti = (await b.textContent('body')) || '';
console.log('4. pajisja e dytë e mori grupin?', teksti.includes('Brigj'));
console.log('   me lojtarët e duhur?         ', teksti.includes('3 lojtarë'));

process.exit(0);
