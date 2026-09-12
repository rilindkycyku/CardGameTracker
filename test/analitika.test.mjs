/**
 * Provat e asaj që del nga pajisja te matja.
 *
 * Një adresë e dërguar e plotë nuk duket gabim: numrat te paneli dalin, faqja
 * punon, dhe e vetmja gjë që ndodhi është se mbrëmja e një shoqërie — emrat,
 * raundet, totalet — shkoi te serveri i dikujt tjetër brenda një `?url=`.
 * Prandaj maten këtu, dhe maten mbi paketa të vërteta.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { adresaEMates, shtegiIMates } from '../src/analitika.ts';

/** Një paketë e vërtetë e `ndarja.ts`: emra, totale, radhë tavoline. */
const PAKETA =
  '2b~YWxmYXxiZXRhfGdhbWE~MTIwfDIzNXwtNDA~1f3k9x';

test('rruga e parë lexohet ashtu si është', () => {
  assert.equal(shtegiIMates(''), '/');
  assert.equal(shtegiIMates('/'), '/');
});

test('numri i grupit dhe i lojës bëhet `[id]`', () => {
  // Numri vetë nuk është sekret, por as nuk thotë asgjë: dyzet mbrëmje do të
  // dilnin dyzet rreshta te paneli, dhe asnjëri nuk do të lexohej.
  assert.equal(shtegiIMates('/grupi/12'), '/grupi/[id]');
  assert.equal(shtegiIMates('/loja/3'), '/loja/[id]');
  assert.equal(shtegiIMates('/loja/1247'), '/loja/[id]');
});

test('rruga me numër të pavlefshëm lexohet si ekrani i parë', () => {
  // `App`-i kthen te grupet për një rrugë që nuk e njeh; matja shkruan atë që
  // u pa vërtet, e jo atë që kërkoi adresa.
  for (const rruga of ['/loja/abc', '/loja/0', '/loja/-2', '/grupi', '/loja']) {
    assert.equal(shtegiIMates(rruga), '/', rruga);
  }
});

test('paketa dhe kodi nuk dalin nga pajisja', () => {
  /*
   * Kjo është e tërë arsyeja pse ky skedar ekziston. Te `#/shiko/<paketë>` rri
   * mbrëmja e plotë, dhe te `#/bashkohu/<kod>` rri kodi me të cilin kushdo do
   * të lidhej te pikët e drejtpërdrejta.
   */
  const rruget = [
    [`/shiko/${PAKETA}`, '/shiko'],
    [`/lidhu/${PAKETA}`, '/lidhu'],
    [`/pergjigje/${PAKETA}`, '/pergjigje'],
    ['/bashkohu/K3M8TZ4Q', '/bashkohu'],
    ['/bashkohu', '/bashkohu'],
  ];

  for (const [rruga, pritet] of rruget) {
    const dale = shtegiIMates(rruga);
    assert.equal(dale, pritet, rruga);
    assert.ok(!dale.includes(PAKETA));
    assert.ok(!dale.includes('K3M8TZ4Q'));
  }
});

test('ekrani i sinkronizimit numërohet me emrin e vet', () => {
  /*
   * Kjo rrugë nuk mban asgjë brenda hash-it — adresa e projektit, çelësi dhe
   * email-i rrinë te `localStorage` e nuk kalojnë kurrë nga shiriti — prandaj
   * emri del i plotë. Rri e shkruar këtu me vetëdije: një rrugë që nuk shtohet
   * te ai skedar numërohet si ekrani i parë (pika 18).
   */
  assert.equal(shtegiIMates('/sinkronizimi'), '/sinkronizimi');
});

test('një rrugë e panjohur nuk kalon tekst nga jashtë', () => {
  // Dalja është gjithmonë një nga emrat e shkruar te moduli: një rrugë e re e
  // shtuar nesër nuk rrjedh vetvetiu — duhet shtuar edhe atje.
  for (const rruga of ['/e-shpikur/diçka', '/../../etc/passwd', '/loja/3/4']) {
    const dale = shtegiIMates(rruga);
    assert.ok(['/', '/loja/[id]'].includes(dale), `${rruga} → ${dale}`);
  }
});

test('adresa e plotë e humb hash-in dhe pyetjen, e mban origjinën', () => {
  assert.equal(
    adresaEMates(`https://tavolina.example/#/shiko/${PAKETA}`),
    'https://tavolina.example/shiko',
  );
  assert.equal(
    adresaEMates('https://tavolina.example/?nga=whatsapp#/loja/7'),
    'https://tavolina.example/loja/[id]',
  );
  assert.equal(
    adresaEMates('https://tavolina.example/'),
    'https://tavolina.example/',
  );
});

test('asnjë adresë e ndarë nuk e nxjerr paketën', () => {
  // Prova e fundit, mbi tërë rrugët bashkë: sado e gjatë të jetë adresa, ajo
  // që del nuk e mban asnjë karakter të trupit të saj.
  for (const pjesa of ['shiko', 'lidhu', 'pergjigje', 'bashkohu']) {
    const dale = adresaEMates(`https://tavolina.example/#/${pjesa}/${PAKETA}`);
    assert.equal(dale, `https://tavolina.example/${pjesa}`);
  }
});

test('një adresë që nuk lexohet numërohet, por pa vend', () => {
  // Matja numëron një hapje pa ditur ku — që është ajo që dimë vërtet.
  assert.equal(adresaEMates('jo-adresë'), '/');
  assert.equal(adresaEMates(''), '/');
});
