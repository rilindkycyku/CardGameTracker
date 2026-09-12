/// <reference types="vite/client" />

/**
 * Vetëm një çelës: serverat e sinjalizimit, kur nuk është reja publike.
 *
 * Listë e ndarë me presje, jo një i vetëm — kur i pari nuk kapet, provohet i
 * dyti. Secili si `[https://|http://]host[:porta][/shtegu]`. E zbrazët, dhe
 * kështu rri te prodhimi, do të thotë reja publike e PeerJS-it.
 */
interface ImportMetaEnv {
  readonly VITE_PEER_SERVER?: string;

  /**
   * Serverat ICE të mënyrës së takimit, të ndarë me presje.
   *
   * E zbrazët, dhe kështu rri te prodhimi, do të thotë asnjë — pra vetëm
   * kandidatë brenda rrjetës, dhe asnjë i tretë i kontaktuar (pika 7). Kush ka
   * një TURN të vetin e shton këtu, dhe atëherë ajo mënyrë punon edhe nëpër
   * rrjeta të ndryshme.
   */
  readonly VITE_ICE_SERVERS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Versioni i `package.json`-it, i futur nga `vite.config.ts`. */
declare const __VERSIONI__: string;

/**
 * Lista e skedarëve që punëtori i shërbimit i ruan me instalimin.
 *
 * E shkruan `vite.punetori.config.ts` gjatë ndërtimit të tij, nga manifesti i
 * ndërtimit kryesor: emrat janë të hashuar, prandaj nuk shkruhen dot me dorë.
 */
declare const __PRECACHE__: string[];
