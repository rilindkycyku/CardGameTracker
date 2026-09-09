/**
 * Shpërndarja e rrugëve.
 *
 * Katër rrugë, prandaj një `switch` mbi pjesën e parë të shtegut. Rruga që nuk
 * njihet nuk është faqe gabimi: kthen te grupet, sepse aty fillon gjithçka.
 */

import { Grupet } from './pamjet/Grupet.tsx';
import { Grupi } from './pamjet/Grupi.tsx';
import { Loja } from './pamjet/Loja.tsx';
import { numri, pjeset, useRruga } from './rruga.ts';

export function App() {
  const rruga = useRruga();
  const [pjesa, e_dyta] = pjeset(rruga);
  const id = numri(e_dyta);

  if (pjesa === 'grupi' && id !== null) return <Grupi id={id} />;
  if (pjesa === 'loja' && id !== null) return <Loja id={id} />;

  return <Grupet />;
}
