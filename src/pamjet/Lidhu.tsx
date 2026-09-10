/**
 * Pamja e drejtpërdrejtë — ajo që hap kush skanon ftesën.
 *
 * Nuk lexon nga baza dhe nuk shkruan asgjë, si `#/shiko/`: hapet edhe në një
 * telefon që nuk e ka pasur kurrë aplikacionin. Ndryshimi është se numrat vijnë
 * nga kanali dhe përditësohen vetë sa herë shënohet një raund.
 *
 * Ekrani ka dy gjendje, dhe e para nuk guxon të hiqet: sa nuk është lidhur,
 * tregon kodin e vet që duhet skanuar prapa. Ai është hapi që nuk merret me
 * mend — skanova kodin, dhe tani pse më del një kod tjetër? — prandaj shkruhet
 * me fjalë përse duhet.
 */

import { useEffect, useRef, useState } from 'react';

import { Ikona } from '../ikonat.tsx';
import { Vizitori, type GjendjaEVizitorit } from '../lidhja.ts';
import { shpaketo } from '../ndarja.ts';
import { adresaEPergjigjes } from '../sinjalizimi.ts';
import { KodiQR } from '../pjeset/KodiQR.tsx';
import { LidhjaEKeqe, PamjaERezultatit } from '../pjeset/PamjaERezultatit.tsx';

/** Ora si `14:32`, për të thënë sa i vjetër është numri që shihet. */
function ora(kur: number): string {
  const koha = new Date(kur);
  return `${String(koha.getHours()).padStart(2, '0')}:${String(koha.getMinutes()).padStart(2, '0')}`;
}

export function Lidhu({ kodi }: { kodi: string }) {
  const vizitori = useRef<Vizitori | null>(null);
  const [gjendja, caktoGjendjen] = useState<GjendjaEVizitorit>({
    pergjigja: null,
    lidhur: false,
    paketa: null,
    kur: null,
    gabimi: null,
  });
  const [kopjuar, caktoKopjuar] = useState(false);

  useEffect(() => {
    const i_ri = new Vizitori(kodi, caktoGjendjen);
    vizitori.current = i_ri;
    void i_ri.nis();

    return () => {
      i_ri.mbyll();
      vizitori.current = null;
    };
  }, [kodi]);

  const adresa = gjendja.pergjigja
    ? adresaEPergjigjes(window.location.href, gjendja.pergjigja)
    : null;

  async function kopjo() {
    if (!adresa) return;

    try {
      await navigator.clipboard.writeText(adresa);
      caktoKopjuar(true);
      window.setTimeout(() => caktoKopjuar(false), 2500);
    } catch {
      caktoKopjuar(false);
    }
  }

  // Ftesa e prerë njihet menjëherë, para se të provohet lidhja.
  if (gjendja.gabimi && !gjendja.pergjigja && !gjendja.paketa) {
    return (
      <LidhjaEKeqe
        titulli="Kjo ftesë është e paplotë"
        shpjegimi={
          'Ndoshta u pre gjatë kopjimit, ose kodi ndërkohë u ndërrua. Kërkoji '
          + 'atij që mban pikët ta shfaqë kodin sërish.'
        }
      />
    );
  }

  const pamja = gjendja.paketa ? shpaketo(gjendja.paketa) : null;

  if (pamja) {
    return (
      <div className="faqja">
        <PamjaERezultatit
          pamja={pamja}
          etiketa={{
            emri: gjendja.lidhur ? 'Drejtpërdrejt' : 'Lidhja u shkëput',
            ikona: gjendja.lidhur ? 'drejtperdrejt' : 'kujdes',
          }}
          njoftimi={
            gjendja.lidhur ? (
              <p className="njoftim njoftim--mire">
                <Ikona emri="drejtperdrejt" />
                <span>
                  Pikët vijnë drejtpërdrejt nga telefoni që i mban. Raundi tjetër
                  del vetë, pa e rifreskuar faqen.
                </span>
              </p>
            ) : (
              <p className="njoftim njoftim--kujdes">
                <Ikona emri="kujdes" />
                <span>
                  Lidhja u shkëput. Numrat janë ata të orës{' '}
                  <strong>{gjendja.kur === null ? '—' : ora(gjendja.kur)}</strong>{' '}
                  dhe nuk përditësohen më. Skano ftesën sërish për t'u rilidhur.
                </span>
              </p>
            )
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

  return (
    <div className="faqja">
      <header className="kreu">
        <div className="njesi__shkronja njesi__shkronja--hapur marka">
          <Ikona emri="drejtperdrejt" />
        </div>
        <div>
          <p className="kreu__mbi">Bridzh</p>
          <h1 className="kreu__titull">Edhe një hap</h1>
        </div>
      </header>

      <p className="njoftim njoftim--kujdes">
        <Ikona emri="info" />
        <span>
          Lidhja bëhet drejt mes dy telefonave, pa server — prandaj duhet edhe
          një kod prapa. <strong>Trego këtë ekran</strong> atij që mban pikët,
          që ta skanojë me kamerën e vet.
        </span>
      </p>

      {gjendja.gabimi && (
        <p className="njoftim njoftim--gabim">
          <Ikona emri="kujdes" />
          <span>{gjendja.gabimi}</span>
        </p>
      )}

      {adresa === null ? (
        <p className="ndihma">Duke përgatitur kodin…</p>
      ) : (
        <>
          <div className="ftesa">
            <KodiQR
              teksti={adresa}
              klasa="qr qr--madh"
              pershkrimi="Kod QR që duhet skanuar nga telefoni që mban pikët"
            />
          </div>

          <div className="veprimet">
            <button type="button" className="buton buton--vogel" onClick={kopjo}>
              <Ikona emri="ndaj" />
              {kopjuar ? 'U kopjua' : 'Kopjo kodin'}
            </button>
          </div>

          <label className="lidhja">
            <span className="fusha__etiketa">Kodi i përgjigjes</span>
            <input
              className="fusha lidhja__tekst"
              type="text"
              readOnly
              value={adresa}
              data-pergjigje
              onFocus={(ngjarja) => ngjarja.currentTarget.select()}
            />
          </label>

          <p className="ndihma">
            Sapo ta skanojë, pikët dalin vetë këtu. Nëse kamera nuk e kap,
            kopjoje kodin dhe dërgoja si mesazh.
          </p>
        </>
      )}
    </div>
  );
}
