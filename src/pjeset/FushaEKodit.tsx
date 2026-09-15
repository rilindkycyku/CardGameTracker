/**
 * Kutia e kodit — tetë shkronja të diktuara përtej tavolinës.
 *
 * Dy ekrane e kërkojnë të njëjtën gjë me të njëjtat fjalë: «Bashkohu me kod»
 * (me server) dhe «Takohu» (me sinjalizimin tonë). Ishin dy forma të kopjuara
 * shkronjë për shkronje, dhe një ndreqje te njëra do të harrohej te tjetra.
 *
 * Kodi **nuk shkruhet nga kujtesa**: dikush në anën tjetër të tavolinës e lexon
 * me zë, dhe ky e shtyp sa e dëgjon. Prandaj kutia nuk është një fushë teksti si
 * çdo tjetër:
 *
 *   • **Shkronjat janë të mëdha dhe të larguara**, si te vetë kodi që tregohet —
 *     ashtu krahasohet me sy, shkronjë për shkronjë, pa u lexuar i tëri.
 *   • **Vija vihet vetë** pas të katërtës, dhe shkronjat që ngatërrohen me zë
 *     (`O` → `0`, `I`/`L` → `1`) ndreqen sa shtypen, e jo kur butoni nuk ndizet
 *     (`shkrimiIKodit`, me provat e veta).
 *   • **Rreshti nën të numëron sa mbeten.** Butoni rri i fikur derisa kodi të
 *     jetë i plotë, dhe një buton i fikur pa shpjegim lexohet si i prishur.
 *   • **Butoni zë tërë gjerësinë poshtë**, e nuk rri krah fushës: krah saj e
 *     shtrëngonte pikërisht atë që po shkruhet, dhe është veprimi i vetëm i
 *     ekranit.
 *
 * Fusha e vjetër mbante klasën `fusha` — atë të mbështjellëses, jo të një
 * `input`-i — prandaj nuk merrte asnjë stil të aplikacionit dhe vizatohej nga
 * shfletuesi. Kjo është arsyeja pse dukej e huaj mes gjithçkaje tjetër.
 */

import { useState } from 'react';

import { GJATESIA, lexoKodin, shkrimiIKodit } from '../kodi.ts';
import { Ikona } from '../ikonat.tsx';

export function FushaEKodit({
  onGati,
  etiketaEButonit = 'Bashkohu',
}: {
  /** Thirret me kodin e plotë, kur ai lexohet. */
  onGati: (kodi: string) => void;
  etiketaEButonit?: string;
}) {
  const [teksti, caktoTekstin] = useState('');
  const iLexuar = lexoKodin(teksti);
  const sa = teksti.replace('-', '').length;
  const mbeten = GJATESIA - sa;

  return (
    <form
      className="kodi-forma"
      onSubmit={(ngjarja) => {
        ngjarja.preventDefault();
        if (iLexuar) onGati(iLexuar);
      }}
    >
      <label className="fusha">
        <span className="fusha__etiketa">Kodi</span>
        <input
          className="kodi-kutia"
          type="text"
          value={teksti}
          placeholder="A3F2-7KQM"
          /* Pa `maxLength`: një adresë e ngjitur nga një bisedë është e gjatë,
             dhe do të pritej para se `shkrimiIKodit` ta kthente te kodi i saj. */
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          /* Ekrani ekziston vetëm për këtë fushë, prandaj tastiera hapet vetë. */
          autoFocus
          aria-label="Kodi me tetë shkronja"
          aria-describedby="kodi-gjendja"
          data-gati={iLexuar ? '' : undefined}
          onChange={(ngjarja) => caktoTekstin(shkrimiIKodit(ngjarja.target.value))}
        />
      </label>

      {/*
        Sa mbeten — dhe pse butoni rri i fikur.

        `aria-live` sepse ky rresht është e vetmja përgjigje ndaj shtypjes për
        këdo që nuk e sheh fushën; `polite` që të mos e ndërpresë shkrimin.
      */}
      <p
        className="kodi-gjendja"
        id="kodi-gjendja"
        data-gati={iLexuar ? '' : undefined}
        aria-live="polite"
      >
        {iLexuar ? (
          <>
            <Ikona emri="ruaj" />
            Kodi është i plotë
          </>
        ) : sa === 0 ? (
          'Tetë shkronja, si te telefoni që mban pikët.'
        ) : (
          `Edhe ${mbeten} ${mbeten === 1 ? 'shkronjë' : 'shkronja'}.`
        )}
      </p>

      <button
        type="submit"
        className="buton buton--kryesor buton--i-plote"
        disabled={iLexuar === null}
      >
        <Ikona emri="drejtperdrejt" />
        {etiketaEButonit}
      </button>
    </form>
  );
}
