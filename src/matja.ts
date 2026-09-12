/**
 * Numërimi i hapjeve — Vercel Web Analytics, i ngjitur me dorë.
 *
 * Pse me dorë: `@vercel/analytics` do të ishte varësia e pestë e një projekti
 * që i mban të katërtat me arsye të shkruar (pika 10), dhe ajo që bën paketa
 * është pikërisht ajo që rri poshtë — një `<script>` te koka dhe një radhë
 * thirrjesh te `window.va`. Kontrata me skriptin (emrat `data-*`, forma e
 * thirrjeve `beforeSend` e `pageview`) është ajo e versionit 2.0.1 të paketës,
 * dhe prandaj shkruhet ashtu si e shkruan ajo.
 *
 * Skripti merret nga vetë origjina — `/_vercel/insights/script.js` — e jo nga
 * një host i huaj: te Vercel-i ai shteg shërbehet nga i njëjti domen. Punëtori
 * i shërbimit e lë atë shteg krejt të paprekur (`sherbimi.ts`), që numërimi të
 * mos kalojë nëpër kosh.
 *
 * Çka del nga pajisja: emri i rrugës e asgjë tjetër. Adresa e vërtetë nuk
 * dërgohet kurrë — `beforeSend` e zëvendëson me atë që kthen `analitika.ts`,
 * dhe brenda hash-it rrinë pikët, emrat dhe kodet. Pikët nuk dalin nga pajisja
 * as këtu; kjo mbetet e vërtetë e pikës 1 edhe pas kësaj shmangjeje (pika 18).
 *
 * Njeh `document`-in dhe `window`-in, prandaj rri jashtë listës së moduleve që
 * provohen me `node --test` (pika 1) — si `instalimi.ts`, dhe për të njëjtën
 * arsye: logjika e tij e provueshme është nxjerrë te `analitika.ts`.
 */

import { adresaEMates, shtegiIMates } from './analitika.ts';

/** Skripti i matjes, i shërbyer nga vetë origjina. */
const BURIMI = '/_vercel/insights/script.js';

/**
 * Emri dhe versioni i kontratës. Nuk janë emri i këtij aplikacioni: janë ajo që
 * pret skripti, dhe dalin te matja si etiketë e paketës që e nisi.
 */
const SDK = { emri: '@vercel/analytics', versioni: '2.0.1' };

/** Ngjarja ashtu si i vjen `beforeSend`-it. Na duhet vetëm adresa. */
type NgjarjaEMates = { url?: string } & Record<string, unknown>;

declare global {
  interface Window {
    va?: (...pjeset: unknown[]) => void;
    vaq?: unknown[][];
  }
}

/**
 * Radha e thirrjeve, e ngritur para skriptit.
 *
 * Skripti vjen me `defer`, pra mbërrin pas vizatimit të parë; pa radhë, një
 * `beforeSend` i vënë para tij do të humbte, dhe bashkë me të do të humbte e
 * vetmja gjë që e mban adresën e pastër.
 */
function radha(): void {
  if (window.va) return;
  window.va = (...pjeset: unknown[]) => {
    (window.vaq ??= []).push(pjeset);
  };
}

/**
 * Nis numërimin. Thirret një herë, nga `main.tsx`.
 *
 * Vetëm te ndërtimi i prodhimit: gjatë zhvillimit skripti nuk ekziston te
 * `/_vercel/`, dhe çdo rifreskim do të numërohej si hapje e dikujt.
 */
export function nisMatjen(): void {
  if (!import.meta.env.PROD) return;
  if (document.querySelector(`script[src="${BURIMI}"]`)) return;

  radha();

  /*
   * Pastrimi i adresës — hapi që e bën tërë këtë të pranueshëm.
   *
   * Adresa e vërtetë e një pamjeje të ndarë e mban brenda vetes mbrëmjen e
   * tërë, prandaj asnjë ngjarje nuk del me të: e zëvendëson ajo e
   * `analitika.ts`, që mban origjinën dhe emrin e rrugës e asgjë tjetër.
   * Pastrohet ngjarja e jo `location`-i i çastit, sepse mes hapjes dhe nisjes
   * së skriptit mund të jetë ndërruar rruga — dhe atëherë numri do t'i shkonte
   * ekranit të gabuar.
   */
  window.va?.('beforeSend', (ngjarja: NgjarjaEMates) => ({
    ...ngjarja,
    url: ngjarja.url ? adresaEMates(ngjarja.url) : '/',
  }));

  const skripti = document.createElement('script');
  skripti.src = BURIMI;
  skripti.defer = true;
  skripti.dataset.sdkn = SDK.emri;
  skripti.dataset.sdkv = SDK.versioni;
  document.head.appendChild(skripti);

  /*
   * Ndërrimi i rrugës numërohet me dorë.
   *
   * Skripti i ndjek vetë ndërrimet e `history`-së, kurse këtu rrugët janë me
   * hash (`#/loja/3`): një ndërrim i tillë nuk kalon nga `pushState` dhe as nga
   * `popstate`, prandaj pa këtë rresht do të numërohej vetëm hapja e parë.
   * Hapja e parë mbetet e skriptit — kështu ajo numërohet edhe po qe se kjo
   * thirrje ndërron formë te një version i ardhshëm.
   */
  window.addEventListener('hashchange', () => {
    const shtegu = shtegiIMates(window.location.hash.replace(/^#/, ''));
    window.va?.('pageview', { route: shtegu, path: shtegu });
  });
}
