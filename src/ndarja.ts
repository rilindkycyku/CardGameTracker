/**
 * Ndarja e rezultatit — pamja e lojës e paketuar brenda një adrese.
 *
 * Kush rri rreth tavolinës do t'i shohë pikët në telefonin e vet. Rruga e
 * drejtpërdrejtë rri te `sinjalizimi.ts`; kjo është e dyta, dhe më e thjeshta:
 * gjendja shkruhet te vetë adresa, adresa bëhet kod QR, dhe kush e skanon e hap
 * pamjen vetëm-lexim. Nuk kërkon lidhje mes pajisjeve fare, prandaj punon edhe
 * kur wifi-ja i ndan klientët nga njëri-tjetri — dhe atëherë është e vetmja.
 *
 * Të njëjtat bajte shkojnë edhe nëpër kanalin e drejtpërdrejtë: `paketo()` është
 * ajo që transmetohet, dhe `shpaketo()` ajo që e lexon. Kështu pamja vetëm-lexim
 * ka një rrugë të vetme leximi, e jo dy që dalin jashtë sinkronie.
 *
 * Paketohen vetëm emrat dhe totalet, jo raundet. Kjo nuk është cungim: matrica
 * e shlyerjes është `total[i] − total[j]`, prandaj totalet e nxjerrin të tërën,
 * dhe renditja gjithashtu. Raundet do t'i shumëfishonin bajtet, dhe një kod QR
 * i dendur nuk skanohet dot nga një ekran telefoni në gjysmëdritë.
 *
 * Nuk njeh as DOM, as bazën: vetëm tekst brenda e tekst jashtë, që provat ta
 * matin drejtpërdrejt.
 */

import { kufiriILojes } from './fundi.ts';
import { dataShqip, llojiILojes, raundetELojes } from './llogaritjet.ts';
import { llojiNgaShenja, rregullat } from './lojerat.ts';
import { fjalaE } from './magareci.ts';
import {
  fushat,
  ne64Tekst,
  nenshkruaj,
  nga64Tekst,
  rrenjaEFaqes,
} from './paketa.ts';
import type { LlojiILojes, Loja, RreshtiRenditjes } from './tipet.ts';

/** Ajo që kalon nga një telefon te tjetri. */
export type Pamja = {
  /** Emri i grupit. */
  grupi: string;
  /**
   * Çka u luajt.
   *
   * Numri është i njëjti bajt te të gjitha lojërat — pikë te bridzhi, shkronja
   * te magareci — prandaj pa këtë fushë ana që shikon nuk ka nga ta dijë se `3`
   * do të thotë „MAG". Kjo është arsyeja e vetme pse paketa u bë versioni 2.
   *
   * Domina dhe pishpiriku hynë te e njëjta fushë, me nga një shkronjë të re,
   * dhe versioni mbeti 2: aplikacioni i djeshëm një paketë pishpiriku e refuzon
   * fare — shkronja nuk njihet — dhe kjo është pikërisht ajo që duhet. Aty fiton
   * totali më i madh, prandaj një lexim si bridzh do ta shpallte fituesin e
   * gabuar pa e thënë kush.
   */
  lloji: LlojiILojes;
  /**
   * Deri te sa pikë luhej ajo mbrëmje, ose `null` kur kjo nuk thuhet.
   *
   * `0` do të thotë «pa kufi». `null` do të thotë se paketa nuk e mban fare —
   * bridzhi e magareci nuk e kanë atë pyetje, dhe as paketat e vjetra nuk e
   * kishin — dhe atëherë ana që shikon nuk shkruan asnjë numër për të, në vend
   * që të shpikë parazgjedhjen.
   */
  kufiri: number | null;
  /** Data e lojës, `YYYY-MM-DD`. */
  data: string;
  /** Sa raunde ishin shënuar kur u ndau. */
  raunde: number;
  /** Lojtarët dhe totalet, në radhën e lojës. */
  totalet: [string, number][];
};

/** Versioni i paketës — që një adresë e vjetër të njihet si e vjetër. */
export const VERSIONI = 2;

/** Sa fusha ka trupi, pa nënshkrimin. */
const FUSHA = 6;

/** Sa fusha kishte versioni i parë, ai pa lloj. */
const FUSHA_1 = 5;

/**
 * Lloji brenda paketës rri një shkronjë: çdo bajt është pikë te kodi QR.
 *
 * Shkronjat vijnë nga regjistri i lojërave e nuk shkruhen dy herë — aty rrinë
 * bashkë me gjithçka tjetër që e ndan një lojë nga tjetra, dhe një listë e dytë
 * këtu do të harrohej te loja e pestë.
 *
 * **Kufiri i mbrëmjes hipën te e njëjta fushë**, si shifra pas shkronjës:
 * `d100`, `p0`, `b`. Kjo nuk është kursim shkathtësie, është përputhshmëri:
 * një fushë e re do ta bënte paketën versioni 3, dhe atëherë çdo aplikacion i
 * djeshëm do t'i refuzonte edhe paketat e bridzhit — ndërsa kështu ai i lexon
 * ato si më parë (`b` dhe `m` mbeten fjalë për fjalë ato që ishin), dhe
 * refuzon vetëm dominën e pishpirikun, të cilat nuk i njeh gjithsesi.
 *
 * Shifrat shkruhen vetëm kur loja e ka atë pyetje; `0` do të thotë «pa kufi».
 */
