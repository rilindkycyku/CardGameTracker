import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App.tsx';
import { regjistroPunetorin } from './instalimi.ts';
import { nisMatjen } from './matja.ts';
import './style.css';

const rrenja = document.getElementById('app');
if (!rrenja) throw new Error('Mungon #app te index.html');

createRoot(rrenja).render(
  <StrictMode>
    <App />
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
