/**
 * Ekrani i një loje — futja e raundit, renditja, raundet dhe shlyerja.
 *
 * Katër lojëra ndajnë këtë ekran, dhe ndajnë gjithçka që rri rreth raundit: të
 * dhënat, lojtarët mes lojës, ndarjen e rezultatit, redaktimin dhe fshirjen.
 * Ajo që ndryshon është vetëm çka shënohet — numra te bridzhi, domina e
 * pishpiriku, një emër te magareci — dhe çka vizatohet poshtë. Prandaj `lloji`
 * e ndan vizatimin te pak vende e jo ekranin te katër skedarë: një kopje e dytë
 * e kësaj do të dilte jashtë sinkronie te pikërisht ato pjesë që janë të njëjta.
 *
 * Çka e ndan njërën lojë nga tjetra nuk shkruhet këtu, lexohet nga
 * `lojerat.ts`: kush fiton, me çka mbaron mbrëmja, a ka llogaritës, a shlyhet.
 * Kështu ekrani pyet «çka thotë rregulli» e jo «cila lojë është».
 *
 * Renditja e blloqeve ndjek atë që pyetet më shpesh gjatë lojës: para së
 * gjithash futja e raundit të radhës, sepse ajo bëhet dhjetëra herë në mbrëmje;
 * pastaj kush prin; pastaj tabela e plotë; shlyerja në fund, sepse ajo shihet
 * kur mbaron loja. Panelat që preken një herë a asnjë — lojtarët, ndarja,
 * rregullat, kufiri, mbyllja — rrinë bashkë pas tyre: mes futjes dhe renditjes
 * ata shtynin poshtë pikërisht atë që lexohet pas çdo raundi.
 *
 * Radha mbetet e njëjta te çdo gjerësi; ndryshon vetëm sa prej saj hyn në ekran
 * njëherësh. Te tableta dhe te kompjuteri futja e renditja rrinë krah për krah
 * (`.loja__pune`), dhe panelat dalin dy për rresht — gjerësia ishte aty edhe më
 * parë, thjesht rrinte e zbrazët.
 *
 * Asnjë total nuk ruhet. Sa herë ndryshon një raund, gjithçka rillogaritet nga
 * raundet — prandaj redaktimi i raundit të tretë në raundin e dhjetë e rregullon
 * vetvetiu edhe renditjen, edhe matricën.
 */

import { useCallback, useMemo, useState } from 'react';

import {
  dataShqip,
  llojiILojes,
  fituesit,
  matricaEShlyerjes,
  permbledhja,
  perziersiIRaundit,
  raundetELojes,
  raundiNeVijim,
  renditja,
} from '../llogaritjet.ts';
import {
  FJALA,
  humbesiIRaundit,
  magareci as kushDoliMagarec,
  raundetEMagarecit,
  raundiIHumbjes,
  shkronjat as shkronjatE,
} from '../magareci.ts';
import { kufiriILojes, mbaroiSipasRregullit, perfundoiMbremja } from '../fundi.ts';
import { rregullat, type Rregullat } from '../lojerat.ts';
import { Ikona } from '../ikonat.tsx';
import { useNgarko } from '../ngarko.ts';
import { useEkranIGjere } from '../pamja.ts';
import { Fundfaqja } from '../pjeset/Fundfaqja.tsx';
import { FutjaEMagarecit } from '../pjeset/FutjaEMagarecit.tsx';
import { FutjaERaundit } from '../pjeset/FutjaERaundit.tsx';
import { PA_KUFI, ZgjedhjaEKufirit } from '../pjeset/Kufiri.tsx';
import { LojtaretELojes } from '../pjeset/LojtaretELojes.tsx';
import { Ndarja } from '../pjeset/Ndarja.tsx';
import { PamjaERezultatit } from '../pjeset/PamjaERezultatit.tsx';
import { Parashikimi } from '../pjeset/Parashikimi.tsx';
import { RaundetEMagarecit } from '../pjeset/RaundetEMagarecit.tsx';
import { Raundet } from '../pjeset/Raundet.tsx';
import { RregullatELojes } from '../pjeset/RregullatELojes.tsx';
import { type HyrjetERenditjes, Renditja } from '../pjeset/Renditja.tsx';
import {
  RrjetiIMagarecit,
  ShenjaEMagarecit,
} from '../pjeset/RrjetiIMagarecit.tsx';
import { Shlyerja } from '../pjeset/Shlyerja.tsx';
import { pamjaELojes } from '../ndarja.ts';
import {
  fshiRaund,
  loja as lexoLojen,
  grupi as lexoGrupin,
  raundet as lexoRaundet,
  ruajGrup,
  ruajLoje,
  ruajRaund,
  shtoRaund,
} from '../ruajtja.ts';
import { shko } from '../rruga.ts';

/**
 * Fjalia që mbyll fletën — çka ndodhi atë mbrëmje, me një rresht.
 *
 * Rastet nuk bashkohen dot në një fjali, sepse janë të vërteta të ndryshme:
 *
 * - **Magareci u mbush**: dikush e humbi mbrëmjen, dhe ajo është e tërë lajmi.
 * - **Magareci u mbyll pa u mbushur**: nuk humbi kush, dhe fleta nuk guxon të
 *   lërë të kuptohet se dikush humbi.
 * - **Mbaroi sipas rregullit**: fitorja është e plotë, dhe fjalia e thotë edhe
 *   me çka mbaroi — dy raundet për lojtar te bridzhi, kufiri i pikëve te domina
 *   e pishpiriku.
 * - **U mbyll herët**: kush e ka totalin fitues **prin**, nuk «fitoi» —
 *   raundet që kishin mbetur do ta ndërronin atë radhë.
 *
 * Fituesi merret nga `fituesit` e jo nga `rreshtat[0]`: te një tabelë barazimi
 * ndahet sipas radhës së listës, por një fjali që shpall fituesin nuk e ndan dot
 * ashtu — tre veta me nga 360 pikë nuk i ka ndarë kush (pika 14).
 */
