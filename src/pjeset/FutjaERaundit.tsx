/**
 * Futja e një raundi — me dorë, ose përmes llogaritësit.
 *
 * Ky bllok përdoret më shumë se çdo tjetër: dhjetëra herë në një mbrëmje, nga
 * dikush që mban letrat me dorën tjetër. Prandaj çdo prekje e kursyer këtu
 * vlen më shumë se një ekran i tërë diku tjetër.
 *
 * Tri gjëra e mbajnë të shpejtë:
 *
 *   • «Next» i tastierës kalon te lojtari tjetër, dhe te i fundit e ruan
 *     raundin. Me gjashtë lojtarë kjo është gjashtë prekje më pak për raund,
 *     dhe dora nuk lëviz nga tastiera.
 *   • Rreshti i veprimeve rri i ngjitur në fund të kartelës. Me tastierën e
 *     hapur, ekrani i mbetur është nën gjysmën e telefonit — pa këtë, butoni
 *     „Ruaj" bie poshtë çdo here që lojtarët janë shumë.
 *   • Pikët preken ende me dorë pas llogaritësit: te fleta origjinale ka një
 *     raund me mbyllës −50, që nuk e jep asnjë nga dy mbylljet, dhe një
 *     aplikacion që pranon vetëm kombinimet e lejuara nuk do ta shënonte dot.
 *
 * Shenja ka butonin e vet sepse tastiera numerike e Androidit s'ka minus;
 * arsyetimi i plotë dhe përpunimi i tekstit rrinë te `fusha.ts`.
 */

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  piketERaundit,
  shpjegimi,
  type GjendjaLojtarit,
  type LlojiMbylljes,
} from '../pikezimi.ts';
import { negative, ndrroShenjen as ndrro, numri, pastro } from '../fusha.ts';
import { Ikona } from '../ikonat.tsx';

type Vlerat = Record<string, string>;

