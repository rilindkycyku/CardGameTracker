/**
 * Regjistrimi i punëtorit të shërbimit, dhe njoftimi kur del një version i ri.
 *
 * Punëtori e bën faqen të hapet pa internet (`punetori.ts`), por sjell me vete
 * një pyetje që deri tani e zgjidhte vetë shfletuesi: *çka sheh përdoruesi, të
 * renë apo të vjetrën?* Me një kosh të vetin, përgjigjja është «atë që ka» —
 * derisa dikush ta thotë se ka dalë diçka tjetër. Prandaj ky skedar nuk mbaron
 * te `register()`: ai pret punëtorin e ri, e mban në pritje, dhe e njofton
 * ekranin që numri i versionit te fundfaqja të mos jetë e vetmja gjë që e di.
 *
 * Njeh `navigator`-in dhe `location`-in, prandaj rri jashtë listës së moduleve
 * që provohen me `node --test` (pika 1); logjika e tij e provueshme — çka ruhet
 * dhe si — rri te `sherbimi.ts`.
 */

import { useEffect, useState } from 'react';

/** Mesazhi që i thotë punëtorit në pritje ta marrë pushtetin. */
const MERRE_PUSHTETIN = 'merre-pushtetin';

/** Punëtori që pret radhën, kur ka një të tillë. */
let nePritje: ServiceWorker | null = null;

/** A e ka kërkuar përdoruesi kalimin te versioni i ri. */
let kerkuar = false;

/** Ekranet që duan ta dinë. Shumësi sepse regjistrimi rri jashtë tyre. */
const degjuesit = new Set<(ka: boolean) => void>();

function cakto(punetori: ServiceWorker | null): void {
  nePritje = punetori;
  for (const degjuesi of degjuesit) degjuesi(punetori !== null);
}

/**
 * Regjistron punëtorin. Kush do ta dijë për një version të ri e pyet
 * `useVersionIRi`.
 *
 * Nuk bëhet gjatë zhvillimit: punëtori do t'i shërbente skedarët e ruajtur mbi
 * ata që Vite-ja i ndërron gjatë shkrimit, dhe atëherë ndryshimi nuk duket —
 * ose duket herë pas here, që është më keq.
 *
 * Regjistrimi pret `load`-in me qëllim: ai i shkarkon skedarët e listës së tij
 * me instalimin, dhe pa këtë pritje ato do të garonin me skedarët që i duhen
 * ekranit të parë pikërisht te hapja e parë, e cila matet.
 */
export function regjistroPunetorin(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register('/sw.js')
      .then((regjistrimi) => {
        // Një punëtor mund të rrijë në pritje që nga hapja e kaluar: atëherë
        // «ka të re» është e vërtetë para se të ndodhë asgjë tjetër.
        if (regjistrimi.waiting && navigator.serviceWorker.controller) {
          cakto(regjistrimi.waiting);
        }

        regjistrimi.addEventListener('updatefound', () => {
          const iRi = regjistrimi.installing;
          if (!iRi) return;

          iRi.addEventListener('statechange', () => {
            // `controller` mungon te instalimi i parë — atëherë nuk ka version
            // të ri, ka thjesht faqen që sapo u bë e disponueshme offline.
            if (iRi.state === 'installed' && navigator.serviceWorker.controller) {
              cakto(iRi);
            }
          });
        });
      })
      .catch(() => {
        // Regjistrimi dështon te një kontekst i pasigurt ose kur përdoruesi i
        // ka ndaluar punëtorët. Aplikacioni punon si më parë, vetëm pa koshin
        // e vet — prandaj këtu nuk ka çka t'i thuhet askujt.
      });

    /*
     * Ringarkimi bëhet një herë, dhe vetëm pasi punëtori i ri merr pushtetin.
     *
     * `controllerchange` shkrepet edhe te instalimi i parë (`clients.claim()`),
     * dhe atje nuk ka pse të ringarkohet asgjë: faqja në ekran është pikërisht
     * ajo që sapo u ruajt. Prandaj ringarkimi pret që dikush ta ketë shtypur
     * butonin — ai e vë `kerkuar` — dhe roja e mban të vetëm, që dy ngjarje të
     * mos e nisin dy herë.
     */
    let ringarkuar = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!kerkuar || ringarkuar) return;
      ringarkuar = true;
      window.location.reload();
    });
  });
}

/**
 * Kalon te versioni i ri: punëtorit në pritje i thuhet ta marrë pushtetin, dhe
 * faqja ringarkohet sapo ta ketë marrë.
 */
export function kaloTeIRi(): void {
  if (!nePritje) return;

  kerkuar = true;
  nePritje.postMessage(MERRE_PUSHTETIN);
}

/**
 * A rri një version i ri në pritje — për ekranin që e thotë me fjalë.
 *
 * Gjendja rri te moduli e jo te komponenti, sepse regjistrimi ndodh një herë te
 * nisja e faqes, shumë para se ekrani i parë të vizatohet: një `useState` i
 * zbrazët do ta humbte njoftimin që erdhi para tij.
 */
export function useVersionIRi(): boolean {
  const [ka, cakto] = useState(() => nePritje !== null);

  useEffect(() => {
    // Gjendja e çastit rimerret edhe këtu: mes vizatimit të parë dhe këtij
    // efekti mund të ketë mbërritur njoftimi.
    cakto(nePritje !== null);
    degjuesit.add(cakto);

    return () => {
      degjuesit.delete(cakto);
    };
  }, []);

  return ka;
}