function shenjaE(lloji: LlojiILojes, kufiri: number | null): string {
  const shkronja = rregullat(lloji).shenja;
  return kufiri === null ? shkronja : `${shkronja}${kufiri}`;
}

/** Shkronja e paketës dhe shifrat e saj, ose `null` kur nuk lexohet. */
function llojiDheKufiri(
  fusha: string,
): { lloji: LlojiILojes; kufiri: number | null } | null {
  // Katër shifra mjaftojnë për çdo kufi tavoline, dhe e mbajnë fushën të
  // ngushtë: çka vjen nga jashtë lexohet me alfabet të ngushtë, kudo.
  const pjeset = /^([a-z])(\d{0,4})$/.exec(fusha);
  if (!pjeset) return null;

  const lloji = llojiNgaShenja(pjeset[1]!);
  if (lloji === null) return null;

  return { lloji, kufiri: pjeset[2] ? Number(pjeset[2]) : null };
}

/* ── Paketimi ───────────────────────────────────────────────────────────── */

/**
 * Ndarësit e trupit, dhe vetëm ata.
 *
 * Trupi kalon nëpër base64 para se t'i afrohet adresës, prandaj asnjë karakter
 * nuk ka nevojë t'i ikë adresës — ikje kërkojnë vetëm tri shenjat që e ndajnë
 * trupin, dhe vetë shenja e ikjes.
 */
const NDARESIT = /[%|,:]/g;

/**
 * Ikja e vogël: tri ndarësit, e asgjë tjetër.
 *
 * Këtu rrinte `encodeURIComponent`, dhe ai u ikte të gjithave: një hapësirë
 * bëhej `%20` dhe një `ë` bëhej `%C3%AB` — gjashtë bajte për një shkronjë që
 * base64-i e mban me dy. Te një grup me emra shqip kjo e frynte paketën me një
 * të gjashtën, dhe ajo e gjashta del te modulet e kodit QR: «Shoqëria e
 * mbrëmjes» me gjashtë lojtarë binte nga 190 karaktere në 159, pra nga 57
 * module në 53. Kodi që skanohet nga ekrani i një telefoni tjetër i ka të
 * shtrenjta ato katër module.
 *
 * Leximi nuk u prek fare: `decodeURIComponent` i kthen `%XX`-të dhe çdo gjë
 * tjetër e lë ashtu si është. Prandaj versioni i paketës mbeti 2 — një adresë e
 * shkruar sot lexohet nga aplikacioni i djeshëm, dhe një e djeshme nga i sotmi.
 */
