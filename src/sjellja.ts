/**
 * Sjellja e një mbrëmjeje nga jashtë.
 *
 * Bridzhi tani luhet edhe te telefoni — [bridzh-online][1] i ndan letrat, dhe
 * kur mbrëmja mbaron i nxjerr raundet si skedar. Ky skedar e lexon atë, dhe
 * ndarja mes dy aplikacioneve mbetet ajo që ishte: **atje luhet, këtu numërohet.**
 *
 * [1]: https://github.com/rilindkycyku/bridzh-online
 *
 * **Kjo nuk është kopje rezervë, dhe ndryshimi është i tëri.** `kopja.ts` e
 * zëvendëson bazën kur kthehet — ashtu duhet, sepse ajo është e tërë historia.
 * Këtu shtohet **një mbrëmje e vetme** te një grup që ekziston, dhe asgjë e
 * shkruar më parë nuk preket. Një skedar i tillë nuk fshin dot asnjë natë.
 *
 * Çka kontrollohet, dhe pse me atë ashpërsi: skedari vjen nga jashtë, si çdo gjë
 * tjetër që nuk e shkroi kjo bazë — nga një version i ardhshëm, nga një
 * aplikacion tjetër, ose nga kushdo. Prandaj lexohet fjalë për fjalë, dhe çka
 * nuk lexohet **refuzohet e tëra e nuk ndreqet**: një mbrëmje gjysmake do të
 * shkruhej te historiku pa u vënë re, dhe një raund që i mungon nuk duket si
 * gabim — duket si raund që nuk u luajt.
 *
 * Nuk njeh as bazën, as React-in, as `window`-in: tekst brenda, vlerë jashtë
 * (pika 1).
 */

import type { LlojiILojes } from './tipet.ts';

/** Emri i formatit. Gjysma tjetër e çiftit është `eksporti.ts` te bridzh-online. */
export const FORMATI = 'bridzh-mbremje';

/** Versioni i njohur. Një i panjohur refuzohet i tëri. */
export const VERSIONI = 1;

/** Sa raunde pranohen së shumti — një mbrëmje, jo një bazë. */
export const RAUNDE_ME_TE_SHUMTA = 200;

/** Sa lojtarë pranohen së shumti, si te vetë loja. */
export const LOJTARE_ME_TE_SHUMTE = 8;

export type MbremjaESjelle = {
  lloji: LlojiILojes;
  date: string;
  selectedPlayers: string[];
  raundet: Record<string, number>[];
};

export type Lexuar =
  | { ok: true; mbremja: MbremjaESjelle }
  | { ok: false; gabimi: string };

const jo = (gabimi: string): Lexuar => ({ ok: false, gabimi });