/** Nga sa lojtarë e tutje shtrëngohen rreshtat. */
const SHUME = 5;

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
  const fushat = useRef<(HTMLInputElement | null)[]>([]);

  // Kur ndërrohet raundi që redaktohet, fushat duhet të ndjekin atë e jo të
  // mbajnë pikët e raundit të mëparshëm.
  useEffect(() => {
    caktoVlerat(nga(players, fillestare));
  }, [players, fillestare, roundNumber]);

  const shuma = players.reduce((s, p) => s + (numri(vlerat[p]) ?? 0), 0);
  const sashenuar = players.filter((p) => numri(vlerat[p]) !== null).length;
  const shume = players.length >= SHUME;

  /**
   * Ruan raundin.
   *
   * `rifokuso` vjen vetëm nga tastiera. Pas një prekjeje të butonit fokusi rri
   * ku është: hapja e tastierës pa u kërkuar do ta mbulonte gjysmën e ekranit
   * pikërisht kur përdoruesi po shikon renditjen e sapondryshuar.
   */
  function ruaj(rifokuso = false) {
    if (sashenuar === 0) return;

    const scores: Record<string, number | null> = {};
    for (const player of players) scores[player] = numri(vlerat[player]);
    onRuaj(scores);

    if (!fillestare) {
      caktoVlerat(nga(players, null));
      if (rifokuso) fushat.current[0]?.focus();
    }
    hapLlogaritesin(false);
  }

  /** «Next» shkon te lojtari tjetër; te i fundit ruan raundin. */
  function neTaste(e: React.KeyboardEvent, i: number) {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const tjetra = fushat.current[i + 1];
    if (tjetra) tjetra.focus();
    else ruaj(true);
  }

  return (
    <div className="futja">
      <div className="futja__rrjeti" data-shume={shume || undefined}>
        {players.map((player, i) => (
          <div className="futja__njesi" key={player}>
            <span className="futja__emri">{player}</span>
            <div className="futja__vlera">
              <button
                type="button"
                className="futja__shenja"
                aria-pressed={negative(vlerat[player])}
                onClick={() => ndrroShenjen(player)}
                aria-label={`Ndërro shenjën e ${player}`}
              >
                {negative(vlerat[player]) ? '−' : '+'}
              </button>
              <input
                ref={(el) => {
                  fushat.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="-?[0-9]*"
                enterKeyHint={i === players.length - 1 ? 'done' : 'next'}
                value={vlerat[player] ?? ''}
                onChange={(e) =>
                  caktoVlerat((v) => ({
                    ...v,
                    [player]: pastro(e.target.value),
                  }))
                }
                onKeyDown={(e) => neTaste(e, i)}
                aria-label={`Pikët e ${player} për raundin ${roundNumber}`}
              />
            </div>
          </div>
        ))}
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

      <div className="futja__fund">
        <p className="futja__shuma">
          <span>
            {sashenuar} nga {players.length} të shënuar
          </span>
          <span>
            shuma <strong>{shuma}</strong>
          </span>
        </p>

        <div className="veprimet">
          <button
            type="button"
            className="buton buton--kryesor"
            onClick={() => ruaj()}
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
      </div>
    </div>
  );

  function ndrroShenjen(player: string) {
    caktoVlerat((v) => ({ ...v, [player]: ndrro(v[player]) }));
  }
}

/**
 * Llogaritësi: kush mbylli, si e mbylli, dhe çfarë i mbeti secilit në dorë.
 *
 * Nuk ka çelës „s'hapi / hapi", dhe kjo është vetë pyetja e hequr: dora e thotë.
 * Fushë e zbrazët do të thotë që lojtari nuk hapi fare, prandaj merr dënimin
 * fiks (+100 ose +200); çdo numër do të thotë që hapi, dhe ai numër është dora
 * e tij. Një lojtar që ka hapur e ka mbetur me zero pikë në dorë do ta kishte
 * mbyllur vetë raundin, prandaj zeroja nuk humb asnjë gjendje të vërtetë.
 *
 * Me gjashtë lojtarë kjo e pret llogaritësin përgjysmë dhe heq pesë prekje —
 * më parë secili kërkonte një çelës para se t'i shkruhej dora.
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
  const [duart, caktoDuart] = useState<Record<string, string>>({});

  const gjendjet: Record<string, GjendjaLojtarit> = useMemo(
    () =>
      Object.fromEntries(
        players.map((player) => {
          const dora = Number(duart[player] ?? '');
          const hapi = Number.isFinite(dora) && dora > 0;
          return [player, { mbyllur: !hapi, dora: hapi ? dora : 0 }];
        }),
      ),
    [players, duart],
  );

  const pike = useMemo(
    () => piketERaundit(players, mbyllesi, lloji, gjendjet),
    [players, mbyllesi, lloji, gjendjet],
  );

  const tjeret = players.filter((player) => player !== mbyllesi);

  return (
    <div className="llogaritesi">
      <div className="fusha">
        <span className="fusha__etiketa">Kush e mbylli, dhe si</span>
        <div className="llogaritesi__krye">
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

          <div className="celesi">
            <button
              type="button"
              className="celesi__njesi"
              aria-pressed={lloji === 'normal'}
              onClick={() => caktoLlojin('normal')}
            >
              Normal
            </button>
            <button
              type="button"
              className="celesi__njesi"
              aria-pressed={lloji === 'hant'}
              onClick={() => caktoLlojin('hant')}
            >
              Hant
            </button>
          </div>
        </div>
      </div>

      <p className="ndihma">
        Mbyllësi merr {lloji === 'hant' ? '−40' : '−20'}. Lëre bosh atë që s’hapi —
        merr {lloji === 'hant' ? '200' : '100'}.
      </p>

      <ul className="llogaritesi__lista">
        {tjeret.map((player) => (
          <li className="llogaritesi__njesi" key={player}>
            <span className="llogaritesi__emri">{player}</span>
            <input
              className="llogaritesi__dora"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="s’hapi"
              value={duart[player] ?? ''}
              onChange={(e) =>
                caktoDuart((d) => ({
                  ...d,
                  [player]: e.target.value.replace(/[^0-9]/g, ''),
                }))
              }
              aria-label={`Pikët në dorë të ${player}`}
            />
            <span
              className="llogaritesi__pike"
              title={shpjegimi(lloji, gjendjet[player]!)}
            >
              {pike[player]}
            </span>
          </li>
        ))}
      </ul>

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
