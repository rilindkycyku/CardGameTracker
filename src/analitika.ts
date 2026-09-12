/**
 * Çka i thuhet matjes për një rrugë — dhe, më e rëndësishmja, çka nuk i thuhet.
 *
 * Numërimi i hapjeve rri te Vercel-i (pika 18), dhe ai numërim e do rrugën e
 * ekranit. Rrugët këtu janë me hash, dhe pikërisht brenda hash-it rri gjithçka
 * që nuk guxon të dalë nga pajisja: `#/shiko/<paketë>` e mban tërë mbrëmjen —
 * emrat, raundet, totalet — dhe `#/bashkohu/<kod>` mban kodin me të cilin
 * kushdo do ta shihte lidhjen e drejtpërdrejtë. Një adresë e dërguar ashtu si
 * është do t'i çonte te serveri i matjes pikërisht ato.
 *
 * Prandaj asnjë adresë nuk shkon e plotë: nga e tëra mbahet pjesa e parë e
 * shtegut, dhe vetëm nëse e njeh ky skedar. Numri i një grupi a i një loje
 * bëhet `[id]`, paketa dhe kodi hiqen fare, dhe ajo që nuk njihet lexohet `/` —
 * sepse pikërisht atë ekran e tregon `App`-i për një rrugë që nuk e njeh.
 *
 * Nuk njeh as `window`, as React-in, as bazën: është varg brenda, varg jashtë
 * (pika 1). Lidhja me shfletuesin rri te `matja.ts`.
 */

/** Rrugët që mbajnë numër: `/loja/3` → `/loja/[id]`. */
const ME_NUMER = ['grupi', 'loja'];

/**
 * Rrugët që mbajnë një paketë a një kod. Nga to mbetet vetëm emri: sa herë
 * hapet një fotografi e çastit është numër që thotë diçka; çka kishte brenda
 * ajo fotografi nuk është puna e askujt.
 */
const ME_PAKETE = ['shiko', 'lidhu', 'pergjigje', 'bashkohu', 'takohu'];

/**
 * Rrugët që mbajnë vetëm emrin e vet — pa numër dhe pa paketë.
 *
 * `#/sinkronizimi` nuk mban asgjë brenda hash-it: adresa e projektit, çelësi
 * dhe email-i rrinë te `localStorage` e nuk kalojnë kurrë nga shiriti. Prandaj
 * emri del ashtu si është, dhe hyn këtu me vetëdije — një rrugë që nuk shtohet
 * te ky skedar numërohet si ekrani i parë (pika 18).
 */
const TE_THJESHTA = ['sinkronizimi'];

/**
 * Emri i rrugës, ashtu si del te matja.
 *
 * Hyrja është hash-i pa `#` — `/loja/3`, `/shiko/<paketë>`, ose vargu i
 * zbrazët. Dalja është gjithmonë një nga emrat e shkruar këtu, kurrë tekst i
 * ardhur nga jashtë: kështu një rrugë e re e shtuar nesër nuk rrjedh vetvetiu,
 * ajo duhet të shtohet edhe këtu.
 */
export function shtegiIMates(hashi: string): string {
  const [pjesa, e_dyta] = hashi.split('/').filter(Boolean);
  if (!pjesa) return '/';

  // Rruga me numër të pavlefshëm — `/loja/abc` — nuk e hap dot atë ekran:
  // `App`-i kthen te grupet, dhe matja shkruan atë që u pa vërtet.
  if (ME_NUMER.includes(pjesa)) {
    const n = Number(e_dyta);
    return Number.isInteger(n) && n > 0 ? `/${pjesa}/[id]` : '/';
  }

  if (ME_PAKETE.includes(pjesa)) return `/${pjesa}`;
  if (TE_THJESHTA.includes(pjesa)) return `/${pjesa}`;

  return '/';
}

/**
 * Adresa e pastruar, ajo që i dërgohet matjes në vend të asaj që rri te shiriti.
 *
 * Mbahet origjina dhe emri i rrugës; hash-i, pyetja dhe gjithçka brenda tyre
 * bien. Një adresë që nuk lexohet fare kthen `/` — matja numëron një hapje pa
 * ditur ku, e cila është ajo që dimë vërtet.
 */
export function adresaEMates(adresa: string): string {
  try {
    const e_plota = new URL(adresa);
    return `${e_plota.origin}${shtegiIMates(e_plota.hash.replace(/^#/, ''))}`;
  } catch {
    return '/';
  }
}
