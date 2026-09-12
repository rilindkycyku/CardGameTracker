/*
 * Prova e mënyrës së takimit, me shfletues dhe me vetë funksionin e serverit.
 *
 * NUK bie me `npm test`: kërkon Playwright dhe një server zhvillimi (pika 10).
 * Bie me dorë, dhe rruga është:
 *
 *   npx vite --port 5174 --host 127.0.0.1 &
 *   node deshmitare/takimi.mjs
 *
 * Serveri i sinjalizimit nuk imitohet: `vite.config.ts` e ngre pikërisht
 * `api/sinjali.ts`, pra ajo që provohet këtu është ajo që botohet. Vendi i
 * ruajtjes është kujtesa e çastit — te një server i vetëm ajo sillet si Redis-i
 * te prodhimi, dhe pikërisht ajo ndarje e bën këtë provë të mundshme fare.
 *
 * Provon atë që `node --test` nuk e prek dot: shtrëngimin e plotë të duarve mes
 * dy shfletuesve, pikët që mbërrijnë e që përditësohen, vizitorin e dytë mbi të
 * njëjtin kod, dhe — pika që e bën këtë mënyrë të vlefshme — se sapo lidhja
 * ngrihet, asnjë kërkesë nuk shkon më te serveri.
 */
import { chromium } from 'playwright';

const BAZA = 'http://127.0.0.1:5174/';
const PAKETA = 'provë-1';

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
async function hap(cila, argumentet) {
  const faqja = await (await shfletuesi.newContext()).newPage();
  faqja.on('pageerror', (e) => console.log('FAQJA:', String(e).slice(0, 160)));

  // Çdo kërkesë te shtegu ynë numërohet: ajo është e tërë shmangja, dhe numri i
  // saj është ajo që duhet të mbetet i palëvizur sapo kanali hapet.
  faqja.kerkesa = [];
  faqja.on('request', (k) => {
    if (k.url().includes('/api/sinjali')) faqja.kerkesa.push(k.method());
  });

  await faqja.goto(BAZA);
  await faqja.evaluate(
    async ([cila, argumentet]) => {
      const m = await import('/src/lidhjaMeTakim.ts');
      window.gj = null;
      window.nje = new m[cila](...argumentet, (g) => {
        window.gj = g;
      });
      void window.nje.nis();
    },
    [cila, argumentet],
  );

  return faqja;
}

const gjendja = (faqja) => faqja.evaluate(() => window.gj);

async function prit(faqja, kushti, sa = 45_000) {
  const deri = Date.now() + sa;
  while (Date.now() < deri) {
    const g = await gjendja(faqja);
    if (g && kushti(g)) return g;
    await new Promise((z) => setTimeout(z, 250));
  }
  return null;
}

/* 1. Strehuesi e shkruan ftesën te serveri ynë dhe tregon kodin. */
const kodi = 'A3F27KQM';
const strehuesi = await hap('StrehuesiMeTakim', [kodi, BAZA, PAKETA]);
const meKod = await prit(strehuesi, (g) => g.kodi !== null);
kontrollo(meKod !== null, 'strehuesi e shkruan ftesën dhe tregon kodin');
kontrollo(
  meKod?.vendi === 'kujtesa' || meKod?.vendi === 'upstash',
  'serveri e thotë ku e mban vargun',
);

/* 2. Vizitori e merr ftesën, i përgjigjet, dhe pikët mbërrijnë. */
const vizitori = await hap('VizitoriMeTakim', [kodi, BAZA]);
const uLidh = await prit(vizitori, (g) => g.lidhur && g.paketa !== null);
kontrollo(uLidh?.paketa === PAKETA, 'vizitori lidhet dhe i merr pikët');
kontrollo(
  (await prit(strehuesi, (g) => g.vizitore === 1)) !== null,
  'strehuesi e numëron vizitorin',
);

/* 3. Sapo kanali hapet, serveri nuk preket më. */
const paraTransmetimit = vizitori.kerkesa.length;
await strehuesi.evaluate(() => window.nje.transmeto('provë-2'));
kontrollo(
  (await prit(vizitori, (g) => g.paketa === 'provë-2')) !== null,
  'raundi i ri mbërrin vetvetiu',
);
kontrollo(
  vizitori.kerkesa.length === paraTransmetimit,
  'pikët nuk e prekin fare serverin — ato kalojnë drejt mes telefonave',
);

