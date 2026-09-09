/**
 * Kopja rezervë — nxjerrja dhe kthimi.
 *
 * Të dhënat rrinë vetëm në këtë shfletues. „Pastro të dhënat e shfletimit",
 * një telefon i ri, ose dikush që e hap aplikacionin nga një pajisje tjetër —
 * në të tria rastet historiku nuk vjen vetë. Prandaj ky panel nuk është i
 * fshehur te cilësimet, por rri në faqen e parë.
 *
 * Kthimi e zëvendëson tërë bazën, prandaj kërkohet pohim me numrat e asaj që
 * vjen dhe të asaj që humbet, jo një „a je i sigurt" i thatë.
 */

import { useRef, useState } from 'react';

import { emriISkedarit, lexoKopjen, ndertoKopjen, permbledhja } from '../kopja.ts';
import { gjithcka, zevendeso } from '../ruajtja.ts';
import type { Kopja } from '../tipet.ts';
import { Ikona } from '../ikonat.tsx';

export function PanelaEKopjes({ onKthyer }: { onKthyer: () => void }) {
  const skedari = useRef<HTMLInputElement>(null);
  const [gabimi, caktoGabimin] = useState<string | null>(null);
  const [pritje, caktoPritjen] = useState<Kopja | null>(null);
  const [mesazhi, caktoMesazhin] = useState<string | null>(null);

  async function nxirr() {
    caktoGabimin(null);
    const { groups, games, rounds } = await gjithcka();
    const kopja = ndertoKopjen(groups, games, rounds);

    const lidhja = document.createElement('a');
    const adresa = URL.createObjectURL(
      new Blob([JSON.stringify(kopja, null, 2)], { type: 'application/json' }),
    );

    lidhja.href = adresa;
    lidhja.download = emriISkedarit();
    lidhja.click();
    URL.revokeObjectURL(adresa);

    caktoMesazhin(`U shkarkua: ${permbledhja(kopja)}.`);
  }

  async function lexo(file: File) {
    caktoGabimin(null);
    caktoMesazhin(null);

    const dala = lexoKopjen(await file.text());

    if (!dala.ok) {
      caktoGabimin(dala.gabimi);
      return;
    }

    caktoPritjen(dala.kopja);
  }

  async function pohos() {
    if (!pritje) return;

    await zevendeso(pritje);
    caktoPritjen(null);
    caktoMesazhin(`U kthye: ${permbledhja(pritje)}.`);
    onKthyer();
  }

  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="shkarko" />
        Kopja rezervë
      </h2>

      <div className="kartela">
        <p className="ndihma">
          Gjithçka rri vetëm në këtë shfletues. Nxirre kopjen herë pas here — dhe
          patjetër para se të pastrosh të dhënat e shfletimit ose të ndërrosh
          telefonin.
        </p>

        <div className="veprimet">
          <button type="button" className="buton" onClick={nxirr}>
            <Ikona emri="shkarko" />
            Nxirr kopjen
          </button>

          <button
            type="button"
            className="buton"
            onClick={() => skedari.current?.click()}
          >
            <Ikona emri="ngarko" />
            Kthe një kopje
          </button>

          <input
            ref={skedari}
            type="file"
            accept="application/json,.json"
            className="vetem-lexues"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void lexo(file);
              // Që i njëjti skedar të mund të zgjidhet sërish pas një gabimi.
              e.target.value = '';
            }}
          />
        </div>

        {gabimi && (
          <p className="njoftim njoftim--gabim">
            <Ikona emri="kujdes" />
            <span>{gabimi}</span>
          </p>
        )}

        {mesazhi && !gabimi && (
          <p className="njoftim njoftim--mire">
            <Ikona emri="ruaj" />
            <span>{mesazhi}</span>
          </p>
        )}

        {pritje && (
          <div className="njoftim njoftim--kujdes">
            <Ikona emri="kujdes" />
            <div>
              <p>
                Kopja sjell <strong>{permbledhja(pritje)}</strong> dhe e
                zëvendëson gjithçka që ka tani ky shfletues. Kjo nuk kthehet
                prapa.
              </p>
              <div className="veprimet">
                <button type="button" className="buton buton--kryesor" onClick={pohos}>
                  <Ikona emri="ruaj" />
                  Zëvendëso
                </button>
                <button
                  type="button"
                  className="buton"
                  onClick={() => caktoPritjen(null)}
                >
                  <Ikona emri="anulo" />
                  Anulo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
