/*
 * Prova e mënyrës me kod, me shfletues dhe me një `peerjs-server` lokal.
 *
 * NUK bie me `npm test`: kërkon Playwright dhe një server sinjalizimi, dhe të
 * dyja rrinë jashtë varësive (pika 10). Bie me dorë, dhe rruga është:
 *
 *   VITE_PEER_SERVER=127.0.0.1:9000 npx vite --port 5174 &
 *   node deshmitare/lidhja-me-kod.mjs
 *
 * Klasat merren drejtpërdrejt nga burimi, e jo nëpër ekranet: ajo që provohet
 * këtu është makina e gjendjes, e jo vizatimi. Reja publike e PeerJS-it nuk
 * kapet nga kjo makinë (pika te «Gjëra që të zënë ngushtë»), prandaj serveri
 * është ai lokal — dhe pikërisht sepse është lokal, mund edhe të vritet në mes
 * të mbrëmjes, që është e tërë puna e kësaj prove.
 *
 * Provon atë që `node --test` nuk e prek dot: kodin që mbërrin, paketën që
 * kalon mes dy anëve, serverin që bie e kthehet, dhe — pika që u shtua — kodin
 * që **nuk ndërrohet** pas asaj rënieje.
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const BAZA = 'http://127.0.0.1:5174/';
const PAKETA = 'provë-1';

let serveri = null;

async function ngriSinjalizimin() {
  // `detached`, që vrasja të kapë edhe fëmijën e vërtetë: `npx` është vetëm
  // mbështjellësi, dhe vrasja e tij e le serverin gjallë — pra prova do të
  // dukej se kaloi pa e prekur fare rënien.
  serveri = spawn(
    'npx',
    ['--yes', 'peer', '--host', '127.0.0.1', '--port', '9000', '--path', '/'],
    { stdio: 'ignore', detached: true },
  );
  // Pritet sa hapet vërtet: `spawn` kthehet shumë para se priza të dëgjojë.
  for (let i = 0; i < 60; i++) {
    await new Promise((z) => setTimeout(z, 500));
    try {
      const p = await fetch('http://127.0.0.1:9000/');
      if (p.ok) return;
    } catch {
      // Ende jo.
    }
  }
  throw new Error('serveri i sinjalizimit nuk u ngrit');
}

async function vritSinjalizimin() {
  if (serveri) {
    try {
      process.kill(-serveri.pid, 'SIGKILL');
    } catch {
      serveri.kill('SIGKILL');
    }
  }
  serveri = null;

  // Pritet sa hesht vërtet, përndryshe ngritja e radhës e gjen portën të zënë.
  for (let i = 0; i < 40; i++) {
    await new Promise((z) => setTimeout(z, 250));
    try {
      await fetch('http://127.0.0.1:9000/');
    } catch {
      return;
    }
  }
}

function kontrollo(kushti, fjala) {
  if (!kushti) {
    console.error(`✗ ${fjala}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${fjala}`);
  }
}

const shfletuesi = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});

/** Një faqe me klasën e vet të ngritur, dhe gjendja e fundit te `window.gj`. */
async function hap(cila, arg) {
  const faqja = await (await shfletuesi.newContext()).newPage();
  faqja.on('pageerror', (e) => console.log('FAQJA:', String(e).slice(0, 160)));
  await faqja.goto(BAZA);

  await faqja.evaluate(
    async ([cila, arg]) => {
      const m = await import('/src/lidhjaMeServer.ts');
      window.gj = null;
      window.nje = new m[cila](arg, (g) => {
        window.gj = g;
      });
      await window.nje.nis();
    },
    [cila, arg],
  );

  return faqja;
}

const gjendja = (faqja) => faqja.evaluate(() => window.gj);

/** Pret sa `kushti` bëhet i vërtetë mbi gjendjen, ose kthen `null`. */
async function prit(faqja, kushti, sa = 30_000) {
  const deri = Date.now() + sa;
  while (Date.now() < deri) {
    const g = await gjendja(faqja);
    if (g && kushti(g)) return g;
    await new Promise((z) => setTimeout(z, 250));
  }
  return null;
}

await ngriSinjalizimin();

/* 1. Strehuesi merr një kod. */
const strehuesi = await hap('StrehuesiMeKod', PAKETA);
const meKod = await prit(strehuesi, (g) => g.kodi !== null);
kontrollo(meKod !== null, 'strehuesi e merr kodin nga serveri');
const kodi = meKod?.kodi ?? '';

/* 2. Vizitori lidhet dhe i merr pikët menjëherë, pa pritur raundin tjetër. */
const vizitori = await hap('VizitoriMeKod', kodi);
const uLidh = await prit(vizitori, (g) => g.lidhur && g.paketa !== null);
kontrollo(uLidh?.paketa === PAKETA, 'vizitori lidhet dhe e merr paketën');
kontrollo(
  (await prit(strehuesi, (g) => g.vizitore === 1))!== null,
  'strehuesi e numëron vizitorin',
);

/* 3. Raundi i radhës shkon vetë te ana që shikon. */
await strehuesi.evaluate(() => window.nje.transmeto('provë-2'));
kontrollo(
  (await prit(vizitori, (g) => g.paketa === 'provë-2')) !== null,
  'paketa e re mbërrin vetvetiu',
);

/* 4. Serveri bie në mes të mbrëmjes. */
await vritSinjalizimin();

const raIStrehuesi = await prit(strehuesi, (g) => g.kodi === null && g.deshtime > 0, 40_000);
kontrollo(raIStrehuesi !== null, 'rënia e serverit thuhet, e nuk hesht');
kontrollo(raIStrehuesi?.dukeProvuar === true, 'strehuesi provon sërish vetvetiu');

/*
 * Kanali mes dy shfletuesve rri i hapur edhe pa server — pra pikët e mbetura
 * nuk humbin. Kjo është pikërisht ajo që `destroy()` do ta prishte.
 */
kontrollo(
  (await gjendja(vizitori))?.paketa === 'provë-2',
  'numrat e fundit rrinë në ekran edhe pa server',
);

/* 5. Serveri kthehet. */
await ngriSinjalizimin();
await strehuesi.evaluate(() => window.nje.zgjohu());

const uKthye = await prit(strehuesi, (g) => g.kodi !== null, 60_000);
kontrollo(uKthye !== null, 'strehuesi e rikap serverin pa u rihapur skeda');
kontrollo(
  uKthye?.kodi === kodi,
  'kodi i shkruar në letër mbetet i njëjti pas rënies',
);
kontrollo(uKthye?.deshtime === 0, 'numri i dështimeve nis nga e para pas kapjes');

/* 6. Një vizitor krejt i ri e gjen po atë kod. */
const iTreti = await hap('VizitoriMeKod', kodi);
kontrollo(
  (await prit(iTreti, (g) => g.lidhur && g.paketa === 'provë-2')) !== null,
  'kodi i vjetër ende lidh një telefon të ri',
);

/* 7. Një kod që nuk ekziston ndalet, e nuk provon pa fund. */
const kotesia = await hap('VizitoriMeKod', 'ZZZZZZZZ');
const dorezimi = await prit(kotesia, (g) => g.dukeProvuar === false, 90_000);
kontrollo(dorezimi !== null, 'kodi i pagjetur ndalet pas provave');
kontrollo(
  (dorezimi?.gabimi ?? '').length > 0,
  'dhe thotë me fjalë përse nuk u lidh',
);

await vritSinjalizimin();
await shfletuesi.close();
console.log(process.exitCode ? '\nRA' : '\nGJITHÇKA MIRË');
