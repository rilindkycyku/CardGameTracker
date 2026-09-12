/// <reference types="vite/client" />

/** Vetëm një çelës: serveri i sinjalizimit, kur nuk është reja publike. */
interface ImportMetaEnv {
  readonly VITE_PEER_SERVER?: string;
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
