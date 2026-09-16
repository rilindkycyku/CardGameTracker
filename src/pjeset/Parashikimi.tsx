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
 *
 * ## Te ekrani i gjerë të dyja tabelat bëhen një
 *
 * Renditja dhe parashikimi i kanë dy kolonat e para të njëjta — vendi dhe
 * lojtari — dhe të dyja rrinë njëra nën tjetrën te e njëjta shtyllë. Sapo ekrani
 * ka gjerësi, ajo është një kokë tabele, një radhë emrash dhe një gjysmë ekrani
 * të shpenzuar dy herë për të njëjtën gjë. Prandaj `renditja` jepet si prop:
 * atëherë ky komponent vizaton një seksion të vetëm — titulli i renditjes,
 * çelësi, fjalia, dhe një tabelë me pesë kolona.
 *
 * Tabelën e vizaton ende `TabelaERenditjes`, e jo një e dytë e shkruar këtu:
 * kurora, vendi i parë dhe kolona e raundeve janë vendime të renditjes, dhe dy
 * kopje të tyre do të dilnin jashtë sinkronie pikërisht atje ku numri duhet të
 * jetë i njëjti.
 *
 * **Bashkohen vetëm kur të dy listat kanë të njëjtët lojtarë.** Renditja i lë
 * jashtë ata që s'kanë shënuar ende (pika 5), kurse parashikimi i mban — kush u
 * ul te raundi i fundit e ka ende një vend që mund ta zërë. Një tabelë e vetme
 * mbi rreshtat e renditjes do ta fshihte atë rresht pa e thënë kush, prandaj në
 * atë rast të dyja mbeten të ndara, ashtu si te telefoni.
 */

import { memo, useMemo, useState } from 'react';

