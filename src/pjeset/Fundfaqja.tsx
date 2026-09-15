/**
 * Fundfaqja — versioni, ndriçimi, dhe versioni i ri kur ka.
 *
 * Rrinte vetëm te ekrani i parë, dhe arsyeja ishte se aty rrinë zgjedhjet që
 * bëhen një herë. Por tema nuk zgjidhet një herë: mbrëmja nis me dritë e mbaron
 * në terr, dhe kush e do ndërrimin duhej të linte lojën, të kthehej te grupet,
 * ta prekte çelësin dhe të hapte prapë raundin. Me kërkesë të pronarit, tani rri
 * te çdo ekran.
 *
 * I njëjti arsyetim vlen edhe për numrin: aplikacioni hapet nga një adresë dhe
 * telefoni e mban në cache, prandaj «e ke të renë apo të vjetrën?» duhet t'i
 * përgjigjet dot kushdo, nga aty ku është — përfshirë atë që e hapi fletën nga
 * një kod dhe nuk e ka parë kurrë ekranin e parë.
 *
 * Dy rreshta mbeten vetëm te ballina (`plote`): «Bërë me ♥» dhe fjalia e matjes.
 * Ata e prezantojnë aplikacionin, dhe një prezantim i përsëritur te çdo ekran
 * është zhurmë — kurse çka del nga pajisja duhet thënë aty ku dikush e lexon
 * para se ta përdorë, jo në mes të një raundi.
 */

import type { ReactNode } from 'react';

import { kaloTeIRi, useVersionIRi } from '../instalimi.ts';
import { Ikona, Zemra } from '../ikonat.tsx';
import { VERSIONI } from '../versioni.ts';
import { CelesiINdricimit } from './Ndricimi.tsx';

export function Fundfaqja({
  plote = false,
  children,
}: {
  /** Ballina: shton fjalinë e prezantimit dhe atë të matjes. */
  plote?: boolean;
  /** Çka i takon vetëm atij ekrani — p.sh. lidhja «Hap aplikacionin». */
  children?: ReactNode;
}) {
  const versionIRi = useVersionIRi();

  return (
    <footer className="fundfaqja">
      {children}

      {plote && (
        <p>
          Bërë me <Zemra /> për tavolinën.
        </p>
      )}

      <p className="fundfaqja__versioni">v{VERSIONI}</p>

      {/*
        Çka del nga pajisja, thënë aty ku lexohet.

        Të dhënat rrinë te telefoni (pika 1), dhe kjo nuk ndryshoi: te matja
        shkon emri i rrugës — «/loja/[id]», «/shiko» — e asgjë tjetër. Rri te
        ballina sepse atje lexohet para se të futet i pari emër, e jo në mes të
        një mbrëmjeje.
      */}
      {plote && (
        <p className="fundfaqja__matja">
          Numërohen vetëm hapjet e faqes — pa pikë, pa emra, pa lojëra.
        </p>
      )}

      <CelesiINdricimit />

      {/*
        Versioni i ri rri e pret, dhe nuk merr pushtetin pa u thënë.

        Faqja ruhet te koshi i punëtorit të shërbimit, prandaj ajo që hapet është
        ajo që u ruajt — edhe kur serveri ka diçka më të re. Rri krah numrit, dhe
        shfaqet vetëm kur ka vërtet çka të merret. Tani që fundfaqja është te çdo
        ekran, lajmi arrin edhe te kush nuk kalon nga ballina me ditë.
      */}
      {versionIRi && (
        <p className="fundfaqja__i-ri">
          <span>Ka një version më të ri.</span>
          <button type="button" className="buton buton--vogel" onClick={kaloTeIRi}>
            <Ikona emri="ruaj" />
            Merre tani
          </button>
        </p>
      )}
    </footer>
  );
}
