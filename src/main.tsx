import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App.tsx';
import './style.css';

const rrenja = document.getElementById('app');
if (!rrenja) throw new Error('Mungon #app te index.html');

createRoot(rrenja).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
