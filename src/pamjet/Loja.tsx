/**
 * Ekrani i një loje — futja e raundit, renditja, raundet dhe shlyerja.
 *
 * Dy lojëra ndajnë këtë ekran, dhe ndajnë gjithçka që rri rreth raundit: të
 * dhënat, lojtarët mes lojës, ndarjen e rezultatit, redaktimin dhe fshirjen.
 * Ajo që ndryshon është vetëm çka shënohet — gjashtë numra te bridzhi, një emër
 * te magareci — dhe çka vizatohet poshtë. Prandaj `lloji` e ndan vizatimin te
 * dy vende e jo ekranin te dy skedarë: një kopje e dytë e kësaj do të dilte
 * jashtë sinkronie te pikërisht ato pjesë që janë të njëjta.
 *
 * Renditja e blloqeve ndjek atë që pyetet më shpesh gjatë lojës: para së
 * gjithash futja e raundit të radhës, sepse ajo bëhet dhjetëra herë në mbrëmje;
 * pastaj kush prin; pastaj tabela e plotë; shlyerja në fund, sepse ajo shihet
 * kur mbaron loja.
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
import { Ikona } from '../ikonat.tsx';
import { useNgarko } from '../ngarko.ts';
import { FutjaEMagarecit } from '../pjeset/FutjaEMagarecit.tsx';
import { FutjaERaundit } from '../pjeset/FutjaERaundit.tsx';
import { LojtaretELojes } from '../pjeset/LojtaretELojes.tsx';
import { Ndarja } from '../pjeset/Ndarja.tsx';
import { Parashikimi } from '../pjeset/Parashikimi.tsx';
import { RaundetEMagarecit } from '../pjeset/RaundetEMagarecit.tsx';
import { Raundet } from '../pjeset/Raundet.tsx';
import { Renditja } from '../pjeset/Renditja.tsx';
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
    const rreshtatERenditur = renditja(players, p.totalet);

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
  }, [players, raundet]);

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
            grupi?.name ?? (magarec ? 'Magarec' : 'Bridzh'),
            loja,
            totalat,
            raundet.length,
          )
        : null,
    [grupi?.name, loja, magarec, totalat, raundet.length],
  );

  /*
   * Sa raunde ka mbrëmja gjithsej — dy për lojtar.
   *
   * Te magareci nuk vlen: atje mbrëmja mbaron kur mbushet fjala, e jo pas një
   * numri raundesh, prandaj numri nuk tregohet fare.
   */
  const gjithsej = magarec ? 0 : raundetELojes(players);

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
  const mbaroi = magarec
    ? magareciILojes !== null
    : players.length > 0 && raundet.length >= gjithsej;

  /** Kush doli i pari — disa, kur totali më i vogël është i përbashkët. */
  const pareter = useMemo(() => fituesit(rreshtat), [rreshtat]);

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
              {magarec
                ? `${raundet.length} ${raundet.length === 1 ? 'raund' : 'raunde'}`
                : `${raundet.length} nga ${gjithsej} raunde`}
            </span>
            {magarec && (
              <span className="etiketa etiketa--hapur">
                <Ikona emri="luaj" />
                {FJALA}
              </span>
            )}
          </p>
        </div>
      </header>

      <section>
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
              {magarec ? (
                <ShenjaEMagarecit magareci={magareciILojes} />
              ) : (
                <p className="njoftim njoftim--mire">
                  <Ikona emri="renditja" />
                  {/*
                    Fituesi merret nga `fituesit` e jo nga `rreshtat[0]`: te një
                    tabelë barazimi ndahet sipas radhës së listës, por një fjali
                    që shpall fituesin nuk e ndan dot ashtu — tre veta me nga 360
                    pikë nuk i ka ndarë kush.
                  */}
                  <span>
                    {pareter.length === 1 ? (
                      <>
                        <strong>{pareter[0]}</strong> fitoi me{' '}
                        {rreshtat[0]?.total} pikë
                      </>
                    ) : (
                      <>
                        Barazim: <strong>{pareter.join(', ')}</strong> me nga{' '}
                        {rreshtat[0]?.total} pikë
                      </>
                    )}{' '}
                    — {gjithsej} raunde, dy për lojtar.
                  </span>
                </p>
              )}
              <p className="ndihma" data-hapesire="lart">
                Për një mbrëmje tjetër, nis një lojë të re te grupi. Nëse ndonjë
                raund u shënua gabim, ndërroje ose fshije nga lista poshtë
                {magarec
                  ? '.'
                  : '; dhe nëse dikush u ul vonë, shtoje te lojtarët — mbrëmja zgjatet me dy raunde.'}
              </p>
            </>
          ) : !magarec ? (
            <FutjaERaundit
              players={players}
              roundNumber={raundiQeRedaktohet?.roundNumber ?? iRadhes}
              fillestare={raundiQeRedaktohet?.scores ?? null}
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
      </section>

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

      {magarec ? (
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
            Shëno pikët e raundit të parë më lart. Renditja dhe shlyerja dalin
            vetë sapo të ketë numra.
          </p>
        </div>
      ) : (
        <>
          <Renditja rreshtat={rreshtat} luajtur={barabarte ? null : luajtur} />

          <Parashikimi
            lloji="bridzh"
            players={players}
            totalet={totalat}
            luajtur={raundet.length}
          />

          <Raundet
            players={players}
            raundet={raundet}
            totalet={totalat}
            dukeRedaktuar={dukeRedaktuar}
            onRedakto={redakto}
            onFshi={fshi}
          />

          <Shlyerja players={rendituar} matrica={matrica} />
        </>
      )}
    </div>
  );
}
