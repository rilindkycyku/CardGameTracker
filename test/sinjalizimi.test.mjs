/**
 * Provat e sinjalizimit.
 *
 * `test/sdp.json` mban SDP të vërteta të Chromium-it — një çift me IP të vërtetë
 * dhe një çift me emra mDNS, ashtu si i lëshon telefoni. Provat maten kundër
 * tyre e jo kundër një SDP-je të shpikur: gabimi i vërtetë tek ky modul është
 * pikërisht një fushë që shfletuesi e shkruan ndryshe nga sa u pritej.
 *
 * Se SDP-ja e rindërtuar pranohet vërtet nga shfletuesi nuk provohet dot këtu —
 * kjo kërkon `RTCPeerConnection`. Ajo mbahet nga prova me shfletues, dhe këtu
 * mbahet ajo që mund të matet pa të: fushat, kufijtë dhe çka refuzohet.
 */

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  adresaEFteses,
  adresaEPergjigjes,
  kodiIPergjigjes,
  paketoSinjalin,
  sdpNgaSinjali,
  shpaketoSinjalin,
  sinjaliNgaSdp,
} from '../src/sinjalizimi.ts';

const sdp = JSON.parse(readFileSync(new URL('./sdp.json', import.meta.url)));

const CIFTET = [
  ['IP e vërtetë', sdp.ip],
  ['emër mDNS', sdp.mdns],
];

/* ── Leximi i SDP-së së vërtetë ─────────────────────────────────────────── */

for (const [emri, cifti] of CIFTET) {
  test(`ftesa e Chrome-it lexohet e tëra — ${emri}`, () => {
    const sinjali = sinjaliNgaSdp(cifti.ftesa, 'ftese');
    assert.ok(sinjali);

    assert.equal(sinjali.lloji, 'ftese');
    assert.equal(sinjali.setup, 'actpass');
    assert.equal(sinjali.mid, '0');
    assert.equal(sinjali.sctp, 5000);
    assert.equal(sinjali.maxMesazhi, 262144);
    assert.equal(sinjali.ref, '');

    // Kredencialet dhe gishtëza duhet të dalin fjalë për fjalë ato të SDP-së.
    assert.equal(sinjali.ufrag, cifti.ftesa.match(/a=ice-ufrag:(.+)/)[1].trim());
    assert.equal(sinjali.pwd, cifti.ftesa.match(/a=ice-pwd:(.+)/)[1].trim());
    assert.equal(
      sinjali.gishti,
      cifti.ftesa.match(/a=fingerprint:sha-256 (.+)/)[1].trim().replace(/:/g, '').toLowerCase(),
    );
    assert.equal(sinjali.gishti.length, 64);

    assert.ok(sinjali.adresat.length > 0);
  });

  test(`përgjigjja e Chrome-it e mban rolin «active» — ${emri}`, () => {
    const sinjali = sinjaliNgaSdp(cifti.pergjigja, 'pergjigje', 'tRw2');
    assert.ok(sinjali);
    assert.equal(sinjali.lloji, 'pergjigje');
    assert.equal(sinjali.setup, 'active');
    assert.equal(sinjali.ref, 'tRw2');
  });

  test(`paketa shkon e kthehet e njëjtë — ${emri}`, () => {
    for (const [teksti, lloji] of [[cifti.ftesa, 'ftese'], [cifti.pergjigja, 'pergjigje']]) {
      const sinjali = sinjaliNgaSdp(teksti, lloji, lloji === 'pergjigje' ? 'tRw2' : '');
      assert.deepEqual(shpaketoSinjalin(paketoSinjalin(sinjali)), sinjali);
    }
  });

  test(`SDP-ja e rindërtuar i mban të gjitha fushat që kanë kuptim — ${emri}`, () => {
    const sinjali = sinjaliNgaSdp(cifti.ftesa, 'ftese');
    const rindertuar = sdpNgaSinjali(sinjali);

    // Rindërtimi duhet të lexohet sërish në të njëjtin sinjal — pika ku një
    // fushë e shkruar gabim te rindërtimi do të dukej menjëherë.
    assert.deepEqual(sinjaliNgaSdp(rindertuar, 'ftese'), sinjali);

    // SDP-ja i kërkon fundet CRLF; pa ato Firefox-i e hedh poshtë.
    assert.ok(rindertuar.endsWith('\r\n'));
    assert.ok(!/[^\r]\n/.test(rindertuar));

    // Rreshtat e domosdoshëm për një kanal të vetëm të dhënash.
    for (const rreshti of [
      'v=0',
      'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
      `a=group:BUNDLE ${sinjali.mid}`,
      `a=mid:${sinjali.mid}`,
      'a=end-of-candidates',
    ]) {
      assert.ok(rindertuar.includes(rreshti), `mungon: ${rreshti}`);
    }
  });
}

