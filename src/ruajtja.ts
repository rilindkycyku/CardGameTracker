/**
 * Ruajtja — IndexedDB përmes `idb`.
 *
 * S'ka server. Gjithçka rri në shfletuesin e pajisjes, sepse loja luhet rreth
 * tavolinës dhe jo çdo mbrëmje ka internet të mirë. Kjo do të thotë edhe se
 * fshirja e të dhënave të shfletuesit e merr me vete tërë historikun —
 * prandaj kopja rezervë te `kopja.ts` nuk është shtojcë, është pjesë e punës.
 *
 * Ruhen vetëm pikët e futura. Totalet, renditja dhe matrica nuk shkruhen
 * asnjëherë: llogariten sa herë lexohen, që redaktimi i një raundi të vjetër
 * të mos lërë prapa një total të ngrirë.
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

import type { Grupi, LlojiILojes, Loja, Raundi } from './tipet.ts';

const EMRI = 'cardgametracker';
const VERSIONI = 1;

interface Skema extends DBSchema {
  groups: {
    key: number;
    value: Grupi;
  };
  games: {
    key: number;
    value: Loja;
    indexes: { groupId: number };
  };
  rounds: {
    key: number;
    value: Raundi;
    indexes: { gameId: number };
  };
}

let baza: Promise<IDBPDatabase<Skema>> | null = null;

function db(): Promise<IDBPDatabase<Skema>> {
  baza ??= openDB<Skema>(EMRI, VERSIONI, {
    upgrade(baza) {
      baza.createObjectStore('groups', { keyPath: 'id', autoIncrement: true });

      const games = baza.createObjectStore('games', {
        keyPath: 'id',
        autoIncrement: true,
      });
      games.createIndex('groupId', 'groupId');

      const rounds = baza.createObjectStore('rounds', {
        keyPath: 'id',
        autoIncrement: true,
      });
      rounds.createIndex('gameId', 'gameId');
    },
  });

  return baza;
}

/* ── Grupet ─────────────────────────────────────────────────────────────── */

export async function grupet(): Promise<Grupi[]> {
  return (await db()).getAll('groups');
}

export async function grupi(id: number): Promise<Grupi | undefined> {
  return (await db()).get('groups', id);
}

export async function shtoGrup(
  name: string,
  playerNames: string[],
): Promise<number> {
  const id = await (await db()).add('groups', {
    name,
    playerNames,
  } as Grupi);
  return id as number;
}

export async function ruajGrup(grupi: Grupi): Promise<void> {
  await (await db()).put('groups', grupi);
}

/**
 * Fshin grupin bashkë me lojërat dhe raundet e tij.
 *
 * Të tria brenda një transaksioni: një fshirje gjysmake do të linte raunde pa
 * lojë dhe lojëra pa grup, të padukshme dhe të pafshira.
 */
export async function fshiGrup(groupId: number): Promise<void> {
  const tx = (await db()).transaction(['groups', 'games', 'rounds'], 'readwrite');
  const lojerat = await tx.objectStore('games').index('groupId').getAll(groupId);

  for (const loja of lojerat) {
    const raundet = await tx.objectStore('rounds').index('gameId').getAll(loja.id);
    for (const raundi of raundet) await tx.objectStore('rounds').delete(raundi.id);
    await tx.objectStore('games').delete(loja.id);
  }

  await tx.objectStore('groups').delete(groupId);
  await tx.done;
}

/* ── Lojërat ────────────────────────────────────────────────────────────── */

export async function lojerat(groupId: number): Promise<Loja[]> {
  return (await db()).getAllFromIndex('games', 'groupId', groupId);
}

export async function loja(id: number): Promise<Loja | undefined> {
  return (await db()).get('games', id);
}

/**
 * Nis një lojë të re.
 *
 * `lloji` shkruhet gjithmonë, edhe kur është `bridzh`: lojërat e vjetra e kanë
 * fushën që mungon dhe lexohen bridzh gjithsesi, por një lojë e re që e thotë
 * vetë çka është nuk varet nga ai lexim.
 */
export async function shtoLoje(
  groupId: number,
  date: string,
  selectedPlayers: string[],
  lloji: LlojiILojes = 'bridzh',
): Promise<number> {
  const id = await (await db()).add('games', {
    groupId,
    date,
    selectedPlayers,
    createdAt: Date.now(),
    lloji,
  } as Loja);
  return id as number;
}

export async function ruajLoje(loja: Loja): Promise<void> {
  await (await db()).put('games', loja);
}

