/**
 * Sjellja e një mbrëmjeje të luajtur te telefoni.
 *
 * Bridzhi tani luhet edhe drejtpërdrejt mes telefonave; kur mbrëmja mbaron atje,
 * ajo nxirret si skedar dhe hyn këtu. Deri tani ato tetë raunde shkruheshin me
 * dorë, nga një ekran te tjetri, në orën dy të natës — pikërisht atje ku një
 * numër i rishkruar gabim nuk duket si gabim.
 *
 * **Shton, nuk zëvendëson.** Kjo është e tërë ndarja nga `PanelaEKopjes`: ajo
 * e kthen tërë bazën dhe prandaj kërkon pohim me numrat e asaj që humbet; kjo
 * shton një mbrëmje të vetme te ky grup, dhe asnjë natë e shkruar më parë nuk
 * preket. Pohimi mbetet gjithsesi — çka shkruhet te historiku thuhet para se të
 * shkruhet.
 */

import { useRef, useState } from 'react';

import { lexoMbremjen, permbledhja, teRinjte, type MbremjaESjelle } from '../sjellja.ts';
import { shtoLoje, shtoRaund } from '../ruajtja.ts';
import type { Grupi } from '../tipet.ts';
import { Ikona } from '../ikonat.tsx';

export function SillMbremjen({
  grupi,
  onSjelle,
}: {
  grupi: Grupi;
  onSjelle: () => void;
}) {
  const skedari = useRef<HTMLInputElement>(null);
  const [gabimi, caktoGabimin] = useState<string | null>(null);
  const [pritje, caktoPritjen] = useState<MbremjaESjelle | null>(null);
  const [mesazhi, caktoMesazhin] = useState<string | null>(null);
  const [duke, caktoDuke] = useState(false);

  async function lexo(file: File) {
    caktoGabimin(null);
    caktoMesazhin(null);

    const dala = lexoMbremjen(await file.text());

    if (!dala.ok) {
      caktoPritjen(null);
      caktoGabimin(dala.gabimi);
      return;
    }

    caktoPritjen(dala.mbremja);
  }

  async function shkruaj(m: MbremjaESjelle) {
    caktoDuke(true);

    try {
      const gameId = await shtoLoje(grupi.id, m.date, m.selectedPlayers, m.lloji);

      // Raundet numërohen nga një, sipas radhës së luajtjes — ajo radhë është
      // ajo që e mban historikun të lexueshëm, dhe fleta e vjetër i mbante ashtu.
      for (const [i, pike] of m.raundet.entries()) {
        await shtoRaund(gameId, i + 1, pike);
      }

      caktoPritjen(null);
      caktoMesazhin(`U shtua mbrëmja e ${m.date} me ${m.raundet.length} raunde.`);
      onSjelle();
    } catch {
      caktoGabimin('Mbrëmja nuk u shkrua. Provoje sërish.');
    } finally {
      caktoDuke(false);
    }
  }

  const teRinj = pritje === null ? [] : teRinjte(pritje, grupi.playerNames);

  return (
    <details className="detaje">
      <summary className="detaje__krye">
        <span>Sill një mbrëmje</span>
        <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
      </summary>

      <div className="detaje__trupi">
        <p className="ndihma">
          Mbrëmja e luajtur te telefoni nxirret si skedar kur mbaron. Hape këtu, dhe
          raundet e saj shtohen te ky grup — historiku nuk preket.
        </p>

        <input
          ref={skedari}
          type="file"
          accept="application/json,.json"
          className="vetem-lexues"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void lexo(file);
            // Pastrohet që i njëjti skedar të mund të hapet sërish pas një gabimi.
            e.target.value = '';
          }}
        />

        <div className="veprimet">
          <button
            type="button"
            className="buton"
            onClick={() => skedari.current?.click()}
          >
            <Ikona emri="ngarko" />
            Zgjidh skedarin
          </button>
        </div>

        {gabimi !== null && (
          <p className="njoftim njoftim--gabim" role="alert">
            <Ikona emri="kujdes" />
            <span>{gabimi}</span>
          </p>
        )}

        {mesazhi !== null && gabimi === null && (
          <p className="njoftim njoftim--mire">
            <Ikona emri="ruaj" />
            <span>{mesazhi}</span>
          </p>
        )}

        {pritje !== null && (
          <div className="njoftim njoftim--kujdes">
            <Ikona emri="info" />
            <div>
              <p>
                Do të shtohet: <strong>{permbledhja(pritje)}</strong>.
              </p>

              <p className="ndihma">
                Lojtarët: {pritje.selectedPlayers.join(', ')}.
              </p>

              {teRinj.length > 0 && (
                <p className="ndihma">
                  {teRinj.join(', ')} {teRinj.length === 1 ? 'nuk është' : 'nuk janë'} te
                  lojtarët e këtij grupi. Mbrëmja shtohet gjithsesi — çdo lojë e mban
                  fotografinë e vet të lojtarëve — por te të përgjithshmet do të dalë
                  si emër më vete.
                </p>
              )}

              <div className="veprimet">
                <button
                  type="button"
                  className="buton buton--kryesor"
                  disabled={duke}
                  onClick={() => void shkruaj(pritje)}
                >
                  <Ikona emri="ruaj" />
                  {duke ? 'Duke shtuar…' : 'Shtoje te grupi'}
                </button>

                <button
                  type="button"
                  className="buton"
                  disabled={duke}
                  onClick={() => caktoPritjen(null)}
                >
                  <Ikona emri="anulo" />
                  Lëre
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
