/**
 * Futja e një raundi — me dorë, ose përmes llogaritësit.
 *
 * Fushat me numra mbeten gjithmonë burimi i vërtetë. Llogaritësi vetëm i
 * mbush ato, dhe pastaj mund të preken ende me dorë. Kjo nuk është zbukurim:
 * te fletët e vjetra ka raunde që nuk dalin nga rregullat — një mbyllje e
 * shënuar me −50 në vend të −40 — dhe një aplikacion që i pranon vetëm
 * kombinimet e lejuara nuk do t'i shënonte dot.
 *
 * Fushat janë `inputMode="numeric"` me `min`/`max` të gjera: tastiera e
 * telefonit del numerike, por edhe pikët negative shkruhen pa luftë.
 */

import { useEffect, useMemo, useState } from 'react';

import {
  piketERaundit,
  shpjegimi,
  type GjendjaLojtarit,
  type LlojiMbylljes,
} from '../pikezimi.ts';
import { Ikona } from '../ikonat.tsx';

type Vlerat = Record<string, string>;

export function FutjaERaundit({
  players,
  roundNumber,
  fillestare,
  onRuaj,
  onAnulo,
}: {
  players: string[];
  roundNumber: number;
  /** Pikët ekzistuese kur raundi po redaktohet; `null` kur është i ri. */
  fillestare?: Record<string, number | null> | null;
  onRuaj: (scores: Record<string, number | null>) => void;
  onAnulo?: () => void;
}) {
  const [vlerat, caktoVlerat] = useState<Vlerat>(() => nga(players, fillestare));
  const [hapurLlogaritesi, hapLlogaritesin] = useState(false);

  // Kur ndërrohet raundi që redaktohet, fushat duhet të ndjekin atë e jo të
  // mbajnë pikët e raundit të mëparshëm.
  useEffect(() => {
    caktoVlerat(nga(players, fillestare));
  }, [players, fillestare, roundNumber]);

  const shuma = players.reduce((s, p) => s + (numri(vlerat[p]) ?? 0), 0);
  const sashenuar = players.filter((p) => numri(vlerat[p]) !== null).length;

  function ruaj() {
    const scores: Record<string, number | null> = {};
    for (const player of players) scores[player] = numri(vlerat[player]);
    onRuaj(scores);
    if (!fillestare) caktoVlerat(nga(players, null));
    hapLlogaritesin(false);
  }

  return (
    <div className="futja">
      <div className="futja__rrjeti">
        {players.map((player) => (
          <label className="futja__njesi" key={player}>
            <span className="futja__emri">{player}</span>
            <input
              type="number"
              inputMode="numeric"
              step="1"
              placeholder="—"
              value={vlerat[player] ?? ''}
              onChange={(e) =>
                caktoVlerat((v) => ({ ...v, [player]: e.target.value }))
              }
              aria-label={`Pikët e ${player} për raundin ${roundNumber}`}
            />
          </label>
        ))}
      </div>

      <p className="futja__shuma">
        <span>
          {sashenuar} nga {players.length} të shënuar
        </span>
        <span>
          shuma e raundit <strong>{shuma}</strong>
        </span>
      </p>

      <div className="veprimet">
        <button
          type="button"
          className="buton buton--kryesor"
          onClick={ruaj}
          disabled={sashenuar === 0}
        >
          <Ikona emri="ruaj" />
          {fillestare ? 'Ruaj ndryshimet' : `Ruaj raundin ${roundNumber}`}
        </button>

        <button
          type="button"
          className="buton"
          aria-expanded={hapurLlogaritesi}
          onClick={() => hapLlogaritesin((h) => !h)}
        >
          <Ikona emri="llogaritesi" />
          Llogaritësi
        </button>

        {onAnulo && (
          <button type="button" className="buton" onClick={onAnulo}>
            <Ikona emri="anulo" />
            Anulo
          </button>
        )}
      </div>

      {hapurLlogaritesi && (
        <Llogaritesi
          players={players}
          onVendos={(pike) => {
            caktoVlerat(
              Object.fromEntries(
                players.map((p) => [p, String(pike[p] ?? 0)]),
              ) as Vlerat,
            );
            hapLlogaritesin(false);
          }}
        />
      )}
    </div>
  );
}

/**
 * Llogaritësi: kush mbylli, si e mbylli, dhe çfarë i mbeti secilit në dorë.
 *
 * Dora pyetet vetëm për ata që kishin hapur — dënimi i atij që s'hapi është
 * fiks (+100 ose +200) dhe dora e tij nuk hyn fare në llogari.
 */