function ike(teksti: string): string {
  return teksti.replace(
    NDARESIT,
    (shenja) => `%${shenja.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/**
 * Pamja si tekst i shkurtër, i sigurt për një adresë.
 *
 * Formati është me ndarës e jo JSON, sepse çdo bajt kthehet në pika të kodit
 * QR: `2|b|grupi|data|raunde|emri:total,emri:total`. Emrat kalojnë nëpër
 * `ike`, që një presje ose dy pika brenda emrit të mos e këpusë ndarjen — te
 * fleta e vjetër ka skuadra si „alfa + zeta".
 */
export function paketo(pamja: Pamja): string {
  const totalet = pamja.totalet
    .map(([emri, total]) => `${ike(emri)}:${total}`)
    .join(',');

  const trupi = [
    VERSIONI,
    shenjaE(pamja.lloji, pamja.kufiri),
    ike(pamja.grupi),
    pamja.data,
    pamja.raunde,
    totalet,
  ].join('|');

  return ne64Tekst(nenshkruaj(trupi));
}

/**
 * Lexon një paketë. Kthen `null` për çdo gjë që nuk del e plotë.
 *
 * Lexohen dy versione. I pari nuk e mbante llojin, sepse kur u shkrua kishte
 * vetëm bridzh — prandaj lexohet bridzh, e nuk refuzohet: adresa e ndarë dje te
 * një bisedë nuk ka pse të vdesë sot. Versioni vendos vetëm sa fusha të priten;
 * nënshkrimi kontrollohet mbi tërë trupin gjithsesi, si më parë.
 */
export function shpaketo(kodi: string): Pamja | null {
  const teksti = nga64Tekst(kodi);
  if (teksti === null) return null;

  const version = Number(teksti.split('|', 1)[0]);
  if (version !== VERSIONI && version !== 1) return null;

  const pjeset = fushat(teksti, version === 1 ? FUSHA_1 : FUSHA);
  if (!pjeset) return null;

  const [, ...trupi] = pjeset;
  const shenja = version === 1 ? 'b' : trupi.shift();
  const [grupi, data, raunde, totalet] = trupi as [string, string, string, string];

  const lexuar = llojiDheKufiri(shenja ?? '');
  if (lexuar === null) return null;
  const { lloji, kufiri } = lexuar;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;

  const saRaunde = Number(raunde);
  if (!Number.isInteger(saRaunde) || saRaunde < 0) return null;

  const cifte: [string, number][] = [];
  for (const pjesa of totalet.split(',')) {
    if (!pjesa) continue;

    const kufi = pjesa.lastIndexOf(':');
    if (kufi <= 0) return null;

    const total = Number(pjesa.slice(kufi + 1));
    if (!Number.isFinite(total)) return null;

    try {
      cifte.push([decodeURIComponent(pjesa.slice(0, kufi)), total]);
    } catch {
      return null;
    }
  }

  if (cifte.length === 0) return null;

  try {
    return {
      grupi: decodeURIComponent(grupi),
      lloji,
      kufiri,
      data,
      raunde: saRaunde,
      totalet: cifte,
    };
  } catch {
    return null;
  }
}

/** Pamja e një loje, e gatshme për paketim. */
export function pamjaELojes(
  emriIGrupit: string,
  loja: Loja,
  totalat: Record<string, number>,
  saRaunde: number,
): Pamja {
  const lloji = llojiILojes(loja);

  return {
    grupi: emriIGrupit,
    lloji,
    // Kufiri shkruhet vetëm te lojërat që e kanë atë pyetje. Te bridzhi e
    // magareci ai do të ishin tri shifra që nuk i lexon kush: i pari mbaron me
    // raundet, dhe te i dyti kufiri është vetë fjala.
    kufiri:
      rregullat(lloji).kufijteEMundshem.length > 0
        ? (kufiriILojes(loja) ?? 0)
        : null,
    data: loja.date,
    raunde: saRaunde,
    totalet: loja.selectedPlayers.map((emri) => [emri, totalat[emri] ?? 0]),
  };
}

/**
 * Adresa e plotë e një pakete të gatshme.
 *
 * E ndarë nga ajo poshtë sepse ekrani e mban paketën gjithsesi — e njëjta
 * paketë shkon edhe nëpër kanalin e drejtpërdrejtë — dhe pa këtë ajo do të
 * ndërtohej dy herë për çdo vizatim.
 */
export function adresaEKodit(rrenja: string, kodi: string): string {
  return `${rrenjaEFaqes(rrenja)}/#/shiko/${kodi}`;
}

/** Adresa e plotë që shpërndahet, nga rrënja e faqes. */
export function adresaEPamjes(rrenja: string, pamja: Pamja): string {
  return adresaEKodit(rrenja, paketo(pamja));
}

/**
 * Teksti që shoqëron ndarjen, kur telefoni ka «Share».
 *
 * Ky tekst shkon te një bisedë, dhe atje lexohet pa faqen: prandaj data
 * shkruhet me fjalë e jo `2026-09-11`, dhe te bridzhi numri i raundeve vjen me
 * gjithsejin — «5 nga 8 raunde» thotë edhe sa ka mbetur, ndërsa «5 raunde» nuk
 * thotë asgjë për kë nuk ishte te tavolina. Magareci nuk e ka atë gjithsej
 * (pika 13), prandaj aty mbetet numri i thjeshtë.
 *
 * Te magareci numri nuk thotë asgjë vetëm — `3` lexohet „MAG" — prandaj aty
 * shkruhet fjala. Kush s'ka marrë ende asnjë shkronjë del me një vizë, që
 * rreshti të mos mbetet gjysmak.
 *
 * Radha e rreshtave vjen e gatshme nga thirrësi, dhe me të edhe drejtimi: te
 * pishpiriku i pari është ai me më shumë pikë. Ky funksion nuk rendit asgjë —
 * ai vetëm e shkruan atë që i jepet.
 */
export function tekstiINdarjes(pamja: Pamja, rreshtat: RreshtiRenditjes[]): string {
  const rregulli = rregullat(pamja.lloji);
  const magarec = pamja.lloji === 'magarec';

  // «5 nga 8 raunde» vlen vetëm te bridzhi, sepse vetëm atje gjatësia e
  // mbrëmjes numërohet me raunde (pika 13). Te tri të tjerat numri i thjeshtë
  // është e gjithë e vërteta që dihet.
  const raunde =
    rregulli.raundePerLojtar === null
      ? `${pamja.raunde} ${pamja.raunde === 1 ? 'raund' : 'raunde'}`
      : `${pamja.raunde} nga ${raundetELojes(pamja.totalet.map(([emri]) => emri))} raunde`;

  const kreu = [
    pamja.grupi,
    // Bridzhi rri pa emër sepse ai është parazgjedhja e këtij aplikacioni që
    // nga dita e parë; të tjerat thonë çka u luajt, që një listë pikësh e
    // ngjitur te një bisedë të mos lexohet si bridzh.
    pamja.lloji === 'bridzh' ? null : rregulli.emri,
    dataShqip(pamja.data),
    raunde,
  ]
    .filter(Boolean)
    .join(' · ');

  const lista = rreshtat
    .map((r) => `${r.rank}. ${r.player} ${magarec ? fjalaE(r.total) || '—' : r.total}`)
    .join('\n');

  return `${kreu}\n${lista}`;
}
