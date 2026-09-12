import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App.tsx';
import { regjistroPunetorin } from './instalimi.ts';
import { nisMatjen } from './matja.ts';
import { nisTemen } from './ndricimi.ts';
import { Gardhi, NjoftimiIBazes } from './pjeset/Gardhi.tsx';
import { nisAutomatikun } from './sinkronizimi.ts';
import './style.css';

/*
 * Tema vihet para vizatimit të parë, e jo brenda një komponenti.
 *
 * Atributi te rrënja i zgjedh tokenat e ngjyrave, prandaj një efekt që e vë pas
 * vizatimit do të linte një çast me temën e gabuar — dhe pikërisht çastin e
 * hapjes. Është edhe e vetmja rrugë: `StrictMode` i thërret efektet dy herë,
 * kurse kjo bëhet një herë për tërë jetën e skedës.
 */
nisTemen();

const rrenja = document.getElementById('app');
if (!rrenja) throw new Error('Mungon #app te index.html');

/*
 * Gardhi rri jashtë gjithçkaje.
 *
 * Një gabim vizatimi te cilido ekran e zbraz tërë pemën, dhe pa të kjo do të
 * ishte faqe e bardhë: pa tekst, pa buton, dhe pa asnjë shenjë se pikët janë
 * ende te baza. Brenda tij, njoftimi i bazës rri sipër aplikacionit sepse është
 * e vetmja gjë që ka kuptim kur asnjë ekran nuk lexon dot.
 */
createRoot(rrenja).render(
  <StrictMode>
    <Gardhi>
      <NjoftimiIBazes />
      <App />
    </Gardhi>
  </StrictMode>,
);

/*
 * Punëtori i shërbimit: faqja ruhet një herë dhe pastaj hapet pa internet.
 *
 * Rri këtu e jo brenda `App`-it sepse nuk ka të bëjë me vizatimin, dhe sepse
 * bëhet një herë të vetme për tërë jetën e skedës — `StrictMode` i thërret dy
 * herë efektet e një komponenti, dhe dy regjistrime do të garonin mes vete.
 */
regjistroPunetorin();

/*
 * Numërimi i hapjeve — për të njëjtat arsye rri këtu: nuk ka të bëjë me
 * vizatimin, dhe bëhet një herë për tërë jetën e skedës.
 *
 * Nga pajisja del emri i rrugës e asgjë tjetër: adresa e vërtetë, e cila te
 * pamjet e ndara e mban brenda vetes tërë mbrëmjen, pastrohet para se të nisë
 * (`matja.ts`). Gjatë zhvillimit nuk nis fare.
 */
nisMatjen();

/*
 * Sinkronizimi, kur përdoruesi e ka lidhur një projekt të vetin (pika 19).
 *
 * Pa projekt të lidhur kjo thirrje nuk prek asgjë: `nisAutomatikun` e lexon
 * konfigurimin dhe kthehet. Rri këtu për të njëjtën arsye si dy të mësipërmet —
 * bëhet një herë për tërë jetën e skedës, e jo te një efekt që `StrictMode` e
 * thërret dy herë.
 */
nisAutomatikun();
