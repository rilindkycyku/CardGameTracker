/**
 * Dëshmitari i mbrëmjes së sjellë nga bridzhi.
 *
 * Provon urën mes dy aplikacioneve: skedari që nxjerr bridzh-online hyn këtu,
 * dhe raundet e tij dalin te historiku i grupit me pikët e duhura. Ajo që
 * provohet vërtet nuk është leximi — atë e mban `test/sjellja.test.mjs` — por
 * shkrimi: a shtohet një mbrëmje **pa e prekur** atë që ishte.
 *
 *   node deshmitare/sjellja.mjs
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORTA = 5179;
const BAZA = `http://127.0.0.1:${PORTA}/`;

let deshtime = 0;
function prit(fjala, kusht) {
  if (kusht) console.log(`  ok   ${fjala}`);
  else { deshtime += 1; console.log(`  JO   ${fjala}`); }
}

const serveri = spawn(
  'npm', ['run', 'dev', '--', '--port', String(PORTA), '--strictPort'],
  { cwd: new URL('..', import.meta.url).pathname, detached: true, stdio: 'ignore' },
);

async function priteServerin() {
  for (let i = 0; i < 60; i += 1) {
    try { if ((await fetch(BAZA)).ok) return true; } catch { /* ende jo */ }
    await new Promise((z) => setTimeout(z, 500));
  }
  return false;
}

if (!await priteServerin()) {
  console.log('  JO   serveri i zhvillimit nuk u ngrit');
  try { process.kill(-serveri.pid); } catch { /* iku */ }
  process.exit(1);
}

const shfletuesi = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});

/** Skedari që do të nxirrte bridzh-online pas një mbrëmjeje me tre veta. */
const MBREMJA = {
  formati: 'bridzh-mbremje',
  versioni: 1,
  lloji: 'bridzh',
  date: '2026-09-18',
  selectedPlayers: ['alfa', 'beta', 'gama'],
  raundet: [
    { alfa: -20, beta: 100, gama: 35 },
    { alfa: 45, beta: -40, gama: 200 },
    { alfa: 60, beta: 55, gama: -40 },
  ],
};

