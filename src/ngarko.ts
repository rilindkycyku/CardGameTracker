/**
 * Ngarkimi i të dhënave nga IndexedDB.
 *
 * Asnjë bibliotekë gjendjeje: ekranet lexojnë nga baza kur hapen dhe e
 * rilexojnë atë pas çdo shkrimi. Baza është lokale — një lexim i tërë është
 * disa milisekonda — prandaj një cache që mund të dalë jashtë sinkronie do të
 * ishte rrezik pa përfitim.
 */

import { useCallback, useEffect, useState } from 'react';

export type Ngarkesa<T> = {
  /** `null` derisa leximi i parë të mbarojë. */
  te_dhenat: T | null;
  /** Rilexon nga baza — thirret pas çdo shkrimi. */
  rifresko: () => void;
};

export function useNgarko<T>(lexo: () => Promise<T>, varet: unknown[]): Ngarkesa<T> {
  const [te_dhenat, cakto] = useState<T | null>(null);
  const [numeruesi, rinumero] = useState(0);

  const rifresko = useCallback(() => rinumero((n) => n + 1), []);

  useEffect(() => {
    let gjalle = true;

    void lexo().then((dala) => {
      if (gjalle) cakto(dala);
    });

    return () => {
      gjalle = false;
    };
    // `lexo` rikrijohet në çdo vizatim, prandaj varësia është ajo që i jepet
    // nga ekrani (p.sh. `id`-ja) plus numëruesi i rifreskimeve.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...varet, numeruesi]);

  return { te_dhenat, rifresko };
}
