/**
 * Emrat që i mbijetojnë pajisjes: `uid`-i i një regjistri dhe emri i një
 * shfletuesi.
 *
 * Baza lokale i numëron regjistrat me `autoIncrement` — `1`, `2`, `3` — dhe ata
 * numra janë të mirë sa kohë ka një pajisje të vetme. Sapo hyn sinkronizimi
 * (pika 19), ata nuk vlejnë më si emër: dy telefona që kanë krijuar secili
 * grupin e vet e quajnë të dy `1`, dhe një bashkim mbi atë numër do t'i
 * shkrinte dy shoqëri të ndryshme në një. Prandaj çdo regjistër merr edhe një
 * `uid` që nuk e cakton baza — i rastësishëm, i shkruar një herë, dhe i njëjti
 * te çdo pajisje ku shkon ai regjistër.
 *
 * Numri mbetet aty ku ishte: rrugët (`#/loja/3`), indekset dhe lidhjet brenda
 * pajisjes lexohen njësoj si më parë. `uid`-i është emri që del jashtë.
 *
 * Nuk njeh as bazën, as React-in, as `window`-in (pika 1).
 */

/** Parathënjet e `uid`-ve. Shkronja e parë e thotë çka është, kur lexohet një
 * rresht i cloud-it me sy. */
export const PREFIKSAT = {
  groups: 'grup',
  games: 'loje',
  rounds: 'raund',
} as const;

/**
 * Një `uid` i ri.
 *
 * `crypto.randomUUID` kur e ka shfletuesi; përndryshe ora plus rastësia, e cila
 * për katër pajisje të një shoqërie është po aq unike. Shkurtohet në gjashtëmbë-
 * dhjetë karaktere sepse ky varg shkruhet te çdo rresht që kalon nëpër rrjet
 * dhe te çdo rresht i bazës: 2⁶⁴ mundësi janë tej çdo nevoje këtu.
 */
export function uidIRi(prefiksi: string): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefiksi}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    }
  } catch {
    // Bie te rruga poshtë — e cila nuk dështon dot.
  }
  return `${prefiksi}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * A duket si `uid` i yni.
 *
 * Kontrollohet sepse vjen nga jashtë: rreshtat e cloud-it i shkruan një bazë që
 * e administron vetë përdoruesi, dhe një `record_id` i futur me dorë te SQL
 * Editor-i nuk ka pse ta gjejë veten si çelës të një `objectStore`-i. Alfabet i
 * ngushtë, si te çdo fushë e shpaketuar (pika 7).
 */
export function uidIVlefshem(v: unknown): v is string {
  return typeof v === 'string' && /^[a-z]+_[A-Za-z0-9]{6,40}$/.test(v);
}

/**
 * Shfletuesi dhe sistemi me dy fjalë, si emër i parë i një pajisjeje.
 *
 * I jepet vargu e nuk e lexon vetë, që të provohet. Me qëllim i trashë: kjo
 * është një etiketë te një listë me tri-katër pajisje, e jo matje — «Chrome në
 * Android» mjafton që dikush ta njohë telefonin e vet. Radha ka rëndësi: çdo
 * shfletues Chromium thotë edhe „Chrome", dhe Edge thotë edhe „Chromium".
 */
export function emriIMenduar(ua = ''): string {
  const teksti = String(ua);
  const shfletuesi = /Edg\//i.test(teksti)
    ? 'Edge'
    : /OPR\/|Opera/i.test(teksti)
      ? 'Opera'
      : /SamsungBrowser/i.test(teksti)
        ? 'Samsung Internet'
        : /Firefox|FxiOS/i.test(teksti)
          ? 'Firefox'
          : /Chrome|CriOS/i.test(teksti)
            ? 'Chrome'
            : /Safari/i.test(teksti)
              ? 'Safari'
              : '';

  const sistemi = /iPad/i.test(teksti)
    ? 'iPad'
    : /iPhone|iPod/i.test(teksti)
      ? 'iPhone'
      : /Android/i.test(teksti)
        ? 'Android'
        : /Windows/i.test(teksti)
          ? 'Windows'
          : /Mac OS X|Macintosh/i.test(teksti)
            ? 'Mac'
            : /Linux/i.test(teksti)
              ? 'Linux'
              : '';

  if (shfletuesi && sistemi) return `${shfletuesi} në ${sistemi}`;
  return shfletuesi || sistemi || 'Pajisje';
}
