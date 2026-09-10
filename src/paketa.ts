/**
 * Paketimi i përbashkët — bajtet, nënshkrimi dhe rrënja e adresës.
 *
 * Dy gjëra shkruhen brenda një adrese te ky projekt: fotografia e rezultatit
 * (`ndarja.ts`) dhe sinjali i lidhjes së drejtpërdrejtë (`sinjalizimi.ts`).
 * Të dyja duhen të kalojnë nëpër një kod QR, nëpër WhatsApp dhe nëpër një
 * kopjim me dorë, prandaj i ndajnë të njëjtat tri gjëra: një alfabet base64 pa
 * shkronja që i prishen adresës, një nënshkrim që e kap prerjen, dhe prerjen e
 * hash-it të vjetër nga adresa e faqes.
 *
 * Nuk njeh as DOM, as bazën: vetëm tekst brenda e tekst jashtë, që provat ta
 * matin drejtpërdrejt.
 */

/* ── Base64 pa shkronja që i prishen adresës ────────────────────────────── */

const ALFABETI =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function ne64(bajtet: Uint8Array): string {
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

export function nga64(teksti: string): Uint8Array | null {
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

/** Teksti si paketë base64. */
export function ne64Tekst(teksti: string): string {
  return ne64(new TextEncoder().encode(teksti));
}

/** Paketa base64 si tekst. `null` nëse bajtet nuk janë UTF-8 i vlefshëm. */
export function nga64Tekst(kodi: string): string | null {
  const bajtet = nga64(kodi);
  if (!bajtet) return null;

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bajtet);
  } catch {
    return null;
  }
}

/* ── Nënshkrimi ─────────────────────────────────────────────────────────── */

/**
 * Nënshkrimi i paketës — FNV-1a, i shkruar me bazë 36.
 *
 * Nuk është mbrojtje nga ndryshimi me qëllim: kushdo mund ta rillogarisë. Është
 * mbrojtje nga adresa e prerë, dhe ajo është e vërtetë — WhatsApp-i dhe lexuesit
 * e mesazheve i këpusin lidhjet e gjata.
 *
 * Pa të, prerja nuk dukej fare: një paketë me katër karaktere më pak lexohej
 * ende, dhe totali i lojtarit të fundit dilte 105 → 0. Meqë ajo pamje shërben
 * për t'u shlyer mes vete, një numër i gabuar në heshtje është më i keq se një
 * lidhje që thotë hapur „nuk lexohem". Te sinjali i lidhjes arsyeja është tjetër
 * por përfundimi i njëjti: një gishtëz DTLS e prerë e lë lidhjen të dështojë pa
 * shpjegim, kurse nënshkrimi e thotë menjëherë se kodi nuk erdhi i tërë.
 */
export function nenshkrimi(teksti: string): string {
  let h = 0x811c9dc5;

  for (const bajt of new TextEncoder().encode(teksti)) {
    h ^= bajt;
    // Shumëzim me 16777619 pa dalë nga numrat 32-bitësh.
    h = Math.imul(h, 0x01000193) >>> 0;
  }

  return h.toString(36);
}

/** Trupi bashkë me nënshkrimin e vet, i ndarë me `|`. */
export function nenshkruaj(trupi: string): string {
  return `${trupi}|${nenshkrimi(trupi)}`;
}

/**
 * Fushat e një trupi të nënshkruar, ose `null`.
 *
 * Nënshkrimi kontrollohet i pari dhe mbi tërë trupin: pas tij çdo fushë është
 * ashtu si u shkrua, prandaj lexuesi nuk ka nevojë të dyshojë për secilën.
 */
export function fushat(teksti: string, sa: number): string[] | null {
  const pjeset = teksti.split('|');
  if (pjeset.length !== sa + 1) return null;

  const trupi = pjeset.slice(0, sa).join('|');
  if (nenshkrimi(trupi) !== pjeset[sa]) return null;

  return pjeset.slice(0, sa);
}

/* ── Heksi ──────────────────────────────────────────────────────────────── */

/**
 * Heksi si bajte. Gishtëza DTLS vjen 64 shkronja heks; si bajte del 43
 * karaktere base64, dhe njëzet karaktere më pak janë module më pak te kodi QR.
 */
export function hexNeBajte(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]*$/.test(hex)) return null;

  const bajtet = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bajtet.length; i++) {
    bajtet[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return bajtet;
}

export function bajtetNeHex(bajtet: Uint8Array): string {
  let dale = '';
  for (const bajt of bajtet) dale += bajt.toString(16).padStart(2, '0');
  return dale;
}

/* ── Adresa ─────────────────────────────────────────────────────────────── */

/**
 * Rrënja e faqes, pa hash.
 *
 * Hash-i i vjetër pritet i tëri e jo vetëm skaji: adresa vjen zakonisht nga
 * `location.href`, dhe atje rri rruga e lojës që po shihet — pa këtë, e reja
 * do t'i shtohej pas së vjetrës.
 */
export function rrenjaEFaqes(href: string): string {
  return href.split('#')[0]!.replace(/\/+$/, '');
}
