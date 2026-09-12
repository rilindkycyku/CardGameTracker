/**
 * Kopja rezervë — nxjerrja dhe kthimi i tërë historikut si një skedar JSON.
 *
 * Të dhënat rrinë vetëm në shfletues, prandaj „pastro të dhënat e shfletimit"
 * ose një telefon i ri i merr të gjitha. Kjo është dalja e vetme, dhe pikërisht
 * prandaj kthimi lexohet me kujdes: një skedar i gabuar nuk guxon ta zbrazë
 * bazën ekzistuese, sepse ajo është kopja e fundit që ka mbetur.
 *
 * Vetë leximi nuk prek as bazën as `window`-in, që të provohet drejtpërdrejt.
 */

import type { Grupi, Kopja, LlojiILojes, Loja, Raundi } from './tipet.ts';

export const FORMATI = 'cardgametracker';
export const VERSIONI_I_KOPJES = 1;

/** Rezultati i leximit: ose kopja e vlefshme, ose arsyeja shqip. */
export type Lexuar =
  | { ok: true; kopja: Kopja }
  | { ok: false; gabimi: string };

/** Ndërton objektin që shkruhet në skedar. */
export function ndertoKopjen(
  groups: Grupi[],
  games: Loja[],
  rounds: Raundi[],
  tani: Date = new Date(),
): Kopja {
  return {
    format: FORMATI,
    version: VERSIONI_I_KOPJES,
    exportedAt: tani.toISOString(),
    groups,
    games,
    rounds,
  };
}

/** Emri i skedarit: `bridzh-2026-03-08.json`. */
export function emriISkedarit(tani: Date = new Date()): string {
  const dy = (n: number) => String(n).padStart(2, '0');
  return `bridzh-${tani.getFullYear()}-${dy(tani.getMonth() + 1)}-${dy(tani.getDate())}.json`;
}

