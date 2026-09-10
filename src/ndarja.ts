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

import {
  fushat,
  ne64Tekst,
  nenshkruaj,
  nga64Tekst,
  rrenjaEFaqes,
} from './paketa.ts';
import type { Loja, RreshtiRenditjes } from './tipet.ts';

/** Ajo që kalon nga një telefon te tjetri. */
export type Pamja = {
  /** Emri i grupit. */
  grupi: string;
  /** Data e lojës, `YYYY-MM-DD`. */
  data: string;
  /** Sa raunde ishin shënuar kur u ndau. */
  raunde: number;
  /** Lojtarët dhe totalet, në radhën e lojës. */
  totalet: [string, number][];
};

/** Versioni i paketës — që një adresë e vjetër të njihet si e vjetër. */
export const VERSIONI = 1;

/** Sa fusha ka trupi, pa nënshkrimin. */
const FUSHA = 5;

/* ── Paketimi ───────────────────────────────────────────────────────────── */

/**
 * Pamja si tekst i shkurtër, i sigurt për një adresë.
 *
 * Formati është me ndarës e jo JSON, sepse çdo bajt kthehet në pika të kodit
 * QR: `1|grupi|data|raunde|emri:total,emri:total`. Emrat kalojnë nëpër
 * `encodeURIComponent`, që një presje ose dy pika brenda emrit të mos e këpusë
 * ndarjen — te fleta e vjetër ka skuadra si „meri + mil".
 */
export function paketo(pamja: Pamja): string {
  const totalet = pamja.totalet
    .map(([emri, total]) => `${encodeURIComponent(emri)}:${total}`)
    .join(',');

  const trupi = [
    VERSIONI,
    encodeURIComponent(pamja.grupi),
    pamja.data,
    pamja.raunde,
    totalet,
  ].join('|');

  return ne64Tekst(nenshkruaj(trupi));
}

/** Lexon një paketë. Kthen `null` për çdo gjë që nuk del e plotë. */
export function shpaketo(kodi: string): Pamja | null {
  const teksti = nga64Tekst(kodi);
  if (teksti === null) return null;

  const pjeset = fushat(teksti, FUSHA);
  if (!pjeset) return null;

  const [version, grupi, data, raunde, totalet] = pjeset as [
    string, string, string, string, string,
  ];

  if (Number(version) !== VERSIONI) return null;
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
    data: loja.date,
    raunde: saRaunde,
    totalet: loja.selectedPlayers.map((emri) => [emri, totalat[emri] ?? 0]),
  };
}

/** Adresa e plotë që shpërndahet, nga rrënja e faqes. */
export function adresaEPamjes(rrenja: string, pamja: Pamja): string {
  return `${rrenjaEFaqes(rrenja)}/#/shiko/${paketo(pamja)}`;
}

/** Teksti që shoqëron ndarjen, kur telefoni ka «Share». */
export function tekstiINdarjes(pamja: Pamja, rreshtat: RreshtiRenditjes[]): string {
  const kreu = `${pamja.grupi} · ${pamja.data} · ${pamja.raunde} raunde`;
  const lista = rreshtat
    .map((r) => `${r.rank}. ${r.player} ${r.total}`)
    .join('\n');

  return `${kreu}\n${lista}`;
}
