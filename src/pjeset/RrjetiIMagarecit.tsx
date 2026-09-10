/**
 * Rrjeti i magarecit — shkronjat poshtë, lojtarët përsipër.
 *
 * Kjo është fleta e vjetër ashtu si ishte: M-A-G-A-R-E-C në kolonën e parë, një
 * kolonë për lojtar, dhe shkronja shfaqet te qeliza sapo dikush e merr. Kush e
 * ka parë atë fletë e lexon këtë pa shpjegim, dhe kush s'e ka parë e sheh me një
 * shikim se sa i ka mbetur secilit.
 *
 * Rrjeti del nga vetë numrat e jo nga raundet, prandaj i njëjti komponent
 * vizatohet edhe te pamja vetëm-lexim — atje ku kalojnë vetëm totalet.
 *
 * Ngjyra e ndan afrimin nga fundi: shkronjat e marra rrinë me ngjyrën e
 * paralajmërimit, dhe e shtata — ajo që e mbyll fjalën — me atë të humbjes.
 */

import { memo } from 'react';

import { FJALA, SHKRONJAT, rreshtatEMagarecit } from '../magareci.ts';
import { Ikona } from '../ikonat.tsx';

function RrjetiIMagarecitBrenda({
  players,
  shkronjat,
}: {
  players: string[];
  /** Sa shkronja ka secili. */
  shkronjat: Record<string, number>;
}) {
  const rreshtat = rreshtatEMagarecit(players, shkronjat);

  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="shlyerja" />
        {FJALA}
      </h2>

      <div className="tabela-mbeshtjellese">
        <table
          className="tabela tabela--raundet tabela--magarec"
          data-shume={players.length >= 5 || undefined}
        >
          <caption className="vetem-lexues">
            Shkronjat e secilit lojtar. Kush e mbush fjalën {FJALA} e humb
            mbrëmjen.
          </caption>
          <thead>
            <tr>
              <th scope="col">Shkronja</th>
              {rreshtat.map((rreshti) => (
                <th
                  key={rreshti.player}
                  scope="col"
                  className={rreshti.magarec ? 'numri kolona--magarec' : 'numri'}
                >
                  {rreshti.player}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHKRONJAT.map((shkronja, i) => (
              <tr key={`${shkronja}${i}`}>
                <th scope="row" className="qeliza-raundi">
                  {shkronja}
                </th>
                {rreshtat.map((rreshti) => {
                  const marre = rreshti.shkronja > i;
                  const fundi = marre && i === SHKRONJAT.length - 1;

                  return (
                    <td
                      key={rreshti.player}
                      className={
                        fundi
                          ? 'numri shkronja--fundi'
                          : marre
                            ? 'numri shkronja--marre'
                            : 'numri qeliza-bosh'
                      }
                    >
                      {marre ? shkronja : '·'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="rresht--totali">
              <th scope="row">Gjithsej</th>
              {rreshtat.map((rreshti) => (
                <td
                  key={rreshti.player}
                  className={rreshti.magarec ? 'numri shkronja--fundi' : 'numri'}
                >
                  {rreshti.shkronja}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

/**
 * Njoftimi që e mbyll mbrëmjen.
 *
 * Rri i kuq sepse nuk është fitore: kush e mbushi fjalën e humbi lojën, dhe kjo
 * është e kundërta e asaj që pret syri te një ekran ku vendi i parë ngjyroset
 * smerald. E njëjta shenjë del edhe te pamja vetëm-lexim, prandaj vizatohet nga
 * një vend i vetëm.
 */
export function ShenjaEMagarecit({ magareci }: { magareci: string | null }) {
  if (!magareci) return null;

  return (
    <p className="njoftim njoftim--gabim">
      <Ikona emri="kujdes" />
      <span>
        <strong>{magareci}</strong> e mbushi fjalën {FJALA} — loja mbaroi.
      </span>
    </p>
  );
}

/**
 * Rrjeti varet vetëm nga numrat e vet, prandaj rri pas `memo`.
 *
 * Kjo punon vetëm sepse `Loja` i mban vlerat e derivuara te `useMemo`: pa
 * identitet të qëndrueshëm, krahasimi i hyrjeve do të dështonte çdo herë dhe
 * mbështjellja nuk do të kursente kurrgjë.
 */
export const RrjetiIMagarecit = memo(RrjetiIMagarecitBrenda);
