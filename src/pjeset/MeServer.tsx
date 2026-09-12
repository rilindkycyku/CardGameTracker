/**
 * Lidhja me kod të shkurtër — ana e atij që mban pikët.
 *
 * Mënyra e dytë, dhe e vetmja te tërë aplikacioni që kontakton një server.
 * Prandaj nuk niset vetë kurrë: hyn vetëm pasi përdoruesi lexon çka del nga
 * pajisja dhe shtyp butonin. Teksti para butonit nuk është shkurtuar me qëllim
 * — kush e zgjedh duhet ta dijë çka zgjodhi.
 *
 * Përfitimi është një hap në vend të tre: një kod tetëkarakterësh diktohet me zë
 * ose skanohet një herë, dhe nuk kërkohet kod prapa. Punon edhe kur telefonat
 * nuk janë te i njëjti wifi.
 */

import { useEffect, useRef, useState } from 'react';

import { Ikona } from '../ikonat.tsx';
import { adresaEBashkimit, shfaqKodin } from '../kodi.ts';
import {
  StrehuesiMeKod,
  type GjendjaEStrehuesitMeKod,
} from '../lidhjaMeServer.ts';
import { kopjoTekstin } from '../sistemi.ts';
import { KodiQR } from './KodiQR.tsx';

/** Gjendja para se strehuesi të nisë, dhe ajo ku kthehet pas «Ndalo». */
const BOSH: GjendjaEStrehuesitMeKod = {
  kodi: null,
  vizitore: 0,
  gabimi: null,
  dukeProvuar: true,
  deshtime: 0,
};

export function MeServer({ paketa }: { paketa: string }) {
  const strehuesi = useRef<StrehuesiMeKod | null>(null);
  const [gjendja, caktoGjendjen] = useState<GjendjaEStrehuesitMeKod>(BOSH);
  const [nisur, caktoNisjen] = useState(false);
  /** `null` para se të shtypet; pastaj a e lejoi shfletuesi kopjimin. */
  const [kopjuar, caktoKopjuar] = useState<boolean | null>(null);

  const eTanishmja = useRef(paketa);
  eTanishmja.current = paketa;

  useEffect(() => {
    if (!nisur) return;

    const iRi = new StrehuesiMeKod(eTanishmja.current, caktoGjendjen);
    strehuesi.current = iRi;
    void iRi.nis();

    return () => {
      iRi.mbyll();
      strehuesi.current = null;
      caktoGjendjen(BOSH);
    };
  }, [nisur]);

  useEffect(() => {
    strehuesi.current?.transmeto(paketa);
  }, [paketa]);

  const adresa = gjendja.kodi
    ? adresaEBashkimit(window.location.href, gjendja.kodi)
    : null;

  async function kopjo() {
    if (!adresa) return;

    const u = await kopjoTekstin(adresa);
    caktoKopjuar(u);
    if (u) window.setTimeout(() => caktoKopjuar(null), 2500);
  }

  if (!nisur) {
    return (
      <div className="drejtperdrejt">
        <p className="ndihma">
          Një kod i vetëm, pa kod prapa: diktoje me zë ose lëre të skanohet një
          herë. Punon edhe kur telefonat nuk janë te i njëjti wifi.
        </p>

        <p className="njoftim njoftim--kujdes">
          <Ikona emri="kujdes" />
          <span>
            Kjo mënyrë përdor një server të huaj për t'i lidhur pajisjet
            (<strong>peerjs.com</strong>), prandaj i duhet internet. Atje shkon
            kodi i lidhjes dhe adresa e rrjetës e telefonit.{' '}
            <strong>Pikët nuk ruhen te asnjë server</strong> — kanali mbetet mes
            dy telefonave dhe është i kriptuar. Vetëm kur lidhja e drejtpërdrejtë
            dështon, bajtet e kriptuara kalojnë nëpër një relenjë të tyre, që nuk
            i lexon dot.
          </span>
        </p>

        <div className="veprimet">
          <button
            type="button"
            className="buton"
            onClick={() => caktoNisjen(true)}
          >
            <Ikona emri="drejtperdrejt" />
            Nis me kod
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

        <button
          type="button"
          className="buton buton--vogel"
          onClick={() => caktoNisjen(false)}
        >
          <Ikona emri="anulo" />
          Ndalo
        </button>
      </div>

      {/*
        Gabimi tregohet edhe sa provohet sërish, sepse pritja është e heshtur:
        pa të, ekrani thoshte «Duke marrë kodin…» për gjysmë minute pa e thënë
        përse. Butoni del vetëm kur provat kanë pushuar — sa kohë ato vazhdojnë,
        një «Provo sërish» do të ishte prekje që nuk ndryshon asgjë.
      */}
      {gjendja.gabimi && gjendja.kodi === null && (
        <p
          className={
            gjendja.dukeProvuar ? 'njoftim njoftim--kujdes' : 'njoftim njoftim--gabim'
          }
        >
          <Ikona emri="kujdes" />
          <span>
            {gjendja.gabimi}
            {gjendja.dukeProvuar && ' Po provohet sërish…'}
          </span>
        </p>
      )}

      {gjendja.kodi === null || adresa === null ? (
        <>
          <p className="ndihma">
            {gjendja.dukeProvuar
              ? gjendja.deshtime > 0
                ? `Duke provuar sërish — prova ${gjendja.deshtime + 1}…`
                : 'Duke marrë kodin…'
              : 'Lidhja me serverin nuk u ngrit.'}
          </p>

          {!gjendja.dukeProvuar && (
            <div className="veprimet">
              <button
                type="button"
                className="buton"
                onClick={() => strehuesi.current?.zgjohu()}
              >
                <Ikona emri="drejtperdrejt" />
                Provo sërish
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="kodi" data-kodi={gjendja.kodi}>
            {shfaqKodin(gjendja.kodi)}
          </p>

          <p className="ndihma">
            Te telefoni tjetër: hap aplikacionin, shtyp «Bashkohu me kod» dhe
            shkruaje. Ose skanoje kodin më poshtë — një herë, pa kod prapa.
          </p>

          <div className="ftesa">
            <KodiQR
              teksti={adresa}
              klasa="qr qr--madh"
              pershkrimi={`Kod QR që bashkohet me kodin ${shfaqKodin(gjendja.kodi)}`}
            />
          </div>

          <div className="veprimet">
            <button type="button" className="buton buton--vogel" onClick={kopjo}>
              <Ikona emri="ndaj" />
              {kopjuar ? 'U kopjua' : 'Kopjo lidhjen'}
            </button>
          </div>

          {/*
            Kur shfletuesi nuk e lejon kopjimin, lidhja del në ekran: pa këtë,
            butoni shtypej dhe nuk ndodhte kurrgjë — as mesazh, as rrugë e dytë.
          */}
          {kopjuar === false && (
            <div className="fusha">
              <span className="fusha__etiketa">Lidhja</span>
              <input
                type="text"
                readOnly
                value={adresa}
                aria-label="Lidhja e bashkimit"
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>
          )}

          <p className="njoftim njoftim--kujdes">
            <Ikona emri="info" />
            <span>
              Kush e di kodin i shikon pikët. Kodi vlen sa rri hapur kjo skedë.
            </span>
          </p>
        </>
      )}
    </div>
  );
}