/** `YYYY-MM-DD`, dhe një datë që ekziston vërtet. */
function dataERregullt(x: unknown): x is string {
  if (typeof x !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;

  const [v, m, d] = x.split('-').map(Number) as [number, number, number];
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;

  // 31 shkurti lexohet si 3 mars nga `Date`; kjo e kap atë.
  const proves = new Date(Date.UTC(v, m - 1, d));
  return proves.getUTCFullYear() === v
    && proves.getUTCMonth() === m - 1
    && proves.getUTCDate() === d;
}

/**
 * Lexon një mbrëmje të sjellë, ose thotë me fjalë pse jo.
 *
 * Fjalia e gabimit del te ekrani, prandaj thotë çka nuk shkoi e jo emrin e një
 * fushe: kush e hap atë panel nuk e ka shkruar formatin, dhe «`raundet[3]` nuk
 * është objekt» nuk i thotë asgjë.
 */
export function lexoMbremjen(teksti: string): Lexuar {
  let i_lexuar: unknown;

  try {
    i_lexuar = JSON.parse(teksti);
  } catch {
    return jo('Ky skedar nuk lexohet — a është ai që nxori bridzhi?');
  }

  if (typeof i_lexuar !== 'object' || i_lexuar === null || Array.isArray(i_lexuar)) {
    return jo('Ky skedar nuk është një mbrëmje.');
  }

  const m = i_lexuar as Record<string, unknown>;

  if (m.formati !== FORMATI) {
    return jo('Ky skedar nuk është një mbrëmje bridzhi e nxjerrë nga loja.');
  }

  if (m.versioni !== VERSIONI) {
    return jo(
      `Ky skedar vjen nga një version tjetër (${String(m.versioni)}). `
      + 'Ngrite Tavolinën, ose nxirre mbrëmjen sërish.',
    );
  }

  // Lloji shkruhet te skedari dhe nuk hamendësohet: një mbrëmje e panjohur do
  // të lexohej bridzh, dhe pikët e saj do të dilnin pikë bridzhi (pika 16).
  if (m.lloji !== 'bridzh') {
    return jo('Kjo mbrëmje nuk është bridzh, dhe vetëm bridzhi luhet atje.');
  }

  if (!dataERregullt(m.date)) return jo('Data e mbrëmjes nuk lexohet.');

  if (
    !Array.isArray(m.selectedPlayers)
    || m.selectedPlayers.length === 0
    || m.selectedPlayers.length > LOJTARE_ME_TE_SHUMTE
    || !m.selectedPlayers.every((e) => typeof e === 'string' && e.trim().length > 0)
  ) {
    return jo('Lojtarët e mbrëmjes nuk lexohen.');
  }

  const lojtaret = m.selectedPlayers as string[];
  if (new Set(lojtaret).size !== lojtaret.length) {
    return jo('Dy lojtarë të kësaj mbrëmjeje e kanë të njëjtin emër.');
  }

  if (!Array.isArray(m.raundet) || m.raundet.length === 0) {
    return jo('Kjo mbrëmje nuk ka asnjë raund.');
  }

  if (m.raundet.length > RAUNDE_ME_TE_SHUMTA) {
    return jo('Kjo mbrëmje ka shumë më tepër raunde se një mbrëmje e vërtetë.');
  }

  const raundet: Record<string, number>[] = [];

  for (const [i, raundi] of m.raundet.entries()) {
    if (typeof raundi !== 'object' || raundi === null || Array.isArray(raundi)) {
      return jo(`Raundi ${i + 1} nuk lexohet.`);
    }

    const pike: Record<string, number> = {};

    for (const [emri, vlera] of Object.entries(raundi as Record<string, unknown>)) {
      // Një lojtar që nuk rri te lista do të shkruante një kolonë që nuk
      // ekziston, dhe totali i tij nuk do të dilte askund.
      if (!lojtaret.includes(emri)) {
        return jo(`Raundi ${i + 1} mban një lojtar që nuk është te mbrëmja.`);
      }
      if (typeof vlera !== 'number' || !Number.isFinite(vlera)) {
        return jo(`Raundi ${i + 1} ka një pikë që nuk është numër.`);
      }
      pike[emri] = vlera;
    }

    if (Object.keys(pike).length === 0) return jo(`Raundi ${i + 1} është i zbrazët.`);

    raundet.push(pike);
  }

  return {
    ok: true,
    mbremja: {
      lloji: 'bridzh',
      date: m.date,
      selectedPlayers: lojtaret,
      raundet,
    },
  };
}

/** Një fjali për ekranin, para se të shtypet butoni që e shkruan. */
export function permbledhja(m: MbremjaESjelle): string {
  const raunde = m.raundet.length;
  return `${raunde} ${raunde === 1 ? 'raund' : 'raunde'}, `
    + `${m.selectedPlayers.length} lojtarë, ${m.date}`;
}

/**
 * Lojtarët e mbrëmjes që nuk janë te grupi.
 *
 * Nuk e ndal sjelljen — `selectedPlayers` e një loje është fotografia e asaj
 * nate dhe nuk varet nga lista e sotme e grupit (pika 4). Por ekrani e thotë,
 * sepse kush sjell një mbrëmje me një emër të shkruar ndryshe do ta shohë atë
 * si lojtar të veçantë te të përgjithshmet.
 */
export function teRinjte(m: MbremjaESjelle, playerNames: readonly string[]): string[] {
  return m.selectedPlayers.filter((e) => !playerNames.includes(e));
}
