/**
 * Parashikimi i vendeve — kush mund të dalë ku, dhe sa i duhet për atje.
 *
 * Renditja thotë ku janë tani. Pyetja që vjen menjëherë pas saj rreth tavolinës
 * është tjetër: *a e arrin dot i dyti të parin nëse luajmë edhe një raund?* —
 * dhe atë fleta e vjetër nuk e përgjigjej dot, sepse kërkon të dihen kufijtë e
 * një raundi. Këtu ata kufij dihen, prandaj përgjigjja del nga llogaria e jo
 * nga syri.
 *
 * Të dyja lojërat e veçojnë saktësisht një lojtar për raund — mbyllësin te
 * bridzhi, humbësin te magareci — dhe pikërisht ajo i bën kufijtë të numërueshëm:
 *
 *   • **Bridzh** — mbyllësi merr −40 (hant), dhe kush s'hap fare merr 200.
 *     Pra brenda një raundi një lojtar bie së shumti 40 pikë, dhe ngjitet së
 *     shumti 200. Diferenca që mbyllet me një raund të vetëm është 240.
 *   • **Magarec** — humbësi merr një shkronjë, të tjerët asnjë. Askush nuk i
 *     kthen shkronjat prapa, prandaj vendi vetëm përkeqësohet, dhe mbrëmja
 *     mbaron kur dikujt i mbushet fjala — pra edhe raundet e mbetura kanë kufi.
 *
 * Dy skenarë maten për secilin lojtar, dhe të dy janë të arritshëm vërtet, jo
 * kufij teorikë të pamundur njëkohësisht:
 *
 *   • **Vendi më i mirë** — ai merr më të mirën çdo raund, dhe të tjerët më të
 *     keqen. Te bridzhi kjo është një raund hant ku askush tjetër s'ka hapur;
 *     te magareci, raunde që i humbin të tjerët.
 *   • **Vendi më i keq** — e kundërta. Te bridzhi mbylljet e të tjerëve janë të
 *     kufizuara: një mbyllës për raund, prandaj ato ndahen mes vete e nuk i
 *     merr secili të gjitha.
 *
 * Barazimet numërohen si i njëjti vend: `renditja` e ndan barazimin sipas
 * radhës së listës, por një parashikim që thotë «i dyti» vetëm sepse emri i tij
 * vjen më vonë në alfabet do të ishte numër i shpikur. Prandaj vendi këtu është
 * «sa veta kanë më pak se ai, plus një».
 *
 * Asnjë nga këto vlera nuk ruhet, si çdo vlerë e derivuar (pika 2). Ky skedar
 * nuk njeh as bazën, as React-in, as `window`-in: importohet drejt nga
 * `node --test`, pa bundler.
 */

import { FJALA } from './magareci.ts';
import { DENIMI_I_MBYLLUR, PIKET_E_MBYLLESIT } from './pikezimi.ts';
import type { LlojiILojes } from './tipet.ts';

/* ── Kufijtë e një raundi ───────────────────────────────────────────────── */

/**
 * Sa pikë bie më së shumti një lojtar brenda një raundi: −40, mbyllja hant.
 *
 * Vjen nga `pikezimi.ts` e nuk shkruhet sërish këtu: nëse dikush e prek
 * rregullin, parashikimi e ndjek vetvetiu.
 */
export const FITIMI_I_RAUNDIT = PIKET_E_MBYLLESIT.hant;

/**
 * Sa pikë ngjitet më së shumti sipas rregullit: 200, hant pa hapur.
 *
 * Ky është i vetmi nga të dy kufijtë që rregulli nuk e mbyll plotësisht —
 * `2 × dora` e kalon atë kur dora del mbi 100 pikë, gjë që ndodh rrallë por
 * ndodh. Prandaj «vendi më i keq» lexohet si kufi i rregullit e jo i së
 * mundshmes, dhe ekrani e thotë atë me fjalë.
 */