function ShenjaEFundit({
  rregulli,
  mbaroi,
  magareciILojes,
  pareter,
  total,
  raunde,
  gjithsej,
  kufiri,
  kaloiKufirin,
}: {
  rregulli: Rregullat;
  /** A e mbaroi rregulli mbrëmjen, apo e mbylli dora para tij. */
  mbaroi: boolean;
  magareciILojes: string | null;
  /** Të gjithë ata që e ndajnë totalin fitues. */
  pareter: string[];
  total: number;
  raunde: number;
  /** Sa raunde ka mbrëmja gjithsej — vetëm bridzhi e ka atë numër. */
  gjithsej: number;
  /** Kufiri me të cilin u luajt kjo mbrëmje, ose `null` kur s'kishte. */
  kufiri: number | null;
  /** Kush e arriti kufirin e pikëve, kur loja mbaron ashtu. */
  kaloiKufirin: string | null;
}) {
  if (rregulli.lloji === 'magarec') {
    if (magareciILojes) return <ShenjaEMagarecit magareci={magareciILojes} />;

    return (
      <p className="njoftim njoftim--kujdes">
        <Ikona emri="info" />
        <span>
          Mbrëmja u mbyll pas {raunde} {raunde === 1 ? 'raundi' : 'raundeve'},
          pa e mbushur kush fjalën {FJALA}.
        </span>
      </p>
    );
  }

  const emrat = <strong>{pareter.join(', ')}</strong>;

  if (!mbaroi) {
    return (
      <p className="njoftim njoftim--kujdes">
        <Ikona emri="info" />
        <span>
          Mbrëmja u mbyll te {raunde}{' '}
          {gjithsej > 0
            ? `nga ${gjithsej} raunde`
            : raunde === 1
              ? 'raund'
              : 'raunde'}
          . {emrat} {pareter.length === 1 ? 'prin' : 'prijnë'} me {total} pikë.
        </span>
      </p>
    );
  }

  /*
   * Si mbaroi mbrëmja — dhe të tria mënyrat janë të ndryshme.
   *
   * Te bridzhi mbaron numri i raundeve. Te domina mbaron durimi i njërit: ai që
   * i mbushi njëqind e humbi, prandaj emri i tij rri te fjalia — pa të, «fitoi»
   * do të mbetej pa shkak. Te pishpiriku i njëjti kufi do të thotë e kundërta,
   * dhe ai që e arriti është pikërisht fituesi.
   */
  const si =
    rregulli.raundePerLojtar !== null
      ? `${gjithsej} raunde, ${rregulli.raundePerLojtar} për lojtar`
      : rregulli.drejtimi === 'larte'
        ? `i pari te ${kufiri}`
        : kaloiKufirin
          ? `${kaloiKufirin} i mbushi ${kufiri} pikët`
          : `${kufiri} pikët u mbushën`;

  return (
    <p className="njoftim njoftim--mire">
      <Ikona emri="renditja" />
      <span>
        {pareter.length === 1 ? (
          <>{emrat} fitoi me {total} pikë</>
        ) : (
          <>Barazim: {emrat} me nga {total} pikë</>
        )}{' '}
        — {si}.
      </span>
    </p>
  );
}

/**
 * Fjalia e mbylljes së hershme — pse do ta mbyllje një mbrëmje që vazhdon.
 *
 * Secila lojë e ka fundin e vet, prandaj edhe «para fundit» thuhet ndryshe:
 * para se t'i mbarojnë raundet, para se dikujt t'i mbushen pikët, para se
 * dikush të arrijë kufirin.
 */
function paraFundit(
  rregulli: Rregullat,
  gjithsej: number,
  kufiri: number | null,
): string {
  if (rregulli.lloji === 'magarec') {
    return 'Nëse shoqëria u ngrit para se dikujt t’i mbushej fjala, mbylle këtu.';
  }

  if (rregulli.raundePerLojtar !== null) {
    return `Nëse shoqëria u ngrit para se t’i mbaronin ${gjithsej} raundet, mbylle këtu.`;
  }

  // Pa kufi, mbyllja me dorë nuk është «më herët» — është e vetmja mbyllje që
  // ka, dhe teksti nuk guxon të lërë të kuptohet se pritej diçka tjetër.
  if (kufiri === null) {
    return 'Kjo mbrëmje u nis pa kufi pikësh, prandaj mbaron kur ta mbyllësh ti.';
  }

  return rregulli.drejtimi === 'larte'
    ? `Nëse shoqëria u ngrit para se dikush të arrinte ${kufiri}, mbylle këtu.`
    : `Nëse shoqëria u ngrit para se dikujt t’i mbusheshin ${kufiri} pikët, mbylle këtu.`;
}

/**
 * Lista boshe si konstante, e jo si `[]` te trupi.
 *
 * Hyrjet e `useMemo`-s krahasohen sipas identitetit; një `[]` i re te çdo
 * vizatim do t'i shkarkonte të gjitha memo-t sa pritet leximi i parë.
 */
