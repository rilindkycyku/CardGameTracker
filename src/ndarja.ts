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

import { dataShqip, llojiILojes, raundetELojes } from './llogaritjet.ts';
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
   * Numri është i njëjti bajt te të dyja lojërat — pikë te bridzhi, shkronja te
   * magareci — prandaj pa këtë fushë ana që shikon nuk ka nga ta dijë se `3`
   * do të thotë „MAG". Kjo është arsyeja e vetme pse paketa u bë versioni 2.
   */
  lloji: LlojiILojes;
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

/** Lloji brenda paketës rri një shkronjë: çdo bajt është pikë te kodi QR. */
const SHENJA: Record<LlojiILojes, string> = { bridzh: 'b', magarec: 'm' };

/* ── Paketimi ───────────────────────────────────────────────────────────── */

/**
 * Pamja si tekst i shkurtër, i sigurt për një adresë.
 *
 * Formati është me ndarës e jo JSON, sepse çdo bajt kthehet në pika të kodit
 * QR: `2|b|grupi|data|raunde|emri:total,emri:total`. Emrat kalojnë nëpër
 * `encodeURIComponent`, që një presje ose dy pika brenda emrit të mos e këpusë
 * ndarjen — te fleta e vjetër ka skuadra si „alfa + zeta".
 */
export function paketo(pamja: Pamja): string {
  const totalet = pamja.totalet
    .map(([emri, total]) => `${encodeURIComponent(emri)}:${total}`)
    .join(',');

  const trupi = [
    VERSIONI,
    SHENJA[pamja.lloji],
    encodeURIComponent(pamja.grupi),
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

  const lloji = shenja === 'm' ? 'magarec' : shenja === 'b' ? 'bridzh' : null;
  if (lloji === null) return null;

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
  return {
    grupi: emriIGrupit,
    lloji: llojiILojes(loja),
    data: loja.date,
    raunde: saRaunde,
    totalet: loja.selectedPlayers.map((emri) => [emri, totalat[emri] ?? 0]),
  };
}

/** Adresa e plotë që shpërndahet, nga rrënja e faqes. */
export function adresaEPamjes(rrenja: string, pamja: Pamja): string {
  return `${rrenjaEFaqes(rrenja)}/#/shiko/${paketo(pamja)}`;
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
 */
export function tekstiINdarjes(pamja: Pamja, rreshtat: RreshtiRenditjes[]): string {
  const magarec = pamja.lloji === 'magarec';
  const gjithsej = raundetELojes(pamja.totalet.map(([emri]) => emri));

  const kreu = [
    pamja.grupi,
    magarec ? 'Magarec' : null,
    dataShqip(pamja.data),
    magarec
      ? `${pamja.raunde} ${pamja.raunde === 1 ? 'raund' : 'raunde'}`
      : `${pamja.raunde} nga ${gjithsej} raunde`,
  ]
    .filter(Boolean)
    .join(' · ');

  const lista = rreshtat
    .map((r) => `${r.rank}. ${r.player} ${magarec ? fjalaE(r.total) || '—' : r.total}`)
    .join('\n');

  return `${kreu}\n${lista}`;
}
