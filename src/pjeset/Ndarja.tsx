/**
 * Ndarja e rezultatit — kodi QR dhe lidhja.
 *
 * Kush rri rreth tavolinës i skanon një herë dhe i shikon pikët në telefonin e
 * vet. Kjo është fotografi e çastit, jo lidhje e drejtpërdrejtë: dy telefona në
 * të njëjtin wifi nuk kapen dot nga shfletuesi pa një server sinjalizimi, dhe
 * ky aplikacion nuk ka server. Prandaj teksti nën kod e thotë hapur se sa
 * raunde mban — që askush të mos shikojë numra të vjetër duke besuar se janë të
 * çastit.
 */

import { useState } from 'react';

import { adresaEPamjes, tekstiINdarjes, type Pamja } from '../ndarja.ts';
import type { RreshtiRenditjes } from '../tipet.ts';
import { Ikona } from '../ikonat.tsx';
import { KodiQR } from './KodiQR.tsx';

export function Ndarja({
  pamja,
  rreshtat,
}: {
  pamja: Pamja;
  rreshtat: RreshtiRenditjes[];
}) {
  const [kopjuar, caktoKopjuar] = useState(false);
  const adresa = adresaEPamjes(window.location.href, pamja);

  async function ndaj() {
    const teksti = tekstiINdarjes(pamja, rreshtat);

    if (navigator.share) {
      try {
        await navigator.share({ title: pamja.grupi, text: teksti, url: adresa });
        return;
      } catch {
        // Ndarja e anuluar nuk është gabim; bie te kopjimi.
      }
    }

    try {
      await navigator.clipboard.writeText(adresa);
      caktoKopjuar(true);
      window.setTimeout(() => caktoKopjuar(false), 2500);
    } catch {
      caktoKopjuar(false);
    }
  }

  return (
    <details className="detaje">
      <summary className="detaje__krye">
        <span>Shpërnda rezultatin</span>
        <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
      </summary>

      <div className="detaje__trupi">
        <div className="ndarja">
          <KodiQR
            teksti={adresa}
            pershkrimi={`Kod QR që hap rezultatin e ${pamja.grupi}, ${pamja.raunde} raunde`}
          />

          <div className="ndarja__krye">
            <p className="ndihma">
              Skanoje me telefonin tjetër dhe rezultati hapet vetëm-lexim. Mban{' '}
              <strong>
                {pamja.raunde} {pamja.raunde === 1 ? 'raund' : 'raunde'}
              </strong>{' '}
              — pas raundeve të reja shfaqe sërish.
            </p>

            <div className="veprimet">
              <button type="button" className="buton" onClick={ndaj}>
                <Ikona emri="ndaj" />
                {kopjuar ? 'U kopjua' : 'Ndaj lidhjen'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}
