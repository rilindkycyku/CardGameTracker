/**
 * Kodi QR si SVG.
 *
 * Një `<rect>` për modul do të ishin mijëra elemente; kjo bashkon modulet e
 * njëpasnjëshme të një rreshti në një drejtkëndësh të vetëm, prandaj dalin
 * dhjetëra e jo mijëra. Ngjyrat vijnë nga tokenat, që kodi të dalë i lexueshëm
 * edhe në temën e errët — ku sfondi duhet të mbetet i bardhë, sepse skanuesi
 * pret të errët mbi të çelët.
 */

import { kodiQR } from '../qr.ts';

/** Zona e qetë: katër module bosh anash, si e kërkon standardi. */
const ZONA = 4;

export function KodiQR({
  teksti,
  pershkrimi,
  klasa = 'qr',
}: {
  teksti: string;
  pershkrimi: string;
  /** `qr--madh` për ftesën: modulet e saj janë më të vogla dhe duhen skanuar. */
  klasa?: string;
}) {
  const pikat = kodiQR(teksti);

  if (!pikat) {
    return (
      <p className="njoftim njoftim--gabim">
        <span>Rezultati është shumë i gjatë për një kod QR.</span>
      </p>
    );
  }

  const n = pikat.length;
  const gjithsej = n + ZONA * 2;
  const rruget: string[] = [];

  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!pikat[r]![c]) {
        c++;
        continue;
      }
      let gjatesia = 1;
      while (c + gjatesia < n && pikat[r]![c + gjatesia]) gjatesia++;
      rruget.push(`M${c + ZONA} ${r + ZONA}h${gjatesia}v1h-${gjatesia}z`);
      c += gjatesia;
    }
  }

  return (
    <svg
      className={klasa}
      viewBox={`0 0 ${gjithsej} ${gjithsej}`}
      role="img"
      aria-label={pershkrimi}
      shapeRendering="crispEdges"
    >
      <rect className="qr__sfondi" width={gjithsej} height={gjithsej} />
      <path className="qr__pikat" d={rruget.join('')} />
    </svg>
  );
}