test('paketa e ftesës hyn te një kod QR i skanueshëm', () => {
  // Kufiri nuk është i zgjedhur kot: mbi ~300 karaktere kodi kalon versionin 12
  // dhe modulet bien nën tre piksela në ekranin e një telefoni.
  for (const [emri, cifti] of CIFTET) {
    const paketa = paketoSinjalin(sinjaliNgaSdp(cifti.ftesa, 'ftese'));
    const adresa = adresaEFteses('http://192.168.1.5:5173/#/loja/3', paketa);
    assert.ok(adresa.length < 300, `${emri}: ${adresa.length} karaktere`);
  }
});

/* ── Kandidatët që nuk kanë kuptim pa server ────────────────────────────── */

test('mbahen vetëm kandidatët «typ host» mbi UDP', () => {
  const sinjali = sinjaliNgaSdp(
    [
      'v=0',
      'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
      'a=ice-ufrag:tRw2',
      'a=ice-pwd:0f1YvQZytY3C2K71NEw+a8mc',
      'a=fingerprint:sha-256 ' + 'AB:'.repeat(31) + 'CD',
      'a=setup:actpass',
      'a=mid:0',
      'a=candidate:1 1 udp 2113937151 192.168.1.5 40000 typ host generation 0',
      // TCP me portë 9 — i pavlefshëm pa server.
      'a=candidate:2 1 tcp 1518280447 192.168.1.5 9 typ host tcptype active',
      // srflx dhe relay do të kërkonin STUN/TURN, pra pikërisht serverin që nuk ka.
      'a=candidate:3 1 udp 1677729535 93.184.216.34 40001 typ srflx raddr 192.168.1.5',
      'a=candidate:4 1 udp 41885439 93.184.216.34 40002 typ relay raddr 0.0.0.0',
      // Komponenti 2 është RTCP; te SCTP nuk ekziston.
      'a=candidate:5 2 udp 2113937150 192.168.1.5 40003 typ host',
      // I njëjti dy herë — te SDP-ja e rindërtuar do të dilte i dyfishuar.
      'a=candidate:6 1 udp 2113937151 192.168.1.5 40000 typ host generation 0',
    ].join('\r\n'),
    'ftese',
  );

  assert.ok(sinjali);
  assert.deepEqual(sinjali.adresat, [['192.168.1.5', 40000]]);
});

/* ── Çka refuzohet ──────────────────────────────────────────────────────── */

test('paketa e prerë ose e ndryshuar nuk jep kurrë sinjal tjetër', () => {
  const sinjali = sinjaliNgaSdp(sdp.mdns.ftesa, 'ftese');
  const paketa = paketoSinjalin(sinjali);

  // Çdo prerje e mundshme nga fundi.
  for (let sa = 1; sa <= paketa.length - 1; sa++) {
    assert.equal(shpaketoSinjalin(paketa.slice(0, -sa)), null, `prerja ${sa}`);
  }

  /*
   * Çdo shkronjë e ndërruar me tjetrën, në çdo pozicion.
   *
   * Kërkesa nuk është që çdo ndryshim të refuzohet, sepse ka një ndryshim që
   * nuk është ndryshim: shkronja e fundit e base64-shit mban katër bita që
   * bien jashtë bajtit të fundit, prandaj tri vlera të ndryshme atje dekodohen
   * në pikërisht të njëjtat bajte. Ajo paketë nuk është e prishur — është e
   * njëjta paketë e shkruar ndryshe.
   *
   * Kërkesa është kjo: ose nuk lexohet, ose lexohet e njëjta. Një sinjal
   * *tjetër* nga një paketë e prishur do të thoshte lidhje që dështon pa
   * shpjegim, dhe atë e kap nënshkrimi.
   */
  const ALFABETI = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const teNjejta = [];

  for (let i = 0; i < paketa.length; i++) {
    for (const shkronja of ALFABETI) {
      if (shkronja === paketa[i]) continue;

      const prishur = paketa.slice(0, i) + shkronja + paketa.slice(i + 1);
      const lexuar = shpaketoSinjalin(prishur);
      if (lexuar === null) continue;

      assert.deepEqual(lexuar, sinjali, `pozicioni ${i} → ${shkronja}`);
      teNjejta.push(i);
    }
  }

  /*
   * Dhe ato dalin vetëm te shkronja e fundit, saktësisht sa i lejojnë bitat e
   * tepërt: gjatësia e paketës herë gjashtë, minus bajtet e plota, jep bitat
   * që dekodimi i lë jashtë — dhe dy fuqia e tyre, pa origjinalin, është sa
   * shkronja të fundit dekodohen në të njëjtat bajte.
   */
  const bitatETeperta = (paketa.length * 6) % 8;
  assert.equal(teNjejta.length, 2 ** bitatETeperta - 1);
  assert.deepEqual([...new Set(teNjejta)], [paketa.length - 1]);
});

