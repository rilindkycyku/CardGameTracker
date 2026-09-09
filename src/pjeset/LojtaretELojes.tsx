/**
 * Lojtarët e një loje që ka nisur — shtimi dhe heqja mes rrugës.
 *
 * Dikush vjen te raundi i pestë dhe ulet; dikush ngrihet e ikën. Kjo ndodh çdo
 * mbrëmje, prandaj lista e lojës nuk ngrihet në gur kur loja nis.
 *
 * Dy rregulla e mbajnë të pastër:
 *
 *   • Shtimi nuk prek asnjë raund. Lojtari i ri thjesht s'ka pikë te raundet e
 *     shkuara, dhe qeliza e zbrazët nuk numërohet si zero — prandaj totali i
 *     tij nis nga hera e parë që shënon.
 *
 *   • Hiqet vetëm ai që s'ka shënuar ende. Kush ka pikë te ndonjë raund mbetet
 *     te loja: pikët e tij janë pjesë e historikut të asaj mbrëmjeje, dhe
 *     heqja e tij do t'i linte ato të varura pa kolonë. Kush ikën para fundit
 *     thjesht pushon së shënuari.
 */

import { useRef, useState } from 'react';

import { ndajEmrat } from '../fusha.ts';
import { Ikona } from '../ikonat.tsx';
import type { Grupi } from '../tipet.ts';

export function LojtaretELojes({
  players,
  grupi,
  luajtur,
  onShto,
  onHiq,
}: {
  players: string[];
  /** Grupi i lojës — prej andej vijnë emrat që propozohen. */
  grupi: Grupi | undefined;
  /** Sa raunde ka shënuar secili; kush ka zero mund të hiqet. */
  luajtur: Record<string, number>;
  /**
   * Shton te loja, dhe te grupi ata që janë krejt të rinj.
   *
   * Merr një varg e jo një emër të vetëm: një shkrim mund të sjellë disa emra,
   * dhe secili i shtuar veç do ta shkruante lojën me të njëjtën listë të vjetër
   * në dorë — do të mbetej vetëm i fundit.
   */
  onShto: (emrat: string[]) => void;
  onHiq: (emri: string) => void;
}) {
  const [iRi, caktoTeRin] = useState('');
  const fusha = useRef<HTMLInputElement>(null);

  const teLira = (grupi?.playerNames ?? []).filter(
    (emri) => !players.includes(emri),
  );

  function shtoTeRin() {
    const rinjte = ndajEmrat(iRi).filter((emri) => !players.includes(emri));
    caktoTeRin('');
    fusha.current?.focus();
    if (rinjte.length > 0) onShto(rinjte);
  }

  return (
    <details className="detaje">
      <summary className="detaje__krye">
        <span>
          Lojtarët e lojës
          <span className="detaje__numri">{players.length}</span>
        </span>
        <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
      </summary>

      <div className="detaje__trupi">
        <p className="ndihma">
          Kush ulet vonë shtohet këtu; raundet e shkuara nuk i preken dhe totali
          i tij nis nga hera e parë që shënon.
        </p>

        <ul className="shenjat" data-hapesire="lart">
          {players.map((lojtari) => (
            <li className="shenja-lojtari" key={lojtari}>
              {lojtari}
              <span className="shenja-lojtari__numri">
                {luajtur[lojtari] ?? 0}
              </span>
              {(luajtur[lojtari] ?? 0) === 0 && (
                <button
                  type="button"
                  className="shenja-lojtari__hiq"
                  onClick={() => onHiq(lojtari)}
                  aria-label={`Hiq ${lojtari} nga loja`}
                >
                  <Ikona emri="anulo" />
                </button>
              )}
            </li>
          ))}
        </ul>

        {teLira.length > 0 && (
          <>
            <p className="ndihma" data-hapesire="lart">
              Nga grupi, ende pa luajtur sonte:
            </p>
            <div className="zgjedhesi" data-hapesire="lart">
              {teLira.map((emri) => (
                <button
                  type="button"
                  key={emri}
                  className="zgjedhesi__njesi"
                  onClick={() => onShto([emri])}
                >
                  <Ikona emri="shto" />
                  {emri}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="rreshti-fushave" data-hapesire="lart">
          <div className="fusha">
            <input
              ref={fusha}
              type="text"
              value={iRi}
              placeholder="lojtar krejt i ri"
              onChange={(e) => caktoTeRin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  shtoTeRin();
                }
              }}
              aria-label="Emri i një lojtari të ri"
            />
          </div>
          <button
            type="button"
            className="buton"
            onClick={shtoTeRin}
            disabled={!iRi.trim()}
          >
            <Ikona emri="shto" />
            Shto
          </button>
        </div>
        <p className="ndihma">
          Emri që s’është te grupi shtohet edhe atje.
        </p>
      </div>
    </details>
  );
}
