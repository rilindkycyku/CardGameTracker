/**
 * Mbledhja e dorës — një llogaritëse e vogël për një lojtar të vetëm.
 *
 * Pikët e një dore nuk janë një numër që dikush e mban në kokë: janë letrat
 * e mbetura, ose gurët e mbetur, të mbledhur një nga një te tavolina. Deri tani
 * ajo mbledhje bëhej jashtë aplikacionit — me gishta, ose me llogaritësen e
 * telefonit — dhe te fusha shkruhej vetëm shuma. Nëse dikush gabonte, gabimi
 * hynte te raundi pa lënë gjurmë.
 *
 * Prandaj kjo mban **termat**, jo vetëm shumën: «10 + 15 + 5» rri e shkruar sa
 * kohë kutia është hapur, dhe fshirja prapa e heq termin e fundit e jo tërë
 * punën.
 *
 * Rri modul pa React e pa `document` (pika 1), që `node --test` t'i ekzekutojë
 * provat drejtpërdrejt: kjo është aritmetikë, dhe aritmetika provohet pa ekran.
 *
 * Shenja nuk hyn këtu. Te fushat minusi ka butonin e vet (`fusha.ts`), dhe një
 * dorë me letra në të nuk është kurrë negative — mbledhësja jep gjithmonë një
 * numër pa shenjë, dhe kush e thërret vendos ku shkon ai.
 */

/** Sa shifra pranon një term. Katër: 9999 pikë në dorë nuk i ka asnjë lojë. */
const SHIFRAT = 4;

/**
 * Gjendja e mbledhjes: termat e mbyllur, dhe ai që po shkruhet.
 *
 * `tani` mbetet tekst e jo numër sepse «0» dhe «» nuk janë e njëjta gjendje:
 * njëra është një term i shkruar, tjetra është asgjë — dhe butoni «Gati» e ndan
 * dot vetëm ashtu.
 */
export type Mbledhja = {
  terma: number[];
  tani: string;
};

export const ZBRAZET: Mbledhja = { terma: [], tani: '' };

/**
 * Nis nga ajo që ka tashmë fusha.
 *
 * Kush e hap kutinë mbi një numër të shkruar zakonisht do t'i shtojë diçka —
 * prandaj ai numër bëhet termi që po shkruhet e jo term i mbyllur: fshirja
 * prapa e heq shifrë për shifre, ashtu si te çdo llogaritëse.
 *
 * Shenja hiqet me qëllim (shih kreun e skedarit), dhe çdo tekst që nuk jep numër
 * lexohet si fillim nga e para.
 */
export function nisNga(teksti: string | null | undefined): Mbledhja {
  const shifrat = (teksti ?? '').replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
  if (!shifrat) return ZBRAZET;
  return { terma: [], tani: shifrat.slice(0, SHIFRAT) };
}

/** Shton një shifër te termi që po shkruhet. Zeroja e parë zëvendësohet. */
export function shtoShifren(m: Mbledhja, shifra: string): Mbledhja {
  if (!/^[0-9]$/.test(shifra)) return m;
  if (m.tani === '0') return { ...m, tani: shifra };
  if (m.tani.length >= SHIFRAT) return m;
  return { ...m, tani: m.tani + shifra };
}

/**
 * E mbyll termin që po shkruhet dhe hap një të ri — butoni «+».
 *
 * Pa term të shkruar nuk bën asgjë: «+ +» do të fuste një zero që askush nuk e
 * shtypi, dhe ajo do të dilte te rreshti i termave si letër e mbetur.
 */
export function shtoTermin(m: Mbledhja): Mbledhja {
  if (m.tani === '') return m;
  return { terma: [...m.terma, Number(m.tani)], tani: '' };
}

/**
 * Fshirja prapa: një shifër, ose — kur nuk ka shifra — termi i fundit.
 *
 * Termi kthehet i tëri te `tani` e jo i fshirë: gabimi më i shpeshtë është një
 * shifër e shtypur keq te termi që sapo u mbyll, dhe ashtu rregullohet me një
 * prekje të dytë e jo duke e rishkruar.
 */
export function fshiPrapa(m: Mbledhja): Mbledhja {
  if (m.tani !== '') return { ...m, tani: m.tani.slice(0, -1) };
  if (m.terma.length === 0) return m;
  const terma = m.terma.slice(0, -1);
  return { terma, tani: String(m.terma[m.terma.length - 1]) };
}

/** Sa bën gjithsej — termat e mbyllur bashkë me atë që po shkruhet. */
export function shuma(m: Mbledhja): number {
  const tani = m.tani === '' ? 0 : Number(m.tani);
  return m.terma.reduce((s, n) => s + n, 0) + tani;
}

/** A nuk është shtypur ende asgjë — atëherë nuk ka çka të kthehet te fusha. */
export function bosh(m: Mbledhja): boolean {
  return m.terma.length === 0 && m.tani === '';
}

/**
 * Termat si varg: «10 + 15 + 5».
 *
 * Termi që po shkruhet hyn i fundit pa u dalluar nga të tjerët: te letrat në
 * dorë ai është një term si çdo tjetër, thjesht ende i pambyllur, dhe një shenjë
 * e veçantë mbi të do të kërkonte të shpjegohej.
 */
export function shkrimi(m: Mbledhja): string {
  const pjeset = [...m.terma.map(String), ...(m.tani === '' ? [] : [m.tani])];
  return pjeset.join(' + ');
}
