/**
 * Matrica e shlyerjes — `matrica[i][j] = total[i] − total[j]`.
 *
 * Qeliza thotë sa pikë ka lojtari i rreshtit më shumë (+) ose më pak (−) se
 * lojtari i shtyllës. Ngjyrat janë ato të tabelës origjinale: pozitivja jeshile,
 * negativja e kuqe.
 *
 * Vlen të mbahet mend se te ky lojë fiton totali më i vogël, prandaj një numër
 * pozitiv jeshil do të thotë „ka aq pikë më shumë", jo „prin". Legjenda nën
 * tabelë e thotë këtë me fjalë, që ngjyra të mos lexohet si rezultat.
 *
 * Rreshtat dhe shtyllat vijnë sipas renditjes, jo sipas radhës së ulur në
 * tavolinë: shlyerja shihet kur mbaron loja, dhe atëherë pyetja është kush i
 * del sa kujt — e cila lexohet duke nisur nga fituesi. Vendi shkruhet krah
 * emrit te rreshti, që radha të mos duket e rastit.
 */

import { memo, useMemo, useState } from 'react';

import { borxhet } from '../llogaritjet.ts';
import { Ikona } from '../ikonat.tsx';

function ShlyerjaBrenda({
  players,
  matrica,
}: {
  /** Lojtarët sipas renditjes — vendi i parë i pari. */
  players: string[];
  matrica: Record<string, Record<string, number>>;
}) {
  /*
   * Dy pamje të së njëjtës gjë, dhe lista rri e para.
   *
   * Matrica është përgjigjja e plotë — çdo çift, në të dy drejtimet — por pyetja
   * që bëhet te tavolina është një e vetme: «unë sa i kam borxh kujt». Për të, një
   * rrjet n×n me një legjendë shenjash kërkon të lexohet; një rresht «Rila → Lila
   * 30» jo. Prandaj hapet lista, dhe tabela mbetet një prekje larg: ajo është
   * pamja e fletës origjinale, dhe kush e njeh atë e kërkon ashtu.
   */
  const [pamja, caktoPamjen] = useState<'lista' | 'tabela'>('lista');
  const lista = useMemo(() => borxhet(players, matrica), [players, matrica]);

  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="shlyerja" />
        Shlyerja
        <span className="celesi celesi--vogel titull-seksioni__celesi">
          <button
            type="button"
            className="celesi__njesi"
            aria-pressed={pamja === 'lista'}
            onClick={() => caktoPamjen('lista')}
          >
            Kush kujt
          </button>
          <button
            type="button"
            className="celesi__njesi"
            aria-pressed={pamja === 'tabela'}
            onClick={() => caktoPamjen('tabela')}
          >
            Tabela
          </button>
        </span>
      </h2>

      {pamja === 'lista' ? (
        lista.length === 0 ? (
          <p className="ndihma">
            Të gjithë dolën me të njëjtat pikë — nuk i del asgjë askujt.
          </p>
        ) : (
          <ul className="borxhet">
            {lista.map(({ paguesi, marresi, sa }) => (
              <li className="borxhi" key={`${paguesi}|${marresi}`}>
                <span className="borxhi__emrat">
                  <strong>{paguesi}</strong>
                  <Ikona emri="shigjeta" klasa="ikona borxhi__shigjeta" />
                  <strong>{marresi}</strong>
                </span>
                <span className="borxhi__sa">{sa}</span>
              </li>
            ))}
          </ul>
        )
      ) : (
      <>
      <div className="tabela-mbeshtjellese">
        <table className="tabela matrica" data-shume={players.length >= 5 || undefined}>
          <caption className="vetem-lexues">
            Diferenca e totaleve, me lojtarët sipas renditjes: qeliza tregon sa
            pikë ka lojtari i rreshtit më shumë ose më pak se lojtari i
            shtyllës.
          </caption>
          <thead>
            <tr>
              <td />
              {players.map((player) => (
                <th key={player} scope="col">
                  {player}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((i, vendi) => (
              <tr key={i}>
                <th scope="row">
                  <span className="matrica__vendi">{vendi + 1}</span>
                  {i}
                </th>
                {players.map((j) => {
                  const vlera = matrica[i]?.[j] ?? 0;
                  const vetja = i === j;

                  return (
                    <td
                      key={j}
                      className={
                        vetja
                          ? 'qeliza--vetja'
                          : vlera > 0
                            ? 'qeliza--pozitiv'
                            : vlera < 0
                              ? 'qeliza--negativ'
                              : 'qeliza--zero'
                      }
                    >
                      {vetja ? '—' : vlera > 0 ? `+${vlera}` : vlera}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="legjenda">
        <span className="legjenda__njesi">
          <span className="legjenda__ngjyra legjenda__ngjyra--pozitiv" />
          <span>+ ka aq pikë më shumë se lojtari i shtyllës</span>
        </span>
        <span className="legjenda__njesi">
          <span className="legjenda__ngjyra legjenda__ngjyra--negativ" />
          <span>− ka aq pikë më pak</span>
        </span>
      </p>
      </>
      )}
    </section>
  );
}

/**
 * Matrica është O(lojtarë²) qeliza, prandaj rri pas `memo`.
 *
 * Kjo punon vetëm sepse `Loja` i mban vlerat e derivuara te `useMemo`: pa
 * identitet të qëndrueshëm, krahasimi i hyrjeve do të dështonte çdo herë dhe
 * mbështjellja nuk do të kursente kurrgjë.
 */
export const Shlyerja = memo(ShlyerjaBrenda);
