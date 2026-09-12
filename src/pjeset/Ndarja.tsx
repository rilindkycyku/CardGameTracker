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

import { useMemo, useState } from 'react';

import { adresaEKodit, paketo, tekstiINdarjes, type Pamja } from '../ndarja.ts';
import { kopjoTekstin, ndajMeSistemin } from '../sistemi.ts';
import type { RreshtiRenditjes } from '../tipet.ts';
import { Ikona } from '../ikonat.tsx';
import { Drejtperdrejt } from './Drejtperdrejt.tsx';
import { KodiQR } from './KodiQR.tsx';

/** Ku ka arritur butoni i ndarjes — dhe çka ka për të thënë ekrani pas tij. */
type Gjendja = 'gati' | 'kopjuar' | 'me-dore';

export function Ndarja({
  pamja,
  rreshtat,
}: {
  pamja: Pamja;
  rreshtat: RreshtiRenditjes[];
}) {
  const [gjendja, caktoGjendjen] = useState<Gjendja>('gati');
  /*
   * A është hapur fotografia.
   *
   * `<details>` vetëm i fsheh fëmijët — trupi rri i montuar edhe i mbyllur, dhe
   * pa këtë çelës kodi QR do të vizatohej te çdo vizatim i ekranit të lojës. Nuk
   * është hollësi: një kod rreth 210 karakteresh kushton afër 8 ms, pra rreth
   * një të tretën e tërë ruajtjes së një raundi (26 ms) — e shpenzuar për një
   * fotografi që askush nuk e ka hapur. Njësoj si lidhja, edhe ky nis me
   * kërkesë.
   */
  const [hapur, caktoHapjen] = useState(false);

  const paketa = useMemo(() => paketo(pamja), [pamja]);
  const adresa = adresaEKodit(window.location.href, paketa);

  async function ndaj() {
    const teksti = tekstiINdarjes(pamja, rreshtat);
    const ndarja = await ndajMeSistemin({
      title: pamja.grupi,
      text: teksti,
      url: adresa,
    });

    // Kush e mbylli fletën e sistemit nuk kërkoi rrugë të dytë.
    if (ndarja === 'u-nda' || ndarja === 'anulua') {
      caktoGjendjen('gati');
      return;
    }

    if (await kopjoTekstin(adresa)) {
      caktoGjendjen('kopjuar');
      window.setTimeout(() => caktoGjendjen('gati'), 2500);
      return;
    }

    caktoGjendjen('me-dore');
  }

  return (
    <details className="detaje">
      <summary className="detaje__krye">
        <span>Pikët drejtpërdrejt</span>
        <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
      </summary>

      <div className="detaje__trupi">
        <Drejtperdrejt paketa={paketa} />

        <details
          className="detaje detaje--brenda"
          onToggle={(e) => caktoHapjen(e.currentTarget.open)}
        >
          <summary className="detaje__krye">
            <span>Ose dërgo një fotografi të çastit</span>
            <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
          </summary>

          <div className="detaje__trupi">
            <div className="ndarja">
              {/*
                Kodi vizatohet vetëm pasi hapet paneli — dhe kur hapet, del i
                madh: ky skanohet nga kamera e një telefoni tjetër mbi ekranin e
                këtij, pra i njëjti rast i vështirë si ftesa e lidhjes.
              */}
              {hapur && (
                <div className="ndarja__kodi">
                  <KodiQR
                    teksti={adresa}
                    klasa="qr qr--madh"
                    pershkrimi={`Kod QR që hap rezultatin e ${pamja.grupi}, ${pamja.raunde} raunde`}
                  />
                </div>
              )}

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
                    {gjendja === 'kopjuar' ? 'U kopjua' : 'Ndaj lidhjen'}
                  </button>
                </div>

                {/*
                  Kur as fleta e sistemit as tabela e fragmenteve nuk pranojnë,
                  lidhja del në ekran e zgjedhur vetë: pa këtë, butoni shtypej
                  dhe nuk ndodhte kurrgjë — dhe askush nuk e merr me mend se
                  faji ishte i shfletuesit.
                */}
                {gjendja === 'me-dore' && (
                  <>
                    <p className="njoftim njoftim--kujdes">
                      <Ikona emri="kujdes" />
                      <span>
                        Shfletuesi nuk e lejoi kopjimin. Lidhja rri këtu poshtë —
                        prek e mbaje shtypur për ta kopjuar, ose lëre kodin sipër
                        të skanohet.
                      </span>
                    </p>

                    <div className="fusha">
                      <span className="fusha__etiketa">Lidhja</span>
                      <input
                        type="text"
                        readOnly
                        value={adresa}
                        aria-label="Lidhja e rezultatit"
                        onFocus={(e) => e.currentTarget.select()}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </details>
      </div>
    </details>
  );
}
