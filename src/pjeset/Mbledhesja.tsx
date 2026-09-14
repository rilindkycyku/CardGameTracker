/**
 * Mbledhësja e dorës — një llogaritëse për një lojtar, te një kuti e vetme.
 *
 * Pikët e një dore mblidhen: letrat e mbetura te bridzhi, gurët te domina,
 * dora te pishpiriku. Deri tani ajo mbledhje bëhej jashtë aplikacionit, dhe te
 * fusha shkruhej vetëm shuma — pra gabimi hynte te raundi pa lënë gjurmë.
 * Këtu termat rrinë të dukshëm sa kohë kutia është hapur («10 + 15 + 5»), dhe
 * «Gati» e shkruan shumën te fusha e atij lojtari.
 *
 * Është kuti e vërtetë (`<dialog>`) e jo një panel që shpaloset nën rresht, dhe
 * kjo është zgjedhje e ekranit e jo e stilit: rreshtat e futjes janë gjashtë a
 * tetë, dhe një panel i shpalosur mes tyre i shtyn të tjerët sa hapësira e vet —
 * pikërisht atë që kërkon syri për ta krahasuar dorën e radhës. Kutia e mban
 * ekranin për vete, e kthen prapa ashtu si ishte, dhe e mbyll «Esc»-i.
 *
 * Tastiera e vet nuk është zbukurim. Tastiera numerike e Androidit nuk ka as
 * «+» as «−» (e njëjta arsye pse shenja te fushat ka butonin e vet, `fusha.ts`),
 * prandaj një mbledhje e shkruar si tekst nuk shtypej dot fare në telefon.
 *
 * Aritmetika rri jashtë, te `mbledhja.ts`, dhe provohet pa shfletues (pika 1).
 * Këtu mbetet vetëm kutia: hapja, mbyllja dhe prekjet.
 */

import { useRef, useState } from 'react';

import {
  ZBRAZET,
  bosh,
  fshiPrapa,
  nisNga,
  shkrimi,
  shtoShifren,
  shtoTermin,
  shuma,
  type Mbledhja,
} from '../mbledhja.ts';
import { Ikona } from '../ikonat.tsx';

const SHIFRAT = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function Mbledhesja({
  emri,
  vlera,
  onCakto,
  etiketa = 'Mblidh dorën e',
}: {
  /** Kujt i takon dora — del te kreu i kutisë, që të mos mbetet pyetje. */
  emri: string;
  /** Ajo që ka tashmë fusha; kutia nis prej saj. */
  vlera: string;
  /** Shuma si tekst, ashtu si shkruhet te fusha. */
  onCakto: (teksti: string) => void;
  /** Fillimi i emrit që lexon lexuesi i ekranit për butonin që e hap. */
  etiketa?: string;
}) {
  const kutia = useRef<HTMLDialogElement>(null);
  const [gjendja, caktoGjendjen] = useState<Mbledhja>(ZBRAZET);

  function hap() {
    // Nis nga numri i shkruar: kush e hap kutinë mbi një vlerë zakonisht do t'i
    // shtojë diçka, e jo të nisë nga e para.
    caktoGjendjen(nisNga(vlera));
    kutia.current?.showModal();
  }

  function mbyll() {
    kutia.current?.close();
  }

  function gati() {
    onCakto(String(shuma(gjendja)));
    mbyll();
  }

  return (
    <>
      <button
        type="button"
        className="mbledhesja__hap"
        onClick={hap}
        aria-label={`${etiketa} ${emri}`}
      >
        <Ikona emri="llogaritesi" />
      </button>

      <dialog
        ref={kutia}
        className="kutia"
        aria-label={`Mbledhja e dorës — ${emri}`}
        /* Prekja jashtë kutisë e mbyll: te tableta ajo është lëvizja e parë e
           dorës, dhe një kuti që nuk mbyllet ashtu duket e ngecur. Ngjarja vjen
           nga vetë `<dialog>`-u kur prekja bie te sfondi i tij. */
        onClick={(e) => {
          if (e.target === kutia.current) mbyll();
        }}
        /* Te kompjuteri tastiera e vërtetë rri nën gishta gjithsesi, prandaj
           shifrat, «+» dhe fshirja prapa punojnë edhe prej saj. «Enter» nuk
           merret këtu: fokusi rri mbi një tast, dhe shfletuesi e shtyp atë. */
        onKeyDown={(e) => {
          if (e.ctrlKey || e.metaKey || e.altKey) return;
          if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            caktoGjendjen((gj) => shtoShifren(gj, e.key));
          } else if (e.key === '+') {
            e.preventDefault();
            caktoGjendjen(shtoTermin);
          } else if (e.key === 'Backspace') {
            e.preventDefault();
            caktoGjendjen(fshiPrapa);
          }
        }}
        onClose={() => caktoGjendjen(ZBRAZET)}
      >
        <p className="kutia__krye">
          <span className="kutia__titull">{emri}</span>
          <span className="kutia__ndihma">sa i mbeti në dorë</span>
        </p>

        <p className="mbledhesja__shfaqja">
          <span className="mbledhesja__termat">{shkrimi(gjendja) || '0'}</span>
          <strong className="mbledhesja__shuma">{shuma(gjendja)}</strong>
        </p>

        <div className="mbledhesja__tastiera">
          {SHIFRAT.map((shifra) => (
            <button
              key={shifra}
              type="button"
              className="mbledhesja__tast"
              onClick={() => caktoGjendjen((gj) => shtoShifren(gj, shifra))}
            >
              {shifra}
            </button>
          ))}

          <button
            type="button"
            className="mbledhesja__tast"
            onClick={() => caktoGjendjen(fshiPrapa)}
            aria-label="Fshij prapa"
          >
            ⌫
          </button>

          <button
            type="button"
            className="mbledhesja__tast"
            onClick={() => caktoGjendjen((gj) => shtoShifren(gj, '0'))}
          >
            0
          </button>

          <button
            type="button"
            className="mbledhesja__tast mbledhesja__tast--shto"
            onClick={() => caktoGjendjen(shtoTermin)}
            aria-label="Mbyll termin dhe nis një të ri"
          >
            +
          </button>
        </div>

        <div className="veprimet">
          <button
            type="button"
            className="buton buton--kryesor"
            onClick={gati}
            disabled={bosh(gjendja)}
          >
            <Ikona emri="ruaj" />
            Gati
          </button>
          <button type="button" className="buton" onClick={mbyll}>
            <Ikona emri="anulo" />
            Anulo
          </button>
        </div>
      </dialog>
    </>
  );
}
