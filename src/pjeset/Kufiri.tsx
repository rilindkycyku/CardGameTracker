/**
 * Deri te sa pikë luhet mbrëmja — çelësi që e zgjedh.
 *
 * Te domina e pishpiriku kufiri nuk është rregull i lojës, është marrëveshje e
 * tavolinës para se të ndahen letrat: njëqind a dyqind e pesëdhjetë te domina,
 * njëqind e njëzet a diku tjetër te pishpiriku, ose fare — luajmë sa të luajmë.
 * Prandaj zgjidhet, e nuk shkruhet te kodi.
 *
 * I njëjti çelës del te dy ekrane: kur nis mbrëmja, dhe brenda saj. I dyti nuk
 * është luks — pa të, një kufi i zgjedhur gabim do ta mbyllte fletën në mes të
 * lojës, dhe rruga e vetme prapa do të ishte rihapja pas çdo raundi.
 */

import { Ikona } from '../ikonat.tsx';

/** «Pa kufi» ruhet si zero: zgjedhje e vërtetë, e jo fushë e palexuar. */
export const PA_KUFI = 0;

export function ZgjedhjaEKufirit({
  kufijte,
  vlera,
  etiketa = 'Deri te',
  onNdrysho,
}: {
  /** Kufijtë që i ofrohen kësaj loje. Bosh do të thotë se s'ka çka zgjidhet. */
  kufijte: number[];
  /** Kufiri i zgjedhur, ose `PA_KUFI`. */
  vlera: number;
  etiketa?: string;
  onNdrysho: (kufiri: number) => void;
}) {
  if (kufijte.length === 0) return null;

  return (
    <div className="fusha">
      <span className="fusha__etiketa">{etiketa}</span>
      <div className="celesi celesi--rrjet" role="group" aria-label="Kufiri i pikëve">
        {kufijte.map((kufiri) => (
          <button
            type="button"
            key={kufiri}
            className="celesi__njesi"
            aria-pressed={vlera === kufiri}
            onClick={() => onNdrysho(kufiri)}
          >
            {kufiri} pikë
          </button>
        ))}
        <button
          type="button"
          className="celesi__njesi"
          aria-pressed={vlera === PA_KUFI}
          onClick={() => onNdrysho(PA_KUFI)}
        >
          <Ikona emri="info" />
          Pa kufi
        </button>
      </div>
    </div>
  );
}
