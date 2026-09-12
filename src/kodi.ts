/**
 * Kodi i bashkimit — tetë karaktere që i dikton dot dikujt përtej tavolinës.
 *
 * Përdoret vetëm nga mënyra me server (`lidhjaMeServer.ts`). Mënyra pa server e
 * bën shkëmbimin me dy kode QR, sepse gjithçka që duhet për lidhjen — gishtëza
 * DTLS dhe kredencialet ICE — nuk hyn te tetë karaktere. Me një server
 * sinjalizimi mes vete, të dyja anët e marrin atë nga serveri, dhe atëherë
 * mjafton një emër i shkurtër që të gjejnë njëra-tjetrën.
 *
 * Alfabeti është Crockford base32: pa `I`, `L`, `O` dhe `U`. Tri të parat
 * ngatërrohen me `1` e `0` kur kodi lexohet nga ekrani ose diktohet me zë — dhe
 * pikërisht ajo është puna e këtij kodi — kurse `U` hiqet që rastësia të mos
 * shkruajë fjalë që nuk duhen. Leximi i kthen ngatërresat prapa: `O` bëhet `0`,
 * `I` e `L` bëhen `1`.
 *
 * Tetë karaktere nga tridhjetë e dy janë dyzet bita, pra mbi një mijë miliardë
 * kode. Kjo nuk është kot: te reja e PeerJS-it emrat rrinë në një hapësirë të
 * përbashkët publike, prandaj kushdo që e gjen emrin lidhet dhe i shikon pikët.
 * Gjashtë karaktere do të kishin qenë më të lehta për t'u shkruar dhe njësoj të
 * lehta për t'u qëlluar.
 *
 * Nuk njeh as DOM, as rrjetë: bajtet e rastit i vjen nga jashtë, që provat ta
 * matin me bajte të njohura.
 */

/** Crockford base32 — pa `I`, `L`, `O`, `U`. */
export const ALFABETI = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Sa karaktere ka kodi. */
export const GJATESIA = 8;

/**
 * Parathënja e emrit te serveri i sinjalizimit.
 *
 * Reja publike e PeerJS-it përdoret me një çelës të përbashkët, prandaj emrat e
 * çdo aplikacioni rrinë bashkë. Pa parathënje, një kod tetëkarakterësh i këtij
 * aplikacioni mund të përplasej me emrin e ndonjë tjetri.
 *
 * Mbeti `bridzh` edhe pasi aplikacioni u quajt „Tavolina", dhe jo nga harresa:
 * kjo nuk është emër që lexon njeriu, është pjesë e telit. Të dy telefonat e
 * ndërtojnë të njëjtin emër nga i njëjti kod, prandaj një parathënje e ndërruar
 * do të thoshte se telefoni me versionin e ri nuk lidhet me atë që ende nuk e
 * ka rifreskuar faqen — dhe kjo pikërisht atëherë kur po ulen te tavolina. Kur
 * të ndërrohet, duhet të ndërrohet te të dy njëkohësisht.
 */
export const PARATHENJA = 'bridzh';

/**
 * Kodi nga bajte të rastit.
 *
 * Një bajt jep pikërisht tetë vlera për secilën shkronjë të alfabetit
 * (256 = 32 × 8), prandaj `& 31` nuk anon nga asnjë shkronjë.
 */
export function kodiNgaBajtet(bajtet: Uint8Array): string | null {
  if (bajtet.length < GJATESIA) return null;

  let kodi = '';
  for (let i = 0; i < GJATESIA; i++) kodi += ALFABETI[bajtet[i]! & 31];

  return kodi;
}

/** Kodi si tregohet: `A3F2-7KQM`. Vija e mban të lexueshëm dhe të diktueshëm. */
export function shfaqKodin(kodi: string): string {
  return `${kodi.slice(0, 4)}-${kodi.slice(4)}`;
}

/**
 * Kodi nga çka mund të shkruhet ose të ngjitet: kod, kod me vijë, a adresë.
 *
 * Vija, hapësira dhe shkronjat e vogla nuk kanë pse t'i pengojnë dikë që po e
 * shkruan me nxitim, prandaj hiqen para kontrollit. Adresa e plotë kalon njësoj
 * si te ngjitja e një lidhjeje nga një bisedë.
 */
export function lexoKodin(teksti: string): string | null {
  const pastruar = (teksti ?? '').trim();
  if (!pastruar) return null;

  // Adresa lexohet e para: pa këtë, shkronjat e «bashkohu» do të hynin te kodi.
  const gjetja = pastruar.match(/#\/bashkohu\/([^/?#\s]+)/i);
  const trupi = gjetja ? gjetja[1]! : pastruar;

  const kodi = trupi
    .toUpperCase()
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/[^0-9A-Z]/g, '');

  if (kodi.length !== GJATESIA) return null;
  for (const shkronja of kodi) if (!ALFABETI.includes(shkronja)) return null;

  return kodi;
}

/** Emri i strehuesit te serveri i sinjalizimit. */
export function idIStrehuesit(kodi: string): string {
  return `${PARATHENJA}-${kodi}`;
}

/** Adresa që hap pamjen dhe lidhet vetë, pa e shkruar kodin. */
export function adresaEBashkimit(rrenja: string, kodi: string): string {
  return `${rrenja.split('#')[0]!.replace(/\/+$/, '')}/#/bashkohu/${kodi}`;
}
