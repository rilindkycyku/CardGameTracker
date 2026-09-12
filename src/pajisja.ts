/**
 * Cila pajisje është kjo.
 *
 * Gjithçka tjetër te sinkronizimi është me qëllim pa emër: një llogari, një
 * tabelë, dhe rreshta që thonë vetëm **çka** ndryshoi. Kjo mjafton derisa diçka
 * të shkojë keq — një tablet i pastruar që ngarkoi një bazë të zbrazët mbi
 * historikun e një viti — dhe atëherë pyetja e parë është pikërisht ajo që baza
 * nuk i përgjigjet dot: **cila nga pajisjet e mia e bëri?** I njëjti email hyn
 * te të gjitha, pra llogaria nuk thotë asgjë, dhe `updated_at` thotë kur e jo
 * kush.
 *
 * Prandaj çdo shfletues i vë vetes një emër e një id, një herë, dhe i stampon te
 * çdo rresht që dërgon. Id-ja është e rastësishme dhe nuk do të thotë asgjë
 * jashtë kësaj llogarie; emri është si e quan përdoruesi («Tableti», «Telefoni i
 * madh»), i hamendësuar nga shfletuesi herën e parë që të jetë i dobishëm para
 * se ta shkruajë kush.
 *
 * Rri te `localStorage` e jo te baza me qëllim: përshkruan **këtë shfletues**, e
 * jo mbrëmjet e shoqërisë, prandaj nuk guxon të udhëtojë te pajisjet e tjera
 * përmes sinkronizimit — një id e sinkronizuar do t'i bënte të gjitha pajisjet
 * të pohonin se janë e njëjta.
 *
 * Vendimet e provueshme — emri i hamendësuar, id-ja e re — rrinë te
 * `identiteti.ts` (pika 1); këtu mbetet vetëm `localStorage`-i.
 */

import { emriIMenduar, uidIRi } from './identiteti.ts';

const CELESI = 'tavolina.pajisja';

export type Pajisja = { id: string; emri: string; krijuar: number };

/** Një pajisje që nuk është prezantuar ende. */
const BOSH: Pajisja = { id: '', emri: '', krijuar: 0 };

function ua(): string {
  return typeof navigator === 'undefined' ? '' : navigator.userAgent;
}

function lexo(): Pajisja {
  try {
    const raw = localStorage.getItem(CELESI);
    return raw ? { ...BOSH, ...(JSON.parse(raw) as Partial<Pajisja>) } : { ...BOSH };
  } catch {
    // Shfletim privat, ose një hyrje e prishur. Të dyja do të thonë «ky
    // shfletues ende nuk ka emër».
    return { ...BOSH };
  }
}

function shkruaj(pajisja: Pajisja): Pajisja {
  try {
    localStorage.setItem(CELESI, JSON.stringify(pajisja));
  } catch {
    // Identiteti është lehtësi, jo kredencial: sinkronizimi punon edhe pa të,
    // rreshtat thjesht shkojnë të panënshkruar. Asgjë këtu nuk vlen sa një
    // sinkronizim i dështuar.
  }
  return pajisja;
}

/**
 * Kjo pajisje, duke e krijuar identitetin herën e parë që pyet kush.
 *
 * Krijohet këtu e jo te nisja e aplikacionit, që një shfletues i cili nuk lidh
 * kurrë një projekt të mos shpikë një id që nuk i duhet — dhe që id-ja të jetë
 * në vend para rreshtit të parë që del, cilado rrugë arrin e para.
 */
export function pajisjaKjo(): Pajisja {
  const ruajtur = lexo();
  if (ruajtur.id) return ruajtur;
  return shkruaj({ id: uidIRi('paj'), emri: emriIMenduar(ua()), krijuar: Date.now() });
}

/** E riemërton këtë pajisje. E zbrazëta bie te hamendja, që lista të mos tregojë
 * kurrë një rresht pa emër. */
export function riemertoPajisjen(emri: string): Pajisja {
  const pajisja = pajisjaKjo();
  const i = String(emri || '').trim().slice(0, 40);
  return shkruaj({ ...pajisja, emri: i || emriIMenduar(ua()) });
}

/** Çka mban një rresht i dërguar: kush e shkroi, me dy kolona të shkurtra. Kthen
 * `null` kur shfletuesi e mohoi fare ruajtjen — atëherë rreshtat shkojnë të
 * panënshkruar, e nuk dështon dërgimi. */
export function stampaPajisjes(): { id: string; emri: string } | null {
  const pajisja = pajisjaKjo();
  return pajisja.id ? { id: pajisja.id, emri: pajisja.emri } : null;
}
