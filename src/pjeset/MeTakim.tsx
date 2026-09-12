/**
 * Lidhja me takim — ana e atij që mban pikët.
 *
 * Mënyra e tretë, dhe e vetmja që i ka të dyja: kodin e vetëm tetëkarakterësh,
 * dhe asnjë të tretë. Serveri që i takon dy telefonat është i yni, te e njëjta
 * adresë ku rri vetë aplikacioni, dhe preket vetëm sa zgjat shtrëngimi i duarve.
 *
 * Si te dy mënyrat e tjera, lidhja nuk niset vetë: teksti para butonit e thotë
 * çka del nga pajisja, dhe butoni rri poshtë tij. Kjo nuk është tepri edhe pse
 * serveri është yni — pikërisht sepse është yni, kush e lexon ka të drejtë ta
 * dijë se çka sheh ai dhe çka jo.
 */

import { useEffect, useRef, useState } from 'react';

import { Ikona } from '../ikonat.tsx';
import { shfaqKodin } from '../kodi.ts';
import {
  StrehuesiMeTakim,
  kodIRi,
  type GjendjaEStrehuesitMeTakim,
} from '../lidhjaMeTakim.ts';
import { kopjoTekstin } from '../sistemi.ts';
import { adresaETakimit } from '../takimi.ts';
import { KodiQR } from './KodiQR.tsx';

const BOSH: GjendjaEStrehuesitMeTakim = {
  kodi: null,
  vizitore: 0,
  gabimi: null,
  dukeProvuar: true,
  vendi: null,
};

export function MeTakim({ paketa }: { paketa: string }) {
  const strehuesi = useRef<StrehuesiMeTakim | null>(null);
  const [gjendja, caktoGjendjen] = useState<GjendjaEStrehuesitMeTakim>(BOSH);
  const [nisur, caktoNisjen] = useState(false);
  const [kopjuar, caktoKopjuar] = useState<boolean | null>(null);

  const eTanishmja = useRef(paketa);
  eTanishmja.current = paketa;

  useEffect(() => {
    if (!nisur) return;

    const kodi = kodIRi();

    if (!kodi) {
      caktoGjendjen({ ...BOSH, gabimi: 'Kodi nuk u përgatit.', dukeProvuar: false });
      return;
    }

    const iRi = new StrehuesiMeTakim(
      kodi,
      window.location.href,
      eTanishmja.current,
      caktoGjendjen,
    );
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
    ? adresaETakimit(window.location.href, gjendja.kodi)
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
          Një kod i vetëm, pa kod prapa, dhe pa asnjë server të huaj. Kërkon që
          të dy telefonat të rrinë te i njëjti wifi.
        </p>

        <p className="njoftim njoftim--kujdes">
          <Ikona emri="kujdes" />
          <span>
            Kjo mënyrë prek <strong>vetëm serverin e vetë aplikacionit</strong>,
            dhe vetëm sa lidhen dy telefonat. Atje shkon kodi dhe adresa e
            rrjetës e telefonit, të cilat zhduken vetë brenda tre minutash.{' '}
            <strong>Pikët nuk e prekin kurrë atë shteg</strong> — sapo lidhja
            ngrihet, ato kalojnë drejt mes dy telefonave dhe asnjë kërkesë nuk
            niset më.
          </span>
        </p>

        <div className="veprimet">
          <button type="button" className="buton" onClick={() => caktoNisjen(true)}>
            <Ikona emri="drejtperdrejt" />
            Nis takimin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="drejtperdrejt">
      <div className="drejtperdrejt__gjendja">
        <span className={gjendja.vizitore > 0 ? 'etiketa etiketa--hapur' : 'etiketa'}>
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
        Kujtesa e çastit do të thotë se asnjë vend ruajtjeje nuk është lidhur te
        strehuesi, pra lidhja del herë po e herë jo. Thuhet, e nuk lihet të
        dështojë në heshtje: një mënyrë që punon një herë në tri është më e keqe
        se një që thotë hapur se nuk është ngritur.
      */}
      {gjendja.vendi === 'kujtesa' && (
        <p className="njoftim njoftim--kujdes">
          <Ikona emri="kujdes" />
          <span>
            Serveri nuk ka vend ruajtjeje të lidhur, prandaj kjo mënyrë do të
            lidhet herë po e herë jo. Deri atëherë, «Me kod» ose «Pa server»
            punojnë si gjithmonë.
          </span>
        </p>
      )}

      {gjendja.gabimi && (
        <p
          className={
            gjendja.dukeProvuar ? 'njoftim njoftim--kujdes' : 'njoftim njoftim--gabim'
          }
        >
          <Ikona emri="kujdes" />
          <span>{gjendja.gabimi}</span>
        </p>
      )}

      {gjendja.kodi === null || adresa === null ? (
        <>
          <p className="ndihma">
            {gjendja.dukeProvuar ? 'Duke përgatitur kodin…' : 'Takimi nuk u ngrit.'}
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

          {kopjuar === false && (
            <div className="fusha">
              <span className="fusha__etiketa">Lidhja</span>
              <input
                type="text"
                readOnly
                value={adresa}
                aria-label="Lidhja e takimit"
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
