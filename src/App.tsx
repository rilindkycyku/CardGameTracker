/**
 * Shpërndarja e rrugëve.
 *
 * Pak rrugë, prandaj një `switch` mbi pjesën e parë të shtegut. Rruga që nuk
 * njihet nuk është faqe gabimi: kthen te grupet, sepse aty fillon gjithçka.
 *
 * Tri rrugë nuk lexojnë fare nga baza, sepse gjendjen e mban vetë adresa —
 * prandaj hapen edhe në një telefon që nuk e ka pasur kurrë aplikacionin,
 * pikërisht ai që sapo skanoi kodin:
 *
 *   `#/shiko/<paketë>`     fotografia e çastit
 *   `#/lidhu/<ftesë>`      pamja e drejtpërdrejtë pa server
 *   `#/pergjigje/<kod>`    skeda që i dorëzon përgjigjen skedës së lojës
 *   `#/bashkohu[/<kod>]`   pamja e drejtpërdrejtë me kod, përmes serverit
 */

import { Grupet } from './pamjet/Grupet.tsx';
import { Grupi } from './pamjet/Grupi.tsx';
import { Bashkohu } from './pamjet/Bashkohu.tsx';
import { Lidhu } from './pamjet/Lidhu.tsx';
import { Loja } from './pamjet/Loja.tsx';
import { Pergjigja } from './pamjet/Pergjigja.tsx';
import { Shiko } from './pamjet/Shiko.tsx';
import { numri, pjeset, useRruga } from './rruga.ts';

export function App() {
  const rruga = useRruga();
  const [pjesa, e_dyta] = pjeset(rruga);
  const id = numri(e_dyta);

  // Paketa mund të përmbajë „/" pas base64-shit? Nuk mundet — alfabeti i
  // `paketa.ts` e përjashton — prandaj pjesa e dytë mjafton.
  if (pjesa === 'shiko' && e_dyta) return <Shiko kodi={e_dyta} />;
  if (pjesa === 'lidhu' && e_dyta) return <Lidhu kodi={e_dyta} />;
  if (pjesa === 'pergjigje' && e_dyta) return <Pergjigja kodi={e_dyta} />;
  if (pjesa === 'bashkohu') return <Bashkohu kodi={e_dyta ?? null} />;
  if (pjesa === 'grupi' && id !== null) return <Grupi id={id} />;
  if (pjesa === 'loja' && id !== null) return <Loja id={id} />;

  return <Grupet />;
}
