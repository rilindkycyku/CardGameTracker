/**
 * Çelësi i ndriçimit — sistemi, dritë, terr.
 *
 * Rri te fundfaqja, krah versionit — atje ku faqja flet për vete. Deri tani ajo
 * fundfaqe ishte vetëm te ekrani i parë, dhe kjo e bënte temën një zgjedhje që
 * kërkonte dalje nga loja: mbrëmja nis me dritë e mbaron në terr, dhe ndërrimi
 * do të thoshte kthim te grupet e hapje e raundit prapë. Me kërkesë të pronarit
 * fundfaqja tani rri te çdo ekran (`Fundfaqja`), pra edhe çelësi.
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
