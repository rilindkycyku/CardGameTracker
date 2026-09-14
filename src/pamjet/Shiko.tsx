/**
 * Pamja vetëm-lexim — ajo që hap kush skanon kodin QR të fotografisë.
 *
 * Nuk lexon nga baza dhe nuk shkruan asgjë: gjithçka që tregon vjen nga adresa.
 * Prandaj hapet edhe në një telefon që nuk e ka pasur fare aplikacionin, dhe
 * nuk i prek lojërat e vetë atij telefoni.
 *
 * Vizatimi rri te `PamjaERezultatit`, i përbashkët me pamjen e drejtpërdrejtë.
 * Ndryshimi i vetëm — dhe i vetmi që ka kuptim për atë që shikon — është sa i
 * freskët është numri: kjo është fotografi, dhe ajo e thotë.
 */

import { shpaketo } from '../ndarja.ts';
import { Ikona } from '../ikonat.tsx';
import { LidhjaEKeqe, PamjaERezultatit } from '../pjeset/PamjaERezultatit.tsx';

export function Shiko({ kodi }: { kodi: string }) {
  const pamja = shpaketo(kodi);

  if (!pamja) {
    return (
      <LidhjaEKeqe
        titulli="Kjo lidhje është e paplotë"
        shpjegimi={
          'Ndoshta u pre gjatë kopjimit, ose vjen nga një version tjetër i '
          + 'aplikacionit. Kërkoji atij që e ndau ta shfaqë kodin sërish.'
        }
      />
    );
  }

  return (
    <div className="faqja faqja--gjere">
      <PamjaERezultatit
        pamja={pamja}
        etiketa={{ emri: 'Vetëm-lexim', ikona: 'sy' }}
        njoftimi={
          <p className="njoftim njoftim--kujdes">
            <Ikona emri="info" />
            <span>
              Kjo është fotografia e çastit kur u ndau, pas{' '}
              {pamja.raunde} {pamja.raunde === 1 ? 'raundi' : 'raundeve'}. Nuk
              përditësohet vetë — për raundet e mëpasme skano kodin sërish, ose
              kërkoji atij që mban pikët lidhjen e drejtpërdrejtë.
            </span>
          </p>
        }
      />

      <footer className="fundfaqja">
        <p>
          <a href="#/">Hap aplikacionin për të mbajtur pikët vetë</a>
        </p>
      </footer>
    </div>
  );
}
