/**
 * Kod QR — nga teksti te matrica e pikave.
 *
 * I shkruar me dorë sepse rregulli i varësive vlen edhe këtu: tri paketa, dhe
 * asnjë e katërt për një gjë që hapet një herë në mbrëmje. Mbulon aq sa i
 * duhet ndarjes së rezultatit dhe as edhe një bit më shumë — mënyra „byte",
 * niveli i korrigjimit L, versionet 1 deri 20.
 *
 * Nuk njeh as DOM, as React: kthen një matricë `boolean[][]`, dhe kush e
 * vizaton e ka punën e vet. Provat e krahasojnë çdo version kundër `segno`-s,
 * një zbatimi krejt të pavarur në Python — sepse një kod QR i gabuar nuk duket
 * i gabuar, thjesht nuk lexohet.
 */

/* ── Fusha e Galuasë GF(256) ────────────────────────────────────────────── */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]!;
}

function shumezo(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : EXP[LOG[a]! + LOG[b]!]!;
}

/** Polinomi gjenerues i shkallës së dhënë: prodhimi i (x − α^i). */
function gjeneruesi(shkalla: number): number[] {
  let g = [1];

  for (let i = 0; i < shkalla; i++) {
    const tjetri = new Array<number>(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      tjetri[j] = tjetri[j]! ^ g[j]!;
      tjetri[j + 1] = tjetri[j + 1]! ^ shumezo(g[j]!, EXP[i]!);
    }
    g = tjetri;
  }

  return g;
}

/** Kodfjalët e korrigjimit për një bllok të dhënash. */
function korrigjimi(tedhenat: number[], sa: number): number[] {
  const gen = gjeneruesi(sa);
  const res = [...tedhenat, ...new Array<number>(sa).fill(0)];

  for (let i = 0; i < tedhenat.length; i++) {
    const koef = res[i]!;
    if (koef === 0) continue;
    for (let j = 0; j < gen.length; j++) {
      res[i + j] = res[i + j]! ^ shumezo(gen[j]!, koef);
    }
  }

  return res.slice(tedhenat.length);
}

/* ── Tabelat e versioneve, niveli L ─────────────────────────────────────── */

/** `[korrigjim për bllok, blloqe grupi 1, të dhëna grupi 1, blloqe 2, të dhëna 2]` */
const BLLOQET: Record<number, [number, number, number, number, number]> = {
  1: [7, 1, 19, 0, 0],
  2: [10, 1, 34, 0, 0],
  3: [15, 1, 55, 0, 0],
  4: [20, 1, 80, 0, 0],
  5: [26, 1, 108, 0, 0],
  6: [18, 2, 68, 0, 0],
  7: [20, 2, 78, 0, 0],
  8: [24, 2, 97, 0, 0],
  9: [30, 2, 116, 0, 0],
  10: [18, 2, 68, 2, 69],
  11: [20, 4, 81, 0, 0],
  12: [24, 2, 92, 2, 93],
  13: [26, 4, 107, 0, 0],
  14: [30, 3, 115, 1, 116],
  15: [22, 5, 87, 1, 88],
  16: [24, 5, 98, 1, 99],
  17: [28, 1, 107, 5, 108],
  18: [30, 5, 120, 1, 121],
  19: [28, 3, 113, 4, 114],
  20: [28, 3, 107, 5, 108],
};

/** Qendrat e modeleve të rreshtimit për çdo version. */
const RRESHTIMI: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
  11: [6, 30, 54],
  12: [6, 32, 58],
  13: [6, 34, 62],
  14: [6, 26, 46, 66],
  15: [6, 26, 48, 70],
  16: [6, 26, 50, 74],
  17: [6, 30, 54, 78],
  18: [6, 30, 56, 82],
  19: [6, 30, 58, 86],
  20: [6, 34, 62, 90],
};

/** Sa bajt të dhënash mban një version në nivelin L. */
function kapaciteti(version: number): number {
  const [, b1, d1, b2, d2] = BLLOQET[version]!;
  return b1 * d1 + b2 * d2;
}

export const VERSIONI_MAX = 20;

