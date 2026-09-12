/**
 * Tabela e përgjithshme e grupit — të gjitha mbrëmjet në një vend.
 *
 * Fleta e vjetër kishte një bllok renditjeje për çdo lojë dhe asgjë që t'i
 * lidhte: kush kishte fituar më shumë mbahej mend me gojë, dhe zakonisht
 * mbahej mend gabim. Kjo është ajo llogari, e bërë nga vetë raundet.
 *
 * Radha është sipas fitoreve, dhe kur fitoret janë të barabarta sipas mesatares
 * në drejtimin që e fiton loja. Mesatarja rri krah fitoreve e jo në vend të
 * tyre: kush luan më shumë mbrëmje ka më shumë raste të fitojë, dhe kush luan
 * pak i ka të dyja shifrat të vogla.
 *
 * Një tabelë për lojë. Pikët e bridzhit dhe ato të dominës mblidhen njësoj si
 * numra, por nuk janë e njëjta gjë — dhe ato të pishpirikut fitohen nga ana
 * tjetër — prandaj emri i lojës rri te titulli, dhe grupi i ka aq tabela sa
 * lojëra ka luajtur (pika 16).
 *
 * Shuma e papërpunuar e totaleve nuk shfaqet, edhe pse llogaritet: mbledh
 * mbrëmje me nga tre raunde bashkë me mbrëmje me nga dymbëdhjetë, prandaj
 * krahason pak. Mesatarja e thotë të njëjtën gjë e krahasueshme, dhe tabela
 * hyn te telefoni pa rrëshqitur anash.
 */

import { memo } from 'react';

import type { RreshtiPergjithshem } from '../llogaritjet.ts';
import { Ikona } from '../ikonat.tsx';

function TabelaEPergjithshmeBrenda({
  rreshtat,
  lojera,
  emriILojes,
}: {
  rreshtat: RreshtiPergjithshem[];
  /** Sa lojëra të luajtura ka grupi — për titullin. */
  lojera: number;
  /** Çka u luajt — `Bridzh`, `Domina`, `Pishpirik`. Rri te titulli. */
  emriILojes: string;
}) {
  if (rreshtat.length === 0) return null;

  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="renditja" />
        Të përgjithshmet · {emriILojes}
        <span className="titull-seksioni__numri">
          {lojera} {lojera === 1 ? 'lojë' : 'lojëra'}
        </span>
      </h2>

      <div className="tabela-mbeshtjellese">
        <table className="tabela">
          <caption className="vetem-lexues">
            {/*
              Emri rri në kllapa e jo i lakuar: „të bridzhit", „të dominës", „të
              pishpirikut" — secili lakohet ndryshe, dhe një rregull i vetëm mbi
              të katërt do të nxirrte shqipe të thyer te njëri prej tyre.
            */}
            Përmbledhja e mbrëmjeve ({emriILojes}): lojëra të luajtura, fitore
            dhe totali mesatar për lojë.
          </caption>
          <thead>
            <tr>
              <th scope="col">Vendi</th>
              <th scope="col">Lojtari</th>
              <th scope="col" className="numri">
                Lojëra
              </th>
              <th scope="col" className="numri">
                Fitore
              </th>
              <th scope="col" className="numri">
                Mesatarja
              </th>
            </tr>
          </thead>
          <tbody>
            {rreshtat.map((rreshti, vendi) => (
              <tr
                key={rreshti.player}
                className={vendi === 0 ? 'rresht--pare' : undefined}
              >
                <td className="qeliza-vendi">{vendi + 1}</td>
                <td className="qeliza-emri">
                  {rreshti.player}
                  {vendi === 0 && (
                    <>
                      <Ikona emri="renditja" klasa="ikona kurora" />
                      <span className="vetem-lexues">i pari i grupit</span>
                    </>
                  )}
                </td>
                <td className="numri qeliza-raundi">{rreshti.lojera}</td>
                <td className="numri">{rreshti.fitore}</td>
                <td className="numri">{Math.round(rreshti.mesatarja)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Tabela e grupit varet vetëm nga rreshtat e vet, prandaj rri pas `memo`.
 *
 * Kjo punon vetëm sepse `Loja` i mban vlerat e derivuara te `useMemo`: pa
 * identitet të qëndrueshëm, krahasimi i hyrjeve do të dështonte çdo herë dhe
 * mbështjellja nuk do të kursente kurrgjë.
 */
export const TabelaEPergjithshme = memo(TabelaEPergjithshmeBrenda);
