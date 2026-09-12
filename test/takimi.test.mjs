/**
 * Provat e takimit — sinjalizimi te vetë origjina.
 *
 * Ky shteg është i hapur për këdo që e gjen adresën, prandaj gabimi i vërtetë
 * këtu nuk është matematika: është një varg i pakontrolluar që kalon te serveri
 * ose te SDP-ja. Provat maten kundër atyre.
 */

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  AFATI_I_FTESES,
  JETA,
  KUFIRI,
  ROLET,
  SHTEGU,
  adresaESinjalit,
  adresaETakimit,
  celesi,
  kodIRregullt,
  pritjaEPyetjes,
  roliIRregullt,
  serveratEICE,
  trupiIRregullt,
} from '../src/takimi.ts';
import { lexoKodin } from '../src/kodi.ts';

test('kodi pranohet vetëm i plotë dhe nga alfabeti i vet', () => {
  assert.ok(kodIRregullt('A3F27KQM'));

  for (const keq of [
    '',
    'A3F27KQ',      // shtatë
    'A3F27KQMM',    // nëntë
    'A3F27KQ!',     // karakter jashtë alfabetit
    'A3F27KQI',     // `I` nuk rri te alfabeti — lexohet `1` para se të vijë këtu
    'a3f27kqm',     // shkronjat e vogla i kthen `lexoKodin`, jo ky
    'A3F2-7KQ',
    null,
    undefined,
    12345678,
    ['A3F27KQM'],
  ]) {
    assert.ok(!kodIRregullt(keq), JSON.stringify(keq));
  }
});

test('roli është një nga dy, dhe asgjë tjetër', () => {
  for (const mire of ROLET) assert.ok(roliIRregullt(mire), mire);
  for (const keq of ['', 'ftesa', 'FTESE', 'pikët', '__proto__', null, 0]) {
    assert.ok(!roliIRregullt(keq), JSON.stringify(keq));
  }
});

test('trupi nuk pranon asnjë karakter që SDP-ja e lexon si ndarës', () => {
  // Kjo është e njëjta ashpërsi si te sinjali i skanuar (pika 7): një rresht i
  // futur brenda një sinjali do të shpikte një kandidat `relay` dhe do t'i
  // çonte pikët te një server i huaj.
  assert.ok(trupiIRregullt('ftese|abc,def:1%20'));

  for (const keq of [
    'a\r\nb',
    'a\nb',
    'a b',
    'a\tb',
    'a<b',
    'a"b',
    "a'b",
    'a\\b',
    '',
    'x'.repeat(KUFIRI + 1),
    null,
    undefined,
    42,
  ]) {
    assert.ok(!trupiIRregullt(keq), JSON.stringify(String(keq).slice(0, 20)));
  }

  // Pikërisht te kufiri ende pranohet.
  assert.ok(trupiIRregullt('x'.repeat(KUFIRI)));
});

test('çelësi mban parathënjen, dhe kodin e rolin ashtu si janë', () => {
  assert.equal(celesi('A3F27KQM', 'ftese'), 'takim:A3F27KQM:ftese');
  assert.equal(celesi('A3F27KQM', 'pergjigje'), 'takim:A3F27KQM:pergjigje');
});

test('adresa e sinjalit ndërtohet mbi origjinën, pa hash-in e vjetër', () => {
  assert.equal(
    adresaESinjalit('http://192.168.1.5:5173/#/loja/3', 'A3F27KQM', 'ftese'),
    `http://192.168.1.5:5173${SHTEGU}?kodi=A3F27KQM&roli=ftese`,
  );
  assert.equal(
    adresaESinjalit('https://tavolina.example/nen/faqe/', 'A3F27KQM', 'pergjigje'),
    `https://tavolina.example/nen/faqe${SHTEGU}?kodi=A3F27KQM&roli=pergjigje`,
  );
});

test('adresa e takimit lexohet prapa nga vetë kodi', () => {
  const adresa = adresaETakimit('http://192.168.1.5:5173/#/loja/3', 'A3F27KQM');
  assert.equal(adresa, 'http://192.168.1.5:5173/#/takohu/A3F27KQM');

  // Kush e ngjit lidhjen te kutia e kodit duhet të marrë kodin prapa — njësoj
  // si te mënyra me PeerJS, sepse të dyja e ndajnë vetë kodin.
  assert.equal(lexoKodin(adresa), 'A3F27KQM');
});

