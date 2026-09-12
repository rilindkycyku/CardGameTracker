/**
 * Provat e skemës së projektit të përdoruesit.
 *
 * Këto migrime bien te baza e dikujt tjetër, në një skedë tjetër, jashtë çdo
 * gjëje që aplikacioni mund ta shohë — dhe pastaj nuk ka rrugë për t’i shkruar
 * atij njeriu. Prandaj tri rregullat (vetëm shtohet, përsëritja s’prish gjë,
 * vetëm shtesa) nuk janë udhëzime te një koment: maten këtu.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MIGRIMET,
  SKEMA_VERSIONI,
  SQL_INSTALIMI,
  STORI_META,
  TABELA,
  VERSIONI_PARA_NUMERIMIT,
  migrimetPezull,
  sqlPerMigrim,
} from '../src/skema.ts';

test('numrat e migrimeve nisin te një dhe rriten me një', () => {
  // Një numër i kapërcyer ose i përsëritur do të thoshte se «te cili migrim ka
  // arritur projekti» nuk i përgjigjet më asnjë gjendjeje të vetme.
  MIGRIMET.forEach((m, i) => assert.equal(m.versioni, i + 1));
  assert.equal(SKEMA_VERSIONI, MIGRIMET.length);
  assert.equal(VERSIONI_PARA_NUMERIMIT, 1);
});

test('çdo migrim e thotë me fjalë çka bën', () => {
  // «Ekzekuto migrimin 3» nuk i thotë asgjë askujt, dhe ky tekst është i vetmi
  // që përdoruesi lexon para se t’ia lëshojë bazës së vet.
  for (const m of MIGRIMET) {
    assert.ok(m.emri.length > 10, `migrimi ${m.versioni} pa emër të lexueshëm`);
    assert.ok(m.sql.includes(TABELA));
  }
});

test('përsëritja e skriptit nuk prish gjë', () => {
  /*
   * Ky është kushti nën të cilin ngritja ofrohet si buton e jo si ritual që
   * askush nuk guxon ta përsërisë — dhe ai që e bën një skript të rënë përgjysmë
   * të sigurt për t’u provuar sërish.
   */
  for (const m of MIGRIMET) {
    // Trupi i një funksioni plpgsql rri mes dy `$$` dhe i ka pikëpresjet e veta;
    // ai kalon i tëri me `create or replace` që e mban, prandaj hiqet para
    // ndarjes e nuk lexohet fjali për fjali.
    // Edhe komentet hiqen para saj: shpjegimet shqip i kanë pikëpresjet e veta,
    // dhe një ndarje mbi to do të krijonte „fjali" që nuk janë SQL fare.
    const vetem_sql = m.sql
      .replace(/\$\$[\s\S]*?\$\$/g, '$$$$')
      .split('\n')
      .filter((rreshti) => !rreshti.trim().startsWith('--'))
      .join('\n');

    for (const fjali of vetem_sql.split(';')) {
      const i = fjali.trim();
      if (!i) continue;

      const rrethuar =
        /create table if not exists/i.test(i) ||
        /create index if not exists/i.test(i) ||
        /create or replace/i.test(i) ||
        /drop \w+ if exists/i.test(i) ||
        /add column if not exists/i.test(i) ||
        // `create policy` e `create trigger` vijnë gjithmonë pas një `drop …
        // if exists` (kontrolluar te prova poshtë), dhe `alter table … enable
        // row level security` e `grant` janë vetvetiu të përsëritshme.
        /^create (policy|trigger)/i.test(i) ||
        /^alter table .* enable row level security/i.test(i) ||
        /^grant /i.test(i);

      assert.ok(rrethuar, `fjali e parrethuar te migrimi ${m.versioni}: ${i.slice(0, 60)}`);
    }
  }
});

test('rregulli i sigurisë dhe ora e serverit rrinë te migrimi i parë', () => {
  const i_pari = MIGRIMET[0].sql;

  // Pa RLS çdo përdorues i projektit do t’i shihte rreshtat e tjetrit.
  assert.match(i_pari, /enable row level security/i);
  assert.match(i_pari, /auth\.uid\(\) = user_id/);
  // Pa trigger-in e orës, dy telefona me orë të pabarabarta do të krahasoheshin
  // me njësi të ndryshme.
  assert.match(i_pari, /new\.updated_at := now\(\)/);
  // Të dyja duhet të vijnë pas një heqjeje, përndryshe rënia e dytë bie.
  assert.ok(i_pari.indexOf('drop policy if exists') < i_pari.indexOf('create policy'));
  assert.ok(i_pari.indexOf('drop trigger if exists') < i_pari.indexOf('create trigger'));
});

test('kolonat e pajisjes hyjnë që te migrimi i parë', () => {
  // Pa to, «cila nga pajisjet e mia e bëri?» nuk ka përgjigje: i njëjti email
  // hyn kudo, dhe `updated_at` thotë kur e jo kush.
  assert.match(MIGRIMET[0].sql, /device_id/);
  assert.match(MIGRIMET[0].sql, /device_name/);
});

test('verifikimi i një migrimi e pyet vetë bazën', () => {
  // Skripti bie jashtë aplikacionit, prandaj «a funksionoi?» nuk ka nga ku të
  // kthehet veç nga vetë projekti.
  for (const m of MIGRIMET) {
    if (!m.verifikimi) continue;
    assert.ok(m.verifikimi.startsWith(`${TABELA}?`));
  }
});

test('migrimet pezull janë ato pas numrit të dhënë', () => {
  assert.deepEqual(migrimetPezull(0), MIGRIMET);
  assert.deepEqual(migrimetPezull(SKEMA_VERSIONI), []);
  assert.equal(sqlPerMigrim(SKEMA_VERSIONI), '');
});

test('skripti i plotë mban të gjitha migrimet dhe udhëzimin', () => {
  for (const m of MIGRIMET) assert.ok(SQL_INSTALIMI.includes(m.sql));
  assert.match(SQL_INSTALIMI, /SQL Editor/);
});

test('stori i shenjave rri jashtë emrave të storeve të bazës', () => {
  // `meta` nuk është store i aplikacionit, prandaj bashkimi kalon përtej tij pa
  // e parë — dhe pikërisht kjo e lejon shenjën e migrimit të rrijë si rresht i
  // zakonshëm i së njëjtës tabelë.
  assert.equal(['groups', 'games', 'rounds'].includes(STORI_META), false);
});
