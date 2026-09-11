/**
 * Parashikimi i vendeve — çka mund të ndodhë nëse luhen edhe pak raunde.
 *
 * Renditja thotë ku janë tani; pyetja që vjen menjëherë pas saj është tjetër, e
 * bëhet rreth tavolinës çdo mbrëmje: *a e arrin dot i dyti të parin nëse
 * luajmë edhe një raund?* Llogaria rri te `parashikimi.ts`; këtu vizatohet.
 *
 * Numri i raundeve është çelës e jo hamendje. Bridzhi nuk ka fund të vetin —
 * mbrëmja mbaron kur ngrihen nga tavolina — prandaj «brenda sa raundeve»
 * duhet zgjedhur, dhe ekrani nuk e shpik dot atë numër. Magareci e ka fundin e
 * vet, prandaj zgjedhjet i priten sipas raundeve që i kanë mbetur.
 *
 * Supozimet rrinë të shkruara poshtë tabelës. Një interval vendesh pa to është
 * numër që nuk kontrollohet dot nga kush e lexon — dhe ai i skajshëm («vendi më
 * i keq» te bridzhi) është kufi i rregullit, jo i së mundshmes.
 */

import { memo, useMemo, useState } from 'react';

import { FJALA } from '../magareci.ts';
import {
  RAUNDET_E_PARASHIKIMIT,
  parashikimi as llogarit,
} from '../parashikimi.ts';
import type { LlojiILojes } from '../tipet.ts';
import { Ikona } from '../ikonat.tsx';

/** „1 raund" / „3 raunde", që teksti të mos dalë i çalë te njëshi. */
function raundet(sa: number): string {
  return `${sa} ${sa === 1 ? 'raund' : 'raunde'}`;
}

/** Emrat si fjali: „alfa, beta dhe gama". */
function lista(emrat: string[]): string {
  if (emrat.length <= 1) return emrat[0] ?? '';
  return `${emrat.slice(0, -1).join(', ')} dhe ${emrat[emrat.length - 1]}`;
}

