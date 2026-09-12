import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

import paketa from './package.json';
import { SHTEGU } from './src/takimi.ts';

/**
 * Serveri i sinjalizimit, i ngritur edhe gjatë zhvillimit.
 *
 * Te prodhimi `api/sinjali.ts` e ngre Vercel-i vetë; te `npm run dev` nuk e
 * ngre kush, dhe pa këtë mënyra e takimit nuk provohej dot fare pa botuar —
 * pra do të shkonte e paprovuar, e cila është pikërisht mënyra si prishet kodi
 * i rrjetës (e njëjta arsye si `VITE_PEER_SERVER`).
 *
 * Është i njëjti funksion, e jo një imitim: ngarkohet nga i njëjti skedar, dhe
 * këtu përkthehet vetëm mes `req`/`res` të Node-it dhe `Request`/`Response`-it
 * të Web-it. Kështu ajo që provohet është ajo që botohet.
 */
function sinjalizimiIZhvillimit(): Plugin {
  return {
    name: 'sinjalizimi-i-zhvillimit',
    apply: 'serve',
    configureServer(serveri) {
      serveri.middlewares.use(async (req, res, tjetri) => {
        if (!req.url?.startsWith(SHTEGU)) return tjetri();

        const { default: trajto } = await serveri.ssrLoadModule('/api/sinjali.ts') as {
          default: (k: Request) => Promise<Response>;
        };

        const copat: Buffer[] = [];
        for await (const cope of req) copat.push(cope as Buffer);

        const dale = await trajto(
          new Request(`http://${req.headers.host ?? 'localhost'}${req.url}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: copat.length ? Buffer.concat(copat) : undefined,
          }),
        );

        res.statusCode = dale.status;
        dale.headers.forEach((vlera, emri) => res.setHeader(emri, vlera));
        res.end(dale.body ? Buffer.from(await dale.arrayBuffer()) : undefined);
      });
    },
  };
}

/**
 * Versioni vjen nga `package.json` dhe hyn te ndërtimi si konstante.
 *
 * Një vend i vetëm ku shkruhet numri: `npm version` e ngre atë skedar, dhe
 * ekrani e tregon pikërisht atë që u ndërtua. Pa këtë, telefoni që mban një
 * kopje të vjetër në cache nuk ka si të dallohet nga ai që e ka të renë.
 */
export default defineConfig({
  plugins: [react(), sinjalizimiIZhvillimit()],
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
