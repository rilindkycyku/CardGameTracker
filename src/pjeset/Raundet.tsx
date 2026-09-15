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

import { memo } from 'react';

import { sipasRadhes } from '../llogaritjet.ts';
import type { Raundi } from '../tipet.ts';
import { Ikona } from '../ikonat.tsx';

function RaundetBrenda({
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
  /**
   * Mungojnë kur mbrëmja është e mbyllur, dhe atëherë kolona e veprimeve hiqet
   * fare e nuk rri e fikur: një buton i fikur thotë «provo prapë», kurse aty
   * nuk ka çka provohet derisa loja të rihapet.
   */
  onRedakto?: (id: number) => void;
  onFshi?: (id: number) => void;
}) {
  const veprime = onRedakto !== undefined && onFshi !== undefined;
  const rreshtat = sipasRadhes(raundet);
  const shume = players.length >= SHUME;

  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="shlyerja" />
        Raundet
        <span className="titull-seksioni__numri">{rreshtat.length}</span>
      </h2>

      <div className="tabela-mbeshtjellese">
        <table className="tabela tabela--raundet" data-shume={shume || undefined}>
          <caption className="vetem-lexues">
            Pikët e secilit lojtar raund pas raundi, me totalin në fund.
          </caption>
          <thead>
            <tr>
              <th scope="col">Raundi</th>
              {/*
                Me pesë lojtarë e tutje emri shkurtohet te kreu, si dita e javës
                te Kujdestaria: gjerësinë e kolonës e vendos emri e jo numri, dhe
                numri është ai që lexohet. Emri i plotë mbetet për lexuesat e
                ekranit, prandaj asgjë nuk humbet — vetëm piksela.
              */}
              {players.map((player) => (
                <th key={player} scope="col" className="numri">
                  {shume ? (
                    <>
                      <span className="emri-shkurtuar" aria-hidden>
                        {shkurto(player)}
                      </span>
                      <span className="vetem-lexues">{player}</span>
                    </>
                  ) : (
                    player
                  )}
                </th>
              ))}
              {veprime && (
                <th scope="col" className="rreshti-veprimeve">
                  <span className="vetem-lexues">Veprimet</span>
                </th>
              )}
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
                {veprime && (
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
                )}
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

/**
 * Tabela e raundeve del me qindra qeliza te një mbrëmje e gjatë, prandaj rri pas `memo`.
 *
 * Kjo punon vetëm sepse `Loja` i mban vlerat e derivuara te `useMemo`: pa
 * identitet të qëndrueshëm, krahasimi i hyrjeve do të dështonte çdo herë dhe
 * mbështjellja nuk do të kursente kurrgjë.
 */
export const Raundet = memo(RaundetBrenda);

/** Nga sa lojtarë e tutje shtrëngohet tabela. E njëjta prag si te futja. */
const SHUME = 5;

/**
 * Emri sa hyn te kreu i një kolone numrash.
 *
 * Tri shkronja i ndajnë emrat e një tavoline — «Lila», «Lesa», «Liridon» dalin
 * «Lil», «Les», «Lir» — dhe kolona bie te gjerësia e numrit, që është ajo që
 * lexohet. Nën katër shkronja nuk prek asgjë: një emër i shkurtër është tashmë
 * i shkurtër.
 */
function shkurto(emri: string): string {
  return emri.length <= 4 ? emri : emri.slice(0, 3);
}