/** Versioni më i vogël që e nxë tekstin, ose `null` nëse s’e nxë asnjë. */
export function versioniPerGjatesi(bajt: number): number | null {
  for (let v = 1; v <= VERSIONI_MAX; v++) {
    // Koka është treguesi i mënyrës (4 bit), numri i karaktereve dhe mbaresa
    // (4 bit) — plot dy bajt, ose tre nga versioni 10 e tutje, ku treguesi i
    // numrit zgjatet në gjashtëmbëdhjetë bit.
    const koka = v >= 10 ? 3 : 2;
    if (bajt + koka <= kapaciteti(v)) return v;
  }
  return null;
}

/* ── Rrjedha e biteve ───────────────────────────────────────────────────── */

class Bitet {
  private readonly bites: number[] = [];

  shto(vlera: number, sa: number): void {
    for (let i = sa - 1; i >= 0; i--) this.bites.push((vlera >> i) & 1);
  }

  get gjatesia(): number {
    return this.bites.length;
  }

  /** Bitet e mbledhur si kodfjalë tetëbitëshe, të mbushura me zero. */
  kodfjalet(): number[] {
    const dale: number[] = [];
    for (let i = 0; i < this.bites.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | (this.bites[i + j] ?? 0);
      dale.push(b);
    }
    return dale;
  }
}

/* ── Matrica ────────────────────────────────────────────────────────────── */

type Matrica = {
  /** `true` = pikë e errët. */
  pikat: boolean[][];
  /** Modulet e rezervuara (modele, informacion) që maska nuk i prek. */
  ruajtur: boolean[][];
  madhesia: number;
};

function matriceEZbrazet(madhesia: number): Matrica {
  return {
    pikat: Array.from({ length: madhesia }, () =>
      new Array<boolean>(madhesia).fill(false),
    ),
    ruajtur: Array.from({ length: madhesia }, () =>
      new Array<boolean>(madhesia).fill(false),
    ),
    madhesia,
  };
}

function vendos(m: Matrica, r: number, c: number, e: boolean): void {
  m.pikat[r]![c] = e;
  m.ruajtur[r]![c] = true;
}

function syri(m: Matrica, rreshti: number, shtylla: number): void {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const y = rreshti + r;
      const x = shtylla + c;
      if (y < 0 || y >= m.madhesia || x < 0 || x >= m.madhesia) continue;

      const brenda =
        (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
        (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
        (r >= 2 && r <= 4 && c >= 2 && c <= 4);

      vendos(m, y, x, brenda);
    }
  }
}

function modelet(m: Matrica, version: number): void {
  syri(m, 0, 0);
  syri(m, 0, m.madhesia - 7);
  syri(m, m.madhesia - 7, 0);

  // Rreshtat e kohës.
  for (let i = 8; i < m.madhesia - 8; i++) {
    vendos(m, 6, i, i % 2 === 0);
    vendos(m, i, 6, i % 2 === 0);
  }

  // Modelet e rreshtimit, veç aty ku nuk përplasen me sytë.
  const qendrat = RRESHTIMI[version]!;
  for (const y of qendrat) {
    for (const x of qendrat) {
      const teSy =
        (y <= 8 && x <= 8) ||
        (y <= 8 && x >= m.madhesia - 9) ||
        (y >= m.madhesia - 9 && x <= 8);
      if (teSy) continue;

      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          vendos(
            m,
            y + r,
            x + c,
            Math.max(Math.abs(r), Math.abs(c)) !== 1,
          );
        }
      }
    }
  }

  // Moduli i errët, gjithmonë aty.
  vendos(m, m.madhesia - 8, 8, true);

  // Vendet e informacionit të formatit rezervohen që tani.
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      vendos(m, 8, i, false);
      vendos(m, i, 8, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    vendos(m, 8, m.madhesia - 1 - i, false);
    if (i < 7) vendos(m, m.madhesia - 1 - i, 8, false);
  }

  if (version >= 7) {
    const bitet = informacioniIVersionit(version);
    for (let i = 0; i < 18; i++) {
      const bit = ((bitet >> i) & 1) === 1;
      const r = Math.floor(i / 3);
      const c = (i % 3) + m.madhesia - 11;
      vendos(m, r, c, bit);
      vendos(m, c, r, bit);
    }
  }
}

/** BCH(18,6) për informacionin e versionit. */
function informacioniIVersionit(version: number): number {
  let d = version << 12;
  for (let i = 0; i < 6; i++) {
    if (d & (1 << (17 - i))) d ^= 0x1f25 << (5 - i);
  }
  return (version << 12) | d;
}

