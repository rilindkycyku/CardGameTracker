/**
 * Rreshti mbi titullin e faqes — ose etiketë, ose vetë shtegu i kthimit.
 *
 * Deri tani ishin dy gjëra njëra mbi tjetrën: një shteg («‹ Shoqëria») dhe, një
 * rresht më poshtë, e njëjta fjalë si etiketë mbi titull. Te ekrani i lojës ato
 * ishin fjalë për fjalë i njëjti emër grupi i shkruar dy herë, dhe te ekrani i
 * grupit dy fjalë që thoshin të njëjtën gjë («Grupet» dhe «Grupi»). Rreshti i
 * parë e shtynte poshtë titullin te çdo ekran, pa shtuar asgjë.
 *
 * Tani është një i vetëm: shigjeta hyn te vetë etiketa, dhe fjala që ishte aty
 * bëhet ajo ku shkon prekja. Kush kthehet e gjen atje ku ishte — mbi titull, në
 * krye të faqes — dhe faqja fiton një rresht.
 *
 * Pa `shtegu` mbetet tekst i thjeshtë: te `#/shiko` nuk ka ku të kthehesh, dhe
 * një shigjetë që nuk shpie askund është premtim i thyer.
 */

import type { MouseEvent, ReactNode } from 'react';

import { Ikona } from '../ikonat.tsx';

export type ShtegiIKthimit = {
  href: string;
  /**
   * Kur kthimi nuk bëhet dot me adresë — p.sh. një lojë pa grupin e vet, ku
   * `shko('/')` është e vetmja rrugë prapa.
   */
  onClick?: (ngjarja: MouseEvent<HTMLAnchorElement>) => void;
};

export function MbiTitullin({
  shtegu,
  children,
}: {
  /** Ku shpie prekja. Pa të, rreshti është etiketë e jo lidhje. */
  shtegu?: ShtegiIKthimit;
  children: ReactNode;
}) {
  if (!shtegu) return <p className="kreu__mbi">{children}</p>;

  return (
    <a className="kreu__mbi" href={shtegu.href} onClick={shtegu.onClick}>
      <Ikona emri="kthehu" />
      {children}
    </a>
  );
}
