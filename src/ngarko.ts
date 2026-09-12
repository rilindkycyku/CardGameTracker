/**
 * Ngarkimi i të dhënave nga IndexedDB.
 *
 * Asnjë bibliotekë gjendjeje: ekranet lexojnë nga baza kur hapen dhe e
 * rilexojnë atë pas çdo shkrimi. Baza është lokale — një lexim i tërë është
 * disa milisekonda — prandaj një cache që mund të dalë jashtë sinkronie do të
 * ishte rrezik pa përfitim.
 */

import { useCallback, useEffect, useState } from 'react';

import { onBazaNdryshoi } from './ruajtja.ts';

export type Ngarkesa<T> = {
  /** `null` derisa leximi i parë të mbarojë. */
  te_dhenat: T | null;
  /** Rilexon nga baza — thirret pas çdo shkrimi. */
  rifresko: () => void;
};

export function useNgarko<T>(lexo: () => Promise<T>, varet: unknown[]): Ngarkesa<T> {
  const [te_dhenat, cakto] = useState<T | null>(null);
  const [gabimi, caktoGabimin] = useState<Error | null>(null);
  const [numeruesi, rinumero] = useState(0);

  const rifresko = useCallback(() => rinumero((n) => n + 1), []);

  // Sinkronizimi shkruan te baza pa e prekur asnjë ekran (pika 19), prandaj
  // rileximi duhet të vijë nga baza e jo nga një prekje: pa këtë, mbrëmja e
  // mbërritur nga telefoni tjetër do të dukej vetëm pas një rifreskimi faqeje.
  useEffect(() => onBazaNdryshoi(rifresko), [rifresko]);

  useEffect(() => {
    let gjalle = true;

    void lexo().then(
      (dala) => {
        if (gjalle) cakto(dala);
      },
      (err: unknown) => {
        if (gjalle) caktoGabimin(err instanceof Error ? err : new Error(String(err)));
      },
    );

    return () => {
      gjalle = false;
    };
    // `lexo` rikrijohet në çdo vizatim, prandaj varësia është ajo që i jepet
    // nga ekrani (p.sh. `id`-ja) plus numëruesi i rifreskimeve.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...varet, numeruesi]);

  /*
   * Një lexim i dështuar hidhet gjatë vizatimit, që ta kapë `Gardhi`.
   *
   * Kufijtë e gabimit të React-it i kapin vetëm gabimet e vizatimit — një
   * premtim i refuzuar u kalon pranë pa u prekur. Pa këtë rresht, një bazë që
   * nuk hapet dot (kuota e mbushur, një skedë tjetër që bllokon, IndexedDB e
   * fikur në shfletim privat) do ta linte ekranin te «Duke lexuar…» **pa fund**,
   * pa asnjë fjalë se çka ndodhi dhe pa asnjë rrugë përpara. Kështu del kartela
   * që thotë se pikët janë të sigurta dhe si provohet sërish.
   */
  if (gabimi) throw gabimi;

  return { te_dhenat, rifresko };
}
