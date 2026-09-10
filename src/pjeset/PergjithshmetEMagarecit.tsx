/**
 * Tabela e grupit për magarecin — të gjitha mbrëmjet e tij në një vend.
 *
 * Rri veç tabelës së bridzhit sepse numrat nuk janë të njëjtë lloji: aty
 * mblidhen pikë me qindra, këtu shkronja nga zero në shtatë. Një kolonë e vetme
 * mbi të dyja do të ishte numër pa kuptim.
 *
 * Radha është sipas herëve që dikush ka dalë magarec, nga më pak te më shumë —
 * dhe kur janë të barabarta, sipas shkronjave për lojë. Të dyja lexohen njësoj:
 * më pak, më mirë.
 */

import { memo } from 'react';

import { FJALA, type RreshtiPergjithshemMagarec } from '../magareci.ts';
import { Ikona } from '../ikonat.tsx';

function PergjithshmetEMagarecitBrenda({
  rreshtat,
  lojera,
}: {
  rreshtat: RreshtiPergjithshemMagarec[];
  /** Sa mbrëmje magareci të luajtura ka grupi — për titullin. */
  lojera: number;
}) {
  if (rreshtat.length === 0) return null;

  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="renditja" />
        {FJALA}
        <span className="titull-seksioni__numri">
          {lojera} {lojera === 1 ? 'lojë' : 'lojëra'}
        </span>
      </h2>

      <div className="tabela-mbeshtjellese">
        <table className="tabela">
          <caption className="vetem-lexues">
            Përmbledhja e magarecave të grupit: mbrëmje të luajtura, herë magarec
            dhe shkronja mesatare për lojë.
          </caption>
          <thead>
            <tr>
              <th scope="col">Vendi</th>
              <th scope="col">Lojtari</th>
              <th scope="col" className="numri">
                Lojëra
              </th>
              <th scope="col" className="numri">
                Magarec
              </th>
              <th scope="col" className="numri">
                Shkronja
              </th>
            </tr>
          </thead>
          <tbody>
            {rreshtat.map((rreshti, vendi) => (
              <tr
                key={rreshti.player}
                className={vendi === 0 ? 'rresht--pare' : undefined}
              >
                <td className="qeliza-vendi">{vendi + 1}</td>
                <td className="qeliza-emri">
                  {rreshti.player}
                  {vendi === 0 && (
                    <>
                      <Ikona emri="renditja" klasa="ikona kurora" />
                      <span className="vetem-lexues">i pari i grupit</span>
                    </>
                  )}
                </td>
                <td className="numri qeliza-raundi">{rreshti.lojera}</td>
                <td
                  className={
                    rreshti.magarec > 0 ? 'numri shkronja--fundi' : 'numri'
                  }
                >
                  {rreshti.magarec}
                </td>
                <td className="numri">{Math.round(rreshti.mesatarja * 10) / 10}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Varet vetëm nga rreshtat e vet, prandaj rri pas `memo` — si e bridzhit. */
export const PergjithshmetEMagarecit = memo(PergjithshmetEMagarecitBrenda);
