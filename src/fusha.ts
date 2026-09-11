/**
 * Teksti i fushave: pikët me shenjën e tyre, dhe emrat e lojtarëve.
 *
 * Fusha e pikëve është `type="text"` e jo `type="number"`, dhe kjo nuk është
 * rastësi: tastiera `inputMode="numeric"` e Androidit ka vetëm shifra — pa
 * minus — prandaj pikët e mbylljes (−20 dhe −40, ato që futen në çdo raund) nuk
 * shkruheshin dot fare në telefon. Shenjën e vendos një buton më vete, dhe një
 * fushë numerike do ta hidhte poshtë vlerën e ndërmjetme „−" para se të vinin
 * shifrat.
 *
 * Këtu rri vetëm përpunimi i tekstit, pa React dhe pa DOM, që `node --test` ta
 * masë drejtpërdrejt. Një gabim aty nuk duket në ekran — thjesht ruan pikë me
 * shenjë të gabuar, dhe totali i mbrëmjes del përmbys.
 */

/** A është kjo fushë e vendosur në negativ? */
export function negative(teksti: string | undefined): boolean {
  return (teksti ?? '').startsWith('-');
}

/**
 * Mban vetëm shifrat, dhe minusin nëse gjendet kudo qoftë.
 *
 * Minusi kërkohet kudo e jo vetëm në krye. Kur shenja shtypet para shifrave,
 * fusha mbetet me „−" të vetëm dhe kursori shkon aty ku e lë gishti — shpesh
 * para tij. Shifrat atëherë dalin „4−", dhe një filtër që e kërkon minusin në
 * krye do ta hidhte poshtë pikërisht shenjën që përdoruesi sapo e vuri.
 */
export function pastro(teksti: string): string {
  const shenja = teksti.includes('-') ? '-' : '';
  return shenja + teksti.replace(/[^0-9]/g, '');
}

/**
 * Ndërron shenjën e një teksti.
 *
 * Fusha e zbrazët bëhet „−", që shifrat e shtypura pas saj të dalin negative pa
 * u kthyer njëherë pozitive.
 */
export function ndrroShenjen(teksti: string | undefined): string {
  const tani = teksti ?? '';
  return tani.startsWith('-') ? tani.slice(1) : `-${tani}`;
}

/** Teksti i një fushe si numër, ose `null` nëse s’është shënuar ende. */
export function numri(teksti: string | undefined): number | null {
  if (teksti === undefined || teksti.trim() === '') return null;
  const n = Number(teksti);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/* ── Data ───────────────────────────────────────────────────────────────── */

/**
 * Formaton datën sa shkruhet: shifrat marrin vijat vetë — «11/09/2025».
 *
 * Vijat nuk shtypen me dorë: tastiera numerike e telefonit nuk i ka, dhe kush
 * i kërkon te «!#1» e humb rreshtin. Prandaj mbahen vetëm shifrat, dhe vija
 * del vetë pas ditës e pas muajit. Grupi i zbrazët nuk e merr vijën, që
 * fshirja mbrapsht të mos ngecë te «11/».
 */
export function pastroDaten(teksti: string): string {
  const shifrat = teksti.replace(/\D/g, '').slice(0, 8);
  const pjeset = [
    shifrat.slice(0, 2),
    shifrat.slice(2, 4),
    shifrat.slice(4, 8),
  ];

  return pjeset.filter((pjesa) => pjesa !== '').join('/');
}

/* ── Emrat e lojtarëve ──────────────────────────────────────────────────── */

/**
 * Ndan një tekst me shumë emra në emra të veçantë.
 *
 * Krijimi i një grupi ishte një emër për prekje: shkruaj, Enter, shkruaj,
 * Enter — gjashtë herë para se të nisë loja e parë. Tani i njëjti kuti pranon
 * «alfa, beta, gama, delta» njëherësh, të shkruar ose të ngjitur nga një bisedë.
 *
 * Ndarësit janë presja, pikëpresja, tabulatori dhe rreshti i ri — jo hapësira,
 * sepse emrat me dy fjalë („alfa + zeta" te fleta e vjetër) duhet të mbeten një
 * i vetëm. Hapësirat e shumta brenda emrit shtypen në një.
 */
export function ndajEmrat(teksti: string): string[] {
  const dale: string[] = [];

  for (const pjesa of teksti.split(/[,;\n\r\t]+/)) {
    const emri = pjesa.trim().replace(/\s+/g, ' ');
    if (emri && !dale.includes(emri)) dale.push(emri);
  }

  return dale;
}

/**
 * Emrat e rinj që duhen shtuar te një listë ekzistuese.
 *
 * Ata që i ka tashmë lista kapërcehen pa zhurmë: kur dikush e ngjit sërish
 * tërë shoqërinë për të shtuar një emër të vetëm, pritja është që të shtohet
 * ai i vetmi, jo të dalë gabim.
 */
export function emratERinj(teksti: string, ekzistuesit: string[]): string[] {
  return ndajEmrat(teksti).filter((emri) => !ekzistuesit.includes(emri));
}