/** Fshin lojën bashkë me raundet e saj. */
export async function fshiLoje(gameId: number): Promise<void> {
  const tx = (await db()).transaction(['games', 'rounds'], 'readwrite');
  const raundet = await tx.objectStore('rounds').index('gameId').getAll(gameId);

  for (const raundi of raundet) await tx.objectStore('rounds').delete(raundi.id);
  await tx.objectStore('games').delete(gameId);
  await tx.done;
}

/* ── Raundet ────────────────────────────────────────────────────────────── */

export async function raundet(gameId: number): Promise<Raundi[]> {
  return (await db()).getAllFromIndex('rounds', 'gameId', gameId);
}

export async function shtoRaund(
  gameId: number,
  roundNumber: number,
  scores: Record<string, number | null>,
): Promise<number> {
  const id = await (await db()).add('rounds', {
    gameId,
    roundNumber,
    scores,
  } as Raundi);
  return id as number;
}

export async function ruajRaund(raundi: Raundi): Promise<void> {
  await (await db()).put('rounds', raundi);
}

export async function fshiRaund(id: number): Promise<void> {
  await (await db()).delete('rounds', id);
}

/* ── Numërimet ──────────────────────────────────────────────────────────── */

/**
 * Sa lojëra ka secili grup, dhe sa raunde ka secila lojë.
 *
 * Ekranet e listave i duan vetëm numrat. Leximi i vetë regjistrave do të
 * shpaketonte çdo objekt `scores` të çdo raundi vetëm që të matej gjatësia e
 * vargut — dhe një mbrëmje e vetme ka dhjetëra raunde. `index.count()` e nxjerr
 * numrin nga vetë indeksi, pa i prekur regjistrat.
 *
 * Të gjitha numërimet hyjnë në një transaksion të vetëm, jo në një për çdo
 * çelës, sepse hapja e transaksionit është pjesa e shtrenjtë.
 */
/** Sa lojëra ka secili nga këta grupe. */
export async function numriILojerave(
  groupIds: number[],
): Promise<Record<number, number>> {
  if (groupIds.length === 0) return {};

  const tx = (await db()).transaction('games', 'readonly');
  const index = tx.store.index('groupId');

  const cifte = await Promise.all(
    groupIds.map(async (id) => [id, await index.count(id)] as const),
  );

  await tx.done;
  return Object.fromEntries(cifte);
}

/**
 * Raundet e disa lojërave njëherësh, të ndara sipas lojës.
 *
 * Historiku i grupit tregon renditjen përfundimtare të secilës mbrëmje, prandaj
 * i duhen vetë raundet e jo vetëm sa janë. Leximi bëhet brenda një transaksioni
 * të vetëm: hapja e transaksionit është pjesa e shtrenjtë, jo vetë kërkesat.
 */
export async function raundetELojerave(
  gameIds: number[],
): Promise<Record<number, Raundi[]>> {
  if (gameIds.length === 0) return {};

  const tx = (await db()).transaction('rounds', 'readonly');
  const index = tx.store.index('gameId');

  const cifte = await Promise.all(
    gameIds.map(async (id) => [id, await index.getAll(id)] as const),
  );

  await tx.done;
  return Object.fromEntries(cifte);
}

/* ── Kopja rezervë ──────────────────────────────────────────────────────── */

/** Gjithçka që ka baza, për ta shkruar në skedar. */
export async function gjithcka(): Promise<{
  groups: Grupi[];
  games: Loja[];
  rounds: Raundi[];
}> {
  const baza = await db();
  const [groups, games, rounds] = await Promise.all([
    baza.getAll('groups'),
    baza.getAll('games'),
    baza.getAll('rounds'),
  ]);

  return { groups, games, rounds };
}

/**
 * Zëvendëson tërë bazën me përmbajtjen e një kopjeje.
 *
 * Zëvendësim e jo bashkim: `id`-të e kopjes ruhen ashtu si janë, që lidhjet
 * `groupId`/`gameId` të mbeten të vlefshme. Një bashkim do t'i rinumëronte dhe
 * do të kërkonte rilidhjen e gjithçkaje — punë me shumë mundësi gabimi për një
 * veprim që bëhet një herë, kur pajisja ndërrohet.
 */
export async function zevendeso(kopja: {
  groups: Grupi[];
  games: Loja[];
  rounds: Raundi[];
}): Promise<void> {
  const tx = (await db()).transaction(['groups', 'games', 'rounds'], 'readwrite');

  await Promise.all([
    tx.objectStore('groups').clear(),
    tx.objectStore('games').clear(),
    tx.objectStore('rounds').clear(),
  ]);

  for (const grupi of kopja.groups) await tx.objectStore('groups').put(grupi);
  for (const loja of kopja.games) await tx.objectStore('games').put(loja);
  for (const raundi of kopja.rounds) await tx.objectStore('rounds').put(raundi);

  await tx.done;
}
