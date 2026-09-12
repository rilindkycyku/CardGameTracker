/*
 * Dëshmitar zhvillimi: një Supabase i rremë, sa për të provuar shtresën e
 * `fetch`-it. Nuk hyn te aplikacioni dhe nuk rri te `package.json` — si
 * `peerjs-server` te mënyra me kod.
 *
 * Mban pikërisht aq sa prek `supabase.ts`: një hyrje me fjalëkalim, një
 * rifreskim, një `select`, një `upsert` dhe një `delete`. Tabela nis që NUK
 * ekziston, që të provohet rruga e ngritjes; `POST /ngrije` e krijon, ashtu si
 * do ta bënte «Run» te SQL Editor-i.
 */
import { createServer } from 'node:http';

let tabelaEkziston = false;
const rreshtat = new Map(); // `${store}:${record_id}` → rreshti
let ora = 1_700_000_000_000;

const trup = (res, kodi, o) => {
  res.writeHead(kodi, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': '*',
    'access-control-expose-headers': 'content-range',
  });
  res.end(JSON.stringify(o ?? null));
};

const lexo = (req) =>
  new Promise((zgjidh) => {
    let d = '';
    req.on('data', (c) => (d += c));
    req.on('end', () => zgjidh(d ? JSON.parse(d) : null));
  });

createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') return trup(res, 204, null);

  if (u.pathname === '/rivendos') {
    tabelaEkziston = false; rreshtat.clear();
    return trup(res, 200, { ok: true });
  }
  if (u.pathname === '/ngrije') { tabelaEkziston = true; return trup(res, 200, { ok: true }); }
  if (u.pathname === '/rreshtat')
    return trup(res, 200, [...rreshtat.values()].map((r) => `${r.store}:${r.record_id}`));
  if (u.pathname === '/gjendja') return trup(res, 200, { tabelaEkziston, rreshta: rreshtat.size });

  if (u.pathname.startsWith('/auth/v1/token')) {
    const trupi = await lexo(req);
    if (trupi?.password && trupi.password !== 'fjalekalimi') {
      return trup(res, 400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
    }
    return trup(res, 200, {
      access_token: 'token-i-hyrjes', refresh_token: 'token-i-rifreskimit', expires_in: 3600,
      user: { id: 'perdoruesi-1', email: 'une@shembull.dev' },
    });
  }
  if (u.pathname === '/auth/v1/logout') return trup(res, 204, null);

  if (u.pathname.startsWith('/rest/v1/tavolina_records')) {
    if (!tabelaEkziston) {
      return trup(res, 404, { code: 'PGRST205', message: 'Could not find the table' });
    }
    if (req.method === 'POST') {
      const dala = [];
      for (const r of await lexo(req)) {
        ora += 1;
        const i = { ...r, updated_at: new Date(ora).toISOString() };
        rreshtat.set(`${r.store}:${r.record_id}`, i);
        dala.push({ store: i.store, record_id: i.record_id, updated_at: i.updated_at });
      }
      const pref = String(req.headers.prefer || '');
      return trup(res, 201, pref.includes('return=minimal') ? null : dala);
    }
    if (req.method === 'DELETE') { rreshtat.clear(); return trup(res, 204, null); }

    // GET: filtrimi sa na duhet — `store=neq.meta` dhe `updated_at=gt.…`.
    const store = u.searchParams.get('store') || '';
    const nga = u.searchParams.get('updated_at') || '';
    let lista = [...rreshtat.values()];
    if (store.startsWith('neq.')) lista = lista.filter((r) => r.store !== store.slice(4));
    if (store.startsWith('eq.')) lista = lista.filter((r) => r.store === store.slice(3));
    if (nga.startsWith('gt.')) {
      const kufiri = Date.parse(decodeURIComponent(nga.slice(3)));
      lista = lista.filter((r) => Date.parse(r.updated_at) > kufiri);
    }
    lista.sort((a, b) => a.updated_at.localeCompare(b.updated_at));
    res.writeHead(200, {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-expose-headers': 'content-range',
      'content-range': `0-${Math.max(lista.length - 1, 0)}/${lista.length}`,
    });
    return res.end(JSON.stringify(lista));
  }

  return trup(res, 404, { message: 'nuk njihet' });
}).listen(54321, () => console.log('supabase i rremë te :54321'));