export const HUMBJA_E_RAUNDIT = DENIMI_I_MBYLLUR.hant;

/** Sa raunde para i propozon ekrani. Magareci i pret sipas kufirit të vet. */
export const RAUNDET_E_PARASHIKIMIT = [1, 2, 3, 5];

/* ── Forma e përgjigjes ─────────────────────────────────────────────────── */

/** Parashikimi i një lojtari të vetëm. */
export type ParashikimiILojtarit = {
  player: string;
  /** Totali tani — pikët te bridzhi, shkronjat te magareci. */
  totali: number;
  /** Vendi tani. Barazimi numërohet si i njëjti vend. */
  vendi: number;
  /** Vendi më i mirë i arritshëm brenda raundeve të marra parasysh. */
  meIMiri: number;
  /** Vendi më i keq i mundshëm brenda tyre. */
  meIKeqi: number;
  /** Totali te skenari më i mirë për të. */
  meIMiriTotali: number;
  /** Totali te skenari më i keq për të. */
  meIKeqiTotali: number;
  /** A e arrin dot ende vendin e parë brenda atyre raundeve. */
  mundTeFitoje: boolean;
  /** A e mban vendin e parë sido që të vijë puna. */
  iSigurt: boolean;
  /**
   * Sa raunde i duhen së paku për vendin e parë, pavarësisht sa janë zgjedhur
   * në ekran. `0` do të thotë që e ka tashmë; `null` që nuk arrihet me asnjë
   * numër raundesh — dhe atë e nxjerr vetëm magareci, ku shkronjat nuk kthehen.
   */
  raundetPerVendinEPare: number | null;
};

/** Parashikimi i tërë tavolinës. */
export type Parashikimi = {
  /** Raundet e marra parasysh, pasi janë prerë sipas kufirit të lojës. */
  raunde: number;
  /** Lojtarët sipas totalit, më i vogli i pari — si te renditja. */
  rreshtat: ParashikimiILojtarit[];
  /** Kush e arrin dot ende vendin e parë. */
  pretendentet: string[];
  /**
   * Sa raunde mund të luhen ende më së shumti, ose `null` kur s'ka kufi.
   *
   * Bridzhi nuk e ka: mbrëmja mbaron kur ngrihen nga tavolina. Magareci po —
   * fjala mbushet, dhe pas saj nuk ka raund tjetër.
   */
  kufiriIRaundeve: number | null;
};

/* ── Ndihmësit ──────────────────────────────────────────────────────────── */

/** Vendi sipas totalit, me barazimin si i njëjti vend. */
function vendiSipas(totalet: number[], vlera: number): number {
  return 1 + totalet.filter((t) => t < vlera).length;
}

/**
 * Sa prej tyre e kalojnë pragun kur raundet ndahen mes vete.
 *
 * `kostot` mban sa raunde i duhen secilit; `buxheti` sa raunde ka gjithsej.
 * Meqë vetëm një lojtar veçohet për raund, ato raunde nuk i merr secili të
 * gjitha — ndahen. Më i liri i pari, sepse ai lë më shumë për të tjerët; kjo
 * e nxjerr numrin më të madh të mundshëm.
 */
function saKalojne(kostot: number[], buxheti: number): number {
  let mbetur = buxheti;
  let sa = 0;

  for (const kostoja of [...kostot].sort((a, b) => a - b)) {
    if (!Number.isFinite(kostoja) || kostoja > mbetur) break;
    mbetur -= kostoja;
    sa += 1;
  }

  return sa;
}

/** Numri i raundeve i pastruar: i plotë, jo negativ, jo `NaN`. */
function raundeTePastra(raunde: number): number {
  return Number.isFinite(raunde) ? Math.max(0, Math.trunc(raunde)) : 0;
}

/* ── Bridzhi ────────────────────────────────────────────────────────────── */

