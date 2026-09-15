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
 *
 * Vetë tabela rri te `TabelaERenditjes`, e ndarë nga seksioni, sepse te ekrani
 * i gjerë ajo vizatohet edhe nga `Parashikimi` — me dy kolona më shumë, brenda
 * një seksioni të vetëm. Dy kopje të saj do të dilnin jashtë sinkronie
 * pikërisht atje ku numri duhet të jetë i njëjti.
 */

import { memo } from 'react';

import { fituesit } from '../llogaritjet.ts';
import type { ParashikimiILojtarit } from '../parashikimi.ts';
import type { Drejtimi, RreshtiRenditjes } from '../tipet.ts';
import { Ikona } from '../ikonat.tsx';

/** Sa raunde ka luajtur secili. Jepet vetëm kur nuk kanë luajtur njësoj. */
export type RaundetELuajtura = Record<string, number> | null;

export type HyrjetERenditjes = {
  rreshtat: RreshtiRenditjes[];
  luajtur?: RaundetELuajtura;
  /** Nga cila anë fitohet — që kurora të mos shkojë te fundi i tabelës. */
  drejtimi?: Drejtimi;
};

/**
 * Shënimi mbi tabelë kur nuk kanë luajtur të gjithë të njëjtat raunde.
 *
 * Rri veç seksionit sepse te tabela e bashkuar ai duhet po ashtu, dhe fjalia
 * është e njëjta — çka ndryshon është vetëm se çka vjen pas saj.
 */
export function NjoftimiIRaundeve() {
  return (
    <p className="njoftim njoftim--kujdes" data-hapesire="posht">
      <Ikona emri="kujdes" />
      <span>
        Nuk kanë luajtur të gjithë të njëjtat raunde. Totalet janë të sakta, por
        radha krahason shuma të mbledhura mbi baza të ndryshme.
      </span>
    </p>
  );
}

/**
 * Tabela e renditjes, me ose pa kolonat e parashikimit.
 *
 * `parashikimi` jepet vetëm kur të dyja tabelat janë bashkuar: atëherë çdo
 * rresht merr edhe vendin që mund të dalë e raundet që i duhen për të parin.
 * Lidhja bëhet me emrin, sepse radha e dy llogarive del e njëjta vetëm kur
 * totalet janë të njëjta — dhe një lidhje sipas indeksit do të heshtte
 * pikërisht kur nuk janë.
 */
export function TabelaERenditjes({
  rreshtat,
  luajtur,
  drejtimi = 'poshte',
  parashikimi,
}: HyrjetERenditjes & {
  /** Rreshtat e parashikimit, kur tabela është e bashkuar. */
  parashikimi?: ParashikimiILojtarit[];
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
  const sipasEmrit = new Map(parashikimi?.map((r) => [r.player, r]));

  return (
    <div className="tabela-mbeshtjellese">
      <table
        className="tabela"
        data-shume={
          (parashikimi && rreshtat.length >= 5) || undefined
        }
      >
        <caption className="vetem-lexues">
          Renditja e lojtarëve sipas totalit,{' '}
          {drejtimi === 'larte'
            ? 'nga më i madhi te më i vogli'
            : 'nga më i vogli te më i madhi'}
          .
          {parashikimi &&
            ' Krah saj, vendi më i mirë dhe më i keq që mund të arrijë secili' +
              ' dhe sa raunde i duhen për vendin e parë.'}
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
            {parashikimi && (
              <>
                <th scope="col" className="numri">
                  Mund të dalë
                </th>
                <th scope="col" className="numri">
                  Deri te i pari
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rreshtat.map((rreshti) => {
            const p = sipasEmrit.get(rreshti.player);

            return (
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
                {parashikimi && (
                  <>
                    <td
                      className={p?.mundTeFitoje ? 'numri pike--mbyllje' : 'numri'}
                    >
                      {!p
                        ? '—'
                        : p.meIMiri === p.meIKeqi
                          ? p.meIMiri
                          : `${p.meIMiri}–${p.meIKeqi}`}
                    </td>
                    <td className="numri qeliza-raundi">
                      {!p || p.raundetPerVendinEPare === null
                        ? '—'
                        : p.raundetPerVendinEPare === 0
                          ? '·'
                          : p.raundetPerVendinEPare}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RenditjaBrenda({ rreshtat, luajtur, drejtimi = 'poshte' }: HyrjetERenditjes) {
  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="renditja" />
        Renditja
      </h2>

      {luajtur && <NjoftimiIRaundeve />}

      <TabelaERenditjes
        rreshtat={rreshtat}
        luajtur={luajtur}
        drejtimi={drejtimi}
      />
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