function Llogaritesi({
  players,
  onVendos,
}: {
  players: string[];
  onVendos: (pike: Record<string, number>) => void;
}) {
  const [mbyllesi, caktoMbyllesin] = useState(players[0] ?? '');
  const [lloji, caktoLlojin] = useState<LlojiMbylljes>('normal');
  const [gjendjet, caktoGjendjet] = useState<Record<string, GjendjaLojtarit>>(
    () => Object.fromEntries(players.map((p) => [p, { mbyllur: true, dora: 0 }])),
  );

  const pike = useMemo(
    () => piketERaundit(players, mbyllesi, lloji, gjendjet),
    [players, mbyllesi, lloji, gjendjet],
  );

  function ndrysho(player: string, ndryshimi: Partial<GjendjaLojtarit>) {
    caktoGjendjet((g) => ({
      ...g,
      [player]: { ...(g[player] ?? { mbyllur: true, dora: 0 }), ...ndryshimi },
    }));
  }

  return (
    <div className="llogaritesi">
      <div className="fusha">
        <span className="fusha__etiketa">Kush e mbylli</span>
        <select
          value={mbyllesi}
          onChange={(e) => caktoMbyllesin(e.target.value)}
          aria-label="Lojtari që mbylli raundin"
        >
          {players.map((player) => (
            <option key={player} value={player}>
              {player}
            </option>
          ))}
        </select>
      </div>

      <div className="fusha">
        <span className="fusha__etiketa">Si e mbylli</span>
        <div className="celesi">
          <button
            type="button"
            className="celesi__njesi"
            aria-pressed={lloji === 'normal'}
            onClick={() => caktoLlojin('normal')}
          >
            Normal · −20
          </button>
          <button
            type="button"
            className="celesi__njesi"
            aria-pressed={lloji === 'hant'}
            onClick={() => caktoLlojin('hant')}
          >
            Hant · −40
          </button>
        </div>
        <p className="ndihma">
          {lloji === 'hant'
            ? 'Mbylli pa hedhur e pa shitur asnjë letër. Të tjerët që s’hapën marrin 200, të hapurit dorën dyfish.'
            : 'Kishte hapur para se të mbyllte. Të tjerët që s’hapën marrin 100, të hapurit dorën një herë.'}
        </p>
      </div>

      <div className="llogaritesi__lista">
        {players
          .filter((player) => player !== mbyllesi)
          .map((player) => {
            const gjendja = gjendjet[player] ?? { mbyllur: true, dora: 0 };

            return (
              <div className="llogaritesi__njesi" key={player}>
                <span className="llogaritesi__emri">{player}</span>

                <div className="llogaritesi__gjendja">
                  <div className="celesi celesi__vogel">
                    <button
                      type="button"
                      className="celesi__njesi"
                      aria-pressed={gjendja.mbyllur}
                      onClick={() => ndrysho(player, { mbyllur: true })}
                    >
                      S’hapi
                    </button>
                    <button
                      type="button"
                      className="celesi__njesi"
                      aria-pressed={!gjendja.mbyllur}
                      onClick={() => ndrysho(player, { mbyllur: false })}
                    >
                      Hapi
                    </button>
                  </div>

                  <input
                    className="llogaritesi__dora"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    placeholder="dora"
                    disabled={gjendja.mbyllur}
                    value={gjendja.mbyllur ? '' : String(gjendja.dora || '')}
                    onChange={(e) =>
                      ndrysho(player, { dora: Number(e.target.value) || 0 })
                    }
                    aria-label={`Pikët në dorë të ${player}`}
                  />
                </div>

                <p className="llogaritesi__rezultati">
                  <span>{shpjegimi(lloji, gjendja)}</span>
                  <span className="llogaritesi__pike">{pike[player]}</span>
                </p>
              </div>
            );
          })}
      </div>

      <p className="futja__shuma">
        <span>
          {mbyllesi} merr <strong>{pike[mbyllesi]}</strong>
        </span>
        <span>
          shuma <strong>{Object.values(pike).reduce((a, b) => a + b, 0)}</strong>
        </span>
      </p>

      <button
        type="button"
        className="buton buton--i-plote"
        onClick={() => onVendos(pike)}
      >
        <Ikona emri="ruaj" />
        Vendosi te fushat
      </button>
    </div>
  );
}

/** Pikët ekzistuese si tekst për fushat; `null` bëhet fushë e zbrazët. */
function nga(
  players: string[],
  scores: Record<string, number | null> | null | undefined,
): Vlerat {
  return Object.fromEntries(
    players.map((p) => {
      const v = scores?.[p];
      return [p, typeof v === 'number' ? String(v) : ''];
    }),
  );
}

/** Teksti i një fushe si numër, ose `null` nëse s’është shënuar ende. */
function numri(teksti: string | undefined): number | null {
  if (teksti === undefined || teksti.trim() === '') return null;
  const n = Number(teksti);
  return Number.isFinite(n) ? Math.round(n) : null;
}
