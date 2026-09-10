/**
 * Lista e raundeve të një magareci — kush e humbi secilin, dhe cilën shkronjë
 * mori.
 *
 * Te bridzhi këtu rri një tabelë me një kolonë për lojtar; këtu do të ishte një
 * tabelë me `1` e `0` që nuk thotë asgjë. Raundi i magarecit ka një emër të
 * vetëm, prandaj ka edhe një rresht të vetëm: «4 · eri · R».
 *
 * Shkronja nuk ruhet askund — del nga sa herë e kishte humbur ai lojtar deri
 * atëherë. Prandaj fshirja e një raundi të mesit i rinumëron vetvetiu të gjitha
 * ato që vijnë pas, si totali te bridzhi.
 */

import { memo } from 'react';

import type { RaundiIMagarecit } from '../magareci.ts';
import { Ikona } from '../ikonat.tsx';

function RaundetEMagarecitBrenda({
  raundet,
  dukeRedaktuar,
  onRedakto,
  onFshi,
}: {
  raundet: RaundiIMagarecit[];
  dukeRedaktuar: number | null;
  onRedakto: (id: number) => void;
  onFshi: (id: number) => void;
}) {
  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="kalendari" />
        Raundet
        <span className="titull-seksioni__numri">{raundet.length}</span>
      </h2>

      <div className="tabela-mbeshtjellese">
        <table className="tabela">
          <caption className="vetem-lexues">
            Kush e humbi secilin raund, dhe shkronja që mori për të.
          </caption>
          <thead>
            <tr>
              <th scope="col">Raundi</th>
              <th scope="col">E humbi</th>
              <th scope="col" className="numri">
                Shkronja
              </th>
              <th scope="col" className="rreshti-veprimeve">
                <span className="vetem-lexues">Veprimet</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {raundet.map((raundi) => (
              <tr key={raundi.id}>
                <th scope="row" className="qeliza-raundi">
                  {raundi.roundNumber}
                </th>
                <td className="qeliza-emri">{raundi.humbesi ?? '—'}</td>
                <td
                  className={
                    raundi.shkronja ? 'numri shkronja--marre' : 'numri qeliza-bosh'
                  }
                >
                  {raundi.shkronja || '—'}
                </td>
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
                        Ndërro humbësin e raundit {raundi.roundNumber}
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
        </table>
      </div>
    </section>
  );
}

/** Si te `Raundet`: rri pas `memo`, dhe hyrjet i mban `useMemo` te `Loja`. */
export const RaundetEMagarecit = memo(RaundetEMagarecitBrenda);
