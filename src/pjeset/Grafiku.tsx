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
 * Secila vijë mbulon vetëm raundet që lojtari i luajti vërtet (shih
 * `seriteEGrafikut`). Boshti horizontal është i përbashkët: raundet ndahen në
 * vende të barabarta dhe vija fillon te vendi i vet, jo te skaji i majtë.
 */

import type { Seria } from '../llogaritjet.ts';
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

export function Grafiku({ serite }: { serite: Seria[] }) {
  const vizatohen = serite.filter((s) => s.pikat.length > 1);
  if (vizatohen.length === 0) return null;

  // Boshti horizontal: çdo raund që shfaqet te ndonjë seri, plus nisja.
  const raundet = [
    ...new Set(vizatohen.flatMap((s) => s.pikat.map((p) => p.roundNumber))),
  ].sort((a, b) => a - b);

  const vlerat = vizatohen.flatMap((s) => s.pikat.map((p) => p.total));

  // Boshti gjithmonë e përfshin zeron: pa të, një lojë ku të gjithë janë në
  // minus do të dukej sikur nisi nga një bazë tjetër.
  const maxi = Math.max(0, ...vlerat);
  const mini = Math.min(0, ...vlerat);
  const hapesira = (maxi - mini) * 0.08 || 10;
  const larte = maxi + hapesira;
  const poshte = mini - hapesira;

  const x = (roundNumber: number) => {
    const i = raundet.indexOf(roundNumber);
    return (
      MAJTAS +
      (raundet.length <= 1
        ? 0
        : (i / (raundet.length - 1)) * (GJERESIA - MAJTAS - DJATHTAS))
    );
  };

  const y = (v: number) =>
    LART + ((larte - v) / (larte - poshte)) * (LARTESIA - LART - POSHTE);

  const shkalla = shkallaEBoshtit(poshte, larte);
  const hapiIEtiketave = Math.max(1, Math.ceil((raundet.length - 1) / 8));

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
          aria-label={pershkrimi(vizatohen)}
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

          {raundet.map((raundi, i) =>
            // Numri i raundit shënohet sa herë ka vend; me shumë raunde
            // shënohen vetëm disa, që të mos mbivendosen.
            raundi > 0 && (i === raundet.length - 1 || i % hapiIEtiketave === 0) ? (
              <text
                key={raundi}
                className="grafiku__teksti"
                x={x(raundi)}
                y={LARTESIA - 6}
                textAnchor="middle"
              >
                {raundi}
              </text>
            ) : null,
          )}

          {vizatohen.map((seria) => (
            <g key={seria.player} className={`seria-${(seria.ngjyra % NGJYRA) + 1}`}>
              <path
                className="grafiku__vija"
                d={seria.pikat
                  .map(
                    (pika, i) =>
                      `${i === 0 ? 'M' : 'L'}${x(pika.roundNumber)} ${y(pika.total)}`,
                  )
                  .join(' ')}
              />
              <circle
                className="grafiku__pika"
                cx={x(seria.pikat.at(-1)!.roundNumber)}
                cy={y(seria.pikat.at(-1)!.total)}
                r="3.2"
              />
            </g>
          ))}
        </svg>

        <ul className="grafiku__legjenda">
          {vizatohen.map((seria) => (
            <li key={seria.player} className={`seria-${(seria.ngjyra % NGJYRA) + 1}`}>
              <span className="grafiku__shenja" />
              {seria.player}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
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

/** Përshkrimi për lexuesin e ekranit — grafiku vetë s’i thotë dot këto. */
function pershkrimi(serite: Seria[]): string {
  const rreshtat = serite.map((seria) => {
    const fundi = seria.pikat.at(-1)!;
    return `${seria.player} ${fundi.total} te raundi ${fundi.roundNumber}`;
  });

  return `Totalet raund pas raundi. Në fund: ${rreshtat.join(', ')}.`;
}
