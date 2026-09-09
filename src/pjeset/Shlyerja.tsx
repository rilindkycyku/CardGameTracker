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
 */

import { Ikona } from '../ikonat.tsx';

export function Shlyerja({
  players,
  matrica,
}: {
  players: string[];
  matrica: Record<string, Record<string, number>>;
}) {
  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="shlyerja" />
        Shlyerja
      </h2>

      <div className="tabela-mbeshtjellese">
        <table className="tabela matrica">
          <caption className="vetem-lexues">
            Diferenca e totaleve: qeliza tregon sa pikë ka lojtari i rreshtit më
            shumë ose më pak se lojtari i shtyllës.
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
            {players.map((i) => (
              <tr key={i}>
                <th scope="row">{i}</th>
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
    </section>
  );
}
