/**
 * Provat e bashkimit.
 *
 * Ky është vendi ku humbet historiku i një shoqërie nëse humbet diku. Një
 * renditje e gabuar mes «çka zbriti» dhe «çka mban kjo pajisje» nuk duket si
 * gabim: ekrani hapet, tabela vizatohet, dhe mbrëmja e së mërkurës thjesht nuk
 * është më aty. Prandaj këtu nuk provohet «a punon», provohet secili nga
 * vendimet që e mbajnë atë të pahumbur.
 *
 * Asnjë bazë dhe asnjë rrjet: `bashkimi.ts` është objekte brenda, objekte
 * jashtë (pika 1).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  KOHA_PARA_SINKRONIZIMIT,
  MENYRAT,
  celesatLokale,
  celesiRreshtit,
  fushatENjeRreshti,
  gjendjaLokale,
  mungojneNeCloud,
  ndryshimetLokale,
  numriLokal,
  pajisjaPaTeDhena,
  permbledhjaELidhjes,
  planiIAplikimit,
  sipasStorit,
  teDhenatPerCloud,
  uidetLokale,
} from '../src/bashkimi.ts';

/* ── Ndihmësit ──────────────────────────────────────────────────────────── */

const GRUPI = (extra = {}) => ({
  id: 1,
  uid: 'grup_a',
  name: 'Brigj',
  playerNames: ['alfa', 'beta'],
  perditesuar: 1000,
  ...extra,
});

const LOJA = (extra = {}) => ({
  id: 1,
  uid: 'loje_a',
  groupId: 1,
  date: '2026-03-08',
  selectedPlayers: ['alfa', 'beta'],
  createdAt: 1700000000000,
  lloji: 'bridzh',
  perditesuar: 1000,
  ...extra,
});

const RAUNDI = (extra = {}) => ({
  id: 1,
  uid: 'raund_a',
  gameId: 1,
  roundNumber: 1,
  scores: { alfa: -20, beta: 100 },
  perditesuar: 1000,
  ...extra,
});

const gjendja = (o = {}) => ({ groups: [], games: [], rounds: [], varret: [], ...o });

/** Gjendja ashtu si e do `planiIAplikimit`. */
const ana = (g) => ({ ...gjendjaLokale(g), uidet: uidetLokale(g) });

const rreshti = (store, uid, perditesuar, data, fshire = false) => ({
  store,
  uid,
  perditesuar,
  fshire,
  data,
});

const DATA_E_GRUPIT = { name: 'Brigj i ri', playerNames: ['alfa', 'beta', 'gama'] };
const DATA_E_LOJES = {
  groupUid: 'grup_a',
  date: '2026-03-09',
  selectedPlayers: ['alfa', 'beta'],
  createdAt: 1700000000001,
  lloji: 'domina',
};
const DATA_E_RAUNDIT = { gameUid: 'loje_a', roundNumber: 2, scores: { alfa: 0, beta: 21 } };

/* ── Kush fiton ─────────────────────────────────────────────────────────── */

test('ndryshimi lokal i padërguar fiton mbi rreshtin që zbriti', () => {
  /*
   * Rregulli mes pajisjeve është «fiton e fundit që sinkronizon», e jo «fiton
   * ajo që e ka orën më përpara». Pa këtë, një telefon me orën një orë prapa do
   * ta humbte çdo raund që shënon — dhe do ta humbte në heshtje, sepse ai raund
   * do të shihej si i dërguar.
   */
  const g = gjendja({ groups: [GRUPI({ sinkPezull: true, perditesuar: 500 })] });
  const plani = planiIAplikimit([rreshti('groups', 'grup_a', 9000, DATA_E_GRUPIT)], ana(g));

  assert.equal(plani.shkruaj.length, 0);
  assert.equal(plani.anashkaluar, 1);
  // Shënjuesi prapë kalon mbi të: vendimi «ky rresht është i llogaritur» është
  // marrë, dhe rishkarkimi i tij te çdo sinkronizim i ardhshëm s'do të arrinte gjë.
  assert.equal(plani.maxTs, 9000);
});

test('me `cloudFiton` i njëjti rresht zbatohet — kjo është «bashkoji»', () => {
  const g = gjendja({ groups: [GRUPI({ sinkPezull: true, perditesuar: 500 })] });
  const plani = planiIAplikimit([rreshti('groups', 'grup_a', 9000, DATA_E_GRUPIT)], ana(g), {
    cloudFiton: true,
  });

  assert.equal(plani.shkruaj.length, 1);
  assert.deepEqual(plani.shkruaj[0].fushat, DATA_E_GRUPIT);
});

