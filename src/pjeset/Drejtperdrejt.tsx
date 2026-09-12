/**
 * Zgjedhja e mënyrës së lidhjes.
 *
 * Tri mënyra, dhe dallimi mes tyre nuk është teknik — është se çka del nga
 * pajisja, dhe kujt:
 *
 * - **Me kod** (`MeServer`): një kod i vetëm tetëkarakterësh, dhe punon edhe
 *   nëpër rrjeta të ndryshme — por i duhet internet dhe një server i huaj për
 *   t'i lidhur pajisjet.
 * - **Takim** (`MeTakim`): i njëjti kod i vetëm, por serveri që i takon dy anët
 *   është i **yni** — te e njëjta adresë ku rri aplikacioni — dhe preket vetëm
 *   sa zgjat shtrëngimi i duarve. Kërkon të njëjtin wifi, sepse `iceServers` rri
 *   i zbrazët si te mënyra pa server (pika 7). Kjo është e vetmja mënyrë me një
 *   kod të vetëm që nuk i thotë asgjë asnjë të treti.
 * - **Pa server** (`PaServer`): asnjë server nuk kontaktohet fare, as i yni, as
 *   për t'u lidhur. Kërkon që telefonat të rrinë te e njëjta rrjetë, dhe
 *   shkëmbimi ka dy skanime, sepse gishtëza DTLS nuk hyn te tetë karaktere.
 *
 * **Parazgjedhja është «Me kod», me kërkesë të pronarit të projektit**, sepse
 * shoqëria zakonisht nuk rri te i njëjti wifi dhe mënyra pa server atëherë nuk
 * lidhet fare. Kjo do të thotë se rruga e parë e ekranit tani prek një server —
 * dhe pikërisht prandaj shënimi para butonit nuk guxon të hiqet.
 *
 * Ajo që mbetet e pandryshuar: lidhja nuk niset vetë. Të tria mënyrat kërkojnë
 * butonin, dhe nuk ka rënie automatike nga një mënyrë te tjetra — kush zgjedh
 * pa server nuk kalon te serveri pa e ditur.
 *
 * Ndërrimi i mënyrës e heq tjetrën nga pema, prandaj lidhjet e saj mbyllen.
 */

import { useState } from 'react';

import { Ikona } from '../ikonat.tsx';
import { kaWebRTC } from '../lidhja.ts';
import { MeServer } from './MeServer.tsx';
import { MeTakim } from './MeTakim.tsx';
import { PaServer } from './PaServer.tsx';

type Menyra = 'pa' | 'me' | 'takim';

export function Drejtperdrejt({ paketa }: { paketa: string }) {
  const [menyra, caktoMenyren] = useState<Menyra>('me');

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

  return (
    <div className="menyrat">
      <div className="zgjedhesi" role="group" aria-label="Mënyra e lidhjes">
        <button
          type="button"
          className="zgjedhesi__njesi"
          aria-pressed={menyra === 'me'}
          onClick={() => caktoMenyren('me')}
        >
          Me kod
        </button>
        <button
          type="button"
          className="zgjedhesi__njesi"
          aria-pressed={menyra === 'takim'}
          onClick={() => caktoMenyren('takim')}
        >
          Takim
        </button>
        <button
          type="button"
          className="zgjedhesi__njesi"
          aria-pressed={menyra === 'pa'}
          onClick={() => caktoMenyren('pa')}
        >
          Pa server
        </button>
      </div>

      {menyra === 'me' && <MeServer paketa={paketa} />}
      {menyra === 'takim' && <MeTakim paketa={paketa} />}
      {menyra === 'pa' && <PaServer paketa={paketa} />}
    </div>
  );
}
