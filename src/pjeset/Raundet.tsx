/**
 * Tabela e raundeve — një rresht për raund, një kolonë për lojtar, dhe totali
 * në fund.
 *
 * Me gjashtë lojtarë tabela del më e gjerë se telefoni, prandaj rrëshqet
 * anash dhe kolona e raundit rri e ngjitur majtas (`position: sticky`): pa të
 * humb se cili raund po shihet sapo rrëshqitet.
 *
 * Pikët negative janë mbyllja e raundit — vetëm një lojtar i ka. Ngjyrosen
 * smerald, që raundi të lexohet me një shikim pa u kërkuar minusi.
 */

import { sipasRadhes } from '../llogaritjet.ts';
import type { Raundi } from '../tipet.ts';
import { Ikona } from '../ikonat.tsx';

export function Raundet({
  players,
  raundet,
  totalet,
  dukeRedaktuar,
  onRedakto,
  onFshi,
}: {
  players: string[];
  raundet: Raundi[];
  totalet: Record<string, number>;
  dukeRedaktuar: number | null;
  onRedakto: (id: number) => void;
  onFshi: (id: number) => void;
}) {
  const rreshtat = sipasRadhes(raundet);

  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="shlyerja" />
        Raundet
        <span className="titull-seksioni__numri">{rreshtat.length}</span>
      </h2>

      <div className="tabela-mbeshtjellese">
        <table
          className="tabela tabela--raundet"
          data-shume={players.length >= 5 || undefined}
        >
          <caption className="vetem-lexues">
            Pikët e secilit lojtar raund pas raundi, me totalin në fund.
          </caption>
          <thead>
            <tr>
              <th scope="col">Raundi</th>
              {players.map((player) => (
                <th key={player} scope="col" className="numri">
                  {player}
                </th>
              ))}
              <th scope="col" className="rreshti-veprimeve">
                <span className="vetem-lexues">Veprimet</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rreshtat.map((raundi) => (
              <tr key={raundi.id}>
                <th scope="row" className="qeliza-raundi">
                  {raundi.roundNumber}
                </th>
                {players.map((player) => {
                  const pike = raundi.scores[player];
                  const shenuar = typeof pike === 'number';

                  return (
                    <td
                      key={player}
                      className={
                        shenuar
                          ? pike < 0
                            ? 'numri pike--mbyllje'
                            : 'numri'
                          : 'numri qeliza-bosh'
                      }
                    >
                      {shenuar ? pike : '—'}
                    </td>
                  );
                })}
                <td className="rreshti-veprimeve">
                  <div className="njesi__veprimet">
                    <button
                      type="button"
                      className="buton buton--vogel"
                      aria-pressed={dukeRedaktuar === raundi.id}
                      onClick={() => onRedakto(raundi.id)}
                    >
                      <Ikona emri="redakto" />
                      <span className="vetem-lexues">
                        Redakto raundin {raundi.roundNumber}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="buton buton--vogel buton--rrezik"
                      onClick={() => onFshi(raundi.id)}
                    >
                      <Ikona emri="fshi" />
                      <span className="vetem-lexues">
                        Fshi raundin {raundi.roundNumber}
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="rresht--totali">
              <th scope="row">Totali</th>
              {players.map((player) => (
                <td key={player} className="numri">
                  {totalet[player] ?? 0}
                </td>
              ))}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