test('jehona e rreshtit tim kapërcehet, e nuk rishkruhet çdo herë', () => {
  // Çdo dërgim e merr prapa orën që i dha serveri, prandaj rreshti im kthehet me
  // të njëjtin milisekond. Pa këtë barazi, çdo sinkronizim do të rishkruante te
  // baza gjithçka që kjo pajisje kishte dërguar ndonjëherë.
  const g = gjendja({ groups: [GRUPI({ perditesuar: 9000 })] });
  const plani = planiIAplikimit([rreshti('groups', 'grup_a', 9000, DATA_E_GRUPIT)], ana(g));

  assert.equal(plani.shkruaj.length, 0);
  assert.equal(plani.anashkaluar, 1);
});

test('regjistri i datuar para sinkronizimit dërgohet, por nuk fiton', () => {
  /*
   * Të dyja gjysmat kanë rëndësi. Ai duhet të **arrijë** te një cloud që nuk e
   * ka parë kurrë — prandaj mban flamurin — por kundër një rreshti që cloud-i e
   * mban vërtet duhet të humbasë, përndryshe një pajisje e dytë do t'i
   * ngarkonte mbrëmjet e veta të vjetra mbi redaktimet e vërteta të së parës.
   */
  const g = gjendja({
    groups: [GRUPI({ perditesuar: KOHA_PARA_SINKRONIZIMIT, sinkPezull: true })],
  });

  const { pezull } = gjendjaLokale(g);
  assert.equal(pezull.has('groups:grup_a'), false);

  assert.equal(ndryshimetLokale(g).length, 1);

  const plani = planiIAplikimit([rreshti('groups', 'grup_a', 9000, DATA_E_GRUPIT)], ana(g));
  assert.equal(plani.shkruaj.length, 1);
});

/* ── Fshirjet ───────────────────────────────────────────────────────────── */

test('fshirja e diçkaje që kjo pajisje s’e ka pasur kurrë kapërcehet', () => {
  const plani = planiIAplikimit([rreshti('groups', 'grup_x', 9000, null, true)], ana(gjendja()));

  assert.equal(plani.fshi.length, 0);
  assert.equal(plani.anashkaluar, 1);
});

test('fëmija fshihet para prindit', () => {
  // Përndryshe transaksioni do të kalonte nëpër një çast me raunde që tregojnë
  // te një lojë e zhdukur — dhe nëse ai transaksion bie aty, ai çast mbetet.
  const g = gjendja({ groups: [GRUPI()], games: [LOJA()], rounds: [RAUNDI()] });
  const plani = planiIAplikimit(
    [
      rreshti('groups', 'grup_a', 9000, null, true),
      rreshti('games', 'loje_a', 9001, null, true),
      rreshti('rounds', 'raund_a', 9002, null, true),
    ],
    ana(g),
  );

  assert.deepEqual(
    plani.fshi.map((rr) => rr.store),
    ['rounds', 'games', 'groups'],
  );
});

/* ── Prindi që nuk ka mbërritur ende ────────────────────────────────────── */

test('raundi pa lojën e vet shtyhet, dhe shënjuesi nuk kalon mbi të', () => {
  /*
   * Pa këtë, një raund i mbërritur para lojës së vet do të hidhej dhe shënjuesi
   * do të kalonte mbi të — pra ai raund nuk do të shkarkohej më kurrë. Humbja do
   * të dukej vetëm si një rresht që mungon te një tabelë e vjetër.
   */
  const g = gjendja({ groups: [GRUPI()] });
  const plani = planiIAplikimit(
    [
      rreshti('games', 'loje_a', 5000, DATA_E_LOJES),
      rreshti('rounds', 'raund_b', 7000, { ...DATA_E_RAUNDIT, gameUid: 'loje_e_panjohur' }),
      // Ky zbatohet, dhe ora e tij është më e re se e atij që u shty.
      rreshti('rounds', 'raund_c', 8000, DATA_E_RAUNDIT),
    ],
    ana(g),
  );

  assert.equal(plani.shtyre, 1);
  assert.equal(plani.shkruaj.length, 2);
  // Shënjuesi ndalet nën rreshtin e shtyrë e jo te më i riu që u zbatua: rreshti
  // te 8000 do të zbresë sërish herën tjetër dhe do të njihet si jehonë, kurse
  // ai te 7000 do të gjejë prindin e vet.
  assert.equal(plani.maxTs, 6999);
});

