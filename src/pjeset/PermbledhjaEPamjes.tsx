/**
 * Përmbledhja e pamjes së ndarë — përgjigjja para tabelave.
 *
 * Kush skanon një kod nuk e ka hapur aplikacionin: ai është ulur te tavolina,
 * telefoni i tij sapo hapi një faqe, dhe pyetja e parë është një e vetme — *kush
 * prin, dhe sa larg jam unë*. Tabelat poshtë e thonë, por kërkojnë lexim; ky
 * bllok e thotë me një shikim.
 *
 * Asgjë këtu nuk shtoi qoftë edhe një bajt te paketa. Totalet dhe radha e
 * tavolinës mjaftojnë: renditja del nga totalet, raundet e mbetura nga numri i
 * lojtarëve (pika 13), dhe kush përzien nga radha e tyre — të njëjtat llogari
 * si te ekrani i lojës, nga të njëjtat module.
 */

import {
  fituesit,
  perziersiIRaundit,
  raundetELojes,
} from '../llogaritjet.ts';
import { FJALA, fjalaE, rreshtatEMagarecit } from '../magareci.ts';
import type { Pamja } from '../ndarja.ts';
import type { RreshtiRenditjes } from '../tipet.ts';
import { Ikona } from '../ikonat.tsx';

export function PermbledhjaEPamjes({
  pamja,
  rreshtat,
  perfundoi = false,
}: {
  pamja: Pamja;
  /** Renditja e gatshme — që të mos llogaritet dy herë te i njëjti ekran. */
  rreshtat: RreshtiRenditjes[];
  /**
   * A është e kryer mbrëmja.
   *
   * Dy fakte këtu shikojnë përpara — sa raunde kanë mbetur, dhe kush përzien
   * atë që vjen — dhe mbi një fletë të mbyllur të dyja janë të pavërteta: nuk
   * vjen asnjë raund, prandaj nuk përzien kush.
   */
  perfundoi?: boolean;
}) {
  const magarec = pamja.lloji === 'magarec';
  const emrat = pamja.totalet.map(([emri]) => emri);

  const pari = rreshtat[0];
  if (!pari) return null;

  /*
   * Kush prin — dhe barazimi te kreu nuk fshihet.
   *
   * `rreshtat[0]` e ndan barazimin sipas radhës së listës, dhe te tabela ashtu
   * duhet. Por këtu shkruhet një fjali, dhe «delta prin» me tre veta te 360
   * pikë do të ishte e pavërtetë.
   */
  const pareter = fituesit(rreshtat);

  /* I pari që nuk është baras me kreun — atij i matet largësia. */
  const tjetri = rreshtat.find((rreshti) => rreshti.total !== pari.total) ?? null;

  // Raundet e mbetura vlejnë vetëm te bridzhi: magareci mbaron kur mbushet
  // fjala, e jo pas një numri raundesh (pika 13).
  const gjithsej = magarec ? 0 : raundetELojes(emrat);
  const mbetur = magarec ? 0 : Math.max(0, gjithsej - pamja.raunde);

  // Kush përzien raundin që vjen. Pas raundit të fundit nuk ka më kush.
  const perziersi =
    perfundoi || (!magarec && mbetur === 0)
      ? null
      : perziersiIRaundit(emrat, pamja.raunde + 1);

  /* Te magareci pyetja e dytë nuk është kush prin, por kush është më afër fundit. */
  const rrezikuari = magarec
    ? [...rreshtatEMagarecit(emrat, Object.fromEntries(pamja.totalet))].sort(
        (a, b) => b.shkronja - a.shkronja,
      )[0]
    : null;

  return (
    <section className="permbledhja" aria-label="Përmbledhja">
      <p className="permbledhja__krye">
        <Ikona emri="renditja" />
        <span>
          <strong>{pareter.join(', ')}</strong>{' '}
          {pareter.length > 1
            ? magarec
              ? 'janë më larg fundit'
              : 'janë baras në krye'
            : magarec
              ? 'është më larg fundit'
              : 'prin'}
        </span>
      </p>

      <p className="permbledhja__numri">
        {magarec ? fjalaE(pari.total) || '—' : pari.total}
      </p>

      <p className="permbledhja__nen">
        {tjetri
          ? magarec
            ? `${tjetri.player} vjen me ${fjalaE(tjetri.total) || 'asnjë shkronjë'}`
            : `${tjetri.player} vjen ${tjetri.total - pari.total} pikë prapa`
          : rreshtat.length > 1
            ? 'të gjithë janë baras'
            : 'i vetmi te tavolina'}
      </p>

      <ul className="permbledhja__fakte">
        <li>
          <Ikona emri="shlyerja" />
          <span>
            {magarec
              ? `${pamja.raunde} ${pamja.raunde === 1 ? 'raund' : 'raunde'}`
              : `${pamja.raunde} nga ${gjithsej} raunde`}
          </span>
        </li>

        {!magarec && (
          <li>
            <Ikona emri="luaj" />
            <span>
              {perfundoi || mbetur === 0
                ? 'loja mbaroi'
                : `edhe ${mbetur} ${mbetur === 1 ? 'raund' : 'raunde'}`}
            </span>
          </li>
        )}

        {magarec && rrezikuari && (
          <li>
            <Ikona emri="kujdes" />
            <span>
              {rrezikuari.shkronja === 0
                ? `asnjë shkronjë ende`
                : `${rrezikuari.player} i ka ${rrezikuari.shkronja} nga ${FJALA.length}`}
            </span>
          </li>
        )}

        {perziersi && (
          <li>
            <Ikona emri="grupi" />
            <span>
              përzien <strong>{perziersi}</strong>
            </span>
          </li>
        )}
      </ul>
    </section>
  );
}
