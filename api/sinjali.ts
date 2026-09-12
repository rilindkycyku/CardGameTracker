/**
 * Serveri i sinjalizimit — i yni, dhe i vetmi te tërë projekti.
 *
 * Rri këtu me kërkesë të shprehur të pronarit, dhe pika 1 e `CLAUDE.md`-së u
 * rishkrua për të: deri tani «server i yni nuk ka» ishte pa përjashtim, dhe
 * kodi i vetëm tetëkarakterësh kërkonte `peerjs.com` — një server i huaj, i
 * cili kur binte e merrte me vete tërë mbrëmjen.
 *
 * Çka bën, dhe asgjë më shumë: mban dy varga për një kod, secilin sa `JETA`
 * sekonda. Ftesa e përgjigja janë pikërisht ato që te mënyra pa server kalojnë
 * nëpër dy kode QR — kredencialet ICE dhe gishtëza DTLS. **Pikët nuk e prekin
 * kurrë këtë shteg**: sapo kanali WebRTC hapet, asnjë kërkesë nuk niset më, dhe
 * emrat, raundet e totalet kalojnë drejt mes dy telefonave.
 *
 * Shtegu është i hapur për këdo që e gjen adresën, prandaj gjithçka që hyn
 * kontrollohet me alfabet të ngushtë te `takimi.ts` — i njëjti zakon si te
 * sinjali i skanuar (pika 7) dhe te rreshtat e sinkronizimit (pika 19). Kodi
 * është tetë karaktere, roli një nga dy, dhe trupi nën një mijë bajte pa asnjë
 * karakter që SDP-ja e lexon si ndarës. Ajo që mbetet e mundur — dikush që
 * shkruan varga të kotë nën kode të rastit — zhduket vetë brenda tre minutash
 * dhe nuk lexohet nga askush.
 *
 * ## Vendi i ruajtjes
 *
 * Një funksion pa gjendje nuk i takon dot dy anët: ftesa shkruhet te një
 * thirrje dhe lexohet te një tjetër, dhe mes tyre ato nuk e njohin njëra-tjetrën.
 * Prandaj duhet një vend ruajtjeje, dhe janë dy:
 *
 * - **Upstash Redis**, kur `KV_REST_API_URL` e `KV_REST_API_TOKEN` (ose emrat
 *   `UPSTASH_REDIS_REST_*`) rrinë te mjedisi. Vercel-i i vë vetë kur shtohet
 *   nga paneli. Flitet me `fetch` e jo me një paketë — e njëjta arsye si te
 *   `supabase.ts` (pika 10): katër thirrje HTTP nuk e vlejnë një varësi.
 * - **Kujtesa e vetë thirrjes**, kur ato mungojnë. Punon te zhvillimi, dhe te
 *   prodhimi punon vetëm sa kohë të dyja anët bien te e njëjta kopje e ngrohtë —
 *   pra ndonjëherë po e ndonjëherë jo. Prandaj përgjigjja e thotë me `x-takimi`,
 *   dhe ekrani e lexon: një mënyrë që dështon një herë në tri është më e keqe se
 *   një që thotë hapur se nuk është ngritur.
 *
 * Shkrimi i ftesës e fshin përgjigjen e vjetër të atij kodi. Pa atë, strehuesi
 * që përtërin ftesën për vizitorin e dytë do ta lexonte sërish përgjigjen e të
 * parit, do ta gjente `ref`-in e gabuar (pika 7), dhe lidhja e re do të vdiste
 * pa shpjegim.
 */

import {
  JETA,
  celesi,
  kodIRregullt,
  roliIRregullt,
  trupiIRregullt,
  type Roli,
} from '../src/takimi.ts';

export const config = { runtime: 'edge' };

/* ── Vendi i ruajtjes ───────────────────────────────────────────────────── */

