/**
 * Çka pranohet të shkruhet te fushat e projektit, dhe çka i thuhet përdoruesit
 * kur projekti përgjigjet keq.
 *
 * Të tria gjërat që futen me dorë — adresa e projektit, çelësi publik, dhe
 * përgjigjet e gabimit që kthehen prej andej — janë vargje, dhe vendimi mbi to
 * është varg brenda, varg jashtë. Prandaj rrinë këtu e jo te `supabase.ts`
 * (pika 1): aty rri `fetch`-i dhe `localStorage`-i, të cilat nuk provohen dot
 * me `node --test`.
 *
 * Kontrolli i çelësit nuk është zbukurim. Çelësi `service_role` e anashkalon
 * çdo rregull sigurie, pra është i vetmi kredencial që nuk guxon të rrijë kurrë
 * te një shfletues — dhe paneli i Supabase-it e shkruan dy rreshta nën çelësin
 * publik. Prandaj refuzohet para se të shkruhet në disk.
 */

import { TABELA } from './skema.ts';

/** Rezultati i një kontrolli: ose vlera e pastruar, ose arsyeja shqip. */
export type Kontrolli =
  | { ok: true; vlera: string }
  | { ok: false; gabimi: string };

/**
 * Adresa e projektit, e pastruar.
 *
 * Pranohen tri format që njerëzit i kopjojnë vërtet nga paneli: `abc.supabase.co`,
 * adresa e plotë, dhe secila me a pa `/` në fund. Kthen vargun e zbrazët kur
 * nuk lexohet fare.
 */
export function normalizoUrl(hyrja: unknown): string {
  const teksti = String(hyrja ?? '')
    .trim()
    .replace(/\/+$/, '');
  if (!teksti) return '';

  const me = /^https?:\/\//i.test(teksti) ? teksti : `https://${teksti}`;
  let u: URL;
  try {
    u = new URL(me);
  } catch {
    return '';
  }

  const lokal = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  if (u.protocol !== 'https:' && !lokal) return '';
  // Adresa e një projekti është një domen. Refuzimi i një fjale të vetme këtu e
  // kthen gabimin e shtypjes në «kjo nuk është adresë» sa kohë fusha rri ende
  // në ekran, në vend të një «projekti nuk u arrit» një sekondë më vonë — e
  // cila lexohet si faji i projektit e jo i shtypjes.
  if (!lokal && !u.hostname.includes('.')) return '';

  return u.origin;
}

/** Ngarkesa e një çelësi që është JWT, ose `null` për çdo gjë tjetër (çelësat e
 * rinj `sb_publishable_…`/`sb_secret_…`, ose marrëzi). Lexohet vetëm `role`-i,
 * dhe lexohet për ta **refuzuar** një çelës, kurrë për t'i besuar. */