/** BCH(15,5) për formatin: niveli L (01) bashkë me maskën. */
function informacioniIFormatit(maska: number): number {
  const tedhenat = (0b01 << 3) | maska;
  let d = tedhenat << 10;
  for (let i = 0; i < 5; i++) {
    if (d & (1 << (14 - i))) d ^= 0x537 << (4 - i);
  }
  return ((tedhenat << 10) | d) ^ 0x5412;
}

function shkruajFormatin(m: Matrica, maska: number): void {
  const bitet = informacioniIFormatit(maska);

  for (let i = 0; i < 15; i++) {
    // Rreshtimi nis nga biti më i rëndësishëm: `i` është vendi te vargu, jo
    // fuqia e dyshit.
    const bit = ((bitet >> (14 - i)) & 1) === 1;

    // Kopja rreth syrit të sipërm-majtas.
    if (i < 6) m.pikat[8]![i] = bit;
    else if (i < 8) m.pikat[8]![i + 1] = bit;
    else if (i === 8) m.pikat[7]![8] = bit;
    else m.pikat[14 - i]![8] = bit;

    // Kopja e dytë, e ndarë mes dy syve të tjerë. Shtatë bitet e para zbresin
    // te shtylla 8; i teti e tutje shkojnë te rreshti 8 — po t'i jepej edhe i
    // teti shtyllës, do të shkelte modulin e errët, që rri pikërisht aty.
    if (i < 7) m.pikat[m.madhesia - 1 - i]![8] = bit;
    else m.pikat[8]![m.madhesia - 15 + i] = bit;
  }
}

/** Rruga gjarpëruese e të dhënave, nga fundi-djathtas lart. */
function vendosTeDhenat(m: Matrica, kodfjalet: number[]): void {
  let i = 0;
  let lart = true;

  for (let shtylla = m.madhesia - 1; shtylla > 0; shtylla -= 2) {
    // Shtylla e kohës kapërcehet krejt.
    if (shtylla === 6) shtylla--;

    for (let n = 0; n < m.madhesia; n++) {
      const rreshti = lart ? m.madhesia - 1 - n : n;

      for (const c of [shtylla, shtylla - 1]) {
        if (m.ruajtur[rreshti]![c]) continue;

        const bajti = kodfjalet[i >> 3] ?? 0;
        m.pikat[rreshti]![c] = ((bajti >> (7 - (i & 7))) & 1) === 1;
        i++;
      }
    }

    lart = !lart;
  }
}

function maskoje(rreshti: number, shtylla: number, maska: number): boolean {
  switch (maska) {
    case 0: return (rreshti + shtylla) % 2 === 0;
    case 1: return rreshti % 2 === 0;
    case 2: return shtylla % 3 === 0;
    case 3: return (rreshti + shtylla) % 3 === 0;
    case 4: return (Math.floor(rreshti / 2) + Math.floor(shtylla / 3)) % 2 === 0;
    case 5: return ((rreshti * shtylla) % 2) + ((rreshti * shtylla) % 3) === 0;
    case 6: return (((rreshti * shtylla) % 2) + ((rreshti * shtylla) % 3)) % 2 === 0;
    default: return (((rreshti + shtylla) % 2) + ((rreshti * shtylla) % 3)) % 2 === 0;
  }
}

/** Dënimi i një maske sipas katër rregullave të standardit. */
function denimi(pikat: boolean[][]): number {
  const n = pikat.length;
  let total = 0;

  // 1 — vargje të njëjta prej pesë e më shumë.
  for (let i = 0; i < n; i++) {
    for (const rresht of [true, false]) {
      let sa = 1;
      for (let j = 1; j < n; j++) {
        const tani = rresht ? pikat[i]![j] : pikat[j]![i];
        const para = rresht ? pikat[i]![j - 1] : pikat[j - 1]![i];
        if (tani === para) sa++;
        else {
          if (sa >= 5) total += 3 + (sa - 5);
          sa = 1;
        }
      }
      if (sa >= 5) total += 3 + (sa - 5);
    }
  }

  // 2 — katrorë 2×2 të një ngjyre.
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const v = pikat[r]![c];
      if (v === pikat[r]![c + 1] && v === pikat[r + 1]![c] && v === pikat[r + 1]![c + 1]) {
        total += 3;
      }
    }
  }

  // 3 — modeli 1:1:3:1:1 me katër të bardha anash.
  const A = [true, false, true, true, true, false, true, false, false, false, false];
  const B = [false, false, false, false, true, false, true, true, true, false, true];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j + 11 <= n; j++) {
      for (const rresht of [true, false]) {
        let njeA = true;
        let njeB = true;
        for (let k = 0; k < 11; k++) {
          const v = rresht ? pikat[i]![j + k] : pikat[j + k]![i];
          if (v !== A[k]) njeA = false;
          if (v !== B[k]) njeB = false;
        }
        if (njeA) total += 40;
        if (njeB) total += 40;
      }
    }
  }

  // 4 — çekuilibri mes së errëtës dhe së çelëtës.
  let errte = 0;
  for (const rreshti of pikat) for (const v of rreshti) if (v) errte++;
  const perqindja = (errte * 100) / (n * n);
  total += Math.floor(Math.abs(perqindja - 50) / 5) * 10;

  return total;
}

