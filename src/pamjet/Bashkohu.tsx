/**
 * Bashkimi me kod — ana që shikon, te mënyra me server.
 *
 * Dy rrugë hyjnë këtu: `#/bashkohu` me kodin e shkruar me dorë, dhe
 * `#/bashkohu/<kod>` kur kodi vjen nga një skanim ose nga një lidhje e dërguar.
 * E dyta lidhet vetë, prandaj skanimi është një hap i vetëm.
 *
 * Si `#/shiko/` dhe `#/lidhu/`, kjo pamje nuk lexon as shkruan në bazë: hapet
 * edhe në një telefon që nuk e ka pasur kurrë aplikacionin, dhe nuk i prek
 * lojërat e vetë atij telefoni.
 *
 * Kur kodi vjen nga adresa, njoftimi mbi tabelë e thotë se lidhja shkon nëpër
 * një server të huaj. Kush skanon një kod nuk e ka lexuar tekstin te ana tjetër,
 * prandaj do ta mësonte vetëm këtu.
 */

import { useEffect, useRef, useState } from 'react';

import { Ikona, ShenjaEFaqes } from '../ikonat.tsx';
import { lexoKodin, shfaqKodin } from '../kodi.ts';
import {
  VizitoriMeKod,
  type GjendjaEVizitoritMeKod,
} from '../lidhjaMeServer.ts';
import { shpaketo } from '../ndarja.ts';
import { PamjaERezultatit } from '../pjeset/PamjaERezultatit.tsx';
import { shko } from '../rruga.ts';

/** Ora si `14:32`, për të thënë sa i vjetër është numri që shihet. */
function ora(kur: number): string {
  const koha = new Date(kur);
  return `${String(koha.getHours()).padStart(2, '0')}:${String(koha.getMinutes()).padStart(2, '0')}`;
}

export function Bashkohu({ kodi }: { kodi: string | null }) {
  const iLexuar = kodi === null ? null : lexoKodin(kodi);

  return iLexuar === null ? (
    <Forma keq={kodi !== null} />
  ) : (
    <Lidhur kodi={iLexuar} />
  );
}

/** Kutia e kodit, kur nuk vjen nga adresa ose kur adresa nuk lexohet. */
function Forma({ keq }: { keq: boolean }) {
  const [teksti, caktoTekstin] = useState('');
  const iLexuar = lexoKodin(teksti);

  return (
    <div className="faqja">
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

      <form
        className="rreshti-fushave"
        onSubmit={(ngjarja) => {
          ngjarja.preventDefault();
          if (iLexuar) shko(`/bashkohu/${iLexuar}`);
        }}
      >
        <label className="lidhja">
          <span className="fusha__etiketa">Kodi</span>
          <input
            className="fusha kodi-fusha"
            type="text"
            value={teksti}
            placeholder="A3F2-7KQM"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            onChange={(ngjarja) => caktoTekstin(ngjarja.target.value)}
          />
        </label>

        <button type="submit" className="buton" disabled={iLexuar === null}>
          <Ikona emri="drejtperdrejt" />
          Bashkohu
        </button>
      </form>

      <p className="ndihma">
        Kodin e tregon telefoni që mban pikët, te paneli «Pikët drejtpërdrejt» →
        «Me kod». Shkronjat e vogla dhe vija nuk kanë rëndësi.
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
  const vizitori = useRef<VizitoriMeKod | null>(null);
  const [gjendja, caktoGjendjen] = useState<GjendjaEVizitoritMeKod>({
    lidhur: false,
    paketa: null,
    kur: null,
    gabimi: null,
  });

  useEffect(() => {
    const iRi = new VizitoriMeKod(kodi, caktoGjendjen);
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
                  Pikët vijnë drejt nga telefoni që i mban, dhe raundi tjetër del
                  vetë. Lidhja u ngrit përmes një serveri të huaj, por pikët
                  kalojnë mes dy telefonave.
                </span>
              </p>
            ) : (
              <p className="njoftim njoftim--kujdes">
                <Ikona emri="kujdes" />
                <span>
                  Lidhja u shkëput. Numrat janë ata të orës{' '}
                  <strong>{gjendja.kur === null ? '—' : ora(gjendja.kur)}</strong>{' '}
                  dhe nuk përditësohen më.
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
          <p className="kreu__mbi">Tavolina · {shfaqKodin(kodi)}</p>
          <h1 className="kreu__titull">
            {gjendja.gabimi ? 'Nuk u lidh' : 'Duke u lidhur…'}
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
            <a className="buton" href="#/bashkohu">
              <Ikona emri="kthehu" />
              Provo një kod tjetër
            </a>
          </div>
        </>
      ) : (
        <p className="njoftim njoftim--kujdes">
          <Ikona emri="info" />
          <span>
            Lidhja ngrihet përmes një serveri të huaj (<strong>peerjs.com</strong>),
            prandaj i duhet internet. Pikët nuk ruhen atje — kanali mbetet mes
            dy telefonave.
          </span>
        </p>
      )}
    </div>
  );
}
