/**
 * Ora e mbrëmjes — kur nisi, kur mbaroi, dhe sa zgjati.
 *
 * Pyetja vjen vetë te tavolina, zakonisht me letrat ende në dorë: *sa kohë ka
 * që kemi nisur?* Deri tani fleta e dinte ditën e jo orën — `date` është
 * `YYYY-MM-DD` dhe asgjë më shumë — kurse dy vulat që duhen ishin gjysma aty:
 * `createdAt` i lojës e mban çastin kur u hap fleta, pra pikërisht kur u ndanë
 * letrat e para.
 *
 * Gjysma tjetër është fundi, dhe ai nuk u shpik si fushë e re te loja: mbrëmja
 * mbaron te raundi i fundit i shënuar, prandaj çdo raund e mban çastin kur u
 * shkrua (`shkruarMe`). Kjo është më e vërtetë se një vulë e vënë kur shtypet
 * «Mbyll»: fleta mbyllet ndonjëherë gjysmë ore pas dorës së fundit, e
 * ndonjëherë të nesërmen, dhe ajo gjysmë orë nuk u luajt.
 *
 * Asnjë kohëzgjatje nuk ruhet (pika 2): del nga dy vula sa herë lexohet, pra
 * një raund i fshirë a i shtuar e rregullon vetvetiu.
 *
 * Nuk njeh as bazën, as React-in, as `window`-in (pika 1): numra brenda, varg
 * jashtë.
 */

/**
 * Sa zgjat më së shumti një mbrëmje që besohet — mbi të, numri nuk shkruhet.
 *
 * Një fletë e lënë hapur mbi tavolinë deri nesër nuk «zgjati katërmbëdhjetë
 * orë», dhe as një mbrëmje e rihapur pas një jave për të ndrequr një raund të
 * shënuar gabim: atëherë raundi i fundit shkruhet sot, dhe dallimi nga hapja
 * bëhet muaj. Të dyja janë e njëjta gjë — një numër që duket i matur e nuk
 * është — prandaj mbi këtë kufi ekrani hesht e nuk gënjen. Dymbëdhjetë orë i
 * lënë vend edhe mbrëmjes më të gjatë që luhet vërtet.
 */
export const KUFIRI_I_BESUESHEM = 12 * 60;

/** Sa minuta ka një milisekondë — një herë, që të mos shkruhet katër herë. */
const MINUTA = 60_000;

/** A është vulë e vërtetë ore: numër i fundmë dhe mbi zero. */
function eshteVule(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

/**
 * Ora e një vule, si e lexon njeriu: `20:45`.
 *
 * Lexohet me orën e vetë pajisjes e jo me UTC-në, sepse pyetja është e
 * tavolinës: «kur u ulëm». Kthen `null` kur vula mungon — një lojë e shkruar
 * para se kjo të ekzistonte, ose e kthyer nga një kopje e vjetër, e ka
 * `createdAt` zero, dhe «01:00» aty do të ishte orë e shpikur.
 */
export function ora(vula: number | undefined): string | null {
  if (!eshteVule(vula)) return null;

  const d = new Date(vula);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Vula e raundit të fundit të shënuar — fundi i mbrëmjes.
 *
 * Merret më e madhja e jo e fundit e listës: raundet vijnë nga një indeks e
 * mund të rirenditen, dhe një raund i vjetër i redaktuar sot nuk e ndërron
 * `shkruarMe`-në e vet — pra ajo mbetet ora kur u shënua vërtet.
 *
 * Kthen `null` kur asnjë raund nuk e mban atë vulë: një mbrëmje e shkruar para
 * kësaj pune e ka fundin të panjohur, dhe të panjohurën ekrani e hesht.
 */
export function fundiIRaundeve(
  raundet: ReadonlyArray<{ shkruarMe?: number }>,
): number | null {
  let fundi: number | null = null;
  for (const r of raundet) {
    if (eshteVule(r.shkruarMe) && (fundi === null || r.shkruarMe > fundi)) {
      fundi = r.shkruarMe;
    }
  }
  return fundi;
}

/**
 * Sa minuta zgjati mbrëmja — ose sa ka që nisi, kur vazhdon ende.
 *
 * Deri ku matet e vendos vetë mbrëmja, dhe kjo është e tërë ndarja: një fletë
 * që vazhdon matet deri tani, kurse një e kryer deri te raundi i fundit. Pa atë
 * dallim, një mbrëmje e mbaruar mbrëmë do të rritej sa herë hapet fleta.
 *
 * Kthen `null` kur numri nuk qëndron — hapja mungon, fundi mungon te një fletë
 * e kryer, ora e pajisjes ka shkuar prapa, ose dallimi e kalon
 * `KUFIRI_I_BESUESHEM`.
 */
export function kohezgjatjaEMbremjes(
  nisi: number | undefined,
  fundi: number | null,
  tani: number,
  perfundoi: boolean,
): number | null {
  if (!eshteVule(nisi)) return null;

  const deri = perfundoi ? fundi : tani;
  if (!eshteVule(deri)) return null;

  const minuta = Math.floor((deri - nisi) / MINUTA);
  if (minuta < 0 || minuta > KUFIRI_I_BESUESHEM) return null;
  return minuta;
}

/**
 * Kohëzgjatja me fjalë: «2 orë e 15 min», «45 min», «3 orë».
 *
 * Minuta e parë nuk shkruhet «0 min»: një fletë e sapohapur do të thoshte se
 * mbrëmja zgjati asgjë, kurse ajo sapo nisi — dhe ajo është fjala e duhur.
 */
export function shkruajKohezgjatjen(minuta: number): string {
  if (minuta < 1) return 'sapo nisi';
  if (minuta < 60) return `${minuta} min`;

  const ore = Math.floor(minuta / 60);
  const mbetur = minuta % 60;
  return mbetur === 0 ? `${ore} orë` : `${ore} orë e ${mbetur} min`;
}

/**
 * E tërë fjalia e orës, ashtu si del te kreu i fletës.
 *
 * Tri gjendje, dhe secila thotë vetëm atë që dihet:
 *
 *   • **mbrëmja vazhdon** → «nisi 20:45 · 2 orë e 15 min», pra ora e hapjes dhe
 *     numërimi që ecën me të.
 *   • **mbrëmja u krye** → «20:45–23:55 · 3 orë e 10 min»: dy orët e vërteta,
 *     dhe sa u luajt mes tyre.
 *   • **koha nuk dihet** → vetëm ora e hapjes, ose asgjë fare. Një fletë e
 *     kthyer nga një kopje e vjetër nuk e ka asnjërën vulë, dhe atëherë kreu
 *     mbetet ashtu si ishte.
 */
export function fjaliaEKohes(
  nisi: number | undefined,
  fundi: number | null,
  tani: number,
  perfundoi: boolean,
): string | null {
  const hapja = ora(nisi);
  if (hapja === null) return null;

  const minuta = kohezgjatjaEMbremjes(nisi, fundi, tani, perfundoi);
  if (minuta === null) return `nisi ${hapja}`;

  const sa = shkruajKohezgjatjen(minuta);
  if (!perfundoi) return `nisi ${hapja} · ${sa}`;

  const mbyllja = ora(fundi ?? undefined);
  return mbyllja === null ? `${hapja} · ${sa}` : `${hapja}–${mbyllja} · ${sa}`;
}
