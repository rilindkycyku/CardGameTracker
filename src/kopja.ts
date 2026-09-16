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

import { PREFIKSAT, uidIRi, uidIVlefshem } from './identiteti.ts';
import { RADHA } from './lojerat.ts';
import type { Grupi, Kopja, LlojiILojes, Loja, Raundi, StoriSink } from './tipet.ts';

export const FORMATI = 'cardgametracker';
export const VERSIONI_I_KOPJES = 1;

/** Rezultati i leximit: ose kopja e vlefshme, ose arsyeja shqip. */
export type Lexuar =
  | { ok: true; kopja: Kopja }
  | { ok: false; gabimi: string };

/**
 * Heq nga një regjistër llogaritë e sinkronizimit të kësaj pajisjeje.
 *
 * `uid`-i mbetet, dhe kjo është e qëllimshme: ai është emri i regjistrit te çdo
 * pajisje, prandaj një kopje e kthyer diku tjetër e mban të njëjtin identitet
 * dhe nuk krijon dublikatë te cloud-i. `perditesuar` e `sinkPezull` jo — ato
 * thonë çka di **ky** shfletues për cloud-in, dhe skedari nuk ka ku ta dijë atë
 * për shfletuesin që do ta lexojë. Kthimi i vë sërish (`zevendeso`).
 */
function paLlogarite<T extends { perditesuar?: number; sinkPezull?: boolean }>(rekordi: T): T {
  const { perditesuar: _koha, sinkPezull: _pezull, ...pjesa } = rekordi;
  void _koha;
  void _pezull;
  return pjesa as T;
}

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
    groups: groups.map(paLlogarite),
    games: games.map(paLlogarite),
    rounds: rounds.map(paLlogarite),
  };
}

/**
 * Emri i skedarit: `tavolina-2026-03-08.json`.
 *
 * Emri i vjetër ishte `bridzh-…`, nga koha kur kjo ishte vetëm një lojë. Skedari
 * i vjetër lexohet ende — emri nuk hyn fare te leximi — dhe kush e ka te
 * telefoni nuk ka pse ta riemërtojë.
 */
export function emriISkedarit(tani: Date = new Date()): string {
  const dy = (n: number) => String(n).padStart(2, '0');
  return `tavolina-${tani.getFullYear()}-${dy(tani.getMonth() + 1)}-${dy(tani.getDate())}.json`;
}

function eshteVarg(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function eshteNumer(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/**
 * `uid`-i i një regjistri të kopjes, ose një i ri.
 *
 * Mungesa është e ligjshme: çdo skedar i nxjerrë para se të vinte sinkronizimi
 * e ka fushën bosh, dhe një kopje e djeshme nuk ka pse të vdesë sot (si te
 * `lloji`). Përsëritja jo — dy regjistra me të njëjtin emër do të shkriheshin
 * te cloud-i pa e thënë kush — prandaj i dyti merr një emër të ri e nuk e rrëzon
 * tërë skedarin: çka shkruan te ai regjistër është e plotë gjithsesi.
 */
function uidIKopjes(v: unknown, store: StoriSink, pare: Set<string>): string {
  const i = uidIVlefshem(v) && !pare.has(v) ? v : uidIRi(PREFIKSAT[store]);
  pare.add(i);
  return i;
}

/**
 * Lloji i një loje të kopjes: njëra nga të katërt, ose mungon.
 *
 * Mungesa është e ligjshme — lojërat e shkruara para se të vinte magareci nuk e
 * kanë fushën, dhe lexohen bridzh. Një vlerë e panjohur jo: ajo do të vinte nga
 * një version më i ri, dhe vizatimi i saj si bridzh do t'i tregonte shkronjat
 * ose pikët e një loje tjetër pa e thënë kush — te pishpiriku edhe fituesin e
 * gabuar, sepse atje fiton totali më i madh. Prandaj kopja refuzohet e tëra, si
 * te çdo fushë tjetër.
 *
 * Lista vjen nga regjistri: një lojë e pestë e shtuar atje lexohet edhe këtu,
 * pa e prekur këtë skedar.
 */
function llojiIKopjes(v: unknown): LlojiILojes | null | undefined {
  if (v === undefined || v === null) return undefined;
  return RADHA.find((lloji) => lloji === v) ?? null;
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

  const uidet = new Set<string>();

  const groups: Grupi[] = [];
  for (const v of o.groups) {
    const g = v as Record<string, unknown>;
    if (!eshteNumer(g.id) || typeof g.name !== 'string' || !eshteVarg(g.playerNames)) {
      return { ok: false, gabimi: 'Një grup i kopjes është i dëmtuar.' };
    }
    groups.push({
      id: g.id,
      uid: uidIKopjes(g.uid, 'groups', uidet),
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
      uid: uidIKopjes(l.uid, 'games', uidet),
      groupId: l.groupId,
      date: l.date,
      selectedPlayers: l.selectedPlayers.map(String),
      createdAt: eshteNumer(l.createdAt) ? l.createdAt : 0,
    };
    // Fusha shkruhet vetëm kur vjen: një lojë e vjetër del nga kopja ashtu si
    // hyri, pa një `lloji: undefined` të shtuar rrugës.
    if (lloji) loja.lloji = lloji;

    /*
     * Kufiri i mbrëmjes: numër i plotë jo negativ, ose asgjë.
     *
     * Zeroja është e ligjshme dhe do të thotë «pa kufi» (pika 13). Një numër i
     * thyer ose negativ jo: do të bënte një mbrëmje që ose nuk mbaron kurrë,
     * ose mbaron para raundit të parë — dhe as njëra as tjetra nuk duket te
     * fleta derisa të jetë vonë.
     */
    if (l.kufiri !== undefined) {
      if (!eshteNumer(l.kufiri) || l.kufiri < 0 || !Number.isInteger(l.kufiri)) {
        return {
          ok: false,
          gabimi: `Loja e ${l.date} ka një kufi që nuk qëndron (${String(l.kufiri)}).`,
        };
      }

      loja.kufiri = l.kufiri;
    }
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

    const raundi: Raundi = {
      id: r.id,
      uid: uidIKopjes(r.uid, 'rounds', uidet),
      gameId: r.gameId,
      roundNumber: r.roundNumber,
      scores,
    };
    // Ora kur u luajt raundi, kur kopja e mban. Një vulë e prishur nuk e
    // rrëzon skedarin: pikët janë ato që kërkohen prapa, dhe pa të mbrëmja e ka
    // fundin të panjohur e jo të gabuar (`koha.ts`).
    if (eshteNumer(r.shkruarMe) && r.shkruarMe > 0) raundi.shkruarMe = r.shkruarMe;

    rounds.push(raundi);
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
