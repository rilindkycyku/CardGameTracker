/**
 * Forma e projektit Supabase të përdoruesit, si listë migrimesh të numëruara —
 * dhe përgjigjja e pyetjes «si do ta dijë kush se projekti i tij ka mbetur
 * prapa?».
 *
 * Çdo përdorues e administron vetë bazën e vet. S'ka hap botimi që do t'ia
 * prekte, s'ka migrues që e ndjek, dhe s'ka rrugë për t'i shkruar askujt nëse
 * një version i ardhshëm kërkon një ndryshim atje lart. Prandaj ai që di është
 * aplikacioni: i mban migrimet me vete, e lexon se ku ka arritur projekti, dhe
 * e hap skriptin e atyre që mbeten.
 *
 * ── rregullat që e mbajnë këtë të vërtetë ────────────────────────────────
 *
 * 1. **Vetëm shtohet.** Një migrim i botuar nuk redaktohet kurrë — ka rënë
 *    tashmë te baza e dikujt tjetër, ku një redaktim thjesht nuk do të zbatohej
 *    kurrë. Gabimi rregullohet duke shtuar numrin tjetër.
 * 2. **Përsëritja nuk prish gjë.** Çdo fjali është e rrethuar (`if not exists`,
 *    `or replace`, `drop … if exists`), prandaj rënia e dytë e skriptit është
 *    pa efekt. Kjo është ajo që e lejon aplikacionin ta ofrojë si buton e jo si
 *    ritual që askush nuk guxon ta përsërisë.
 * 3. **Vetëm shtesa, që pajisja e vjetër të punojë.** Dy telefona rrinë me dy
 *    versione për javë me radhë: i riu e migron projektin, dhe i vjetri duhet të
 *    sinkronizojë kundër tij. Heqja e një kolone botohet si dy lëshime — ndalo
 *    së shkruari, pastaj hiqe.
 *
 * ── pse lista pritet të mbetet e shkurtër ────────────────────────────────
 *
 * Vetë regjistrat rrinë brenda një kolone `jsonb`, prandaj një fushë e re te
 * `Loja` (si `kufiri` në kohën e vet) nuk kërkon asgjë këtu. Pikërisht për këtë
 * është e formësuar ashtu tabela.
 *
 * Nuk njeh as bazën, as React-in, as `window`-in (pika 1): vargje brenda,
 * vargje jashtë.
 */

/**
 * Një tabelë i mban të gjithë regjistrat, me çelës (përdorues, store, uid).
 *
 * Një tabelë për çdo store do të thoshte një migrim te projekti i çdo
 * përdoruesi sa herë aplikacioni fiton një lloj të ri të dhënash — pra
 * pikërisht ajo punë që rregulli 3 përpiqet ta shmangë.
 */
export const TABELA = 'tavolina_records';

/**
 * Ku e shkruan projekti se te cili migrim ka arritur: një rresht i zakonshëm i
 * tabelës së vetë aplikacionit.
 *
 * Me qëllim jo një tabelë e vetja, e cila do të ishte një migrim për të krijuar
 * atë që i numëron migrimet. Një rresht nuk kushton asgjë, lexohet me çelësin
 * që pajisja e ka tashmë, dhe e mbulon i njëjti rregull sigurie si gjithçka
 * tjetër. `store`-i i tij rri jashtë listës së storeve që sinkronizohen,
 * prandaj bashkimi kalon përtej tij pa e parë.
 */
export const STORI_META = 'meta';
export const ID_SKEMES = 'skema';

/** Pajisjet që janë lidhur me këtë projekt, një rresht secila nën të njëjtin
 * store `meta`: `pajisja:<id>`. Rrinë te cloud-i e jo te secila pajisje, për
 * arsyen e dukshme — puna e tyre është që telefoni të thotë çka bëri tableti. */
export const PREFIKSI_PAJISJES = 'pajisja:';