test('pyetja nis shpejt dhe qetësohet, dhe kurrë nuk ngjitet mbi vargun', () => {
  assert.equal(pritjaEPyetjes(1), 1000);
  assert.equal(pritjaEPyetjes(20), 1000);
  assert.equal(pritjaEPyetjes(21), 2000);
  assert.equal(pritjaEPyetjes(60), 2000);
  assert.equal(pritjaEPyetjes(61), 5000);
  assert.equal(pritjaEPyetjes(1000), 5000);

  // Kurrë zbritëse: një pyetje që shpejtohet me kohën do t'i shtonte kërkesat
  // pikërisht te kodi i harruar mbi tavolinë.
  let e_fundit = 0;
  for (let i = 1; i <= 200; i++) {
    const tani = pritjaEPyetjes(i);
    assert.ok(tani >= e_fundit, `prova ${i}`);
    e_fundit = tani;
  }
});

test('ftesa përtërihet para se vargu i saj të vdesë te serveri', () => {
  // Me radhën e kundërt, strehuesi do të pyeste për një përgjigje ndaj një
  // ftese që serveri e kishte fshirë tashmë — pra pritje pa asnjë shpresë.
  assert.ok(AFATI_I_FTESES < JETA * 1000, `${AFATI_I_FTESES} < ${JETA * 1000}`);
});

test('pa `VITE_ICE_SERVERS` nuk kontaktohet asnjë i tretë', () => {
  // Kjo është ajo që e mban mënyrën e takimit pa asnjë server të huaj: pa STUN
  // e pa TURN mblidhen vetëm kandidatë `typ host` (pika 7).
  for (const asgje of [undefined, null, '', '   ', ',,', 7]) {
    assert.deepEqual(serveratEICE(asgje), [], JSON.stringify(asgje));
  }

  // Dhe asgjë që nuk është adresë ICE nuk hyn dot aty rastësisht.
  assert.deepEqual(serveratEICE('https://dikush.example, 1.2.3.4'), []);
});

test('serverat ICE lexohen me kredencialet e tyre', () => {
  assert.deepEqual(serveratEICE('stun:stun.shembull.org:3478'), [
    { urls: 'stun:stun.shembull.org:3478' },
  ]);

  // `@` i fundit e ndan kredencialin, që një fjalëkalim me `@` brenda të mos e
  // presë adresën në vend të gabuar.
  assert.deepEqual(serveratEICE('turn:une:fjale@turn.shembull.org:3478'), [
    {
      urls: 'turn:turn.shembull.org:3478',
      username: 'une',
      credential: 'fjale',
    },
  ]);

  assert.deepEqual(
    serveratEICE('stun:a.example:3478, turn:u:p@b.example:3478').map((n) => n.urls),
    ['stun:a.example:3478', 'turn:b.example:3478'],
  );
});

/* ── Dalja e serverit ───────────────────────────────────────────────────── */

test('importet e nxjerra shkruhen `.js`, që funksioni të botohet dot', () => {
  /*
   * Kjo provë mat një rresht konfigurimi, e jo logjikë, dhe pikërisht prandaj
   * ekziston: dështimi që mbulon nuk duket askund lokalisht.
   *
   * Projekti i shkruan importet me `.ts` sepse `node --test` i lexon modulet
   * drejtpërdrejt (pika 1). Vercel-i e përkthen `api/sinjali.ts` te `.js` me
   * TypeScript-in tonë, por **pa i prekur specifikuesit** — pra pa këtë rresht
   * te dalja rri një funksion që importon `../src/takimi.ts`, skedar që atje
   * nuk ekziston. `npm test`, `tsc --noEmit` dhe `npm run build` kalojnë të
   * gjitha; refuzimi vjen vetëm te botimi, pas gjithçkaje.
   */
  const cilesimet = readFileSync(new URL('../tsconfig.json', import.meta.url), 'utf8');

  // Komentet te tsconfig-u i lejon Vercel-i e jo `JSON.parse`, prandaj lexohet
  // si tekst: ajo që na duhet është një rresht, dhe ai lexohet ashtu.
  assert.match(
    cilesimet,
    /"rewriteRelativeImportExtensions"\s*:\s*true/,
    'pa `rewriteRelativeImportExtensions` funksioni i sinjalizimit nuk botohet dot',
  );
});
