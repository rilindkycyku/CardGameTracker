/**
 * Skeda e dytë — dorëzimi i përgjigjes te skeda e lojës.
 *
 * Kamera e telefonit nuk di t'ia dorëzojë tekstin një skede që rri hapur: ajo
 * hap një skedë të re. Por skeda e lojës nuk guxon të lëvizë, sepse ajo mban
 * `RTCPeerConnection`-in që po lidhet. Prandaj kjo skedë ekziston vetëm për një
 * punë: e merr paketën nga adresa, e kalon te skeda e lojës me
 * `BroadcastChannel`, dhe thotë „mbyllu".
 *
 * Pohimi pritet vërtet e nuk shtiret. Pa të, kjo faqe do të thoshte „u lidh"
 * edhe kur skeda e lojës nuk është hapur fare, dhe njeriu do të pritej para një
 * ekrani që i thotë se puna mbaroi. Me të, heshtja bëhet udhëzim.
 */

import { useEffect, useState } from 'react';

import { Ikona, ShenjaEFaqes } from '../ikonat.tsx';
import { dergoPergjigjen } from '../lidhja.ts';

/** Sa pritet pohimi para se faqja të kalojë te udhëzimi rezervë. */
const PRITJA = 4000;

export function Pergjigja({ kodi }: { kodi: string }) {
  const [pranuar, caktoPranimin] = useState(false);
  const [pritur, caktoPritjen] = useState(false);

  useEffect(() => {
    const pastro = dergoPergjigjen(kodi, () => caktoPranimin(true));
    const afati = window.setTimeout(() => caktoPritjen(true), PRITJA);

    return () => {
      pastro();
      window.clearTimeout(afati);
    };
  }, [kodi]);

  return (
    <div className="faqja">
      <header className="kreu">
        <ShenjaEFaqes />
        <div>
          <p className="kreu__mbi">Tavolina</p>
          <h1 className="kreu__titull">
            {pranuar ? 'U lidh' : 'Duke dorëzuar kodin…'}
          </h1>
        </div>
      </header>

      {pranuar ? (
        <>
          <p className="njoftim njoftim--mire">
            <Ikona emri="drejtperdrejt" />
            <span>
              Telefoni tjetër i shikon pikët tani. <strong>Mbylle këtë skedë</strong>{' '}
              dhe kthehu te loja.
            </span>
          </p>

          <div className="veprimet">
            <a className="buton" href="#/">
              <Ikona emri="kthehu" />
              Hap aplikacionin
            </a>
          </div>
        </>
      ) : pritur ? (
        <div className="zbrazet">
          <p className="zbrazet__titull">Skeda e lojës nuk u gjet</p>
          <p>
            Kodi u dërgua, por asnjë skedë e hapur nuk e pranoi. Kthehu te skeda
            ku po mban pikët, hape panelin «Pikët drejtpërdrejt» dhe skanoje
            kodin sërish — ose ngjite kodin atje me dorë.
          </p>
          <p className="ndihma">
            Ndodh kur kamera e hap lidhjen brenda një aplikacioni tjetër e jo te
            shfletuesi ku rri loja.
          </p>
        </div>
      ) : (
        <p className="ndihma">Duke kërkuar skedën e lojës…</p>
      )}
    </div>
  );
}