test('prindi dhe fëmija të mbërritur bashkë zbatohen te i njëjti sinkronizim', () => {
  const plani = planiIAplikimit(
    [
      rreshti('rounds', 'raund_b', 7000, DATA_E_RAUNDIT),
      rreshti('games', 'loje_a', 6000, DATA_E_LOJES),
      rreshti('groups', 'grup_a', 5000, DATA_E_GRUPIT),
    ],
    ana(gjendja()),
  );

  assert.equal(plani.shtyre, 0);
  assert.deepEqual(
    plani.shkruaj.map((rr) => rr.store),
    ['groups', 'games', 'rounds'],
  );
});

/* ── Çka pranohet të lexohet ────────────────────────────────────────────── */

test('lloji i panjohur refuzohet, jo lexohet si bridzh', () => {
  // Te pishpiriku fiton totali më i madh. Një lexim „si bridzh" i një loje të
  // panjohur do të shpallte fitues atë që mbeti i fundit, dhe në heshtje.
  assert.equal(fushatENjeRreshti('games', { ...DATA_E_LOJES, lloji: 'tavlle' }), null);
});

test('pikë jo-numerike e rrëzojnë raundin', () => {
  assert.equal(
    fushatENjeRreshti('rounds', { ...DATA_E_RAUNDIT, scores: { alfa: 'shumë' } }),
    null,
  );
  // `null` është vlerë e ligjshme: do të thotë «nuk shënoi», e jo zero.
  assert.deepEqual(
    fushatENjeRreshti('rounds', { ...DATA_E_RAUNDIT, scores: { alfa: null } }).scores,
    { alfa: null },
  );
});

test('zeroja e kufirit dhe `false`-ja e mbylljes mbijetojnë', () => {
  /*
   * Te të dyja fushat mungesa do të thotë diçka tjetër nga vlera (pikat 13 e
   * 15): `kufiri: 0` është «pa kufi», dhe `mbyllur: false` është «e rihapur me
   * dorë». Një lexim me `||` do t’i bënte të dyja «mungon» — dhe mbrëmja do të
   * mbyllej vetvetiu pikërisht atje ku u nis për të mos e pasur.
   */
  const dala = fushatENjeRreshti('games', { ...DATA_E_LOJES, kufiri: 0, mbyllur: false });
  assert.equal(dala.kufiri, 0);
  assert.equal(dala.mbyllur, false);

  const pa = fushatENjeRreshti('games', DATA_E_LOJES);
  assert.equal('kufiri' in pa, false);
  assert.equal('mbyllur' in pa, false);
});

test('kufiri i thyer a negativ e rrëzon lojën', () => {
  assert.equal(fushatENjeRreshti('games', { ...DATA_E_LOJES, kufiri: -1 }), null);
  assert.equal(fushatENjeRreshti('games', { ...DATA_E_LOJES, kufiri: 10.5 }), null);
});

test('një store që s’e njeh aplikacioni shpërfillet, jo shkruhet', () => {
  const plani = planiIAplikimit(
    [rreshti('shpikje', 'x_a', 9000, { çfarëdo: 1 })],
    ana(gjendja()),
  );
  assert.equal(plani.shkruaj.length, 0);
  assert.equal(plani.anashkaluar, 1);
});

/* ── Çka del nga pajisja ────────────────────────────────────────────────── */

test('trupi i dërguar mban vetëm fushat e lojës, dhe lidhjet si `uid`', () => {
  const uidet = { grupet: new Map([[1, 'grup_a']]), lojerat: new Map([[1, 'loje_a']]) };

  const loja = teDhenatPerCloud('games', LOJA({ sinkPezull: true }), uidet);
  assert.equal(loja.groupUid, 'grup_a');
  for (const fushe of ['id', 'uid', 'groupId', 'perditesuar', 'sinkPezull']) {
    assert.equal(fushe in loja, false, `${fushe} nuk ka pse të dalë nga pajisja`);
  }

  const raundi = teDhenatPerCloud('rounds', RAUNDI(), uidet);
  assert.equal(raundi.gameUid, 'loje_a');
  assert.equal('gameId' in raundi, false);
});

test('regjistri me prind të panjohur nuk niset fare', () => {
  // Do të mbërrinte te pajisja tjetër si rresht që nuk zbatohet dot kurrë.
  const g = gjendja({ games: [LOJA({ groupId: 99, sinkPezull: true })] });
  assert.equal(ndryshimetLokale(g, { uidet: { grupet: new Map(), lojerat: new Map() } }).length, 0);
});

