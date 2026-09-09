/**
 * Grafiku i totaleve kumulative — një vijë për lojtar, raundi në bosht.
 *
 * SVG i shkruar me dorë e jo bibliotekë grafikësh. Kujdestaria e vizaton
 * shiritin e natës njësoj, dhe arsyeja është e njëjta: një grafik vijash me
 * bosht dhe legjendë është nën dyqind rreshta, kurse Chart.js-i do të shtonte
 * mbi njëqind kilobajt në një aplikacion që hapet rreth tavolinës. Ngjyrat
 * vijnë nga tokenat, jo nga atribute `style`, prandaj tema e errët i ndërron
 * vetë.
 *
 * Vijat nisin nga raundi 0 me total 0: pa atë pikë të përbashkët, raundi i parë
 * do të dukej si nisje nga lartësi të ndryshme.
 */

import type { HapiKumulativ } from '../llogaritjet.ts';
import { Ikona } from '../ikonat.tsx';

/** Kufijtë e vizatimit brenda `viewBox`-it. */
const GJERESIA = 360;
const LARTESIA = 190;
const MAJTAS = 34;
const DJATHTAS = 8;
const LART = 10;
const POSHTE = 22;

/** Sa seri ka paleta te `style.css`. Lojtari i nëntë e nis nga e para. */
const NGJYRA = 8;

export function Grafiku({
  players,
  rrjedha,
}: {
  players: string[];
  rrjedha: HapiKumulativ[];
}) {
  if (rrjedha.length === 0) return null;

  const hapat = [{ roundNumber: 0, totals: zero(players) }, ...rrjedha];
  const vlerat = hapat.flatMap((h) => players.map((p) => h.totals[p] ?? 0));

  // Boshti gjithmonë e përfshin zeron: pa të, një lojë ku të gjithë janë në
  // minus do të dukej sikur nisi nga një bazë tjetër.
  const maxi = Math.max(0, ...vlerat);
  const mini = Math.min(0, ...vlerat);
  const hapesira = (maxi - mini) * 0.08 || 10;
  const larte = maxi + hapesira;
  const poshte = mini - hapesira;

  const x = (i: number) =>
    MAJTAS +
    (hapat.length === 1
      ? 0
      : (i / (hapat.length - 1)) * (GJERESIA - MAJTAS - DJATHTAS));

  const y = (v: number) =>
    LART + ((larte - v) / (larte - poshte)) * (LARTESIA - LART - POSHTE);

  const shkalla = shkallaEBoshtit(poshte, larte);

  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="grafiku" />
        Rrjedha e totaleve
      </h2>

      <div className="kartela">
        <svg
          className="grafiku"
          viewBox={`0 0 ${GJERESIA} ${LARTESIA}`}
          role="img"
          aria-label={pershkrimi(players, rrjedha)}
        >
          {shkalla.map((v) => (
            <g key={v}>
              <line
                className={v === 0 ? 'grafiku__zeroja' : 'grafiku__rrjeti'}
                x1={MAJTAS}
                y1={y(v)}
                x2={GJERESIA - DJATHTAS}
                y2={y(v)}
              />
              <text
                className="grafiku__teksti grafiku__boshti"
                x={MAJTAS - 6}
                y={y(v) + 3.5}
              >
                {v}
              </text>
            </g>
          ))}

          {hapat.map((hapi, i) =>
            // Numri i raundit shënohet sa herë ka vend; me shumë raunde
            // shënohen vetëm disa, që të mos mbivendosen.
            i > 0 && (i === hapat.length - 1 || i % hapiIEtiketave(hapat.length) === 0) ? (
              <text
                key={hapi.roundNumber}
                className="grafiku__teksti"
                x={x(i)}
                y={LARTESIA - 6}
                textAnchor="middle"
              >
                {hapi.roundNumber}
              </text>
            ) : null,
          )}

          {players.map((player, nr) => (
            <g key={player} className={`seria-${(nr % NGJYRA) + 1}`}>
              <path
                className="grafiku__vija"
                d={hapat
                  .map((hapi, i) => `${i === 0 ? 'M' : 'L'}${x(i)} ${y(hapi.totals[player] ?? 0)}`)
                  .join(' ')}
              />
              <circle
                className="grafiku__pika"
                cx={x(hapat.length - 1)}
                cy={y(hapat.at(-1)!.totals[player] ?? 0)}
                r="3.2"
              />
            </g>
          ))}
        </svg>

        <ul className="grafiku__legjenda">
          {players.map((player, nr) => (
            <li key={player} className={`seria-${(nr % NGJYRA) + 1}`}>
              <span className="grafiku__shenja" />
              {player}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function zero(players: string[]): Record<string, number> {
  return Object.fromEntries(players.map((p) => [p, 0]));
}

/** Sa raunde kalohen mes dy etiketave të boshtit horizontal. */
function hapiIEtiketave(sa: number): number {
  return Math.max(1, Math.ceil((sa - 1) / 8));
}

/**
 * Katër ose pesë vlera të rrumbullakosura për boshtin vertikal.
 *
 * Zeroja futet gjithmonë: është vija ku ndahet fitimi nga humbja e raundit.
 */
function shkallaEBoshtit(poshte: number, larte: number): number[] {
  const gjatesia = larte - poshte;
  const perafert = gjatesia / 4;
  const madhesia = Math.pow(10, Math.floor(Math.log10(Math.max(1, perafert))));
  const hapi = Math.max(1, Math.ceil(perafert / madhesia) * madhesia);

  const vlerat: number[] = [];
  for (let v = Math.ceil(poshte / hapi) * hapi; v <= larte; v += hapi) {
    vlerat.push(Math.round(v));
  }
  if (!vlerat.includes(0) && poshte <= 0 && larte >= 0) vlerat.push(0);

  return vlerat.sort((a, b) => a - b);
}

/** Përshkrimi për lexuesin e ekranit — grafiku vetë s'i thotë dot këto. */
function pershkrimi(players: string[], rrjedha: HapiKumulativ[]): string {
  const fundi = rrjedha.at(-1);
  if (!fundi) return 'Grafik i zbrazët.';

  const totalet = players
    .map((p) => `${p} ${fundi.totals[p] ?? 0}`)
    .join(', ');

  return `Totalet raund pas raundi, deri te raundi ${fundi.roundNumber}. Në fund: ${totalet}.`;
}
