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
 *   `#/bashkohu[/<kod>]`   pamja e drejtpërdrejtë me kod, përmes PeerJS-it
 *   `#/takohu[/<kod>]`     e njëjta, por me sinjalizimin te vetë origjina
 *
 * Rruga `#/sinkronizimi` është e pesta dhe e vetmja që shkruan jashtë pajisjes
 * (pika 19): projekti Supabase të cilin e sjell vetë përdoruesi.
 *
 * Pamjet e rënda ngarkohen me `React.lazy` në vend të importit statik, kështu
 * që hapja e parë e aplikacionit shkarkon vetëm Grupet-in (dritarja kryesore)
 * dhe pjesën tjetër vetëm kur kërkohet. Veçanërisht e rëndësishme për pamjet
 * me PeerJS (Bashkohu, Takohu) dhe Sinkronizimin me Supabase.
 */

import { Suspense, lazy } from 'react';
import { Grupet } from './pamjet/Grupet.tsx';
import { numri, pjeset, useRruga } from './rruga.ts';

const Grupi = lazy(() => import('./pamjet/Grupi.tsx').then((m) => ({ default: m.Grupi })));
const Bashkohu = lazy(() => import('./pamjet/Bashkohu.tsx').then((m) => ({ default: m.Bashkohu })));
const Lidhu = lazy(() => import('./pamjet/Lidhu.tsx').then((m) => ({ default: m.Lidhu })));
const Loja = lazy(() => import('./pamjet/Loja.tsx').then((m) => ({ default: m.Loja })));
const Pergjigja = lazy(() => import('./pamjet/Pergjigja.tsx').then((m) => ({ default: m.Pergjigja })));
const Shiko = lazy(() => import('./pamjet/Shiko.tsx').then((m) => ({ default: m.Shiko })));
const Takohu = lazy(() => import('./pamjet/Takohu.tsx').then((m) => ({ default: m.Takohu })));
const Sinkronizimi = lazy(() => import('./pamjet/Sinkronizimi.tsx').then((m) => ({ default: m.Sinkronizimi })));

export function App() {
  const rruga = useRruga();
  const [pjesa, e_dyta] = pjeset(rruga);
  const id = numri(e_dyta);

  // Grupet — faqja kryesore — mbetet import statik për t'u shfaqur menjëherë.
  // Çdo pamje tjetër ngarkohet kur kërkohet me Suspense.
  let pamja: React.ReactNode;

  // Paketa mund të përmbajë „/" pas base64-shit? Nuk mundet — alfabeti i
  // `paketa.ts` e përjashton — prandaj pjesa e dytë mjafton.
  if (pjesa === 'shiko' && e_dyta) pamja = <Shiko kodi={e_dyta} />;
  else if (pjesa === 'lidhu' && e_dyta) pamja = <Lidhu kodi={e_dyta} />;
  else if (pjesa === 'pergjigje' && e_dyta) pamja = <Pergjigja kodi={e_dyta} />;
  else if (pjesa === 'bashkohu') pamja = <Bashkohu kodi={e_dyta ?? null} />;
  else if (pjesa === 'takohu') pamja = <Takohu kodi={e_dyta ?? null} />;
  else if (pjesa === 'sinkronizimi') pamja = <Sinkronizimi />;
  else if (pjesa === 'grupi' && id !== null) pamja = <Grupi id={id} />;
  else if (pjesa === 'loja' && id !== null) pamja = <Loja id={id} />;
  else return <Grupet />;

  return <Suspense fallback={null}>{pamja}</Suspense>;
}
