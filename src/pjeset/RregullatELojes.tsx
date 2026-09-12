/**
 * Rregullat e lojës që po luhet, të mbledhura te një `<details>`.
 *
 * Deri tani ato rrinin te README-ja — pra jashtë telefonit që i mban pikët —
 * dhe te tavolina pyetja vjen pikërisht atëherë kur askush nuk e hap GitHub-un:
 * *a vlen fanti dhjetë a pesëmbëdhjetë?*, *sa merr ai që s'kishte hapur?*
 * Llogaritësi i bridzhit i thotë numrat e vet (pika 3), por vetëm kur është
 * hapur, dhe tri lojërat e tjera nuk kanë llogaritës fare.
 *
 * Rri i mbledhur, dhe kjo nuk është modesti: blloku i futjes përdoret dhjetëra
 * herë në mbrëmje dhe nuk ndahet me askënd (pika 6). I hapur, ky do t'i hante
 * ekranin pikërisht atij.
 *
 * Teksti vjen i tëri nga regjistri (`lojerat.ts`), prandaj një lojë e pestë e
 * merr këtë panel pa e prekur asnjë ekran (pika 16). Numrat e kufirit nuk hyjnë
 * aty (pika 13): atë e zgjedh tavolina, dhe e thotë rreshti «Deri te …».
 */

import { Ikona } from '../ikonat.tsx';
import type { Rregullat } from '../lojerat.ts';

export function RregullatELojes({ rregulli }: { rregulli: Rregullat }) {
  if (rregulli.hollesite.length === 0) return null;

  return (
    <details className="detaje">
      <summary className="detaje__krye">
        <span>Rregullat — {rregulli.emri}</span>
        <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
      </summary>
      <div className="detaje__trupi">
        <ul className="rregullat">
          {rregulli.hollesite.map((rreshti) => (
            <li key={rreshti}>{rreshti}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}