/**
 * Parashikimi i bridzhit.
 *
 * Skenari më i mirë për një lojtar është i arritshëm ashtu si shkruhet: ai
 * mbyll hant çdo raund (−40) ndërsa asnjë nga të tjerët nuk ka hapur (+200
 * secili). Ato dy gjëra janë pikërisht i njëjti raund, prandaj nuk ka nevojë
 * për asnjë supozim të dytë.
 *
 * Skenari më i keq nuk është pasqyra e tij. Ai vetë mund të mos hapë çdo raund
 * dhe të marrë 200 sa herë; por të tjerët nuk mbyllin dot të gjithë njëkohësisht
 * — një mbyllës për raund — prandaj ato mbyllje ndahen mes vete, dhe kush i
 * duhet më pak i merr të parat.
 */
export function parashikimiIBridzhit(
  players: string[],
  totalet: Record<string, number>,
  raunde: number,
): Parashikimi {
  const n = raundeTePastra(raunde);
  const vlera = (player: string) => totalet[player] ?? 0;
  const teGjitha = players.map(vlera);

  const rreshtat = [...players]
    .sort((a, b) => vlera(a) - vlera(b))
    .map((player): ParashikimiILojtarit => {
      const totali = vlera(player);
      const tjeret = players.filter((p) => p !== player).map(vlera);

      const meIMiriTotali = totali + FITIMI_I_RAUNDIT * n;
      const meIKeqiTotali = totali + HUMBJA_E_RAUNDIT * n;

      // Më i miri: ai bie 40 për raund, të tjerët ngjiten 200 — të pavarur nga
      // njëri-tjetri, sepse „nuk hapi" e bëjnë dot të gjithë në të njëjtin raund.
      const meIMiri =
        1 + tjeret.filter((t) => t + HUMBJA_E_RAUNDIT * n < meIMiriTotali).length;

      // Më i keqi: sa raunde i duhen secilit tjetër që të bjerë nën të, kur ai
      // vetë ngjitet 200 për raund. Një mbyllje e ul lojtarin 40 pikë.
      const hapi = -FITIMI_I_RAUNDIT;
      const kostot = tjeret.map((t) => {
        const diferenca = t - meIKeqiTotali;
        return diferenca >= 0 ? Math.floor(diferenca / hapi) + 1 : 0;
      });
      const meIKeqi = 1 + saKalojne(kostot, n);

      // Sa raunde për vendin e parë: një raund e mbyll diferencën me 240 — 40
      // që bie ai, 200 që ngjitet ai që prin.
      const meIVogli = Math.min(...tjeret, totali);
      const mbetja = totali - meIVogli;
      const perVendinEPare = Math.ceil(mbetja / (hapi + HUMBJA_E_RAUNDIT));

      return {
        player,
        totali,
        vendi: vendiSipas(teGjitha, totali),
        meIMiri,
        meIKeqi,
        meIMiriTotali,
        meIKeqiTotali,
        mundTeFitoje: meIMiri === 1,
        iSigurt: meIKeqi === 1,
        raundetPerVendinEPare: Math.max(0, perVendinEPare),
      };
    });

  return {
    raunde: n,
    rreshtat,
    pretendentet: rreshtat.filter((r) => r.mundTeFitoje).map((r) => r.player),
    kufiriIRaundeve: null,
  };
}

/* ── Magareci ───────────────────────────────────────────────────────────── */

/**
 * Sa raunde mund të luhen ende më së shumti.
 *
 * Mbrëmja mbaron sapo dikujt i mbushet fjala, prandaj numri nuk është i pafund:
 * secili mund të arrijë deri te shkronja e gjashtë pa e mbyllur lojën, dhe pastaj
 * një raund i vetëm e mbyll. Kur fjala është mbushur tashmë, raunde nuk ka fare.
 */
export function raundetMeTeShumta(
  players: string[],
  shkronjat: Record<string, number>,
): number {
  const sa = players.map((p) => Math.max(0, Math.trunc(shkronjat[p] ?? 0)));
  if (sa.some((x) => x >= FJALA.length)) return 0;

  return sa.reduce((gjithsej, x) => gjithsej + (FJALA.length - 1 - x), 0) + 1;
}

