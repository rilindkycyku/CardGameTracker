import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App.tsx';
import { regjistroPunetorin } from './instalimi.ts';
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
