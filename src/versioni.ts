/**
 * Versioni i aplikacionit, ashtu si rri te `package.json`.
 *
 * `__VERSIONI__` e shkruan Vite gjatë ndërtimit (shih `vite.config.ts`).
 * Kthimi te „0.0.0" vlen vetëm kur moduli lexohet jashtë ndërtimit — nga
 * `node --test` — që një import i rastit të mos rrëzojë provën.
 */
export const VERSIONI: string =
  typeof __VERSIONI__ === 'string' ? __VERSIONI__ : '0.0.0';