/* ── Hyrja ──────────────────────────────────────────────────────────────── */

/**
 * Kthen tekstin në një matricë pikash, ose `null` nëse teksti është shumë i
 * gjatë për versionet e mbuluara.
 *
 * Maska zgjidhet si te standardi: provohen të tetat dhe mbetet ajo me dënimin
 * më të vogël.
 */
export function kodiQR(teksti: string): boolean[][] | null {
  const bajtet = [...new TextEncoder().encode(teksti)];
  const version = versioniPerGjatesi(bajtet.length);
  if (version === null) return null;

  const [ecPerBllok, b1, d1, b2, d2] = BLLOQET[version]!;

  // Mënyra „byte", numri i karaktereve, të dhënat, mbaresa, mbushja.
  const bitet = new Bitet();
  bitet.shto(0b0100, 4);
  bitet.shto(bajtet.length, version >= 10 ? 16 : 8);
  for (const b of bajtet) bitet.shto(b, 8);

  const gjithsej = kapaciteti(version) * 8;
  bitet.shto(0, Math.min(4, gjithsej - bitet.gjatesia));
  if (bitet.gjatesia % 8 !== 0) bitet.shto(0, 8 - (bitet.gjatesia % 8));

  const kodfjalet = bitet.kodfjalet();
  for (let i = 0; kodfjalet.length < kapaciteti(version); i++) {
    kodfjalet.push(i % 2 === 0 ? 0xec : 0x11);
  }

  // Ndarja në blloqe, dhe korrigjimi për secilin.
  const blloqet: number[][] = [];
  const korrigjimet: number[][] = [];
  let marre = 0;

  for (const [sa, gjatesia] of [
    [b1, d1],
    [b2, d2],
  ] as const) {
    for (let i = 0; i < sa; i++) {
      const bllok = kodfjalet.slice(marre, marre + gjatesia);
      marre += gjatesia;
      blloqet.push(bllok);
      korrigjimet.push(korrigjimi(bllok, ecPerBllok));
    }
  }

  // Thurja: kodfjala e parë e çdo blloku, pastaj e dyta, e kështu me radhë.
  const thurur: number[] = [];
  const meGjata = Math.max(...blloqet.map((b) => b.length));
  for (let i = 0; i < meGjata; i++) {
    for (const bllok of blloqet) if (i < bllok.length) thurur.push(bllok[i]!);
  }
  for (let i = 0; i < ecPerBllok; i++) {
    for (const ec of korrigjimet) thurur.push(ec[i]!);
  }

  const madhesia = version * 4 + 17;
  let mePakDenim: boolean[][] | null = null;
  let meIVogli = Infinity;

  for (let maska = 0; maska < 8; maska++) {
    const m = matriceEZbrazet(madhesia);
    modelet(m, version);
    vendosTeDhenat(m, thurur);

    for (let r = 0; r < madhesia; r++) {
      for (let c = 0; c < madhesia; c++) {
        if (!m.ruajtur[r]![c] && maskoje(r, c, maska)) {
          m.pikat[r]![c] = !m.pikat[r]![c];
        }
      }
    }

    shkruajFormatin(m, maska);

    const d = denimi(m.pikat);
    if (d < meIVogli) {
      meIVogli = d;
      mePakDenim = m.pikat;
    }
  }

  return mePakDenim;
}