type Vendi = {
  emri: 'upstash' | 'kujtesa';
  merr(celesi: string): Promise<string | null>;
  ver(celesi: string, vlera: string): Promise<void>;
  /** Shkruan vetëm nëse çelësi rri bosh. `false` do të thotë «e zuri dikush». */
  zer(celesi: string, vlera: string): Promise<boolean>;
  fshi(celesi: string): Promise<void>;
};

function kredencialet(): { url: string; token: string } | null {
  const mjedisi = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env ?? {};

  const url = mjedisi.KV_REST_API_URL ?? mjedisi.UPSTASH_REDIS_REST_URL;
  const token = mjedisi.KV_REST_API_TOKEN ?? mjedisi.UPSTASH_REDIS_REST_TOKEN;

  return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
}

/** Kujtesa e kopjes së tanishme — rruga e zhvillimit, dhe rezerva e sinqertë. */
const kujtesa = new Map<string, { vlera: string; deri: number }>();

function vendiIKujteses(): Vendi {
  const pastro = () => {
    const tani = Date.now();
    for (const [k, v] of kujtesa) if (v.deri <= tani) kujtesa.delete(k);
  };

  return {
    emri: 'kujtesa',
    async merr(c) {
      pastro();
      return kujtesa.get(c)?.vlera ?? null;
    },
    async ver(c, vlera) {
      pastro();
      kujtesa.set(c, { vlera, deri: Date.now() + JETA * 1000 });
    },
    async zer(c, vlera) {
      pastro();
      if (kujtesa.has(c)) return false;
      kujtesa.set(c, { vlera, deri: Date.now() + JETA * 1000 });
      return true;
    },
    async fshi(c) {
      kujtesa.delete(c);
    },
  };
}

function vendiIUpstash(url: string, token: string): Vendi {
  /*
   * API-ja REST e Upstash-it i pranon komandat si pjesë shtegu, dhe vlerën si
   * trup — kështu trupi nuk ka nevojë t'i ikë adresës. Alfabeti i tij është i
   * ngushtuar tashmë te `takimi.ts`, prandaj shtegu del i sigurt gjithsesi.
   */
  const thirr = async (pjeset: string[], trupi?: string): Promise<unknown> => {
    const pergjigja = await fetch(`${url}/${pjeset.join('/')}`, {
      method: trupi === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: trupi,
    });

    if (!pergjigja.ok) throw new Error(`upstash ${pergjigja.status}`);
    return ((await pergjigja.json()) as { result?: unknown }).result ?? null;
  };

  return {
    emri: 'upstash',
    async merr(c) {
      const dale = await thirr(['get', encodeURIComponent(c)]);
      return typeof dale === 'string' ? dale : null;
    },
    async ver(c, vlera) {
      await thirr(['set', encodeURIComponent(c), 'EX', String(JETA)], vlera);
    },
    async zer(c, vlera) {
      // `NX` e bën zënien atomike edhe kur dy telefona shkruajnë në të njëjtin
      // çast — pikërisht rasti për të cilin kjo ekziston.
      const dale = await thirr(
        ['set', encodeURIComponent(c), 'EX', String(JETA), 'NX'],
        vlera,
      );
      return dale !== null;
    },
    async fshi(c) {
      await thirr(['del', encodeURIComponent(c)]);
    },
  };
}

function vendi(): Vendi {
  const kred = kredencialet();
  return kred ? vendiIUpstash(kred.url, kred.token) : vendiIKujteses();
}

/* ── Përgjigjet ─────────────────────────────────────────────────────────── */

function pergjigju(trupi: unknown, gjendja: number, emriIVendit: string): Response {
  return new Response(gjendja === 204 ? null : JSON.stringify(trupi), {
    status: gjendja,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // Asnjë kopje, askund: një ftesë e ruajtur do të kthehej pasi vargu i saj
      // të kishte vdekur, dhe lidhja do të dështonte pa shpjegim.
      'cache-control': 'no-store',
      // Ekrani e lexon, që të mos premtojë një mënyrë që nuk qëndron.
      'x-takimi': emriIVendit,
    },
  });
}

