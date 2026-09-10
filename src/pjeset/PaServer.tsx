/**
 * Lidhja e drejtpërdrejtë pa server — ana e atij që mban pikët.
 *
 * Mënyra e parazgjedhur, dhe e vetmja që nuk kontakton asnjë server. Tregon
 * ftesën si kod QR dhe pret përgjigjen. Shkëmbimi ka dy hapa e jo një, sepse
 * WebRTC-ja kërkon që të dy anët t'i njohin kredencialet e njëra-tjetrës dhe
 * server sinjalizimi nuk ka: kush shikon skanon ftesën, dhe pastaj tregon një
 * kod të vetin që skanohet nga kjo anë.
 *
 * Hapat rrinë të shkruar te ekrani sepse hapi i dytë nuk merret me mend. Pa të,
 * njeriu skanon kodin e parë, shikon një kod tjetër dhe nuk e di se atë duhet
 * t'ia tregojë prapa.
 *
 * Lidhja ekziston sa rri hapur kjo skedë, prandaj paneli nuk hiqet nga pema kur
 * mbyllet `<details>`-i: `<details>` vetëm e fsheh, dhe kanalet mbeten.
 */

import { useEffect, useRef, useState } from 'react';

import { Ikona } from '../ikonat.tsx';
import {
  adresaEFtesesNgaFaqja,
  kaWebRTC,
  Strehuesi,
  type GjendjaEStrehuesit,
} from '../lidhja.ts';
import { kodiIPergjigjes } from '../sinjalizimi.ts';
import { KodiQR } from './KodiQR.tsx';

