/**
 * Punëtori i shërbimit — faqja që hapet pa internet.
 *
 * Aplikacioni i mban të dhënat te IndexedDB-ja e telefonit që nga dita e parë,
 * pra pikët ishin gjithmonë aty; ajo që mungonte ishte vetë faqja. Pa punëtor,
 * hapja e saj varej nga cache-i i zakonshëm i shfletuesit — i cili e mban një
 * kopje kur do e e heq kur do — dhe premtimi «punon pa internet» mbetej i
 * pamatshëm. Ky skedar e bën të matshëm: skedarët e ndërtimit ruhen me
 * instalimin, dhe pastaj faqja hapet e plotë edhe në «mënyrë avioni».
 *
 * Këtu rri vetëm lidhja me shfletuesin — `self`, `caches`, tri ngjarjet.
 * Vendimet rrinë te `sherbimi.ts`, ku provohen me `node --test` (pika 1).
 *
 * Ndërtohet veç, me `vite.punetori.config.ts`, sepse duhet të dalë një skedar i
 * vetëm `sw.js` te rrënja: ai emër dhe ai vend e vendosin fushën e punëtorit,
 * dhe një emër i hashuar te `/assets/` do ta ngushtonte atë fushë te ajo dosje.
 */

import {
  emriIKoshit,
  koshetEVjetra,
  strategjia,
} from './sherbimi.ts';

/*
 * Tipat e punëtorit, të shkruar me dorë.
 *
 * `tsconfig.json` ka `lib: ["DOM"]`, dhe biblioteka `WebWorker` nuk shtohet dot
 * krah saj — të dyja i shpallin të njëjtat emra (`self`, `fetch`, `caches`) dhe
 * programi nuk përpilohet. Një `tsconfig` i dytë vetëm për këtë skedar do të
 * ishte më shumë konfigurim se kod, prandaj mbahen këto pesë rreshta: aq e
 * prek ky skedar nga API-ja e punëtorit, dhe as një fjalë më shumë.
 */
type NgjarjaEJetes = Event & { waitUntil(pune: Promise<unknown>): void };
type NgjarjaEKerkeses = Event & {
  request: Request;
  respondWith(pergjigjja: Response | Promise<Response>): void;
};

const punetori = self as unknown as {
  addEventListener(lloji: 'install' | 'activate', degjuesi: (e: NgjarjaEJetes) => void): void;
  addEventListener(lloji: 'fetch', degjuesi: (e: NgjarjaEKerkeses) => void): void;
  addEventListener(lloji: 'message', degjuesi: (e: { data?: unknown }) => void): void;
  skipWaiting(): Promise<void>;
  clients: { claim(): Promise<void> };
  location: { origin: string };
};

const KOSHI = emriIKoshit(__VERSIONI__);

/**
 * Instalimi: skedarët e ndërtimit hyjnë te koshi i këtij versioni.
 *
 * `cache.addAll` dështon i tëri nëse dështon një skedar i vetëm, dhe kjo është
 * ajo që duhet: një kosh gjysmak do të hapte një faqe gjysmake pa internet, dhe
 * ajo nuk dallohet nga një faqe e mirë derisa të jetë vonë. Nëse dështon,
 * punëtori i vjetër mbetet ai që shërben, dhe provohet sërish herën tjetër.
 *
 * `skipWaiting` nuk thirret këtu me qëllim — shih `message` poshtë.
 */
punetori.addEventListener('install', (ngjarja) => {
  ngjarja.waitUntil(
    caches.open(KOSHI).then((koshi) => koshi.addAll(__PRECACHE__)),
  );
});

/**
 * Aktivizimi: koshët e ndërtimeve të vjetra fshihen, dhe skedat e hapura merren
 * nën këtë punëtor.
 *
 * Fshirja bëhet sipas parathënjes e jo e gjitha: te e njëjta origjinë mund të
 * rrijë edhe kosh i dikujt tjetër, dhe ai nuk është i yni për ta hequr.
 */
punetori.addEventListener('activate', (ngjarja) => {
  ngjarja.waitUntil(
    caches
      .keys()
      .then((emrat) =>
        Promise.all(
          koshetEVjetra(emrat, KOSHI).map((emri) => caches.delete(emri)),
        ),
      )
      .then(() => punetori.clients.claim()),
  );
});

/**
 * Kërkesa: koshi i pari për skedarët e faqes, `index.html` për çdo navigim.
 *
 * Rrjeti mbetet rrugë e dytë e jo e para, dhe kjo është zgjedhje: emrat e
 * skedarëve janë të hashuar, prandaj një skedar i ruajtur nuk vjetërohet dot —
 * ndërtimi i ri sjell emra të rinj dhe kosh të ri. Kështu hapja nuk pret
 * asnjë rrjetë, as atë të ngadaltën e kafenesë, e cila është më e keqe se
 * mungesa: mungesa dështon menjëherë, ngadalësia rri.
 *
 * Çka merret nga rrjeti ruhet për herën tjetër. Kjo e mban copën e `peerjs`-it
 * jashtë instalimit e brenda koshit sapo dikush e prek atë mënyrë (pika 7).
 */
punetori.addEventListener('fetch', (ngjarja) => {
  const kerkesa = ngjarja.request;
  const si = strategjia(
    {
      url: kerkesa.url,
      metoda: kerkesa.method,
      navigim: kerkesa.mode === 'navigate',
    },
    punetori.location.origin,
  );

  if (si === 'anashkalo') return;

  if (si === 'shelli') {
    // Rrënja e jo `/index.html`: disa strehues e kthejnë të dytën me një
    // ridrejtim te e para, dhe një përgjigje e ridrejtuar nuk ruhet dot te
    // koshi — instalimi do të dështonte i tëri, pra pa kosh e pa asgjë offline.
    ngjarja.respondWith(
      caches.match('/').then((ruajtur) => ruajtur ?? fetch(kerkesa)),
    );
    return;
  }

  ngjarja.respondWith(
    caches.match(kerkesa).then((ruajtur) => {
      if (ruajtur) return ruajtur;

      return fetch(kerkesa).then((pergjigjja) => {
        // Vetëm përgjigjet e plota ruhen: një 404 a një përgjigje e ndërprerë e
        // ruajtur do të kthehej e njëjta edhe kur rrjeti të vinte prapë.
        if (pergjigjja.ok && pergjigjja.type === 'basic') {
          const kopja = pergjigjja.clone();
          void caches.open(KOSHI).then((koshi) => koshi.put(kerkesa, kopja));
        }

        return pergjigjja;
      });
    }),
  );
});

/**
 * «Rifresko tani» — dhe pse kalimi bëhet me kërkesë e jo vetvetiu.
 *
 * Një punëtor i ri që merr pushtetin pa pyetur do t'i ndërronte skedarët nën
 * këmbët e një skede të hapur: kodi i vjetër në ekran, ai i riu te rrjeti, dhe
 * një copë e ngarkuar vonë që nuk përputhet me asnjërin. Prandaj i riu pret, dhe
 * ekrani e thotë me fjalë se ka një version të ri — atje ku rri numri i
 * versionit gjithsesi. Prekja e butonit e dërgon këtë mesazh, dhe faqja
 * ringarkohet sapo punëtori i ri merr pushtetin.
 */
punetori.addEventListener('message', (ngjarja) => {
  if (ngjarja.data === 'merre-pushtetin') void punetori.skipWaiting();
});
