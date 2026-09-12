/**
 * Çelësi i ndriçimit — sistemi, dritë, terr.
 *
 * Rri te fundfaqja e ekranit të parë, krah versionit dhe fjalisë së matjes:
 * atje ku faqja flet për vete. Nuk rri te ekrani i lojës me qëllim — ai bllok
 * përdoret dhjetëra herë në mbrëmje (pika 6), kurse tema zgjidhet një herë dhe
 * pastaj mbahet mend.
 *
 * Ikona krah emrit sepse çelësi lexohet me bisht të syrit: dielli, hëna dhe
 * telefoni thonë sa fjala, dhe më shpejt.
 */

import { Ikona } from '../ikonat.tsx';
import { useTema, vendosTemen } from '../ndricimi.ts';
import { TEMAT } from '../tema.ts';

export function CelesiINdricimit() {
  const tema = useTema();

  return (
    <div className="celesi fundfaqja__ndricimi" role="group" aria-label="Ndriçimi i ekranit">
      {TEMAT.map(({ tema: njesia, emri, ikona }) => (
        <button
          type="button"
          key={njesia}
          className="celesi__njesi"
          aria-pressed={tema === njesia}
          onClick={() => vendosTemen(njesia)}
        >
          <Ikona emri={ikona} />
          {emri}
        </button>
      ))}
    </div>
  );
}
