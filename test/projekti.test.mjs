/**
 * Provat e asaj që pranohet të shkruhet te fushat e projektit.
 *
 * Një nga këto kontrolle është i vetmi gardh mes një gabimi të zakonshëm
 * kopjimi dhe një baze të hapur fare: çelësi `service_role` rri dy rreshta nën
 * atë publik te paneli i Supabase-it, dhe ai i anashkalon të gjitha rregullat e
 * rreshtave. Prandaj refuzohet para se të shkruhet në disk.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  kontrolloCelesin,
  linkuSqlEditor,
  mesazhiGabimit,
  normalizoUrl,
  referencaProjektit,
} from '../src/projekti.ts';

/** Një JWT i rremë me rolin e dhënë — vetëm `role`-i lexohet, dhe lexohet për
 * të refuzuar. */
function jwt(role) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256' })}.${b64({ role, iss: 'supabase' })}.nenshkrim`;
}

test('adresa pranohet te tri format që kopjohen vërtet', () => {
  const pritet = 'https://abcdefghijklmnop.supabase.co';
  assert.equal(normalizoUrl('abcdefghijklmnop.supabase.co'), pritet);
  assert.equal(normalizoUrl('https://abcdefghijklmnop.supabase.co'), pritet);
  assert.equal(normalizoUrl('  https://abcdefghijklmnop.supabase.co/  '), pritet);
});

test('një fjalë e vetme nuk është adresë', () => {
  /*
   * Refuzimi këtu e kthen gabimin e shtypjes në «kjo nuk është adresë» sa kohë
   * fusha rri ende në ekran, në vend të një «projekti nuk u arrit» një sekondë
   * më vonë — e cila lexohet si faji i projektit e jo i shtypjes.
   */
  assert.equal(normalizoUrl('projekti'), '');
  assert.equal(normalizoUrl(''), '');
  assert.equal(normalizoUrl('http://abcdefghijklmnop.supabase.co'), '');
});

test('localhost-i mbetet i lejuar, edhe pa https', () => {
  // Kush nuk do t’ia besojë historikun një reje të huaj mund ta ngrejë vetë
  // Supabase-in te makina e vet.
  assert.equal(normalizoUrl('http://localhost:54321'), 'http://localhost:54321');
});

test('çelësi sekret dhe ai service_role refuzohen me emër', () => {
  const sekreti = kontrolloCelesin('sb_secret_abcdef');
  assert.equal(sekreti.ok, false);
  assert.match(sekreti.gabimi, /sekret/i);

  const roli = kontrolloCelesin(jwt('service_role'));
  assert.equal(roli.ok, false);
  assert.match(roli.gabimi, /service_role/);
});

test('çelësi publik pranohet, i vjetri dhe i riu', () => {
  assert.deepEqual(kontrolloCelesin(jwt('anon')), { ok: true, vlera: jwt('anon') });
  const i_ri = 'sb_publishable_abcdef123';
  assert.deepEqual(kontrolloCelesin(` ${i_ri} `), { ok: true, vlera: i_ri });
});

test('çka nuk duket si çelës Supabase refuzohet', () => {
  assert.equal(kontrolloCelesin('').ok, false);
  assert.equal(kontrolloCelesin('marrëzi').ok, false);
  assert.equal(kontrolloCelesin(jwt('authenticated')).ok, false);
});

test('referenca del vetëm nga një adresë e vërtetë Supabase', () => {
  assert.equal(referencaProjektit('https://abcdefghijklmnop.supabase.co'), 'abcdefghijklmnop');
  assert.equal(referencaProjektit('ABCDEFGHIJKLMNOP.supabase.co'), 'abcdefghijklmnop');
  // Domen i vetin ose instalim i vetëstrehuar: s’ka referencë për të
  // hamendësuar, dhe një lidhje e ndërtuar mbi hamendje bie diku ku s’është asgjë.
  assert.equal(referencaProjektit('https://baza.shembull.com'), '');
  assert.equal(referencaProjektit('http://localhost:54321'), '');
});

test('lidhja e editorit e mban skriptin brenda, ose bie te paneli', () => {
  const link = linkuSqlEditor('abcdefghijklmnop.supabase.co', 'select 1;');
  assert.match(link, /\/project\/abcdefghijklmnop\/sql\/new\?content=/);
  assert.ok(link.includes(encodeURIComponent('select 1;')));

  assert.equal(linkuSqlEditor('baza.shembull.com', 'select 1;'), 'https://supabase.com/dashboard');
});

test('gabimet e projektit përkthehen te diçka me të cilën njeriu vepron', () => {
  /*
   * «Invalid login credentials» nuk i thotë njeriut cilën nga dy fushat ta
   * shohë, dhe «PGRST205» nuk i thotë se skripti s’ka rënë kurrë.
   */
  assert.match(
    mesazhiGabimit(400, { message: 'Invalid login credentials' }),
    /Email-i ose fjalëkalimi/,
  );
  assert.match(mesazhiGabimit(400, { error_code: 'email_not_confirmed' }), /konfirmuar/);
  assert.match(mesazhiGabimit(404, { code: 'PGRST205' }), /nuk është konfiguruar ende/);
  assert.match(mesazhiGabimit(403, {}), /RLS/);
  // Çka nuk njihet kalon me fjalët e vetë serverit: anglisht, por të vërteta.
  assert.equal(mesazhiGabimit(500, { message: 'boom' }), 'boom');
  assert.match(mesazhiGabimit(500, null), /500/);
});
