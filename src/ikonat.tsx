/**
 * Ikonat si SVG inline, si te Kujdestaria.
 *
 * Emoji-t vizatohen nga fonti i sistemit: dalin me ngjyra e madhësi të
 * ndryshme në Android, iOS e Windows dhe nuk e marrin ngjyrën e tekstit
 * përreth. SVG-ja inline e merr, hyn brenda paketës dhe punon pa internet.
 */

import type { JSX } from 'react';

const KORNIZA = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false',
} as const;

const SHTIGJET: Record<string, JSX.Element> = {
  shto: (
    <>
      <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="4.4" />
      <path d="M12 8.4v7.2M8.4 12h7.2" />
    </>
  ),
  grupi: (
    <>
      <circle cx="9" cy="8.4" r="3.4" />
      <path d="M3.2 19.4a5.9 5.9 0 0 1 11.6 0" />
      <path d="M16.2 5.4a3.4 3.4 0 0 1 0 6M17.6 14.2a5.9 5.9 0 0 1 3.2 5.2" />
    </>
  ),
  luaj: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M10.2 8.6 15.6 12l-5.4 3.4Z" />
    </>
  ),
  kthehu: <path d="M14.5 6.5 9 12l5.5 5.5" />,
  fshi: (
    <>
      <path d="M4.6 6.6h14.8M9.4 6.6V4.8h5.2v1.8" />
      <path d="M6.4 6.6 7.3 19a1.6 1.6 0 0 0 1.6 1.5h6.2a1.6 1.6 0 0 0 1.6-1.5l.9-12.4" />
      <path d="M10.4 10.2v6.2M13.6 10.2v6.2" />
    </>
  ),
  redakto: (
    <>
      <path d="M4.6 19.4h3.2L18.4 8.8a2.26 2.26 0 0 0-3.2-3.2L4.6 16.2Z" />
      <path d="M13.8 7l3.2 3.2" />
    </>
  ),
  ruaj: <path d="M5.5 12.5 10 17l8.5-9" />,
  anulo: <path d="M6.6 6.6l10.8 10.8M17.4 6.6 6.6 17.4" />,
  kalendari: (
    <>
      <rect x="3.6" y="5.4" width="16.8" height="15" rx="2.6" />
      <path d="M3.6 10h16.8M8.4 3.6v3.4M15.6 3.6v3.4" />
    </>
  ),
  renditja: (
    <>
      <path d="M7.6 4.4h8.8v4.2a4.4 4.4 0 1 1-8.8 0Z" />
      <path d="M7.6 5.8H5a2.2 2.2 0 0 0 2.6 3.6M16.4 5.8H19a2.2 2.2 0 0 1-2.6 3.6" />
      <path d="M12 13v3.4M8.6 19.6h6.8" />
    </>
  ),
  shlyerja: (
    <>
      <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="3" />
      <path d="M3.6 9.2h16.8M9.2 3.6v16.8" />
    </>
  ),
  shkarko: (
    <>
      <path d="M12 4v11m0 0 3.8-3.8M12 15l-3.8-3.8" />
      <path d="M4.8 17v1.4a1.8 1.8 0 0 0 1.8 1.8h10.8a1.8 1.8 0 0 0 1.8-1.8V17" />
    </>
  ),
  ngarko: (
    <>
      <path d="M12 15.6V4.6m0 0L8.2 8.4M12 4.6l3.8 3.8" />
      <path d="M4.8 17v1.4a1.8 1.8 0 0 0 1.8 1.8h10.8a1.8 1.8 0 0 0 1.8-1.8V17" />
    </>
  ),
  shigjeta: <path d="M6.5 9.75 12 15.25l5.5-5.5" />,
  ndaj: (
    <>
      <path d="M12 15.5V4m0 0 3.6 3.6M12 4 8.4 7.6" />
      <path d="M5 13.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4.5" />
    </>
  ),
  sy: (
    <>
      <path d="M2.4 12S6.2 5.6 12 5.6 21.6 12 21.6 12 17.8 18.4 12 18.4 2.4 12 2.4 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 11v5.2M12 7.9h.01" />
    </>
  ),
  kujdes: (
    <>
      <path d="M10.3 4.3 2.9 17.1a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.4v4.2M12 17.1h.01" />
    </>
  ),
  llogaritesi: (
    <>
      <rect x="4.6" y="3.2" width="14.8" height="17.6" rx="2.6" />
      <path d="M8 7.4h8" />
      <path d="M8.6 12h.01M12 12h.01M15.4 12h.01M8.6 16h.01M12 16h.01M15.4 16h.01" />
    </>
  ),
};

/** `<Ikona emri="shto" />` — merr ngjyrën e tekstit ku vendoset. */
export function Ikona({
  emri,
  klasa = 'ikona',
}: {
  emri: keyof typeof SHTIGJET | string;
  klasa?: string;
}) {
  const shtegu = SHTIGJET[emri];
  if (!shtegu) return null;

  return (
    <svg className={klasa} {...KORNIZA}>
      {shtegu}
    </svg>
  );
}

/**
 * Shenja e aplikacionit: dy letra të mbivendosura, me kalimin smerald→cian të
 * Kujdestarisë. Kalimi rri si `<linearGradient>` e jo si `background-image`,
 * që të ndjekë qoshet e rrumbullakuara pa u prerë.
 */
export function ShenjaEFaqes() {
  return (
    <svg className="marka" viewBox="0 0 44 44" role="img" aria-label="Bridzh">
      <defs>
        <linearGradient id="marka-fusha" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" className="marka__nga" />
          <stop offset="100%" className="marka__deri" />
        </linearGradient>
      </defs>
      <rect className="marka__fusha" width="44" height="44" rx="12" />
      <g className="marka__letrat">
        <rect x="10.5" y="12" width="12.5" height="18" rx="2.6" transform="rotate(-12 16.75 21)" />
        <rect x="21" y="14" width="12.5" height="18" rx="2.6" transform="rotate(9 27.25 23)" />
      </g>
    </svg>
  );
}

/** Zemra e fundfaqjes — e mbushur, dhe me `aria-label` që të lexohet si duhet. */
export function Zemra() {
  return (
    <svg className="zemra" viewBox="0 0 24 24" role="img" aria-label="dashuri">
      <path d="M12 20.7l-1.6-1.45C5.6 14.9 2.7 12.25 2.7 8.95 2.7 6.25 4.85 4.1 7.55 4.1c1.55 0 3.03.72 3.99 1.86l.46.55.46-.55A5.15 5.15 0 0 1 16.45 4.1c2.7 0 4.85 2.15 4.85 4.85 0 3.3-2.9 5.95-7.7 10.3L12 20.7Z" />
    </svg>
  );
}