test('dërgohet vetëm ajo që pret, veç kur kërkohet gjithçka', () => {
  const uidet = { grupet: new Map([[1, 'grup_a']]), lojerat: new Map([[1, 'loje_a']]) };
  const g = gjendja({
    groups: [GRUPI({ sinkPezull: true })],
    games: [LOJA()],
    varret: [
      { celesi: 'rounds:raund_z', store: 'rounds', uid: 'raund_z', perditesuar: 1200, sinkPezull: true },
    ],
  });

  assert.deepEqual(
    ndryshimetLokale(g, { uidet }).map((rr) => rr.uid),
    ['grup_a', 'raund_z'],
  );
  assert.equal(ndryshimetLokale(g, { uidet, gjithcka: true }).length, 3);

  // Çka sapo zbriti nuk kthehet prapa.
  assert.deepEqual(
    ndryshimetLokale(g, { uidet, perjashto: new Set(['groups:grup_a']) }).map((rr) => rr.uid),
    ['raund_z'],
  );
});

test('varri del si fshirje pa trup', () => {
  const g = gjendja({
    varret: [
      { celesi: 'games:loje_a', store: 'games', uid: 'loje_a', perditesuar: 1200, sinkPezull: true },
    ],
  });
  const [rr] = ndryshimetLokale(g);
  assert.equal(rr.fshire, true);
  assert.equal(rr.data, null);
});

/* ── Çka i mungon cloud-it ──────────────────────────────────────────────── */

test('ajo që cloud-i s’e ka gjendet edhe kur flamuri thotë «e dërguar»', () => {
  /*
   * Flamuri mjafton derisa të dyja anët të mos pajtohen. Pastaj mospajtimi bëhet
   * i përhershëm: një regjistër i shënuar «i dërguar» nuk shikohet më kurrë, dhe
   * numrat e dy anëve rrinë të ndryshëm pa asnjë rrugë për të vepruar.
   */
  const g = gjendja({ groups: [GRUPI()], games: [LOJA()] });
  const munguara = mungojneNeCloud(g, new Set(['groups:grup_a']));

  assert.deepEqual(munguara, [{ store: 'games', uid: 'loje_a' }]);
});

/* ── Numrat që i tregohen njeriut ───────────────────────────────────────── */

test('çelësat dhe numërimi i tyre lexohen me fjalë', () => {
  const g = gjendja({ groups: [GRUPI()], games: [LOJA()], rounds: [RAUNDI()] });

  assert.equal(numriLokal(g), 3);
  assert.deepEqual(sipasStorit(celesatLokale(g)), { groups: 1, games: 1, rounds: 1 });
  // `uid`-i mban dy pika brenda vetes vetëm nëse dikush e shpik; një çelës pa
  // store përpara nuk është nga këta fare.
  assert.deepEqual(sipasStorit(['pa-dy-pika']), {});
});

test('mënyra e ofruar varet nga ajo që kanë të dyja anët', () => {
  const plot = gjendja({ groups: [GRUPI()] });
  const bosh = gjendja({ groups: [GRUPI({ perditesuar: KOHA_PARA_SINKRONIZIMIT })] });

  // Cloud i zbrazët: s’ka çka humb.
  assert.equal(permbledhjaELidhjes(plot, new Set()).rekomandimi, MENYRAT.DERGO);
  // Pajisje pa asgjë të vetën: s’ka çka mbron.
  assert.equal(pajisjaPaTeDhena(bosh), true);
  assert.equal(permbledhjaELidhjes(bosh, new Set(['groups:grup_b'])).rekomandimi, MENYRAT.MERR);
  // Të dyja me diçka: mbahen të dyja.
  assert.equal(permbledhjaELidhjes(plot, new Set(['groups:grup_b'])).rekomandimi, MENYRAT.BASHKO);
});

test('numrat e përmbledhjes nuk e numërojnë dy herë të njëjtin regjistër', () => {
  const g = gjendja({ groups: [GRUPI()], games: [LOJA()] });
  const p = permbledhjaELidhjes(g, new Set(['groups:grup_a', 'rounds:raund_z']));

  assert.equal(p.lokal, 2);
  assert.equal(p.cloud, 2);
  assert.equal(p.teNjejta, 1);
  assert.equal(p.vetemLokale, 1);
  assert.equal(p.vetemCloud, 1);
});

test('çelësi i një rreshti është i njëjti nga të dyja anët', () => {
  assert.equal(celesiRreshtit('games', 'loje_a'), 'games:loje_a');
});