function eshteVarg(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function eshteNumer(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/**
 * Lloji i një loje të kopjes: `bridzh`, `magarec`, ose mungon.
 *
 * Mungesa është e ligjshme — lojërat e shkruara para se të vinte magareci nuk e
 * kanë fushën, dhe lexohen bridzh. Një vlerë e panjohur jo: ajo do të vinte nga
 * një version më i ri, dhe vizatimi i saj si bridzh do t'i tregonte shkronjat si
 * pikë pa e thënë kush. Prandaj kopja refuzohet e tëra, si te çdo fushë tjetër.
 */
function llojiIKopjes(v: unknown): LlojiILojes | null | undefined {
  if (v === undefined || v === null) return undefined;
  return v === 'bridzh' || v === 'magarec' ? v : null;
}

/**
 * Lexon tekstin e një skedari kopjeje dhe e pranon vetëm nëse është i plotë.
 *
 * Kontrollohen edhe lidhjet: një raund që tregon te një lojë që s'ekziston do
 * të mbetej i padukshëm përgjithmonë, prandaj skedari refuzohet i tëri e nuk
 * pranohet gjysmë.
 */
export function lexoKopjen(teksti: string): Lexuar {
  let i: unknown;

  try {
    i = JSON.parse(teksti);
  } catch {
    return { ok: false, gabimi: 'Skedari nuk është JSON i vlefshëm.' };
  }

  if (typeof i !== 'object' || i === null) {
    return { ok: false, gabimi: 'Skedari nuk përmban një kopje.' };
  }

  const o = i as Record<string, unknown>;

  if (o.format !== FORMATI) {
    return {
      ok: false,
      gabimi: 'Ky skedar nuk është kopje e këtij aplikacioni.',
    };
  }

  if (o.version !== VERSIONI_I_KOPJES) {
    return {
      ok: false,
      gabimi: `Versioni i kopjes (${String(o.version)}) nuk njihet.`,
    };
  }

  if (!eshteVarg(o.groups) || !eshteVarg(o.games) || !eshteVarg(o.rounds)) {
    return { ok: false, gabimi: 'Kopjes i mungon ndonjë prej listave.' };
  }

  const groups: Grupi[] = [];
  for (const v of o.groups) {
    const g = v as Record<string, unknown>;
    if (!eshteNumer(g.id) || typeof g.name !== 'string' || !eshteVarg(g.playerNames)) {
      return { ok: false, gabimi: 'Një grup i kopjes është i dëmtuar.' };
    }
    groups.push({
      id: g.id,
      name: g.name,
      playerNames: g.playerNames.map(String),
    });
  }

  const games: Loja[] = [];
  for (const v of o.games) {
    const l = v as Record<string, unknown>;
    if (
      !eshteNumer(l.id) ||
      !eshteNumer(l.groupId) ||
      typeof l.date !== 'string' ||
      !eshteVarg(l.selectedPlayers)
    ) {
      return { ok: false, gabimi: 'Një lojë e kopjes është e dëmtuar.' };
    }

    const lloji = llojiIKopjes(l.lloji);
    if (lloji === null) {
      return {
        ok: false,
        gabimi: `Loja e ${l.date} është e një lloji që nuk njihet (${String(l.lloji)}).`,
      };
    }

    const loja: Loja = {
      id: l.id,
      groupId: l.groupId,
      date: l.date,
      selectedPlayers: l.selectedPlayers.map(String),
      createdAt: eshteNumer(l.createdAt) ? l.createdAt : 0,
    };
    // Fusha shkruhet vetëm kur vjen: një lojë e vjetër del nga kopja ashtu si
    // hyri, pa një `lloji: undefined` të shtuar rrugës.
    if (lloji) loja.lloji = lloji;
    // E njëjta arsye, dhe e njëjta kujdes: `false` nuk është mungesë. Ajo do të
    // thotë «e rihapur me dorë», dhe një `if (l.mbyllur)` do ta humbte.
    if (typeof l.mbyllur === 'boolean') loja.mbyllur = l.mbyllur;

    games.push(loja);
  }

  const rounds: Raundi[] = [];
  for (const v of o.rounds) {
    const r = v as Record<string, unknown>;
    if (
      !eshteNumer(r.id) ||
      !eshteNumer(r.gameId) ||
      !eshteNumer(r.roundNumber) ||
      typeof r.scores !== 'object' ||
      r.scores === null
    ) {
      return { ok: false, gabimi: 'Një raund i kopjes është i dëmtuar.' };
    }

    const scores: Record<string, number | null> = {};
    for (const [emri, pike] of Object.entries(r.scores as Record<string, unknown>)) {
      if (pike === null) scores[emri] = null;
      else if (eshteNumer(pike)) scores[emri] = pike;
      else return { ok: false, gabimi: `Pikë jo-numerike te raundi ${r.roundNumber}.` };
    }

    rounds.push({
      id: r.id,
      gameId: r.gameId,
      roundNumber: r.roundNumber,
      scores,
    });
  }

  const idEGrupeve = new Set(groups.map((g) => g.id));
  for (const loja of games) {
    if (!idEGrupeve.has(loja.groupId)) {
      return {
        ok: false,
        gabimi: `Loja e ${loja.date} tregon te një grup që s'gjendet në kopje.`,
      };
    }
  }

  const idELojerave = new Set(games.map((l) => l.id));
  for (const raundi of rounds) {
    if (!idELojerave.has(raundi.gameId)) {
      return {
        ok: false,
        gabimi: `Raundi ${raundi.roundNumber} tregon te një lojë që s'gjendet në kopje.`,
      };
    }
  }

  return {
    ok: true,
    kopja: {
      format: FORMATI,
      version: VERSIONI_I_KOPJES,
      exportedAt: typeof o.exportedAt === 'string' ? o.exportedAt : '',
      groups,
      games,
      rounds,
    },
  };
}

/** Përshkrimi i asaj që sjell kopja, për ta parë përdoruesi para se ta pranojë. */
export function permbledhja(kopja: Kopja): string {
  const njesi = (n: number, njejes: string, shumes: string) =>
    `${n} ${n === 1 ? njejes : shumes}`;

  return [
    njesi(kopja.groups.length, 'grup', 'grupe'),
    njesi(kopja.games.length, 'lojë', 'lojëra'),
    njesi(kopja.rounds.length, 'raund', 'raunde'),
  ].join(' · ');
}