export default async function handler(kerkesa: Request): Promise<Response> {
  const vend = vendi();
  const adresa = new URL(kerkesa.url);

  if (kerkesa.method === 'GET') {
    const kodi = adresa.searchParams.get('kodi');
    const roli = adresa.searchParams.get('roli');

    if (!kodIRregullt(kodi) || !roliIRregullt(roli)) {
      return pergjigju({ gabimi: 'kerkese' }, 400, vend.emri);
    }

    try {
      const trupi = await vend.merr(celesi(kodi, roli));
      return trupi === null
        ? pergjigju({ gabimi: 'mungon' }, 404, vend.emri)
        : pergjigju({ trupi }, 200, vend.emri);
    } catch {
      return pergjigju({ gabimi: 'ruajtja' }, 502, vend.emri);
    }
  }

  if (kerkesa.method === 'POST') {
    let lexuar: { kodi?: unknown; roli?: unknown; trupi?: unknown };

    try {
      lexuar = (await kerkesa.json()) as typeof lexuar;
    } catch {
      return pergjigju({ gabimi: 'kerkese' }, 400, vend.emri);
    }

    const { kodi, roli, trupi } = lexuar;

    if (!kodIRregullt(kodi) || !roliIRregullt(roli) || !trupiIRregullt(trupi)) {
      return pergjigju({ gabimi: 'kerkese' }, 400, vend.emri);
    }

    try {
      /*
       * Një ftesë merr saktësisht një përgjigje.
       *
       * Pa këtë, dy veta që e skanojnë kodin njëkohësisht i përgjigjeshin të dy
       * së njëjtës ftesë: i dyti e mbishkruante të parin, e pastaj **të dy**
       * i dërgonin strehuesit kontrolle ICE mbi po ato kredenciale. Ai çift i
       * ngatërruar dështonte rreth një herë në tri, dhe atëherë nuk lidhej
       * asnjëri nga të dy. Tani i pari e zë, i dyti e mëson menjëherë, dhe pret
       * ftesën e radhës — e cila vjen brenda pak sekondash.
       */
      if (roli === 'pergjigje') {
        const uZu = await vend.zer(celesi(kodi, roli), trupi);
        return uZu
          ? pergjigju(null, 204, vend.emri)
          : pergjigju({ gabimi: 'zene' }, 409, vend.emri);
      }

      await vend.ver(celesi(kodi, roli as Roli), trupi);
      // Ftesa e re e fshin përgjigjen e vjetër: përndryshe vizitori i dytë do
      // të lidhej mbi `ref`-in e të parit, dhe lidhja do të vdiste në heshtje.
      await vend.fshi(celesi(kodi, 'pergjigje'));
      return pergjigju(null, 204, vend.emri);
    } catch {
      return pergjigju({ gabimi: 'ruajtja' }, 502, vend.emri);
    }
  }

  /*
   * Fshirja e ftesës sapo ajo konsumohet.
   *
   * Pa të, ftesa e përgjigjur mbetej e lexueshme sa zgjat përgatitja e asaj që
   * vjen pas — dhe kush skanonte kodin pikërisht atëherë i përgjigjej një ftese
   * të vdekur: `ref`-i i tij nuk i shkonte asnjë pritjeje, dhe ai telefon rrinte
   * te «Duke u lidhur…» pa fund. Ndodh sapo dy veta e skanojnë kodin njëkohësisht.
   */
  if (kerkesa.method === 'DELETE') {
    const kodi = adresa.searchParams.get('kodi');
    const roli = adresa.searchParams.get('roli');

    if (!kodIRregullt(kodi) || !roliIRregullt(roli)) {
      return pergjigju({ gabimi: 'kerkese' }, 400, vend.emri);
    }

    try {
      await vend.fshi(celesi(kodi, roli));
      return pergjigju(null, 204, vend.emri);
    } catch {
      return pergjigju({ gabimi: 'ruajtja' }, 502, vend.emri);
    }
  }

  return pergjigju({ gabimi: 'metode' }, 405, vend.emri);
}
