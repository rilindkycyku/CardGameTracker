/**
 * Ndërtimi i punëtorit të shërbimit — i dyti, dhe pas atij kryesorit.
 *
 * Dy ndërtime e jo një, sepse punëtori duhet të dalë një skedar i vetëm te
 * rrënja: `/sw.js`. Ai vend e vendos fushën e tij — një punëtor i vendosur te
 * `/assets/` do të mbulonte vetëm atë dosje — dhe emri duhet të mbetet i
 * pahashuar, që ndërtimi i ri ta zëvendësojë atë të vjetrin te i njëjti vend.
 *
 * Është i dyti sepse i duhet manifesti i të parit: emrat e skedarëve janë të
 * hashuar, prandaj lista e asaj që ruhet nuk shkruhet dot me dorë. Lexohet nga
 * `dist/.vite/manifest.json` dhe futet brenda si konstante.
 *
 * `npm run build` i bën të dyja me radhë; njëri pa tjetrin lë ose faqe pa
 * punëtor, ose punëtor që tregon te skedarë që nuk ekzistojnë më.
 */

import { readFileSync, rmSync } from 'node:fs';
import { defineConfig } from 'vite';

import paketa from './package.json' with { type: 'json' };
import { precachja, type Manifesti } from './src/sherbimi.ts';

const manifesti: Manifesti = JSON.parse(
  readFileSync(new URL('./dist/.vite/manifest.json', import.meta.url), 'utf8'),
);

/**
 * Skedarët që nuk hyjnë te manifesti, sepse nuk kalojnë nëpër bundler: ata të
 * `public/`-ut dhe vetë dokumenti.
 *
 * Rrënja shkruhet `/` e jo `/index.html` — shih `punetori.ts`. Nga dy
 * nënbashkësitë e fontit ruhet vetëm `latin`: ajo e mban shqipen e tëra, dhe
 * `unicode-range` bën që tjetra të mos kërkohet fare për tekstin tonë. Po qe se
 * dikush shkruan një emër që e kërkon, ajo ruhet vetvetiu sapo të merret.
 */
const TE_PAVARURAT = [
  '/',
  '/manifest.webmanifest',
  '/ikona.svg',
  '/shkronja/quicksand-latin.woff2',
];

export default defineConfig({
  // Skedarët e `public/`-ut i kopjoi ndërtimi i parë; një kopjim i dytë do të
  // ishte punë e njëjtë mbi vete.
  publicDir: false,
  plugins: [
    {
      name: 'hiq-manifestin',
      /*
       * Manifesti i ndërtimit fshihet sapo të jetë lexuar.
       *
       * Ai ekziston vetëm që kjo listë të dalë e saktë; i lënë aty, ai ngarkohet
       * bashkë me faqen te strehuesi dhe u tregon të gjithëve se si është
       * ndërtuar. Asgjë e rrezikshme, por asgjë e nevojshme — dhe `dist/` është
       * pikërisht ajo që publikohet.
       */
      closeBundle() {
        rmSync(new URL('./dist/.vite', import.meta.url), {
          recursive: true,
          force: true,
        });
      },
    },
  ],
  define: {
    __VERSIONI__: JSON.stringify(paketa.version),
    __PRECACHE__: JSON.stringify(precachja(manifesti, TE_PAVARURAT)),
  },
  build: {
    outDir: 'dist',
    // Dosja mbetet ashtu si e la ndërtimi i parë: këtu shtohet vetëm `sw.js`.
    emptyOutDir: false,
    rollupOptions: {
      input: new URL('./src/punetori.ts', import.meta.url).pathname,
      output: {
        entryFileNames: 'sw.js',
        // Një skedar i vetëm, pa `import`: punëtori regjistrohet si skript i
        // thjeshtë, dhe punëtorët me module nuk i mbajnë ende të gjithë
        // shfletuesit që e hapin këtë faqe nga një telefon i vjetër.
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
  },
});