function ParashikimiBrenda({
  lloji,
  players,
  totalet,
}: {
  lloji: LlojiILojes;
  players: string[];
  /** Pikët te bridzhi, shkronjat te magareci — si te `Renditja`. */
  totalet: Record<string, number>;
}) {
  const [raunde, caktoRaundet] = useState(1);
  const magarec = lloji === 'magarec';

  // Hook-et rrinë mbi kthimet e para, si te `Loja`: një `useMemo` nën një
  // `return` të kushtëzuar e ndërron numrin e hook-eve mes dy vizatimeve.
  const kufiri = useMemo(
    () => (magarec ? llogarit(lloji, players, totalet, 0).kufiriIRaundeve : null),
    [lloji, magarec, players, totalet],
  );

  const zgjedhjet = useMemo(() => {
    if (kufiri === null) return RAUNDET_E_PARASHIKIMIT;
    const brenda = RAUNDET_E_PARASHIKIMIT.filter((n) => n <= kufiri);
    return brenda.length > 0 ? brenda : [kufiri];
  }, [kufiri]);

  const zgjedhur = zgjedhjet.includes(raunde) ? raunde : (zgjedhjet[0] ?? 1);
  const p = useMemo(
    () => llogarit(lloji, players, totalet, zgjedhur),
    [lloji, players, totalet, zgjedhur],
  );

  /** Kush e mbush dot ende fjalën — pyetja e vërtetë e magarecit. */
  const rrezikuar = useMemo(
    () =>
      magarec
        ? p.rreshtat
            .filter((r) => r.meIKeqiTotali >= FJALA.length)
            .map((r) => r.player)
        : [],
    [magarec, p],
  );

  // Me një lojtar nuk ka çka të parashikohet, dhe pas fjalës së mbushur nuk ka
  // raund tjetër — atëherë ky bllok nuk thotë asgjë që s'e thotë renditja.
  if (players.length < 2 || p.raunde === 0) return null;

  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="info" />
        Parashikimi
      </h2>

      <div className="fusha" data-hapesire="posht">
        <span className="fusha__etiketa">Nëse luhen edhe</span>
        <div className="celesi" role="group" aria-label="Raunde të mbetura">
          {zgjedhjet.map((n) => (
            <button
              type="button"
              key={n}
              className="celesi__njesi"
              aria-pressed={n === zgjedhur}
              onClick={() => caktoRaundet(n)}
            >
              {raundet(n)}
            </button>
          ))}
        </div>
      </div>

      <p
        className={
          p.pretendentet.length === 1 ? 'njoftim njoftim--mire' : 'njoftim'
        }
        data-hapesire="posht"
      >
        <Ikona emri={p.pretendentet.length === 1 ? 'renditja' : 'info'} />
        <span>
          {p.pretendentet.length === 1 ? (
            <>
              Vendi i parë nuk i merret dot më{' '}
              <strong>{p.pretendentet[0]}</strong> brenda {raundet(zgjedhur)}.
            </>
          ) : (
            <>
              Vendin e parë mund ta marrë ende{' '}
              <strong>{lista(p.pretendentet)}</strong>.
            </>
          )}
          {magarec && (
            <>
              {' '}
              {rrezikuar.length === 0
                ? `Fjalën ${FJALA} nuk e mbush dot askush brenda tyre.`
                : `Fjalën ${FJALA} mund ta mbushë ${lista(rrezikuar)}.`}
            </>
          )}
        </span>
      </p>

      <div className="tabela-mbeshtjellese">
        <table className="tabela" data-shume={players.length >= 5 || undefined}>
          <caption className="vetem-lexues">
            Vendi më i mirë dhe më i keq që mund të arrijë secili nëse luhen
            edhe {raundet(zgjedhur)}, dhe sa raunde i duhen për vendin e parë.
          </caption>
          <thead>
            <tr>
              <th scope="col">Vendi</th>
              <th scope="col">Lojtari</th>
              <th scope="col" className="numri">
                Mund të dalë
              </th>
              <th scope="col" className="numri">
                Deri te i pari
              </th>
            </tr>
          </thead>
          <tbody>
            {p.rreshtat.map((rreshti) => (
              <tr
                key={rreshti.player}
                className={rreshti.vendi === 1 ? 'rresht--pare' : undefined}
              >
                <td className="qeliza-vendi">{rreshti.vendi}</td>
                <td className="qeliza-emri">{rreshti.player}</td>
                <td
                  className={
                    rreshti.mundTeFitoje ? 'numri pike--mbyllje' : 'numri'
                  }
                >
                  {rreshti.meIMiri === rreshti.meIKeqi
                    ? rreshti.meIMiri
                    : `${rreshti.meIMiri}–${rreshti.meIKeqi}`}
                </td>
                <td className="numri qeliza-raundi">
                  {rreshti.raundetPerVendinEPare === null
                    ? '—'
                    : rreshti.raundetPerVendinEPare === 0
                      ? '·'
                      : rreshti.raundetPerVendinEPare}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="ndihma" data-hapesire="lart">
        {magarec ? (
          <>
            Shkronjat nuk kthehen prapa: vendin ia ndërrojnë ato të të tjerëve,
            dhe ato ndahen — një për raund. Mbrëmja mbaron kur mbushet fjala,
            prandaj mund të luhen edhe së shumti{' '}
            {raundet(p.kufiriIRaundeve ?? 0)}.
          </>
        ) : (
          <>
            Supozimi: mbyllje hant çdo raund (−40) ndërsa të tjerët nuk hapin
            fare (+200) — pra një raund mbyll 240 pikë diferencë. Mbyllja është
            një për raund, dhe një dorë mbi 100 pikë e kalon kufirin 200: vendi
            më i keq është kufi i rregullit, jo i së mundshmes.
          </>
        )}{' '}
        Barazimi numërohet si i njëjti vend, dhe «·» do të thotë që e ka tashmë
        vendin e parë.
      </p>
    </section>
  );
}

/**
 * Parashikimi rivizatohet vetëm kur ndryshojnë totalet, prandaj rri pas `memo`.
 *
 * Kjo punon vetëm sepse `Loja` i mban vlerat e derivuara te `useMemo`: pa
 * identitet të qëndrueshëm, krahasimi i hyrjeve do të dështonte çdo herë dhe
 * mbështjellja nuk do të kursente kurrgjë.
 */
export const Parashikimi = memo(ParashikimiBrenda);