/**
 * Parashikimi i magarecit.
 *
 * Shkronjat vetëm shtohen — askush nuk i kthen prapa — prandaj skenari më i mirë
 * i një lojtari është të mos humbë asnjë raund tjetër, dhe ai më i keqi t'i
 * humbë të gjitha. Ajo që ia ndërron vendin janë shkronjat e të tjerëve, dhe
 * ato ndahen: një shkronjë për raund, e jo një për secilin.
 *
 * Për vendin nuk kërkohet që tjetri ta kalojë — mjafton ta arrijë. Barazimi
 * numërohet si i njëjti vend, dhe meqë synimi i të tjerëve është shkronjat e
 * atij që po matet, dhe ai ka së shumti gjashtë sa kohë loja vazhdon, asnjë nga
 * ata raunde nuk e mbush fjalën e nuk e mbyll mbrëmjen para kohe.
 */
export function parashikimiIMagarecit(
  players: string[],
  shkronjat: Record<string, number>,
  raunde: number,
): Parashikimi {
  const kufiri = raundetMeTeShumta(players, shkronjat);
  const n = Math.min(raundeTePastra(raunde), kufiri);
  const vlera = (player: string) =>
    Math.max(0, Math.trunc(shkronjat[player] ?? 0));
  const teGjitha = players.map(vlera);

  const rreshtat = [...players]
    .sort((a, b) => vlera(a) - vlera(b))
    .map((player): ParashikimiILojtarit => {
      const totali = vlera(player);
      const tjeret = players.filter((p) => p !== player).map(vlera);

      // Më i keqi: i humb vetë të gjitha, dhe ndalet aty ku fjala mbushet.
      const meIKeqiTotali = Math.min(totali + n, FJALA.length);
      const meIKeqi = 1 + tjeret.filter((t) => t < meIKeqiTotali).length;

      // Më i miri: nuk humb asnjë, dhe raundet e mbetura i marrin ata që rrinë
      // ende nën të. Kush nuk arrihet dot brenda buxhetit i mbetet përpara.
      const nevojtaret = tjeret.filter((t) => t < totali).map((t) => totali - t);
      const meIMiri = 1 + nevojtaret.length - saKalojne(nevojtaret, n);

      // Sa raunde për vendin e parë: sa shkronja u mungojnë të gjithë atyre që
      // rrinë nën të. Nuk arrihet vetëm kur loja ka mbaruar tashmë.
      const gjithsej = nevojtaret.reduce((shuma, x) => shuma + x, 0);

      return {
        player,
        totali,
        vendi: vendiSipas(teGjitha, totali),
        meIMiri,
        meIKeqi,
        meIMiriTotali: totali,
        meIKeqiTotali,
        mundTeFitoje: meIMiri === 1,
        iSigurt: meIKeqi === 1,
        raundetPerVendinEPare: gjithsej <= kufiri ? gjithsej : null,
      };
    });

  return {
    raunde: n,
    rreshtat,
    pretendentet: rreshtat.filter((r) => r.mundTeFitoje).map((r) => r.player),
    kufiriIRaundeve: kufiri,
  };
}

/* ── Hyrja e vetme ──────────────────────────────────────────────────────── */

/**
 * Parashikimi sipas llojit të lojës.
 *
 * Ekrani e thërret vetëm këtë: cila lojë është, e dinë këto dy funksionet, dhe
 * një `lloji === 'magarec'` i shpërndarë nëpër komponentë do të harrohej
 * pikërisht atje ku ndryshon llogaria.
 */
export function parashikimi(
  lloji: LlojiILojes,
  players: string[],
  totalet: Record<string, number>,
  raunde: number,
): Parashikimi {
  return lloji === 'magarec'
    ? parashikimiIMagarecit(players, totalet, raunde)
    : parashikimiIBridzhit(players, totalet, raunde);
}
