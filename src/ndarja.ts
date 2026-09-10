/**
 * Ndarja e rezultatit — pamja e lojës e paketuar brenda një adrese.
 *
 * Kush rri rreth tavolinës do t'i shohë pikët në telefonin e vet. Dy telefona
 * në të njëjtin wifi nuk kapen dot drejtpërdrejt nga shfletuesi — WebRTC-ja
 * kërkon një server sinjalizimi, dhe gjithçka tjetër rri brenda një pajisjeje —
 * prandaj rruga pa server është kjo: gjendja shkruhet te vetë adresa, adresa
 * bëhet kod QR, dhe kush e skanon e hap pamjen vetëm-lexim.
 *
 * Paketohen vetëm emrat dhe totalet, jo raundet. Kjo nuk është cungim: matrica
 * e shlyerjes është `total[i] − total[j]`, prandaj totalet e nxjerrin të tërën,
 * dhe renditja gjithashtu. Raundet do t'i shumëfishonin bajtet, dhe një kod QR
 * i dendur nuk skanohet dot nga një ekran telefoni në gjysmëdritë.
 *
 * Nuk njeh as DOM, as bazën: vetëm tekst brenda e tekst jashtë, që provat ta
 * matin drejtpërdrejt.
 */

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

/**
 * Nënshkrimi i paketës — FNV-1a, i shkruar me bazë 36.
 *
 * Nuk është mbrojtje nga ndryshimi me qëllim: kushdo mund ta rillogarisë. Është
 * mbrojtje nga adresa e prerë, dhe ajo është e vërtetë — WhatsApp-i dhe lexuesit
 * e mesazheve i këpusin lidhjet e gjata.
 *
 * Pa të, prerja nuk dukej fare: një paketë me katër karaktere më pak lexohej
 * ende, dhe totali i lojtarit të fundit dilte 105 → 0. Meqë kjo pamje shërben
 * për t'u shlyer mes vete, një numër i gabuar në heshtje është më i keq se një
 * lidhje që thotë hapur „nuk lexohem".
 */
function nenshkrimi(teksti: string): string {
  let h = 0x811c9dc5;

  for (const bajt of new TextEncoder().encode(teksti)) {
    h ^= bajt;
    // Shumëzim me 16777619 pa dalë nga numrat 32-bitësh.
    h = Math.imul(h, 0x01000193) >>> 0;
  }

  return h.toString(36);
}

/* ── Base64 pa shkronja që i prishen adresës ────────────────────────────── */

const ALFABETI =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function ne64(bajtet: Uint8Array): string {
  let dale = '';

  for (let i = 0; i < bajtet.length; i += 3) {
    const a = bajtet[i]!;
    const b = bajtet[i + 1];
    const c = bajtet[i + 2];

    dale += ALFABETI[a >> 2];
    dale += ALFABETI[((a & 3) << 4) | ((b ?? 0) >> 4)];
    if (b === undefined) break;
    dale += ALFABETI[((b & 15) << 2) | ((c ?? 0) >> 6)];
    if (c === undefined) break;
    dale += ALFABETI[c & 63];
  }

  return dale;
}

function nga64(teksti: string): Uint8Array | null {
  const bites: number[] = [];

  for (const shkronja of teksti) {
    const v = ALFABETI.indexOf(shkronja);
    if (v < 0) return null;
    for (let i = 5; i >= 0; i--) bites.push((v >> i) & 1);
  }

  const bajtet: number[] = [];
  for (let i = 0; i + 8 <= bites.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bites[i + j]!;
    bajtet.push(b);
  }

  return new Uint8Array(bajtet);
}

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

  return ne64(new TextEncoder().encode(`${trupi}|${nenshkrimi(trupi)}`));
}

/** Lexon një paketë. Kthen `null` për çdo gjë që nuk del e plotë. */
export function shpaketo(kodi: string): Pamja | null {
  const bajtet = nga64(kodi);
  if (!bajtet) return null;

  let teksti: string;
  try {
    teksti = new TextDecoder('utf-8', { fatal: true }).decode(bajtet);
  } catch {
    return null;
  }

  const pjeset = teksti.split('|');
  if (pjeset.length !== 6) return null;

  const [version, grupi, data, raunde, totalet, shenja] = pjeset as [
    string, string, string, string, string, string,
  ];

  // Nënshkrimi kontrollohet i pari: pas tij çdo fushë është ashtu si u shkrua.
  if (nenshkrimi(pjeset.slice(0, 5).join('|')) !== shenja) return null;
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

/**
 * Adresa e plotë që shpërndahet, nga rrënja e faqes.
 *
 * Hash-i i vjetër pritet i tëri e jo vetëm skaji: adresa vjen zakonisht nga
 * `location.href`, dhe atje rri rruga e lojës që po shihet — pa këtë, e reja
 * do t'i shtohej pas së vjetrës.
 */
export function adresaEPamjes(rrenja: string, pamja: Pamja): string {
  const pa = rrenja.split('#')[0]!.replace(/\/+$/, '');
  return `${pa}/#/shiko/${paketo(pamja)}`;
}

/** Teksti që shoqëron ndarjen, kur telefoni ka «Share». */
export function tekstiINdarjes(pamja: Pamja, rreshtat: RreshtiRenditjes[]): string {
  const kreu = `${pamja.grupi} · ${pamja.data} · ${pamja.raunde} raunde`;
  const lista = rreshtat
    .map((r) => `${r.rank}. ${r.player} ${r.total}`)
    .join('\n');

  return `${kreu}\n${lista}`;
}
