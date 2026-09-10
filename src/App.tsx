/**
 * Shpërndarja e rrugëve.
 *
 * Pak rrugë, prandaj një `switch` mbi pjesën e parë të shtegut. Rruga që nuk
 * njihet nuk është faqe gabimi: kthen te grupet, sepse aty fillon gjithçka.
 *
 * `#/shiko/<paketë>` është e ndryshme nga të tjerat: nuk lexon fare nga baza,
 * sepse gjendjen e mban vetë adresa. Prandaj hapet edhe në një telefon që nuk e
 * ka pasur kurrë aplikacionin — pikërisht ai që sapo skanoi kodin.
 */

import { Grupet } from './pamjet/Grupet.tsx';
import { Grupi } from './pamjet/Grupi.tsx';
import { Loja } from './pamjet/Loja.tsx';
import { Shiko } from './pamjet/Shiko.tsx';
import { numri, pjeset, useRruga } from './rruga.ts';

export function App() {
  const rruga = useRruga();
  const [pjesa, e_dyta] = pjeset(rruga);
  const id = numri(e_dyta);

  // Paketa mund të përmbajë „/" pas base64-shit? Nuk mundet — alfabeti i
  // `ndarja.ts` e përjashton — prandaj pjesa e dytë mjafton.
  if (pjesa === 'shiko' && e_dyta) return <Shiko kodi={e_dyta} />;
  if (pjesa === 'grupi' && id !== null) return <Grupi id={id} />;
  if (pjesa === 'loja' && id !== null) return <Loja id={id} />;

  return <Grupet />;
}
