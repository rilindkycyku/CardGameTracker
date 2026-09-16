/**
 * Ora e mbrëmjes te kreu i fletës: kur nisi, dhe sa ka që zgjat.
 *
 * Pyetja bëhet me letrat në dorë — *sa kohë ka që kemi nisur?* — dhe deri tani
 * fleta e dinte vetëm ditën. Tani e thotë ora e hapjes krah numrit që ecën me
 * të, dhe sapo mbrëmja mbaron ai numër ngrin te sa zgjati vërtet.
 *
 * Çka shkruhet e vendos `koha.ts` (pika 1); këtu rri vetëm ajo që ai nuk e bën
 * dot: numërimi. Një minutë është hapi i duhur — ekrani shkruan minuta, dhe një
 * numërues për sekonda do ta ndizte ekranin e telefonit çdo sekondë për një
 * shifër që nuk ndërron.
 *
 * Ora rilexohet edhe kur skeda kthehet në pamje: tableta që fjeti mbi tavolinë
 * i ka ndalur kohëmatësit e vet, dhe pa atë rresht numri do të kthehej i
 * ngrirë aty ku e la.
 */

import { useEffect, useState } from 'react';

import { Ikona } from '../ikonat.tsx';
import { fjaliaEKohes } from '../koha.ts';

/** Sa shpesh rilexohet ora sa mbrëmja vazhdon. */
const HAPI = 60_000;

export function Kohezgjatja({
  nisi,
  fundi,
  perfundoi,
}: {
  /** `createdAt` i lojës — çasti kur u hap fleta. */
  nisi: number | undefined;
  /** Vula e raundit të fundit të shënuar, ose `null` kur nuk dihet. */
  fundi: number | null;
  perfundoi: boolean;
}) {
  const [tani, caktoTani] = useState(() => Date.now());

  useEffect(() => {
    // Mbrëmja e kryer nuk numërohet më: fundi i saj është një vulë e shkruar,
    // dhe një orë që ecën mbi të do ta rriste një numër të mbaruar.
    if (perfundoi) return;

    const rilexo = () => caktoTani(Date.now());
    const kohematesi = setInterval(rilexo, HAPI);
    document.addEventListener('visibilitychange', rilexo);

    return () => {
      clearInterval(kohematesi);
      document.removeEventListener('visibilitychange', rilexo);
    };
  }, [perfundoi]);

  const fjalia = fjaliaEKohes(nisi, fundi, tani, perfundoi);
  // Një fletë e kthyer nga një kopje e vjetër nuk e ka asnjë vulë, dhe atëherë
  // kreu mbetet ashtu si ishte — më mirë asgjë se një orë e shpikur.
  if (fjalia === null) return null;

  return (
    <span className="etiketa">
      <Ikona emri="ora" />
      {fjalia}
    </span>
  );
}
