/**
 * Parashikimi i vendeve — çka mund të ndodhë deri në fund të mbrëmjes.
 *
 * Renditja thotë ku janë tani; pyetja që vjen menjëherë pas saj është tjetër, e
 * bëhet rreth tavolinës çdo mbrëmje: *a e arrin dot i dyti të parin me raundet
 * që kanë mbetur?* Llogaria rri te `parashikimi.ts`; këtu vizatohet.
 *
 * Numri i raundeve nuk hamendësohet. Bridzhi mbaron pas dy raundeve për lojtar
 * dhe magareci kur dikujt i mbushet fjala, prandaj «sa ka mbetur» është numër
 * që del nga vetë loja — `raundetEMbetura` e jep, dhe ekrani nuk shpik asgjë.
 *
 * Dy pyetje bëhen vërtet, prandaj janë dy çelësa e jo pesë: *sikur të luajmë
 * edhe një raund*, dhe *deri në fund*. Kur ka mbetur vetëm një raund të dyja
 * janë e njëjta gjë, dhe çelësi zhduket.
 *
 * Supozimet rrinë të shkruara poshtë tabelës. Një interval vendesh pa to është
 * numër që nuk kontrollohet dot nga kush e lexon — dhe ai i skajshmi («vendi më
 * i keq» te bridzhi) është kufi i rregullit, jo i së mundshmes.
 */

import { memo, useMemo, useState } from 'react';

import { FJALA } from '../magareci.ts';
import { parashikimi as llogarit, raundetEMbetura } from '../parashikimi.ts';
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
  luajtur,
}: {
  lloji: LlojiILojes;
  players: string[];
  /** Pikët te bridzhi, shkronjat te magareci — si te `Renditja`. */
  totalet: Record<string, number>;
  /** Sa raunde janë shënuar deri tani. */
  luajtur: number;
}) {
  const [vetemNjeri, caktoVetemNjerin] = useState(false);
  const magarec = lloji === 'magarec';

  // Hook-et rrinë mbi kthimet e para, si te `Loja`: një `useMemo` nën një
  // `return` të kushtëzuar e ndërron numrin e hook-eve mes dy vizatimeve.
  const mbetur = useMemo(
    () => raundetEMbetura(lloji, players, totalet, luajtur),
    [lloji, players, totalet, luajtur],
  );

  const zgjedhur = vetemNjeri && mbetur > 1 ? 1 : mbetur;
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

  // Me një lojtar nuk ka çka të parashikohet, dhe pa raunde të mbetura renditja
  // e thotë vetë të tërën — nuk ka mbetur asgjë që mund të ndryshojë.
  if (players.length < 2 || mbetur === 0) return null;

  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="info" />
        Parashikimi
        <span className="titull-seksioni__numri">
          {magarec ? 'së shumti ' : 'edhe '}
          {raundet(mbetur)}
        </span>
      </h2>

      {mbetur > 1 && (
        <div className="fusha" data-hapesire="posht">
          <span className="fusha__etiketa">Sa larg të shihet</span>
          <div className="celesi" role="group" aria-label="Sa larg të shihet">
            <button
              type="button"
              className="celesi__njesi"
              aria-pressed={vetemNjeri}
              onClick={() => caktoVetemNjerin(true)}
            >
              Raundi tjetër
            </button>
            <button
              type="button"
              className="celesi__njesi"
              aria-pressed={!vetemNjeri}
              onClick={() => caktoVetemNjerin(false)}
            >
              Deri në fund
            </button>
          </div>
        </div>
      )}

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
              <strong>{p.pretendentet[0]}</strong>
              {zgjedhur === 1 ? ' te raundi tjetër' : ' deri në fund'}.
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
                ? `Fjalën ${FJALA} nuk e mbush dot askush kaq shpejt.`
                : `Fjalën ${FJALA} mund ta mbushë ${lista(rrezikuar)}.`}
            </>
          )}
        </span>
      </p>

      <div className="tabela-mbeshtjellese">
        <table className="tabela" data-shume={players.length >= 5 || undefined}>
          <caption className="vetem-lexues">
            Vendi më i mirë dhe më i keq që mund të arrijë secili nëse luhen edhe{' '}
            {raundet(zgjedhur)}, dhe sa raunde i duhen për vendin e parë.
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
            Mbrëmja mbaron kur mbushet fjala, prandaj {raundet(mbetur)} është sa
            mund të luhen më së shumti — jo sa do të luhen. Shkronjat nuk kthehen
            prapa: vendin ia ndërrojnë ato të të tjerëve, dhe ato ndahen — një
            për raund.
          </>
        ) : (
          <>
            Loja mbaron pas dy raundeve për lojtar, prandaj {raundet(mbetur)}{' '}
            është sa ka mbetur vërtet. Supozimi: mbyllje hant çdo raund (−40)
            ndërsa të tjerët nuk hapin fare (+200) — pra një raund mbyll 240
            pikë diferencë. Mbyllja është një për raund, dhe një dorë mbi 100
            pikë e kalon kufirin 200: vendi më i keq është kufi i rregullit, jo
            i së mundshmes.
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
