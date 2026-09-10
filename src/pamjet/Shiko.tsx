/**
 * Pamja vetëm-lexim — ajo që hap kush skanon kodin QR.
 *
 * Nuk lexon nga baza dhe nuk shkruan asgjë: gjithçka që tregon vjen nga adresa.
 * Prandaj hapet edhe në një telefon që nuk e ka pasur fare aplikacionin, dhe
 * nuk i prek lojërat e vetë atij telefoni.
 *
 * Renditja dhe shlyerja llogaritjen e kanë të njëjtën me atë të lojës —
 * `renditja` dhe `matricaEShlyerjes`, pa kopje të dytë — sepse matrica është
 * `total[i] − total[j]` dhe totalet i mban paketa.
 */

import {
  dataShqip,
  matricaEShlyerjes,
  renditja,
} from '../llogaritjet.ts';
import { shpaketo } from '../ndarja.ts';
import { Ikona, ShenjaEFaqes } from '../ikonat.tsx';
import { Renditja } from '../pjeset/Renditja.tsx';
import { Shlyerja } from '../pjeset/Shlyerja.tsx';

export function Shiko({ kodi }: { kodi: string }) {
  const pamja = shpaketo(kodi);

  if (!pamja) {
    return (
      <div className="faqja">
        <header className="kreu">
          <ShenjaEFaqes />
          <div>
            <p className="kreu__mbi">Bridzh</p>
            <h1 className="kreu__titull">Lidhja nuk lexohet</h1>
          </div>
        </header>

        <div className="zbrazet">
          <p className="zbrazet__titull">Kjo lidhje është e paplotë</p>
          <p>
            Ndoshta u pre gjatë kopjimit, ose vjen nga një version tjetër i
            aplikacionit. Kërkoji atij që e ndau ta shfaqë kodin sërish.
          </p>
          <a className="buton" href="#/">
            <Ikona emri="kthehu" />
            Hap aplikacionin
          </a>
        </div>
      </div>
    );
  }

  const emrat = pamja.totalet.map(([emri]) => emri);
  const totalat = Object.fromEntries(pamja.totalet);
  const rreshtat = renditja(emrat, totalat);
  const matrica = matricaEShlyerjes(emrat, totalat);

  return (
    <div className="faqja">
      <header className="kreu">
        <ShenjaEFaqes />
        <div>
          <p className="kreu__mbi">{pamja.grupi}</p>
          <h1 className="kreu__titull">{dataShqip(pamja.data)}</h1>
          <p className="kreu__meta">
            <span className="etiketa">
              <Ikona emri="sy" />
              Vetëm-lexim
            </span>
            <span className="etiketa">
              <Ikona emri="shlyerja" />
              {pamja.raunde} {pamja.raunde === 1 ? 'raund' : 'raunde'}
            </span>
          </p>
        </div>
      </header>

      <p className="njoftim njoftim--kujdes">
        <Ikona emri="info" />
        <span>
          Kjo është fotografia e çastit kur u ndau, pas{' '}
          {pamja.raunde} {pamja.raunde === 1 ? 'raundi' : 'raundeve'}. Nuk
          përditësohet vetë — për raundet e mëpasme skano kodin sërish.
        </span>
      </p>

      <Renditja rreshtat={rreshtat} />

      <Shlyerja
        players={rreshtat.map((rreshti) => rreshti.player)}
        matrica={matrica}
      />

      <footer className="fundfaqja">
        <p>
          <a href="#/">Hap aplikacionin për të mbajtur pikët vetë</a>
        </p>
      </footer>
    </div>
  );
}
