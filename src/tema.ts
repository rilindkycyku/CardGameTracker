/**
 * Ndriçimi i ekranit: sistemi, drita, terri — dhe pse zgjidhet fare.
 *
 * Deri tani temën e vendoste vetëm telefoni (`prefers-color-scheme`), dhe kjo
 * mbulon mbrëmjen: ora kur luhet e ka telefonin në terr gjithsesi. Ajo që nuk e
 * mbulonte ishte dita — tavolina e pasdites, dielli mbi ekran, ose thjesht kush
 * e mban telefonin në terr e këtë fletë e do të bardhë. Një telefon nuk e
 * ndërron temën e vet për një aplikacion, prandaj e ndërron aplikacioni.
 *
 * Tri gjendje e jo dy, dhe e treta nuk është luks: pa «Sistemi» nuk kthehesh
 * dot te ajo që bën vetë telefoni, sepse një zgjedhje e ruajtur nuk ka si të
 * çzgjidhet. Kjo është e njëjta trenjëshe si `mbyllur` te pika 15 — mungon,
 * po, jo — dhe për të njëjtën arsye: një çelës me dy gjendje e humb «vendos
 * vetë» pikërisht atëherë kur duhet.
 *
 * Ky skedar nuk njeh as `window`-in, as `document`-in, as `localStorage`-in
 * (pika 1): varg brenda, varg jashtë. Lidhja me shfletuesin — atributi te
 * rrënja, çelësi i ruajtjes, ngjarja e sistemit — rri te `ndricimi.ts`, si
 * `matja.ts` krah `analitika.ts`.
 */

/** Çka zgjedh përdoruesi. */
export type Tema = 'sistemi' | 'drite' | 'terr';

/** Çka del në ekran pasi «sistemi» të jetë zgjidhur. */
export type TemaEZbatuar = 'drite' | 'terr';

/**
 * Çelësi te `localStorage`.
 *
 * Nuk shkon te baza, dhe kjo nuk është rastësi: rrugët e ndarjes nuk e prekin
 * bazën fare (pika 7), dhe kush skanon një kod QR e hap faqen te telefoni i vet
 * me temën e vet. Një preferencë ekrani nuk është e dhënë loje — nuk hyn te
 * kopja rezervë, nuk del nga pajisja, dhe humbja e saj nuk humb asgjë.
 */
export const CELESI_I_TEMES = 'tavolina-tema';

/**
 * Radha te çelësi: sistemi i pari, sepse ajo është gjendja e parazgjedhur dhe
 * ajo te e cila kthehesh.
 */
export const TEMAT: { tema: Tema; emri: string; ikona: string }[] = [
  { tema: 'sistemi', emri: 'Sistemi', ikona: 'telefoni' },
  { tema: 'drite', emri: 'Dritë', ikona: 'dielli' },
  { tema: 'terr', emri: 'Terr', ikona: 'hena' },
];

/**
 * Tema nga ajo që gjendet e ruajtur.
 *
 * Mungesa dhe vlera e panjohur lexohen njësoj — «sistemi» — dhe këtu kjo është
 * e saktë e jo shkurtore: ndryshe nga lloji i lojës te një kopje rezervë
 * (pika 16), një temë e panjohur nuk e ndërron kuptimin e asnjë numri. Më e
 * keqja që ndodh është një ekran i errët atje ku dikush kishte zgjedhur dritën,
 * dhe një prekje e rregullon.
 */
export function lexoTemen(ruajtur: string | null): Tema {
  return TEMAT.some(({ tema }) => tema === ruajtur) ? (ruajtur as Tema) : 'sistemi';
}

/** Cila temë del vërtet në ekran, kur dihet çka thotë telefoni. */
export function temaEZbatuar(tema: Tema, sistemiNeTerr: boolean): TemaEZbatuar {
  if (tema !== 'sistemi') return tema;

  return sistemiNeTerr ? 'terr' : 'drite';
}

/**
 * Ngjyra e shiritit të shfletuesit për secilën temë.
 *
 * Te drita është smeraldi i veprimit kryesor, te terri sfondi i faqes — ashtu
 * si i mban `index.html`-i te dy metat e veta. Ato dy meta e pyesin sistemin,
 * prandaj një zgjedhje me dorë do t'i linte pas: te aplikacioni i instaluar
 * shiriti do të mbetej i errët mbi një faqe të bardhë. Prandaj ngjyrat rrinë
 * edhe këtu, dhe prova `ngjyrat e shiritit janë ato të index.html-it` i lexon
 * të dy skedarët që të mos ndahen.
 */
export const NGJYRAT_E_SHIRITIT: Record<TemaEZbatuar, string> = {
  drite: '#047857',
  terr: '#080f1a',
};
