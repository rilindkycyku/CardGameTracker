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
 * Ajo që hapet kur nuk ka zgjedhur kush, **me kërkesë të pronarit**: drita.
 *
 * Kjo është e kundërta e asaj që bënte deri dje, kur temën e vendoste telefoni,
 * dhe e kundërta e asaj që thotë rreshti «mbrëmja është ora kur luhet». Është
 * zgjedhje e pronarit e jo rrjedhojë e kodit — mos e ndërro pa e pyetur.
 *
 * «Sistemi» nuk u hoq: mbetet zgjedhje e parë te çelësi, dhe kush e prek e
 * merr sërish ndërrimin automatik të telefonit. Ajo që ndryshoi është vetëm se
 * ajo gjendje nuk vjen më vetvetiu.
 */
export const TEMA_E_PARAZGJEDHUR: Tema = 'drite';

/**
 * Radha te çelësi. Sistemi rri i pari edhe pse nuk është më parazgjedhja: te
 * një çelës me tri njësi ai është mesi i shkallës — «ashtu si e thotë pajisja»
 * — dhe dy skajet, drita e terri, lexohen më shpejt kur e kanë atë mes vete.
 */
export const TEMAT: { tema: Tema; emri: string; ikona: string }[] = [
  { tema: 'sistemi', emri: 'Sistemi', ikona: 'telefoni' },
  { tema: 'drite', emri: 'Dritë', ikona: 'dielli' },
  { tema: 'terr', emri: 'Terr', ikona: 'hena' },
];

/**
 * Tema nga ajo që gjendet e ruajtur.
 *
 * Mungesa dhe vlera e panjohur lexohen njësoj — parazgjedhja — dhe këtu kjo
 * është e saktë e jo shkurtore: ndryshe nga lloji i lojës te një kopje rezervë
 * (pika 16), një temë e panjohur nuk e ndërron kuptimin e asnjë numri. Më e
 * keqja që ndodh është një ekran i ndryshëm nga ai që kishte zgjedhur dikush,
 * dhe një prekje e rregullon.
 */
export function lexoTemen(ruajtur: string | null): Tema {
  return TEMAT.some(({ tema }) => tema === ruajtur)
    ? (ruajtur as Tema)
    : TEMA_E_PARAZGJEDHUR;
}

/** Cila temë del vërtet në ekran, kur dihet çka thotë telefoni. */
export function temaEZbatuar(tema: Tema, sistemiNeTerr: boolean): TemaEZbatuar {
  if (tema !== 'sistemi') return tema;

  return sistemiNeTerr ? 'terr' : 'drite';
}

/**
 * Ngjyra e shiritit të shfletuesit për secilën temë.
 *
 * Te drita është smeraldi i veprimit kryesor, te terri sfondi i faqes. Meta e
 * `index.html`-it mban atë të parazgjedhjes — pra shiriti del i saktë që para
 * se JS-i të ngarkohet — dhe `ndricimi.ts` e ndërron sapo tema të vihet; pa
 * këtë, te aplikacioni i instaluar shiriti do të mbetej smerald mbi një faqe
 * të errët. Provat `ngjyra e shiritit është ajo e index.html-it` dhe
 * `ngjyra e territ është sfondi i tij te CSS-i` i lexojnë skedarët e tjerë që
 * të tria vendet të mos ndahen.
 */
export const NGJYRAT_E_SHIRITIT: Record<TemaEZbatuar, string> = {
  drite: '#047857',
  terr: '#080f1a',
};