export function PaServer({ paketa }: { paketa: string }) {
  const strehuesi = useRef<Strehuesi | null>(null);
  const [gjendja, caktoGjendjen] = useState<GjendjaEStrehuesit>({
    ftesa: null,
    vizitore: 0,
    dukeLidhur: false,
    gabimi: null,
  });
  const [meDore, caktoMeDore] = useState('');
  const [kopjuar, caktoKopjuar] = useState(false);
  /**
   * Lidhja nis me kërkesë e jo me hapjen e ekranit.
   *
   * `<details>` vetëm i fsheh fëmijët, prandaj paneli rri i montuar edhe i
   * mbyllur — dhe pa këtë çelës çdo hapje e një loje do të ngrinte një
   * `RTCPeerConnection` që nuk i kërkoi kush.
   */
  const [nisur, caktoNisjen] = useState(false);

  // Paketa e çastit rri te një ref, që strehuesi të nisë një herë e jo sa herë
  // ndryshon një pikë.
  const eTanishmja = useRef(paketa);
  eTanishmja.current = paketa;

  useEffect(() => {
    if (!nisur) return;

    const iRi = new Strehuesi(eTanishmja.current, caktoGjendjen);
    strehuesi.current = iRi;
    void iRi.nis();

    return () => {
      iRi.mbyll();
      strehuesi.current = null;
      caktoGjendjen({ ftesa: null, vizitore: 0, dukeLidhur: false, gabimi: null });
    };
  }, [nisur]);

  // Çdo raund i ri shkon vetë te kush shikon; kjo është tërë pika e panelit.
  useEffect(() => {
    strehuesi.current?.transmeto(paketa);
  }, [paketa]);

  const adresa = gjendja.ftesa ? adresaEFtesesNgaFaqja(gjendja.ftesa) : null;

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

  function fut(ngjarja: React.FormEvent) {
    ngjarja.preventDefault();

    const kodi = kodiIPergjigjes(meDore);
    if (!kodi) return;

    void strehuesi.current?.pergjigju(kodi).then((mire) => {
      if (mire) caktoMeDore('');
    });
  }

  if (!kaWebRTC()) {
    return (
      <p className="njoftim njoftim--kujdes">
        <Ikona emri="kujdes" />
        <span>
          Ky shfletues nuk e mban lidhjen e drejtpërdrejtë. Fotografia më poshtë
          punon gjithsesi.
        </span>
      </p>
    );
  }

  if (!nisur) {
    return (
      <div className="drejtperdrejt">
        <p className="ndihma">
          Pikët shkojnë drejt te telefonat përreth, brenda së njëjtës rrjetë, dhe
          përditësohen vetë pas çdo raundi. Asnjë server nuk kontaktohet — as për
          t'u lidhur.
        </p>

        <div className="veprimet">
          <button
            type="button"
            className="buton buton--kryesor"
            onClick={() => caktoNisjen(true)}
          >
            <Ikona emri="drejtperdrejt" />
            Nis lidhjen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="drejtperdrejt">
      <div className="drejtperdrejt__gjendja">
        <span
          className={
            gjendja.vizitore > 0 ? 'etiketa etiketa--hapur' : 'etiketa'
          }
        >
          <Ikona emri="drejtperdrejt" />
          {gjendja.vizitore === 0
            ? 'Askush ende'
            : `${gjendja.vizitore} ${gjendja.vizitore === 1 ? 'shikon' : 'shikojnë'}`}
        </span>

        {gjendja.dukeLidhur && <span className="etiketa">Duke lidhur…</span>}

        <button
          type="button"
          className="buton buton--vogel"
          onClick={() => caktoNisjen(false)}
        >
          <Ikona emri="anulo" />
          Ndalo
        </button>
      </div>

      {gjendja.gabimi && (
        <p className="njoftim njoftim--gabim">
          <Ikona emri="kujdes" />
          <span>{gjendja.gabimi}</span>
        </p>
      )}

      {adresa === null ? (
        <p className="ndihma">Duke përgatitur ftesën…</p>
      ) : (
        <>
          <div className="ftesa">
            <KodiQR
              teksti={adresa}
              klasa="qr qr--madh"
              pershkrimi="Kod QR që lidh telefonin tjetër me pikët e drejtpërdrejta"
            />
          </div>

          <ol className="hapat">
            <li>
              <Ikona emri="kamera" />
              <span>
                Tjetri e skanon këtë kod me <strong>kamerën e telefonit</strong>,
                jo me aplikacionin.
              </span>
            </li>
            <li>
              <Ikona emri="sy" />
              <span>Në ekranin e tij del një kod i dytë.</span>
            </li>
            <li>
              <Ikona emri="kamera" />
              <span>
                <strong>Skanoje ti</strong> atë kod, me kamerën e këtij telefoni.
                Hapet një skedë e dytë që mbyllet vetë.
              </span>
            </li>
          </ol>

          <div className="veprimet">
            <button type="button" className="buton buton--vogel" onClick={kopjo}>
              <Ikona emri="ndaj" />
              {kopjuar ? 'U kopjua' : 'Kopjo ftesën'}
            </button>
          </div>

          <label className="lidhja">
            <span className="fusha__etiketa">Ftesa</span>
            <input
              className="fusha lidhja__tekst"
              type="text"
              readOnly
              value={adresa}
              data-ftesa
              onFocus={(ngjarja) => ngjarja.currentTarget.select()}
            />
          </label>
        </>
      )}

      {/*
        Rruga me dorë rri jashtë kushtit të ftesës me qëllim. Brenda tij, ajo do
        të zhdukej pikërisht kur duhet: sa përgatitet ftesa e radhës, dhe — më
        keq — kur përgatitja dështon fare dhe kodi QR nuk del. Atëherë ngjitja e
        kodit është e vetmja rrugë e mbetur.
      */}
      <details className="detaje detaje--brenda">
        <summary className="detaje__krye">
          <span>Kamera nuk e kapi? Fute kodin me dorë</span>
          <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
        </summary>

        <div className="detaje__trupi">
          <p className="ndihma">
            Kërkoji atij të kopjojë kodin e dytë dhe ta dërgojë si mesazh.
            Ngjite tërë tekstin këtu — adresa e plotë punon njësoj.
          </p>

          <form className="rreshti-fushave" onSubmit={fut}>
            <input
              className="fusha"
              type="text"
              value={meDore}
              placeholder="Kodi i përgjigjes"
              autoComplete="off"
              spellCheck={false}
              onChange={(ngjarja) => caktoMeDore(ngjarja.target.value)}
            />
            <button
              type="submit"
              className="buton"
              disabled={kodiIPergjigjes(meDore) === null}
            >
              <Ikona emri="ruaj" />
              Lidhu
            </button>
          </form>
        </div>
      </details>
    </div>
  );
}