/* 4. Numri i kërkesave është i vogël: shtrëngimi, e asgjë më shumë. */
kontrollo(
  vizitori.kerkesa.length <= 4,
  `vizitori e prek serverin vetëm sa lidhet (${vizitori.kerkesa.length} kërkesa)`,
);

/* 5. Një vizitor i dytë mbi të njëjtin kod. */
const iDyti = await hap('VizitoriMeTakim', [kodi, BAZA]);
kontrollo(
  (await prit(iDyti, (g) => g.lidhur && g.paketa === 'provë-2')) !== null,
  'një telefon i dytë lidhet mbi të njëjtin kod',
);
kontrollo(
  (await prit(strehuesi, (g) => g.vizitore === 2)) !== null,
  'dhe strehuesi i numëron të dy',
);

/* 6. Dy veta e skanojnë kodin njëkohësisht.
 *
 * Kjo është rruga që dështonte: të dy e marrin të njëjtën ftesë, strehuesi i
 * përgjigjet vetëm njërit, dhe pa rrethin e dytë te ana që shikon i dyti rrinte
 * te «Duke u lidhur…» pa fund — pra pikërisht ai që u ul i fundit te tavolina
 * nuk i shihte kurrë pikët.
 */
const [njekohesishtA, njekohesishtB] = await Promise.all([
  hap('VizitoriMeTakim', [kodi, BAZA]),
  hap('VizitoriMeTakim', [kodi, BAZA]),
]);

// Afat i gjerë me qëllim: njëri nga të dy e humb ftesën e parë dhe i duhet
// rrethi tjetër, dhe dy shfletues që mbledhin kandidatë njëkohësisht te një
// makinë prove janë më të ngadaltë se dy telefona te një tavolinë.
kontrollo(
  (await prit(njekohesishtA, (g) => g.lidhur, 90_000)) !== null,
  'nga dy skanime njëkohësisht, i pari lidhet',
);
kontrollo(
  (await prit(njekohesishtB, (g) => g.lidhur, 90_000)) !== null,
  'dhe i dyti lidhet gjithashtu, me ftesën e radhës',
);

/* 7. Një kod që nuk u shkrua kurrë ndalet me fjalë. */
const kotesia = await hap('VizitoriMeTakim', ['ZZZZZZZZ', BAZA]);
const dorezimi = await prit(kotesia, (g) => g.dukeProvuar === false, 60_000);
kontrollo(dorezimi !== null, 'kodi i pagjetur ndalet pas provave');
kontrollo((dorezimi?.gabimi ?? '').length > 0, 'dhe thotë me fjalë përse');

/* 8. Serveri i thotë jo çdo gjëje që i vjen. */
const refuzimet = await strehuesi.evaluate(async () => {
  const prove = async (menyra, shtegu, trupi) => {
    const p = await fetch(shtegu, {
      method: menyra,
      headers: { 'content-type': 'application/json' },
      body: trupi === undefined ? undefined : JSON.stringify(trupi),
    });
    return p.status;
  };

  return {
    kodIShkurter: await prove('GET', '/api/sinjali?kodi=A3F&roli=ftese'),
    roliIShpikur: await prove('GET', '/api/sinjali?kodi=A3F27KQM&roli=pike'),
    trupiMeRresht: await prove('POST', '/api/sinjali', {
      kodi: 'A3F27KQM',
      roli: 'ftese',
      trupi: 'a\r\nb',
    }),
    trupiIGjate: await prove('POST', '/api/sinjali', {
      kodi: 'A3F27KQM',
      roli: 'ftese',
      trupi: 'x'.repeat(5000),
    }),
    metodaTjeter: await prove('PUT', '/api/sinjali'),
  };
});

kontrollo(refuzimet.kodIShkurter === 400, 'kodi i shkurtër refuzohet');
kontrollo(refuzimet.roliIShpikur === 400, 'roli i shpikur refuzohet');
kontrollo(refuzimet.trupiMeRresht === 400, 'trupi me rresht të ri refuzohet');
kontrollo(refuzimet.trupiIGjate === 400, 'trupi mbi kufi refuzohet');
kontrollo(refuzimet.metodaTjeter === 405, 'metoda tjetër refuzohet');

await shfletuesi.close();
console.log(process.exitCode ? '\nRA' : '\nGJITHÇKA MIRË');
