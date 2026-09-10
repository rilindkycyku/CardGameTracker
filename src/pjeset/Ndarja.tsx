/**
 * Shpërndarja e rezultatit — dy rrugë, sepse asnjëra nuk mjafton vetëm.
 *
 * E para është e drejtpërdrejtë: një kanal WebRTC mes telefonave të së njëjtës
 * rrjetë, dhe pikët dalin vetë pas çdo raundi. Kjo është ajo që duhet gjatë
 * lojës — kush shikon nuk ka pse të kërkojë kod të re çdo herë.
 *
 * E dyta është fotografia brenda adresës. Rri sepse e para ka një kufi që nuk
 * varet nga kodi: një rrjetë që i ndan klientët nga njëri-tjetri e bllokon
 * lidhjen fare, dhe atëherë fotografia është e vetmja. Punon edhe kur telefonat
 * nuk janë fare në të njëjtin wifi.
 *
 * E drejtpërdrejta rri e para sepse është ajo që kërkohet gjatë lojës; e dyta
 * rri e mbledhur.
 */

import { useState } from 'react';

import { adresaEPamjes, paketo, tekstiINdarjes, type Pamja } from '../ndarja.ts';
import type { RreshtiRenditjes } from '../tipet.ts';
import { Ikona } from '../ikonat.tsx';
import { Drejtperdrejt } from './Drejtperdrejt.tsx';
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
        <span>Pikët drejtpërdrejt</span>
        <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
      </summary>

      <div className="detaje__trupi">
        <Drejtperdrejt paketa={paketo(pamja)} />

        <details className="detaje detaje--brenda">
          <summary className="detaje__krye">
            <span>Ose dërgo një fotografi të çastit</span>
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
                  Punon edhe pa u lidhur telefonat mes vete — edhe nëpër mesazh.
                  Mban{' '}
                  <strong>
                    {pamja.raunde} {pamja.raunde === 1 ? 'raund' : 'raunde'}
                  </strong>{' '}
                  dhe nuk përditësohet vetë.
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
      </div>
    </details>
  );
}