test('nuk kalon asnjë karakter që SDP-ja e lexon si rresht i vet', () => {
  const sinjali = sinjaliNgaSdp(sdp.ip.ftesa, 'ftese');
  assert.ok(sinjali);

  // Një kandidat i futur me dorë brenda adresës do të shpikte një server relay
  // dhe pikët do t'i kalonin atij. Nënshkrimi e kap ndryshimin, prandaj kjo
  // provohet duke i shkruar paketës vlerën e keqe para se të nënshkruhet.
  for (const adresa of [
    '1.2.3.4 typ host\r\na=candidate:9 1 udp 1 6.6.6.6 3478 typ relay',
    '1.2.3.4\r\na=ice-pwd:tjetri',
    'adresa me hapësirë',
    'shumë-e-gjatë-'.repeat(20),
    '',
  ]) {
    const keq = paketoSinjalin({ ...sinjali, adresat: [[adresa, 40000]] });
    assert.equal(shpaketoSinjalin(keq), null, JSON.stringify(adresa));
  }

  for (const fusha of ['ufrag', 'pwd', 'mid']) {
    for (const vlera of ['a\r\nb', 'me hapësirë', '|', ',', '']) {
      const keq = paketoSinjalin({ ...sinjali, [fusha]: vlera });
      assert.equal(shpaketoSinjalin(keq), null, `${fusha} = ${JSON.stringify(vlera)}`);
    }
  }

  // Kredencialet ICE i ka së paku katër karaktere; mid-i jo, prandaj «ab» është
  // i mirë atje dhe i keq te dy të tjerat.
  for (const fusha of ['ufrag', 'pwd']) {
    assert.equal(shpaketoSinjalin(paketoSinjalin({ ...sinjali, [fusha]: 'ab' })), null, fusha);
  }
  assert.ok(shpaketoSinjalin(paketoSinjalin({ ...sinjali, mid: 'ab' })));

  const roliIKeq = paketoSinjalin({ ...sinjali, setup: 'holdconn' });
  assert.equal(shpaketoSinjalin(roliIKeq), null);
});

test('SDP pa fushat e domosdoshme nuk jep sinjal', () => {
  const plote = sdp.ip.ftesa;

  for (const parathenja of [
    'a=ice-ufrag:',
    'a=ice-pwd:',
    'a=mid:',
    'a=setup:',
    'a=fingerprint:sha-256 ',
  ]) {
    const cunguar = plote
      .split(/\r\n|\n/)
      .filter((rreshti) => !rreshti.startsWith(parathenja))
      .join('\r\n');

    assert.equal(sinjaliNgaSdp(cunguar, 'ftese'), null, `pa ${parathenja}`);
  }
});

test('gishtëza që nuk është 32 bajte nuk pranohet', () => {
  const shkurter = sdp.ip.ftesa.replace(
    /a=fingerprint:sha-256 .+/,
    'a=fingerprint:sha-256 AB:CD:EF',
  );
  assert.equal(sinjaliNgaSdp(shkurter, 'ftese'), null);
});

test('paketa boshe dhe teksti i çfarëdoshëm nuk rrëzojnë leximin', () => {
  for (const kodi of ['', 'x', 'jo-paketë', '||||', 'A'.repeat(400), '!@#$']) {
    assert.equal(shpaketoSinjalin(kodi), null, JSON.stringify(kodi));
  }
});

/* ── Adresat ────────────────────────────────────────────────────────────── */

test('adresat e ndërtuara e presin hash-in e vjetër', () => {
  assert.equal(
    adresaEFteses('http://192.168.1.5:5173/#/loja/3', 'AAA'),
    'http://192.168.1.5:5173/#/lidhu/AAA',
  );
  assert.equal(
    adresaEPergjigjes('http://192.168.1.5:5173/#/lidhu/BBB', 'CCC'),
    'http://192.168.1.5:5173/#/pergjigje/CCC',
  );
  assert.equal(
    adresaEFteses('https://bridzh.example/nen/faqe/', 'AAA'),
    'https://bridzh.example/nen/faqe/#/lidhu/AAA',
  );
});

test('kodi i përgjigjes nxjerrohet edhe nga adresa e plotë', () => {
  assert.equal(kodiIPergjigjes('  AbC-_123  '), 'AbC-_123');
  assert.equal(
    kodiIPergjigjes('http://192.168.1.5:5173/#/pergjigje/AbC-_123'),
    'AbC-_123',
  );
  // Ngjitja nga një bisedë sjell edhe tekst përreth.
  assert.equal(
    kodiIPergjigjes('shiko: http://192.168.1.5:5173/#/pergjigje/AbC123 faleminderit'),
    'AbC123',
  );
  assert.equal(kodiIPergjigjes(''), null);
  assert.equal(kodiIPergjigjes('   '), null);
  assert.equal(kodiIPergjigjes('jo kod'), null);
});