try {
  const dosja = await mkdtemp(join(tmpdir(), 'bridzh-'));
  const shtegu = join(dosja, 'mbremja.json');
  await writeFile(shtegu, JSON.stringify(MBREMJA, null, 2));

  const faqja = await (await shfletuesi.newContext()).newPage();
  faqja.on('pageerror', (e) => console.log('   FAQJA:', String(e).slice(0, 160)));

  await faqja.goto(BAZA);

  /* ── Një grup i ri ────────────────────────────────────────────────────── */
  // Emrat e butonave kërkojnë përputhje të saktë: «Krijo grupin» rri edhe brenda
  // «Krijo grupin e parë», dhe një përputhje e pjesshme i kap të dy.
  await faqja.getByRole('button', { name: 'Krijo grupin e parë' }).click();
  await faqja.fill('.fusha:has-text("Emri i grupit") input', 'Shoqëria');
  await faqja.fill('input[aria-label="Emrat e lojtarëve"]', 'alfa, beta');
  await faqja.getByRole('button', { name: 'Shto', exact: true }).click();
  await faqja.getByRole('button', { name: 'Krijo grupin', exact: true }).click();

  // Krijimi e hap vetë ekranin e grupit — nuk ka lidhje për të shtypur.
  await faqja.waitForSelector('summary:has-text("Sill një mbrëmje")', { timeout: 15000 });
  prit('paneli i sjelljes del te ekrani i grupit', true);

  const lojeratPara = await faqja.locator('.lista-lojerave li, .historiku li').count();

  /* ── Skedari hyn ──────────────────────────────────────────────────────── */
  // `<details>` është çelës edhe te provat: një klikim mbi titullin e mbyll po
  // aq lehtë sa e hap, dhe atëherë pohimi rri te pema por i fshehur.
  const paneli = faqja.locator('details:has(summary:has-text("Sill një mbrëmje"))');
  if (!(await paneli.evaluate((d) => d.open))) {
    await faqja.click('summary:has-text("Sill një mbrëmje")');
  }

  await paneli.locator('input[type=file]').setInputFiles(shtegu);

  await faqja.waitForSelector('text=Do të shtohet', { timeout: 15000 });
  const pohimi = await faqja.textContent('.njoftim--kujdes');
  prit('pohimi thotë çka do të shkruhet', /3 raunde/.test(pohimi ?? ''));
  prit('dhe i thotë lojtarët', /alfa/.test(pohimi ?? '') && /gama/.test(pohimi ?? ''));
  // Njëjës a shumës sipas sa janë: grupi ka alfa e beta, mbrëmja edhe gamën.
  prit(
    'dhe paralajmëron se një emër nuk është te grupi',
    /gama nuk është te/.test(pohimi ?? ''),
  );

  // Asgjë nuk është shkruar ende: pohimi vjen para shkrimit.
  const lojeratMesi = await faqja.locator('.lista-lojerave li, .historiku li').count();
  prit('para pohimit nuk shkruhet asgjë', lojeratMesi === lojeratPara);

  await faqja.click('button:has-text("Shtoje te grupi")');
  await faqja.waitForSelector('text=U shtua mbrëmja', { timeout: 15000 });
  prit('mbrëmja u shkrua', true);

  /* ── Dhe numrat janë ata që hynë ──────────────────────────────────────── */
  await faqja.waitForSelector('a:has-text("18")', { timeout: 15000 });
  await faqja.click('a:has-text("18")');
  await faqja.waitForSelector('.tabela', { timeout: 15000 });

  // Totalet lexohen nga qelizat e renditjes e jo nga teksti i faqes: `textContent`
  // i ngjit fjalët pa ndarës — «alfa85» — dhe atje asnjë kufi fjale nuk gjendet.
  // Rreshti i fituesit e mban edhe fjalën «fituesi» brenda qelizës së emrit,
  // prandaj kërkohet emri **brenda** rreshtit e nuk krahasohet qeliza e tërë.
  const rreshtat = await faqja
    .locator('.loja__bllok--renditja tbody tr')
    .evaluateAll((n) => n.map((r) => ({
      teksti: r.textContent ?? '',
      numrat: [...r.querySelectorAll('td')]
        .map((c) => Number(String(c.textContent).trim().replace('+', '')))
        .filter((x) => Number.isFinite(x)),
    })));

  function totali(emri) {
    const rreshti = rreshtat.find((r) => r.teksti.includes(emri));
    // Numri i parë mbi tre është totali; ata nën të janë vendi dhe raundet.
    return rreshti?.numrat.find((x) => Math.abs(x) > 3);
  }

  // alfa −20+45+60 = 85 · beta 100−40+55 = 115 · gama 35+200−40 = 195.
  prit(`totali i alfës është 85 (${totali('alfa')})`, totali('alfa') === 85);
  prit(`totali i betës është 115 (${totali('beta')})`, totali('beta') === 115);
  prit(`totali i gamës është 195 (${totali('gama')})`, totali('gama') === 195);

  // Dhe fiton alfa: totali më i vogël, si te bridzhi.
  prit('i pari te renditja është alfa', (rreshtat[0]?.teksti ?? '').includes('alfa'));

  const raundet = await faqja.locator('.loja__bllok--raundet tbody tr').count();
  prit(`të tre raundet dolën te tabela (${raundet})`, raundet === 3);

  await faqja.screenshot({ path: 'deshmitare/sjellja.png', fullPage: true });
} catch (gabimi) {
  deshtime += 1;
  console.log(`  JO   dëshmitari ra: ${gabimi.message}`);
} finally {
  await shfletuesi.close();
  try { process.kill(-serveri.pid); } catch { /* iku */ }
}

console.log(deshtime === 0 ? '\nTë gjitha kaluan.' : `\n${deshtime} dështime.`);
process.exit(deshtime === 0 ? 0 : 1);