function payloadJwt(celesi: string): Record<string, unknown> | null {
  const pjeset = String(celesi).split('.');
  if (pjeset.length !== 3 || !pjeset[1]) return null;
  try {
    const b64 = pjeset[1].replace(/-/g, '+').replace(/_/g, '/');
    const teksti = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const i: unknown = JSON.parse(teksti);
    return typeof i === 'object' && i !== null ? (i as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Refuzon çelësin sekret para se të shkruhet diku a të dërgohet kudo.
 *
 * Ai çelës i shpërfill rregullat e rreshtave me qëllim, prandaj kushdo që e
 * lexon `localStorage`-in e kësaj pajisjeje do ta rishkruante tërë bazën. Të
 * dy çelësat rrinë dy rreshta larg njëri-tjetrit te paneli, pra ngatërrimi
 * është gabim i zakonshëm — më mirë të kapet me zë se sa «të punojë» dhe ta
 * lërë bazën të hapur.
 */
export function kontrolloCelesin(celesi: unknown): Kontrolli {
  const teksti = String(celesi ?? '').trim();

  if (!teksti) {
    return { ok: false, gabimi: 'Shkruaj çelësin publik (publishable, ose anon i vjetër) të projektit.' };
  }
  if (/^sb_secret_/i.test(teksti)) {
    return {
      ok: false,
      gabimi: 'Ky është çelësi sekret — ai nuk vendoset kurrë te një shfletues. Përdor çelësin publishable.',
    };
  }

  const payload = payloadJwt(teksti);
  const roli = typeof payload?.role === 'string' ? payload.role : '';

  if (roli === 'service_role') {
    return {
      ok: false,
      gabimi:
        'Ky është çelësi service_role — ai anashkalon çdo rregull sigurie dhe nuk ruhet te shfletuesi. Përdor çelësin anon public.',
    };
  }
  if (roli && roli !== 'anon') {
    return { ok: false, gabimi: `Çelësi ka rolin „${roli}"; duhet çelësi publik i projektit.` };
  }
  if (!payload && !/^sb_publishable_/i.test(teksti)) {
    return { ok: false, gabimi: 'Çelësi nuk duket si çelës Supabase (sb_publishable_… ose anon i vjetër).' };
  }

  return { ok: true, vlera: teksti };
}

/**
 * Referenca e projektit — `abcdefghijklmnopqrst` te
 * `https://abcdefghijklmnopqrst.supabase.co`, ashtu si e adreson paneli.
 *
 * E zbrazët për çdo gjë që nuk është adresë projekti Supabase (domen i vetin,
 * instalim i vetëstrehuar): atje s'ka referencë për të hamendësuar, dhe një
 * lidhje e ndërtuar mbi hamendje bie diku ku nuk është asgjë.
 */
export function referencaProjektit(url: unknown): string {
  try {
    const { hostname } = new URL(normalizoUrl(url) || String(url));
    const [referenca, ...fundi] = hostname.split('.');
    if (!referenca || fundi.length < 2) return '';
    if (!/^supabase\.(co|in|net)$/i.test(fundi.join('.'))) return '';
    return /^[a-z0-9]{16,32}$/i.test(referenca) ? referenca.toLowerCase() : '';
  } catch {
    return '';
  }
}

/**
 * SQL Editor-i i atij projekti, i hapur te një pyetje e re me skriptin
 * **brenda** — pra rruga me dorë është një prekje dhe pastaj «Run», pa kopjuar
 * asgjë dhe pa e kërkuar projektin.
 *
 * `content` është mënyra e vetë panelit për t'u lidhur me një pyetje të
 * parambushur. Nëse një panel i ardhshëm e shpërfill, lidhja prapë bie te një
 * editor i zbrazët i projektit të duhur — pikërisht atje ku do të binte edhe
 * butoni i kopjimit.
 */
export function linkuSqlEditor(url: unknown, skripti: string): string {
  const ref = referencaProjektit(url);
  if (!ref) return 'https://supabase.com/dashboard';
  return `https://supabase.com/dashboard/project/${ref}/sql/new?content=${encodeURIComponent(skripti)}`;
}

/**
 * Çka i thuhet përdoruesit për një përgjigje që nuk ishte «po».
 *
 * Përkthimi bëhet nga kodi ose nga teksti i GoTrue-së/PostgREST-it, dhe çdo gjë
 * që nuk njihet kalon me fjalët e vetë serverit — zakonisht anglisht, por të
 * paktën të vërteta. Ky funksion është arsyeja pse «Invalid login credentials»
 * nuk del në ekran: ai varg nuk i thotë njeriut cilën nga dy fushat ta shohë.
 */
export function mesazhiGabimit(statusi: number, data: Record<string, unknown> | null): string {
  const kod = String(data?.error_code ?? data?.code ?? '');
  const teksti = String(
    data?.msg ?? data?.message ?? data?.error_description ?? data?.error ?? '',
  );

  if (statusi === 0) return 'Projekti nuk u arrit — kontrollo internetin dhe adresën e projektit.';
  if (/invalid login credentials/i.test(teksti) || kod === 'invalid_credentials') {
    return 'Email-i ose fjalëkalimi nuk përputhen me këtë projekt.';
  }
  if (/email not confirmed/i.test(teksti) || kod === 'email_not_confirmed') {
    return 'Email-i nuk është konfirmuar ende — hap linkun që të dërgoi Supabase, ose çaktivizo konfirmimin te Authentication → Providers → Email.';
  }
  if (/user already registered/i.test(teksti) || kod === 'user_already_exists') {
    return 'Kjo llogari ekziston tashmë te projekti — përdor «Hyr» në vend të «Krijo llogari».';
  }
  if (/weak password|password should be/i.test(teksti) || kod === 'weak_password') {
    return 'Fjalëkalimi është shumë i shkurtër për këtë projekt (zakonisht duhen së paku gjashtë karaktere).';
  }
  if (/signups not allowed|signup is disabled/i.test(teksti) || kod === 'signup_disabled') {
    return 'Projekti i ka çaktivizuar regjistrimet e reja — aktivizoji te Authentication → Providers → Email.';
  }
  if (statusi === 401 && !teksti) return 'Çelësi publik nuk pranohet nga ky projekt.';
  if (/Invalid API key|No API key found/i.test(teksti)) {
    return 'Çelësi publik nuk i përket këtij projekti.';
  }
  if (kod === 'PGRST205' || statusi === 404) {
    return `Projekti nuk është konfiguruar ende — tabela „${TABELA}" nuk ekziston. Te ekrani i sinkronizimit, «Konfiguro projektin» e hap skriptin që e krijon.`;
  }
  if (statusi === 401 || statusi === 403) {
    return 'Projekti nuk e lejoi këtë veprim — kontrollo se rregullat RLS të skriptit janë krijuar.';
  }

  return teksti || `Projekti u përgjigj me gabimin ${statusi}.`;
}
