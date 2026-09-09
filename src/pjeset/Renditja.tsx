/**
 * Renditja e lojës — vendi, lojtari, totali.
 *
 * Fiton totali më i vogël, prandaj rreshti i parë është ai me më pak pikë. Kjo
 * është e kundërta e asaj që pret syri te një tabelë pikësh, prandaj vendi i
 * parë ka mbushjen smerald dhe shiritin anësor: kush e sheh tabelën për herë
 * të parë e kupton pa e lexuar rregullin.
 */

import type { RreshtiRenditjes } from '../tipet.ts';
import { Ikona } from '../ikonat.tsx';

export function Renditja({ rreshtat }: { rreshtat: RreshtiRenditjes[] }) {
  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="renditja" />
        Renditja
      </h2>

      <div className="tabela-mbeshtjellese">
        <table className="tabela">
          <caption className="vetem-lexues">
            Renditja e lojtarëve sipas totalit, nga më i vogli te më i madhi.
          </caption>
          <thead>
            <tr>
              <th scope="col">Vendi</th>
              <th scope="col">Lojtari</th>
              <th scope="col" className="numri">
                Totali
              </th>
            </tr>
          </thead>
          <tbody>
            {rreshtat.map((rreshti) => (
              <tr
                key={rreshti.player}
                className={rreshti.rank === 1 ? 'rresht--pare' : undefined}
              >
                <td className="qeliza-vendi">{rreshti.rank}</td>
                <td className="qeliza-emri">
                  {rreshti.player}
                  {rreshti.rank === 1 && (
                    <>
                      <Ikona emri="renditja" klasa="ikona kurora" />
                      <span className="vetem-lexues">fituesi</span>
                    </>
                  )}
                </td>
                <td className="numri">{rreshti.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
