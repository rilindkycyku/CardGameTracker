/**
 * Futja e një raundi magareci — një pyetje e vetme: kush e humbi.
 *
 * Te bridzhi raundi është gjashtë numra; këtu është një emër. Prandaj s'ka
 * fusha, s'ka tastierë dhe s'ka buton «Ruaj»: prekja e emrit e ruan raundin.
 * Kjo është e tërë futja, dhe ajo bëhet dhjetëra herë në mbrëmje.
 *
 * Çdo buton e thotë edhe ku e ka atë lojtar: fjala e tij deri tani, dhe
 * shkronja që do të marrë po e humbi këtë raund. Pa këtë, kush e mban telefonin
 * duhet ta lexojë rrjetin poshtë para çdo prekjeje — dhe pikërisht kjo është
 * pyetja që e mban tavolinën në pritje.
 *
 * Prekja e gabuar nuk është e pakthyeshme: raundi fshihet ose ndërrohet nga
 * lista poshtë, si te bridzhi.
 */

import { FJALA, SHKRONJAT, fjalaE } from '../magareci.ts';
import { Ikona } from '../ikonat.tsx';

/** Nga sa lojtarë e tutje shtrëngohet rrjeti — i njëjti kufi si te bridzhi. */
const SHUME = 5;

export function FutjaEMagarecit({
  players,
  roundNumber,
  shkronjat,
  humbesi,
  onRuaj,
  onAnulo,
}: {
  players: string[];
  roundNumber: number;
  /** Sa shkronja ka secili para këtij raundi. */
  shkronjat: Record<string, number>;
  /** Kush e humbi raundin që po redaktohet; `null` kur raundi është i ri. */
  humbesi?: string | null;
  onRuaj: (humbesi: string) => void;
  onAnulo?: () => void;
}) {
  return (
    <div className="futja">
      <p className="ndihma">
        {humbesi
          ? `Prek atë që e humbi raundin ${roundNumber} — ndryshimi ruhet aty për aty.`
          : `Kush e humbi raundin ${roundNumber}? Prekja e emrit e ruan raundin.`}
      </p>

      <div className="magareci-futja" data-shume={players.length >= SHUME || undefined}>
        {players.map((player) => {
          const sa = Math.max(0, shkronjat[player] ?? 0);
          const tjetra = SHKRONJAT[sa];

          return (
            <button
              type="button"
              key={player}
              className="magareci-futja__njesi"
              aria-pressed={humbesi === player}
              onClick={() => onRuaj(player)}
            >
              <span className="magareci-futja__emri">{player}</span>
              <span className="magareci-futja__fjala">
                <span className="magareci-futja__marre">{fjalaE(sa)}</span>
                {tjetra && <span className="magareci-futja__tjetra">{tjetra}</span>}
              </span>
              <span className="vetem-lexues">
                {tjetra
                  ? `${player} e humb raundin ${roundNumber} dhe merr shkronjën ${tjetra}`
                  : `${player} e ka mbushur ${FJALA}`}
              </span>
            </button>
          );
        })}
      </div>

      {onAnulo && (
        <div className="veprimet">
          <button type="button" className="buton" onClick={onAnulo}>
            <Ikona emri="anulo" />
            Anulo
          </button>
        </div>
      )}
    </div>
  );
}