const BOSH: never[] = [];

/** E njëjta arsye si te `BOSH`, për numrat e shkronjave. */
const BOSH_NUMRA: Record<string, number> = {};

export function Loja({ id }: { id: number }) {
  const { te_dhenat, rifresko } = useNgarko(async () => {
    const loja = await lexoLojen(id);
    if (!loja) return null;

    const [grupi, raundet] = await Promise.all([
      lexoGrupin(loja.groupId),
      lexoRaundet(id),
    ]);

    return { loja, grupi, raundet };
  }, [id]);

  const [dukeRedaktuar, caktoRedaktimin] = useState<number | null>(null);

  /*
   * Nga këtu e poshtë, hook-et rrinë të gjitha mbi kthimet e para.
   *
   * Kjo nuk është stil: React-i i numëron hook-et sipas radhës, dhe një
   * `useMemo` nën një `return` të kushtëzuar thirret vetëm pasi të dhënat kanë
   * mbërritur. Vizatimi i dytë atëherë ka më shumë hook-e se i pari, dhe React-i
   * bie me gabimin #310 — ekrani i lojës nuk hapet fare. Ndodhi pikërisht ashtu.
   */
  const loja = te_dhenat?.loja ?? null;
  const grupi = te_dhenat?.grupi ?? null;
  const raundet = te_dhenat?.raundet ?? BOSH;
  const players = loja?.selectedPlayers ?? BOSH;
  const lloji = llojiILojes(loja ?? {});
  const rregulli = rregullat(lloji);
  const magarec = lloji === 'magarec';

  /*
   * Të gjitha vlerat e derivuara nga një kalim i vetëm mbi raundet.
   *
   * `useMemo` nuk është për shpejtësinë e mbledhjes — ajo është dhjetëra
   * mikrosekonda. Është për identitetin: pa të, `rreshtat` e `matrica` dalin
   * objekte të reja te çdo vizatim, dhe atëherë `memo` mbi tabelat nuk kap
   * kurrgjë. Me të, hapja e një `<details>`-i ose kalimi te redaktimi nuk e
   * rivizaton tabelën e raundeve me qindra qeliza.
   */
  const { totalat, rreshtat, rendituar, matrica, luajtur, barabarte } = useMemo(() => {
    const p = permbledhja(players, raundet);
    // Drejtimi vjen nga rregulli i lojës: te pishpiriku i pari është ai me më
    // shumë pikë, dhe një renditje e ngritur pa të do ta shpallte fitues
    // pikërisht atë që mbeti prapa.
    const rreshtatERenditur = renditja(players, p.totalet, rregulli.drejtimi);

    return {
      totalat: p.totalet,
      rreshtat: rreshtatERenditur,
      // Shlyerja lexohet duke nisur nga fituesi, prandaj radha e saj vjen nga
      // renditja. Mbahet brenda memo-s, që hyrja e `Shlyerja`-s të mos dalë
      // varg i re te çdo vizatim.
      rendituar: rreshtatERenditur.map((rreshti) => rreshti.player),
      matrica: matricaEShlyerjes(players, p.totalet),
      luajtur: p.luajtur,
      barabarte: p.barabarte,
    };
  }, [players, raundet, rregulli.drejtimi]);

  /*
   * Hyrjet e renditjes, të mbajtura bashkë.
   *
   * Te ekrani i gjerë ato i kalojnë `Parashikimi`-t, i cili i vizaton të dyja
   * si një tabelë e vetme; te telefoni renditja del e vetme si më parë. Rrinë
   * te një `useMemo` sepse `Renditja` rri pas `memo`: një objekt i ri te çdo
   * vizatim do ta bënte atë mbështjellje peshë të kotë.
   */
  const hyrjetERenditjes = useMemo<HyrjetERenditjes>(
    () => ({
      rreshtat,
      luajtur: barabarte ? null : luajtur,
      drejtimi: rregulli.drejtimi,
    }),
    [rreshtat, barabarte, luajtur, rregulli.drejtimi],
  );

  /*
   * A ka ekrani gjerësi sa për tabelën e bashkuar.
   *
   * Pyetja shkon te JS-i e jo te CSS-i sepse ajo tabelë ka kolona e krye tjetër
   * (`pamja.ts`), dhe një fshehje me CSS do të linte të njëjtët numra dy herë
   * te pema.
   */
  const gjere = useEkranIGjere();

  const iRadhes = useMemo(() => raundiNeVijim(raundet), [raundet]);

  /*
   * Vlerat e magarecit, të veçuara nga ato të bridzhit.
   *
   * Rrinë te një `useMemo` i vetin dhe jo te ai i mësipërmi sepse llogariten
   * vetëm kur loja është magarec — dhe sepse hyrjet e `RrjetiIMagarecit`-it e
   * të `RaundetEMagarecit`-it duhen me identitet të qëndrueshëm, njësoj si ato
   * të tabelave të bridzhit.
   */
  const { magareciILojes, raundetMeShkronja } = useMemo(
    () => ({
      magareciILojes: magarec ? kushDoliMagarec(players, raundet) : null,
      raundetMeShkronja: magarec ? raundetEMagarecit(players, raundet) : BOSH,
    }),
    [magarec, players, raundet],
  );

  /*
   * Sa shkronja kishte secili para raundit që po shënohet.
   *
   * Kur një raund i vjetër po redaktohet, ai nuk hyn te numërimi: përndryshe
   * butoni i humbësit të tij do të tregonte shkronjën e radhës sikur ai raund
   * të kishte ndodhur dy herë.
   */
  const shkronjatPara = useMemo(() => {
    if (!magarec) return BOSH_NUMRA;

    const perpara =
      dukeRedaktuar === null
        ? raundet
        : raundet.filter((r) => r.id !== dukeRedaktuar);

    return shkronjatE(players, perpara);
  }, [magarec, players, raundet, dukeRedaktuar]);

  const pamja = useMemo(
    () =>
      loja
        ? pamjaELojes(
            grupi?.name ?? rregulli.emri,
            loja,
            totalat,
            raundet.length,
          )
        : null,
    [grupi?.name, loja, rregulli.emri, totalat, raundet.length],
  );

  /*
   * Sa raunde ka mbrëmja gjithsej — dy për lojtar.
   *
   * Vetëm bridzhi e ka atë numër. Te tri lojërat e tjera mbrëmja mbaron kur
   * dikush e arrin kufirin e vet — fjalën, njëqind pikët, 101-shin — prandaj
   * një «nga 8 raunde» atje do të ishte numër i shpikur (pika 13). Zeroja do të
   * thotë «nuk numërohet», dhe ekrani e lexon ashtu.
   */
  const gjithsej =
    rregulli.raundePerLojtar === null ? 0 : raundetELojes(players);

  /*
   * Deri te sa pikë luhet kjo mbrëmje.
   *
   * Merret nga `fundi.ts` e jo nga regjistri: ai i regjistrit është vetëm
   * parazgjedhja e çelësit, dhe tavolina mund ta ketë nisur mbrëmjen deri te
   * një numër tjetër — ose pa kufi fare (`null`).
   */
  const kufiri = loja ? kufiriILojes(loja) : null;

  /*
   * A ka mbaruar mbrëmja — dhe të dyja lojërat e kanë fundin e vet.
   *
   * Te magareci mbaron kur dikujt i mbushet fjala; te bridzhi pas dy raundeve
   * për lojtar (pika 13). Nga këtu poshtë dallimi nuk përsëritet: ekrani pyet
   * vetëm «a mbaroi», dhe fundi vizatohet një herë për të dyja.
   *
   * Kufiri i bridzhit nuk ngec dot mbi një raund të vërtetë: hiqet vetëm ai që
   * s'ka shënuar ende (pika 5), prandaj lista nuk shkurtohet dot nën raundet që
   * janë luajtur tashmë. Dhe kush ulet vonë e zgjat mbrëmjen vetvetiu.
   */
  const mbaroi = loja !== null && mbaroiSipasRregullit(loja, raundet);

  /*
   * A është mbyllur fleta — dhe kjo nuk është e njëjta gjë me `mbaroi`.
   *
   * `mbaroi` thotë se rregulli nuk pranon raund tjetër; `perfundoi` thotë se
   * mbrëmja është e kryer dhe nuk preket më. Të dyja rrinë te `fundi.ts`, sepse
   * historiku i grupit e bën të njëjtën pyetje dhe një kopje e dytë do të dilte
   * jashtë sinkronie pikërisht atje ku fleta thotë «përfundoi» e lista jo.
   */
  const perfundoi = loja !== null && perfundoiMbremja(loja, raundet);

  /** Kush doli i pari — disa, kur totali fitues është i përbashkët. */
  const pareter = useMemo(
    () => fituesit(rreshtat, rregulli.drejtimi),
    [rreshtat, rregulli.drejtimi],
  );

  /**
   * Kush e arriti kufirin e pikëve — ai që e mbylli mbrëmjen te domina.
   *
   * Merret nga totali më i madh e jo nga fituesi: te domina ai që e arrin
   * kufirin është pikërisht humbësi, dhe fjalia e fundit e thotë emrin e tij.
   */
  const kaloiKufirin = useMemo(() => {
    if (kufiri === null || rregulli.njesia !== 'pike') return null;

    const iMadhi = [...rreshtat].sort((a, b) => b.total - a.total)[0];
    return iMadhi && iMadhi.total >= kufiri ? iMadhi.player : null;
  }, [rreshtat, kufiri, rregulli.njesia]);

  /*
   * Kush i përzien letrat te raundi që po shënohet.
   *
   * Rri te krahu i djathtë i titullit e jo te një rresht i vetin: blloku poshtë
   * përdoret dhjetëra herë në mbrëmje, dhe një rresht mbi të do t'i hiqte
   * hapësirë pikërisht atij. Te redaktimi tregon përzierësin e atij raundi —
   * numri i raundit e jep vetë.
   */
  const perziersi = useMemo(() => {
    const numri = raundet.find((r) => r.id === dukeRedaktuar)?.roundNumber;
    return perziersiIRaundit(players, numri ?? raundiNeVijim(raundet));
  }, [players, raundet, dukeRedaktuar]);

  const raundiQeRedaktohet =
    dukeRedaktuar === null
      ? null
      : (raundet.find((r) => r.id === dukeRedaktuar) ?? null);

  // Identiteti i qëndrueshëm i këtyre dyve është kushti që `memo` mbi
  // `Raundet` të kapë diçka: një shigjetë e shkruar brenda JSX-it do të dilte
  // funksion i re te çdo vizatim dhe krahasimi i hyrjeve do të dështonte.
  const redakto = useCallback((idERaundit: number) => {
    caktoRedaktimin((tani) => (tani === idERaundit ? null : idERaundit));
  }, []);

  const fshi = useCallback(
    async (idERaundit: number) => {
      const raundi = raundet.find((r) => r.id === idERaundit);
      if (!raundi) return;
      if (!window.confirm(`Të fshihet raundi ${raundi.roundNumber}?`)) return;

      await fshiRaund(idERaundit);
      caktoRedaktimin((tani) => (tani === idERaundit ? null : tani));
      rifresko();
    },
    [raundet, rifresko],
  );

  if (te_dhenat === null) {
    return (
      <div className="faqja">
        <p className="ndihma">Duke lexuar…</p>
      </div>
    );
  }

  if (!loja) {
    return (
      <div className="faqja">
        <a className="shtegu" href="#/">
          <Ikona emri="kthehu" />
          Grupet
        </a>
        <div className="zbrazet">
          <p className="zbrazet__titull">Kjo lojë nuk gjendet</p>
          <p>Ndoshta është fshirë bashkë me grupin e vet.</p>
        </div>
      </div>
    );
  }

  async function ruaj(scores: Record<string, number | null>) {
    if (raundiQeRedaktohet) {
      await ruajRaund({ ...raundiQeRedaktohet, scores });
      caktoRedaktimin(null);
    } else {
      await shtoRaund(id, iRadhes, scores);
    }
    rifresko();
  }

  /**
   * Shton një ose disa lojtarë te loja, dhe te grupi ata që s'i njihte.
   *
   * Të gjithë me një shkrim të vetëm: një shkrim për secilin do të nisej nga e
   * njëjta listë e vjetër dhe do të linte vetëm të fundit.
   */
  async function shtoLojtar(emrat: string[]) {
    if (!loja) return;

    const rinjte = emrat.filter((emri) => !players.includes(emri));
    if (rinjte.length === 0) return;

    if (grupi) {
      const pagrup = rinjte.filter((emri) => !grupi.playerNames.includes(emri));
      if (pagrup.length > 0) {
        await ruajGrup({
          ...grupi,
          playerNames: [...grupi.playerNames, ...pagrup],
        });
      }
    }

    await ruajLoje({ ...loja, selectedPlayers: [...players, ...rinjte] });
    rifresko();
  }

  async function hiqLojtar(emri: string) {
    if (!loja) return;

    await ruajLoje({
      ...loja,
      selectedPlayers: players.filter((p) => p !== emri),
    });
    rifresko();
  }

  /**
   * Mbyll mbrëmjen — dhe kërkon pohim vetëm kur rregulli nuk e ka mbaruar.
   *
   * Kur rregulli e mbaroi, mbyllja nuk heq asgjë që mund të bëhej; kur
   * mbrëmja ndërpritet herët, ajo i mbyll raundet që kishin mbetur, prandaj
   * pyetet. Në të dyja rastet rruga prapa rri një prekje larg.
   */
  async function mbyll() {
    if (!loja) return;
    if (
      !mbaroi &&
      !window.confirm(
        'Të mbyllet mbrëmja këtu? Raundet që kanë mbetur nuk shënohen dot më, '
        + 'derisa ta rihapësh.',
      )
    ) {
      return;
    }

    await ruajLoje({ ...loja, mbyllur: true });
    caktoRedaktimin(null);
    rifresko();
  }

  /**
   * Ndërron kufirin e kësaj mbrëmjeje.
   *
   * Shkruhet te loja e jo te grupi: kufiri është marrëveshje e asaj tavoline,
   * dhe mbrëmja e djeshme nuk ka pse të ndërrojë kuptim sepse sonte luhet deri
   * diku tjetër (pika 4).
   */
  async function ndrroKufirin(i_ri: number) {
    if (!loja) return;

    await ruajLoje({ ...loja, kufiri: i_ri });
    rifresko();
  }

  /**
   * Rihap mbrëmjen.
   *
   * Pa këtë, një prekje e gabuar do të ishte e pakthyeshme — dhe do të ishte e
   * pakthyeshme edhe një raund i shënuar gabim te një mbrëmje që rregulli e
   * mbaroi vetë. Prandaj shkruhet `false` e nuk fshihet fusha: mungesa do të
   * thoshte «vendos rregulli», dhe rregulli do ta mbyllte sërish menjëherë.
   */
  async function rihap() {
    if (!loja) return;

    await ruajLoje({ ...loja, mbyllur: false });
    rifresko();
  }

  /*
   * Mbrëmja e mbyllur vizatohet si fletë, jo si ekran pune.
   *
   * Kjo është e njëjta pamje që merr kush skanon kodin QR — `PamjaERezultatit`
   * — dhe kjo nuk është kursim kodi: mbrëmja e kryer lexohet e jo shënohet, pra
   * pyetja e saj është pikërisht ajo e atij që sapo skanoi kodin. Kush prin, sa
   * vjen i dyti prapa, dhe kush kujt sa i del. Prandaj futja, redaktimi dhe
   * fshirja hiqen nga ekrani; raundet mbeten poshtë si dëshmi, pa butona.
   */
  if (perfundoi && pamja) {
    return (
      <div className="faqja">
        <a
          className="shtegu"
          href={grupi ? `#/grupi/${grupi.id}` : '#/'}
          onClick={(e) => {
            if (!grupi) {
              e.preventDefault();
              shko('/');
            }
          }}
        >
          <Ikona emri="kthehu" />
          {grupi ? grupi.name : 'Grupet'}
        </a>

        <PamjaERezultatit
          pamja={pamja}
          perfundoi
          etiketa={{ emri: 'Përfundoi', ikona: 'renditja' }}
          njoftimi={
            <ShenjaEFundit
              rregulli={rregulli}
              mbaroi={mbaroi}
              magareciILojes={magareciILojes}
              pareter={pareter}
              total={rreshtat[0]?.total ?? 0}
              raunde={raundet.length}
              gjithsej={gjithsej}
              kufiri={kufiri}
              kaloiKufirin={kaloiKufirin}
            />
          }
        />

        {players.length > 0 && <Ndarja pamja={pamja} rreshtat={rreshtat} />}

        {raundet.length > 0 && (
          <details className="detaje">
            <summary className="detaje__krye">
              <span>Raundet e mbrëmjes</span>
              <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
            </summary>
            <div className="detaje__trupi">
              {magarec ? (
                <RaundetEMagarecit
                  raundet={raundetMeShkronja}
                  dukeRedaktuar={null}
                />
              ) : (
                <Raundet
                  players={players}
                  raundet={raundet}
                  totalet={totalat}
                  dukeRedaktuar={null}
                />
              )}
            </div>
          </details>
        )}

        <details className="detaje">
          <summary className="detaje__krye">
            <span>Rihap lojën</span>
            <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
          </summary>
          <div className="detaje__trupi">
            <p className="ndihma">
              Rihape nëse ndonjë raund u shënua gabim, ose nëse mbrëmja vazhdon
              prapë. Asgjë nuk humbet: raundet rrinë ku janë, dhe mbyllja kthehet
              me një prekje.
            </p>
            <div className="veprimet">
              <button type="button" className="buton" onClick={rihap}>
                <Ikona emri="redakto" />
                Rihap lojën
              </button>
            </div>
          </div>
        </details>
      </div>
    );
  }

  /*
   * Mbyllja e mbrëmjes — i njëjti bllok, dy vende.
   *
   * Kur rregulli e ka mbaruar lojën, ky është veprimi i radhës dhe hap radhën e
   * panelave: fleta mbyllet dhe mbrëmja del ashtu si e sheh kush skanon kodin.
   * Këtu arrihet vetëm pas një rihapjeje — përndryshe ekrani do të ishte mbyllur
   * vetë — prandaj teksti nuk e përsërit fundin, e thotë kthimin.
   *
   * Sa kohë loja vazhdon, mbyllja e hershme rri e mbledhur dhe e fundit mes
   * panelave: është e rrallë dhe e mban një pyetje — ajo i mbyll raundet që
   * kishin mbetur, dhe ato nuk shënohen dot derisa loja të rihapet.
   */
  const mbyllja = raundet.length > 0 && (
    mbaroi ? (
      <section>
        <div className="veprimet">
          <button
            type="button"
            className="buton buton--kryesor"
            onClick={mbyll}
          >
            <Ikona emri="renditja" />
            Mbyll lojën
          </button>
        </div>
      </section>
    ) : (
      <details className="detaje">
        <summary className="detaje__krye">
          <span>Mbyll lojën më herët</span>
          <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
        </summary>
        <div className="detaje__trupi">
          <p className="ndihma">
            {paraFundit(rregulli, gjithsej, kufiri)} Mbrëmja del si fletë e mbyllur —
            pa futje e pa redaktim — dhe rihapet me një prekje kur duhet.
          </p>
          <div className="veprimet">
            <button type="button" className="buton" onClick={mbyll}>
              <Ikona emri="renditja" />
              Mbyll lojën
            </button>
          </div>
        </div>
      </details>
    )
  );

  /*
   * Çka doli nga raundet — kush prin, raundet e shënuara dhe shlyerja.
   *
   * Rri te një ndryshore e jo drejtpërdrejt te vizatimi, sepse te ekrani i gjerë
   * kjo shtyllë vendoset krah futjes: dy kolona e duan bllokun të tërin, dhe një
   * listë e shpërndarë nëpër `return` nuk hyn dot brenda njërës.
   */
  const rezultatet = magarec ? (
    <>
      {/*
        Rrjeti rri edhe kur s'ka ende asnjë raund: shtatë rreshta të zbrazët
        e thonë vetë lojën — kaq shkronja ka, dhe kush i mbush i humbi.
      */}
      <RrjetiIMagarecit players={players} shkronjat={totalat} />

      {raundet.length > 0 && (
        <Parashikimi
          lloji="magarec"
          players={players}
          totalet={totalat}
          luajtur={raundet.length}
        />
      )}

      {raundet.length === 0 ? (
        <div className="zbrazet">
          <p className="zbrazet__titull">Ende asnjë raund</p>
          <p>
            Prek atë që e humbi raundin e parë. Shkronjat dalin vetë, një
            për raund, derisa dikujt t'i mbushet fjala.
          </p>
        </div>
      ) : (
        <RaundetEMagarecit
          raundet={raundetMeShkronja}
          dukeRedaktuar={dukeRedaktuar}
          onRedakto={redakto}
          onFshi={fshi}
        />
      )}
    </>
  ) : raundet.length === 0 ? (
    <div className="zbrazet">
      <p className="zbrazet__titull">Ende asnjë raund</p>
      <p>
        Shëno pikët e raundit të parë te blloku i futjes. Renditja{' '}
        {rregulli.shlyerja ? 'dhe shlyerja dalin' : 'del'} vetë sapo të ketë
        numra.
      </p>
    </div>
  ) : (
    <>
      {/*
        Parashikimi kërkon kufij të numërueshëm për një raund, dhe ata i ka
        vetëm bridzhi mes lojërave me pikë: te domina e pishpiriku sa bën
        një dorë nuk e thotë rregulli (pika 12).

        Kur ai vizatohet, renditja i jepet atij: te ekrani i gjerë të dyja dalin
        si një tabelë e vetme, sepse kolonat e para janë të njëjtat dhe
        hapësira nuk është. Vendimin e mban `Parashikimi` — edhe rastin kur
        s'ka çka të parashikohet, ku renditja del e vetme si më parë.
      */}
      {rregulli.parashikimi ? (
        <Parashikimi
          lloji={lloji}
          players={players}
          totalet={totalat}
          luajtur={raundet.length}
          renditja={hyrjetERenditjes}
          bashko={gjere}
        />
      ) : (
        <Renditja {...hyrjetERenditjes} />
      )}

      <Raundet
        players={players}
        raundet={raundet}
        totalet={totalat}
        dukeRedaktuar={dukeRedaktuar}
        onRedakto={redakto}
        onFshi={fshi}
      />

      {/*
        Shlyerja vlen aty ku diferenca paguhet — bridzh e domina. Te
        pishpiriku pikët mblidhen drejt 101-shit e nuk janë borxh, prandaj
        matrica nuk vizatohet fare, si te magareci.
      */}
      {rregulli.shlyerja && <Shlyerja players={rendituar} matrica={matrica} />}
    </>
  );

  return (
    <div className="faqja faqja--gjere">
      <a
        className="shtegu"
        href={grupi ? `#/grupi/${grupi.id}` : '#/'}
        onClick={(e) => {
          if (!grupi) {
            e.preventDefault();
            shko('/');
          }
        }}
      >
        <Ikona emri="kthehu" />
        {grupi ? grupi.name : 'Grupet'}
      </a>

      <header className="kreu">
        <div className="njesi__shkronja njesi__shkronja--hapur marka">
          <Ikona emri="kalendari" />
        </div>
        <div>
          <p className="kreu__mbi">{grupi ? grupi.name : 'Lojë'}</p>
          <h1 className="kreu__titull">{dataShqip(loja.date)}</h1>
          <p className="kreu__meta">
            <span className="etiketa">
              <Ikona emri="grupi" />
              {players.length} {players.length === 1 ? 'lojtar' : 'lojtarë'}
            </span>
            <span className="etiketa">
              <Ikona emri="shlyerja" />
              {gjithsej > 0
                ? `${raundet.length} nga ${gjithsej} raunde`
                : `${raundet.length} ${raundet.length === 1 ? 'raund' : 'raunde'}`}
            </span>
            {/*
              Çka luhet rri te kreu për çdo lojë veç bridzhit — ai është
              parazgjedhja që nga dita e parë. Te magareci shkruhet vetë fjala
              që mbushet: atje emri dhe rregulli janë i njëjti varg.
            */}
            {lloji !== 'bridzh' && (
              <span className="etiketa etiketa--hapur">
                <Ikona emri="luaj" />
                {magarec ? FJALA : rregulli.emri}
              </span>
            )}
          </p>
        </div>
      </header>

      {/*
        Puna e mbrëmjes: futja e raundit dhe çka doli prej saj, të dyja bashkë.

        Te telefoni kjo mbetet një kolonë e vetme dhe radha lexohet nga lart —
        futja, pastaj renditja. Sapo ekrani ka gjerësi (tableta, kompjuteri),
        të dyja rrinë krah për krah: futja majtas e ngjitur, renditja djathtas.
        Ajo gjerësi ishte aty edhe më parë, thjesht rrinte e zbrazët — kurse
        renditja, ajo që pyetet pas çdo raundi, ishte disa panela poshtë.
      */}
      <div className="loja__pune">
        <div className="loja__futja">
          <h2 className="titull-seksioni">
            <Ikona
              emri={
                raundiQeRedaktohet
                  ? 'redakto'
                  : mbaroi
                    ? magarec
                      ? 'kujdes'
                      : 'renditja'
                    : 'shto'
              }
            />
            {raundiQeRedaktohet
              ? `Raundi ${raundiQeRedaktohet.roundNumber}`
              : mbaroi
                ? 'Loja mbaroi'
                : `Raundi ${iRadhes}`}

            {perziersi && !(mbaroi && !raundiQeRedaktohet) && (
              <span className="titull-seksioni__perziersi">
                përzien <strong>{perziersi}</strong>
              </span>
            )}
          </h2>

          <div className="kartela kartela--kryesore">
            {mbaroi && !raundiQeRedaktohet ? (
              /*
               * Mbrëmja ka mbaruar, prandaj raund i ri nuk ka — te të dyja lojërat,
               * secila me fundin e vet: fjala e mbushur te magareci, dy raundet për
               * lojtar te bridzhi.
               *
               * Butonat nuk rrinë të fikur, hiqen: një raund i shënuar pas fundit
               * do ta bënte fletën të gënjejë. Dy rrugë mbeten të hapura, dhe të
               * dyja janë të vërteta të tavolinës — raundi i shënuar gabim
               * rregullohet nga lista poshtë, dhe kush u ul vonë shtohet te
               * lojtarët, e atëherë te bridzhi mbrëmja zgjatet vetvetiu.
               */
              <>
                {/*
                  E njëjta fjali si te fleta e mbyllur, nga i njëjti vend: dy kopje
                  të saj do të dilnin jashtë sinkronie pikërisht atje ku njëra
                  shpall fitues e tjetra jo (pika 14).
                */}
                <ShenjaEFundit
                  rregulli={rregulli}
                  mbaroi
                  magareciILojes={magareciILojes}
                  pareter={pareter}
                  total={rreshtat[0]?.total ?? 0}
                  raunde={raundet.length}
                  gjithsej={gjithsej}
                  kufiri={kufiri}
                  kaloiKufirin={kaloiKufirin}
                />
                <p className="ndihma" data-hapesire="lart">
                  Për një mbrëmje tjetër, nis një lojë të re te grupi. Nëse ndonjë
                  raund u shënua gabim, ndërroje ose fshije nga lista e raundeve
                  {rregulli.raundePerLojtar === null
                    ? '.'
                    : '; dhe nëse dikush u ul vonë, shtoje te lojtarët — mbrëmja zgjatet me dy raunde.'}
                </p>
              </>
            ) : !magarec ? (
              <FutjaERaundit
                players={players}
                roundNumber={raundiQeRedaktohet?.roundNumber ?? iRadhes}
                fillestare={raundiQeRedaktohet?.scores ?? null}
                llogaritesi={rregulli.llogaritesi}
                ndihma={rregulli.shenimi ?? undefined}
                onRuaj={ruaj}
                onAnulo={
                  raundiQeRedaktohet ? () => caktoRedaktimin(null) : undefined
                }
              />
            ) : (
              <FutjaEMagarecit
                players={players}
                roundNumber={raundiQeRedaktohet?.roundNumber ?? iRadhes}
                shkronjat={shkronjatPara}
                humbesi={
                  raundiQeRedaktohet
                    ? humbesiIRaundit(players, raundiQeRedaktohet)
                    : null
                }
                onRuaj={(humbesi) => void ruaj(raundiIHumbjes(players, humbesi))}
                onAnulo={
                  raundiQeRedaktohet ? () => caktoRedaktimin(null) : undefined
                }
              />
            )}
          </div>
        </div>

        <div className="loja__rezultatet">{rezultatet}</div>

        {/*
          Panelat rrinë bashkë poshtë, dhe të gjithë të mbledhur.

          Secili prej tyre preket një herë në mbrëmje, ose asnjë: kush u ul, ku
          shpërndahet fleta, çka thotë rregulli, deri ku luhet, kur mbyllet. Mbi
          renditje ata e shtynin poshtë pikërisht atë që pyetet pas çdo raundi;
          këtu rrinë një rrëshqitje larg, dhe te ekrani i gjerë dy për rresht.
        */}
        <div className="loja__panelat">
          {mbaroi && mbyllja}

          {/*
            Te magareci numri krah emrit është shkronja e jo raundi i shënuar: aty
            secili shënon `0` te çdo raund, prandaj raundet e luajtura do t'i ndalnin
            të gjithëve heqjen. Kush ka marrë shkronja mbetet te loja — ato janë
            pjesë e historikut të asaj mbrëmjeje — dhe kush u ngrit pa marrë asnjë
            hiqet lirisht.
          */}
          <LojtaretELojes
            players={players}
            grupi={grupi ?? undefined}
            luajtur={magarec ? totalat : luajtur}
            onShto={shtoLojtar}
            onHiq={hiqLojtar}
          />

          {players.length > 0 && pamja && (
            <Ndarja pamja={pamja} rreshtat={rreshtat} />
          )}

          {/*
            Rregullat e lojës, një prekje larg dhe të mbledhura.

            Rrinë këtu krah panelave të tjerë e jo mbi bllokun e futjes: ai
            përdoret dhjetëra herë në mbrëmje (pika 6), kurse kjo pyetje bëhet një
            herë — dhe kur bëhet, bëhet me letrat në dorë.
          */}
          <RregullatELojes rregulli={rregulli} />

          {/*
            Kufiri ndërrohet edhe mes mbrëmjes.

            Pa këtë, një kufi i zgjedhur gabim te nisja do ta mbyllte fletën në mes
            të lojës, dhe rruga e vetme prapa do të ishte rihapja pas çdo raundi
            (pika 15). Rri i mbledhur sepse preket rrallë — një herë, nëse preket
            fare — dhe ndryshimi ruhet aty për aty: mbrëmja mbaron ose vazhdon sipas
            numrit të ri, pa asnjë buton të dytë.
          */}
          {rregulli.kufijteEMundshem.length > 0 && (
            <details className="detaje">
              <summary className="detaje__krye">
                <span>
                  Deri te {kufiri === null ? 'pa kufi' : `${kufiri} pikë`}
                </span>
                <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
              </summary>
              <div className="detaje__trupi">
                <p className="ndihma">
                  Deri ku luhet e vendos tavolina, prandaj ndërrohet edhe tani. Nëse
                  dikush e ka kaluar tashmë numrin e ri, mbrëmja mbyllet menjëherë —
                  dhe rihapet po aq lehtë.
                </p>
                <ZgjedhjaEKufirit
                  kufijte={rregulli.kufijteEMundshem}
                  vlera={kufiri ?? PA_KUFI}
                  onNdrysho={ndrroKufirin}
                />
              </div>
            </details>
          )}

          {!mbaroi && mbyllja}
        </div>
      </div>

      <Fundfaqja />
    </div>
  );
}
