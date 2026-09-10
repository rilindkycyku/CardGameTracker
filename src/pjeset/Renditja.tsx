/**
 * Renditja e lojës — vendi, lojtari, totali.
 *
 * Fiton totali më i vogël, prandaj rreshti i parë është ai me më pak pikë. Kjo
 * është e kundërta e asaj që pret syri te një tabelë pikësh, prandaj vendi i
 * parë ka mbushjen smerald dhe shiritin anësor.
 *
 * Kur dikush hyri në mes të lojës, shtohet kolona „raunde" dhe një shënim mbi
 * tabelë. Numrat nuk ndryshojnë — totali mbetet shuma e pikëve — por një total
 * i mbledhur mbi një raund nuk krahasohet me një të mbledhur mbi dhjetë, dhe
 * pa këtë kolonë tabela do ta thoshte të kundërtën pa e ditur.
 */

import { memo } from 'react';

import type { RreshtiRenditjes } from '../tipet.ts';
import { Ikona } from '../ikonat.tsx';

function RenditjaBrenda({
  rreshtat,
  luajtur,
}: {
  rreshtat: RreshtiRenditjes[];
  /** Sa raunde ka luajtur secili. Jepet vetëm kur nuk kanë luajtur njësoj. */
  luajtur?: Record<string, number> | null;
}) {
  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="renditja" />
        Renditja
      </h2>

      {luajtur && (
        <p className="njoftim njoftim--kujdes" data-hapesire="posht">
          <Ikona emri="kujdes" />
          <span>
            Nuk kanë luajtur të gjithë të njëjtat raunde. Totalet janë të sakta,
            por radha krahason shuma të mbledhura mbi baza të ndryshme.
          </span>
        </p>
      )}

      <div className="tabela-mbeshtjellese">
        <table className="tabela">
          <caption className="vetem-lexues">
            Renditja e lojtarëve sipas totalit, nga më i vogli te më i madhi.
          </caption>
          <thead>
            <tr>
              <th scope="col">Vendi</th>
              <th scope="col">Lojtari</th>
              {luajtur && (
                <th scope="col" className="numri">
                  Raunde
                </th>
              )}
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
                {luajtur && (
                  <td className="numri qeliza-raundi">
                    {luajtur[rreshti.player] ?? 0}
                  </td>
                )}
                <td className="numri">{rreshti.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Renditja rivizatohet vetëm kur ndryshojnë rreshtat, prandaj rri pas `memo`.
 *
 * Kjo punon vetëm sepse `Loja` i mban vlerat e derivuara te `useMemo`: pa
 * identitet të qëndrueshëm, krahasimi i hyrjeve do të dështonte çdo herë dhe
 * mbështjellja nuk do të kursente kurrgjë.
 */
export const Renditja = memo(RenditjaBrenda);