import { FJALA } from '../magareci.ts';
import { parashikimi as llogarit, raundetEMbetura } from '../parashikimi.ts';
import type { LlojiILojes } from '../tipet.ts';
import { Ikona } from '../ikonat.tsx';
import {
  type HyrjetERenditjes,
  NjoftimiIRaundeve,
  Renditja,
  TabelaERenditjes,
} from './Renditja.tsx';

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
  renditja,
  bashko = false,
}: {
  lloji: LlojiILojes;
  players: string[];
  /** Pikët te bridzhi, shkronjat te magareci — si te `Renditja`. */
  totalet: Record<string, number>;
  /** Sa raunde janë shënuar deri tani. */
  luajtur: number;
  /**
   * Hyrjet e renditjes, kur ajo vizatohet nga këtu.
   *
   * Pa të, ky komponent mbetet pikërisht ai që ishte — një seksion me tabelën e
   * vet, dhe renditjen e vizaton thirrësi. Me të, renditja del nga këtu: ose e
   * bashkuar, ose si seksion i vetin mbi parashikimin. Të dyja rrugët e mbajnë
   * renditjen në ekran edhe kur s'ka çka të parashikohet.
   */
  renditja?: HyrjetERenditjes;
  /**
   * A ka ekrani gjerësi sa për një tabelë të vetme.
   *
   * Vjen si prop e nuk pyetet këtu: kështu ky komponent mbetet vizatim i
   * pastër, dhe `matchMedia`-n e njeh një vend i vetëm (`pamja.ts`).
   */
  bashko?: boolean;
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
  // e thotë vetë të tërën — nuk ka mbetur asgjë që mund të ndryshojë. Renditja
  // nuk bie bashkë me të: kur vizatimi i saj ka ardhur këtu, ajo mbetet e vetmja
  // gjë që duhet parë — pra dilet me të e jo me `null`.
  if (players.length < 2 || mbetur === 0)
    return renditja ? <Renditja {...renditja} /> : null;

  /*
   * Bashkohen vetëm kur të dyja listat kanë të njëjtët lojtarë.
   *
   * Tabela e bashkuar i vizaton rreshtat e renditjes, pra kush mungon prej
   * saj e humb edhe parashikimin e vet. Te ekrani i lojës kjo nuk ndodh —
   * `renditja` aty i merr të gjithë lojtarët, edhe atë që s'ka shënuar ende —
   * por kushti rri i shkruar sepse ai është pikërisht ajo që e bën bashkimin të
   * ndershëm: një thirrës që i jep rreshtat e filtruar (`renditjaELojes`, pika
   * 5) i merr të dyja tabelat të ndara, e nuk i humb një lojtar në heshtje.
   * Rreshtat janë gjithmonë nënbashkësi e lojtarëve, prandaj numri mjafton.
   */
  const bashkuar =
    bashko && renditja != null && renditja.rreshtat.length === players.length;

  const celesi = mbetur > 1 && (
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
  );

  const fjalia = (
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
  );

  /*
   * Supozimet rrinë poshtë tabelës, por të mbledhura.
   *
   * Ato nuk hiqen dot (pika 12): një interval vendesh pa to është numër që nuk
   * e kontrollon dot kush e lexon, dhe «vendi më i keq» te bridzhi është kufi i
   * rregullit e jo i së mundshmes — pa atë fjali ai numër lexohet si parashikim.
   *
   * Por ato lexohen një herë, jo pas çdo raundi, kurse hapësirën e zinin
   * gjithmonë: shtatë rreshta tekst nën tabelën që pyetet dhjetëra herë në
   * mbrëmje, dhe te tableta e mbajtur anash pikërisht ato e shtynin tabelën e
   * raundeve jashtë ekranit. Te një `<details>` teksti mbetet fjalë për fjalë
   * ai që ishte, një prekje larg, dhe kreu i tij e thotë çka gjendet brenda —
   * i njëjti zakon si rregullat e lojës (pika 16).
   */
  const ndihma = (
    <details className="detaje detaje--supozimet">
      <summary className="detaje__krye">
        <span>Si llogariten këta numra</span>
        <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
      </summary>
      <div className="detaje__trupi">
        <p className="ndihma">
          {magarec ? (
            <>
              Mbrëmja mbaron kur mbushet fjala, prandaj {raundet(mbetur)} është
              sa mund të luhen më së shumti — jo sa do të luhen. Shkronjat nuk
              kthehen prapa: vendin ia ndërrojnë ato të të tjerëve, dhe ato
              ndahen — një për raund.
            </>
          ) : (
            <>
              Loja mbaron pas dy raundeve për lojtar, prandaj{' '}
              {raundet(mbetur)} është sa ka mbetur vërtet. Supozimi: mbyllje
              hant çdo raund (−40) ndërsa të tjerët nuk hapin fare (+200) — pra
              një raund mbyll 240 pikë diferencë. Mbyllja është një për raund,
              dhe një dorë mbi 100 pikë e kalon kufirin 200: vendi më i keq
              është kufi i rregullit, jo i së mundshmes.
            </>
          )}{' '}
          Barazimi numërohet si i njëjti vend, dhe «·» do të thotë që e ka
          tashmë vendin e parë.
        </p>
      </div>
    </details>
  );

  /*
   * Një seksion i vetëm: titulli i renditjes, dhe numri i raundeve krah tij.
   *
   * Titulli mbetet «Renditja» sepse ajo është pyetja e parë pas çdo raundi, dhe
   * kolonat e parashikimit vijnë pas totalit — të fundit, si të fundit që
   * lexohen. Çelësi dhe fjalia rrinë mbi tabelë e jo nën të: ato e ndërrojnë
   * pikërisht atë që shkruhet te dy kolonat e fundit, dhe një kontroll nën atë
   * që e ndryshon nuk lexohet si kontroll.
   */
  if (bashkuar)
    return (
      <section>
        <h2 className="titull-seksioni">
          <Ikona emri="renditja" />
          Renditja
          <span className="titull-seksioni__numri">
            {magarec ? 'së shumti ' : 'edhe '}
            {raundet(mbetur)}
          </span>
        </h2>

        {renditja.luajtur && <NjoftimiIRaundeve />}
        {celesi}
        {fjalia}

        <TabelaERenditjes
          rreshtat={renditja.rreshtat}
          luajtur={renditja.luajtur}
          drejtimi={renditja.drejtimi}
          parashikimi={p.rreshtat}
        />

        {ndihma}
      </section>
    );

  return (
    <>
      {renditja && <Renditja {...renditja} />}

      <section>
        <h2 className="titull-seksioni">
          <Ikona emri="info" />
          Parashikimi
          <span className="titull-seksioni__numri">
            {magarec ? 'së shumti ' : 'edhe '}
            {raundet(mbetur)}
          </span>
        </h2>

        {celesi}
        {fjalia}

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

        {ndihma}
      </section>
    </>
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
