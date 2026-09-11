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
