/**
 * Renditja e lojës — vendi, lojtari, totali.
 *
 * Te tri lojërat nga katër fiton totali më i vogël, prandaj rreshti i parë është
 * ai me më pak pikë. Kjo është e kundërta e asaj që pret syri te një tabelë
 * pikësh, prandaj vendi i parë ka mbushjen smerald dhe shiritin anësor — dhe
 * përshkrimi i tabelës e thotë me fjalë nga cila anë lexohet.
 *
 * Pishpiriku shkon nga ana tjetër, dhe atë e thotë `drejtimi`: rreshtat vijnë
 * tashmë të renditur nga thirrësi, por kurora nuk merret dot nga radha e tyre —
 * ajo kërkon të dihet cili total është fitues (pika 14).
 *
 * Kur dikush hyri në mes të lojës, shtohet kolona „raunde" dhe një shënim mbi
 * tabelë. Numrat nuk ndryshojnë — totali mbetet shuma e pikëve — por një total
 * i mbledhur mbi një raund nuk krahasohet me një të mbledhur mbi dhjetë, dhe
 * pa këtë kolonë tabela do ta thoshte të kundërtën pa e ditur.
 */

import { memo } from 'react';

import { fituesit } from '../llogaritjet.ts';
import type { Drejtimi, RreshtiRenditjes } from '../tipet.ts';
import { Ikona } from '../ikonat.tsx';

function RenditjaBrenda({
  rreshtat,
  luajtur,
  drejtimi = 'poshte',
}: {
  rreshtat: RreshtiRenditjes[];
  /** Sa raunde ka luajtur secili. Jepet vetëm kur nuk kanë luajtur njësoj. */
  luajtur?: Record<string, number> | null;
  /** Nga cila anë fitohet — që kurora të mos shkojë te fundi i tabelës. */
  drejtimi?: Drejtimi;
}) {
  /*
   * Kurora u takon të gjithëve që e ndajnë totalin më të vogël.
   *
   * Vendet mbeten ashtu si i jep `renditja` — 1, 2, 3 edhe kur totalet janë të
   * njëjta — sepse ashtu i numëron fleta origjinale dhe një rresht nuk rri dot
   * në dy vende. Por kurora nuk është numër, është pohim: «ky fitoi». Me tre
   * veta te 360 pikë ajo mbi të parin e listës do të thoshte diçka që nuk ka
   * ndodhur, prandaj ose u takon të gjithëve, ose askujt.
   */
  const pare = new Set(fituesit(rreshtat, drejtimi));

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
            Renditja e lojtarëve sipas totalit,{' '}
            {drejtimi === 'larte'
              ? 'nga më i madhi te më i vogli'
              : 'nga më i vogli te më i madhi'}
            .
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
                className={pare.has(rreshti.player) ? 'rresht--pare' : undefined}
              >
                <td className="qeliza-vendi">{rreshti.rank}</td>
                <td className="qeliza-emri">
                  {rreshti.player}
                  {pare.has(rreshti.player) && (
                    <>
                      <Ikona emri="renditja" klasa="ikona kurora" />
                      <span className="vetem-lexues">
                        {pare.size === 1 ? 'fituesi' : 'baras në krye'}
                      </span>
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
