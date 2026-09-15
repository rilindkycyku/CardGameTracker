/**
 * Takimi me kod — ana që shikon.
 *
 * Dy rrugë hyjnë këtu: `#/takohu` me kodin e shkruar me dorë, dhe
 * `#/takohu/<kod>` kur kodi vjen nga një skanim ose nga një lidhje e dërguar.
 *
 * Si `#/shiko/`, `#/lidhu/` dhe `#/bashkohu/`, kjo pamje nuk lexon as shkruan
 * në bazë: hapet edhe në një telefon që nuk e ka pasur kurrë aplikacionin, dhe
 * nuk i prek lojërat e vetë atij telefoni (pika 7).
 */

import { useEffect, useRef, useState } from 'react';

import { Ikona, ShenjaEFaqes } from '../ikonat.tsx';
import { lexoKodin, shfaqKodin } from '../kodi.ts';
import {
  VizitoriMeTakim,
  type GjendjaEVizitoritMeTakim,
} from '../lidhjaMeTakim.ts';
import { shpaketo } from '../ndarja.ts';
import { FushaEKodit } from '../pjeset/FushaEKodit.tsx';
import { PamjaERezultatit } from '../pjeset/PamjaERezultatit.tsx';
import { shko } from '../rruga.ts';

/** Ora si `14:32`, për të thënë sa i vjetër është numri që shihet. */
function ora(kur: number): string {
  const koha = new Date(kur);
  return `${String(koha.getHours()).padStart(2, '0')}:${String(koha.getMinutes()).padStart(2, '0')}`;
}

export function Takohu({ kodi }: { kodi: string | null }) {
  const iLexuar = kodi === null ? null : lexoKodin(kodi);

  return iLexuar === null ? <Forma keq={kodi !== null} /> : <Lidhur kodi={iLexuar} />;
}

/** Kutia e kodit, kur nuk vjen nga adresa ose kur adresa nuk lexohet. */
function Forma({ keq }: { keq: boolean }) {
  return (
    <div className="faqja faqja--fokus">
      <header className="kreu">
        <ShenjaEFaqes />
        <div>
          <p className="kreu__mbi">Tavolina</p>
          <h1 className="kreu__titull">Bashkohu me kod</h1>
        </div>
      </header>

      {keq && (
        <p className="njoftim njoftim--gabim">
          <Ikona emri="kujdes" />
          <span>Ai kod nuk lexohet. Shkruaje me dorë më poshtë.</span>
        </p>
      )}

      <FushaEKodit onGati={(kodi) => shko(`/takohu/${kodi}`)} />

      <p className="ndihma">
        Kodin e tregon telefoni që mban pikët, te paneli «Pikët drejtpërdrejt» →
        «Takim». Shkronjat e vogla, vija dhe një lidhje e ngjitur e tërë ndreqen vetë.
      </p>

      <footer className="fundfaqja">
        <p>
          <a href="#/">Hap aplikacionin për të mbajtur pikët vetë</a>
        </p>
      </footer>
    </div>
  );
}

/** Pamja e lidhur, ose pritja para se pikët të mbërrijnë. */
function Lidhur({ kodi }: { kodi: string }) {
  const vizitori = useRef<VizitoriMeTakim | null>(null);
  const [gjendja, caktoGjendjen] = useState<GjendjaEVizitoritMeTakim>({
    lidhur: false,
    paketa: null,
    kur: null,
    gabimi: null,
    dukeProvuar: true,
  });

  useEffect(() => {
    const iRi = new VizitoriMeTakim(kodi, window.location.href, caktoGjendjen);
    vizitori.current = iRi;
    void iRi.nis();

    return () => {
      iRi.mbyll();
      vizitori.current = null;
    };
  }, [kodi]);

  const pamja = gjendja.paketa ? shpaketo(gjendja.paketa) : null;

  if (pamja) {
    return (
      <div className="faqja faqja--gjere">
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
                  Pikët vijnë drejt nga telefoni që i mban, dhe raundi tjetër del
                  vetë. Asnjë server nuk i sheh: lidhja u ngrit dhe serveri u la
                  jashtë.
                </span>
              </p>
            ) : (
              <p className="njoftim njoftim--kujdes">
                <Ikona emri="kujdes" />
                <span>
                  Lidhja u shkëput. Numrat janë ata të orës{' '}
                  <strong>{gjendja.kur === null ? '—' : ora(gjendja.kur)}</strong>{' '}
                  dhe nuk përditësohen më.{' '}
                  <a href={`#/takohu/${kodi}`} onClick={() => window.location.reload()}>
                    Provo sërish
                  </a>
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
    <div className="faqja faqja--fokus">
      <header className="kreu">
        <div className="njesi__shkronja njesi__shkronja--hapur marka">
          <Ikona emri="drejtperdrejt" />
        </div>
        <div>
          <p className="kreu__mbi">Tavolina · {shfaqKodin(kodi)}</p>
          <h1 className="kreu__titull">
            {gjendja.dukeProvuar ? 'Duke u lidhur…' : 'Nuk u lidh'}
          </h1>
        </div>
      </header>

      {gjendja.gabimi ? (
        <>
          <p className="njoftim njoftim--gabim">
            <Ikona emri="kujdes" />
            <span>{gjendja.gabimi}</span>
          </p>

          <div className="veprimet">
            <button
              type="button"
              className="buton"
              onClick={() => vizitori.current?.zgjohu()}
            >
              <Ikona emri="drejtperdrejt" />
              Provo sërish
            </button>

            <a className="buton buton--vogel" href="#/takohu">
              <Ikona emri="kthehu" />
              Provo një kod tjetër
            </a>
          </div>
        </>
      ) : (
        <p className="njoftim njoftim--kujdes">
          <Ikona emri="info" />
          <span>
            Lidhja ngrihet përmes serverit të vetë aplikacionit, dhe vetëm sa
            zgjat kjo pritje. Pikët nuk kalojnë atje — ato vijnë drejt nga
            telefoni që i mban.
          </span>
        </p>
      )}
    </div>
  );
}