const sql1 = `-- Tavolina · sinkronizimi (migrimi 1)

create table if not exists public.${TABELA} (
  user_id     uuid        not null default auth.uid() references auth.users on delete cascade,
  store       text        not null,
  record_id   text        not null,
  updated_at  timestamptz not null default now(),
  deleted     boolean     not null default false,
  data        jsonb,
  device_id   text,
  device_name text,
  primary key (user_id, store, record_id)
);

-- Pa këtë çdo përdorues i projektit do t'i shihte rreshtat e tjetrit.
alter table public.${TABELA} enable row level security;

drop policy if exists "vetem rreshtat e mi" on public.${TABELA};
create policy "vetem rreshtat e mi" on public.${TABELA}
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Ora e serverit, jo ajo e telefonit. Pa këtë, dy telefona me orë të
-- pabarabarta do të krahasoheshin me njësi të ndryshme, dhe ai që ka mbetur
-- pas do të humbte ndryshime që duhej t'i fitonte. Vlera e dërguar nga
-- pajisja shpërfillet me qëllim.
create or replace function public.${TABELA}_ora()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists ${TABELA}_ora on public.${TABELA};
create trigger ${TABELA}_ora
  before insert or update on public.${TABELA}
  for each row execute function public.${TABELA}_ora();

-- Nëse projekti nuk i ekspozon vetvetiu tabelat e reja te Data API, pa këto
-- tabela ekziston por API-ja e kthen si të palejuar. Vetëm përdoruesi i
-- identifikuar merr të drejta; rreshtat i filtron gjithsesi rregulli më sipër.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.${TABELA} to authenticated;

-- Sinkronizimi merr vetëm çka ka ndryshuar që nga hera e fundit.
create index if not exists ${TABELA}_updated_at_idx
  on public.${TABELA} (user_id, updated_at);`;

/** Një migrim: numri, çka bën me fjalë, SQL-ja, dhe pyetja që kthen përgjigje
 * vetëm pasi ai të ketë rënë. */
export type Migrimi = {
  versioni: number;
  emri: string;
  sql: string;
  /** Një pyetje PostgREST që i mbijeton vetëm një projekti ku ky migrim ka
   * rënë. Mungon te një migrim që shton vetëm një indeks: aty nuk ka çka të
   * zgjidhet, dhe kontrolli arrin deri te migrimi para tij. */
  verifikimi?: string;
};

/**
 * Migrimet, me radhë. `emri` është ajo që i thuhet përdoruesit se do t'i
 * ndodhë bazës — «ekzekuto migrimin 3» nuk i thotë asgjë askujt.
 *
 * `verifikimi` është ajo që e lejon aplikacionin ta pyesë projektin në vend që
 * t'i besojë një butoni: skripti bie jashtë aplikacionit, te një skedë tjetër,
 * prandaj «a funksionoi?» nuk ka nga ku të kthehet veç nga vetë baza.
 */
export const MIGRIMET: Migrimi[] = [
  {
    versioni: 1,
    emri: 'Tabela e regjistrave, rregulli i sigurisë, ora e serverit dhe indeksi',
    sql: sql1,
    verifikimi: `${TABELA}?select=record_id&limit=1`,
  },
];

/** Migrimi më i ri që mban ky lëshim. Një projekt te ky numër është i freskët. */
export const SKEMA_VERSIONI = MIGRIMET[MIGRIMET.length - 1]?.versioni ?? 0;

/**
 * Versioni që i vishet një projekti që e ka tabelën por nuk ka shkruar kurrë
 * një numër.
 *
 * Ndodh kur dikush e ekzekuton skriptin me dorë pa u kthyer te aplikacioni: e
 * vetmja lexim i ndershëm i «tabela është aty, shenja jo» është pikërisht
 * migrimi i parë.
 */
export const VERSIONI_PARA_NUMERIMIT = 1;

/** Migrimet që një projekti te `nga` i mbeten për t'i ekzekutuar. */
export function migrimetPezull(nga = 0): Migrimi[] {
  const numri = Number.isFinite(nga) ? nga : 0;
  return MIGRIMET.filter((m) => m.versioni > numri);
}

/** Ata migrime si një skript i vetëm — i zbrazët kur s'ka çka të bëhet. */
export function sqlPerMigrim(nga = 0): string {
  return migrimetPezull(nga)
    .map((m) => m.sql)
    .join('\n\n');
}

/** E tëra, për atë që e ngre projektin me dorë. */
export const SQL_INSTALIMI = `${sqlPerMigrim(0)}

-- Ekzekutojeni te Supabase → SQL Editor → New query → Run.
-- Përsëritja nuk prish gjë.`;
