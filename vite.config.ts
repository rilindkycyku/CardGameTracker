import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import paketa from './package.json';

/**
 * Versioni vjen nga `package.json` dhe hyn te ndërtimi si konstante.
 *
 * Një vend i vetëm ku shkruhet numri: `npm version` e ngre atë skedar, dhe
 * ekrani e tregon pikërisht atë që u ndërtua. Pa këtë, telefoni që mban një
 * kopje të vjetër në cache nuk ka si të dallohet nga ai që e ka të renë.
 */
export default defineConfig({
  plugins: [react()],
  define: {
    __VERSIONI__: JSON.stringify(paketa.version),
  },
  build: {
    /*
     * Manifesti i ndërtimit — lista e skedarëve me emrat e tyre të hashuar.
     *
     * E lexon `vite.punetori.config.ts` për të ditur çka ruan punëtori i
     * shërbimit me instalimin. Pa të, ajo listë do të shkruhej me dorë dhe do
     * të vjetërohej te ndërtimi i parë që ndërron një hash — pra menjëherë.
     */
    manifest: true,
  },
});
