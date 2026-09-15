/**
 * Ekrani i një grupi — historiku i lojërave, dhe lista e lojtarëve.
 *
 * Lojërat renditen sipas ditës, më e reja e para, sepse ajo që pyetet gjithmonë
 * është „ku e lamë mbrëmë". Një grup mund të ketë dy lojëra në të njëjtën ditë;
 * ora e krijimit i ndan.
 *
 * Lista e lojtarëve redaktohet edhe pasi janë luajtur lojëra. Kjo nuk i prek
 * lojërat e kaluara: secila mban fotografinë e vet të lojtarëve që luajtën atë
 * natë (`selectedPlayers`), dhe raundet shkruhen mbi atë listë e jo mbi
 * listën e sotme të grupit.
 */

import { useMemo, useRef, useState } from 'react';

import {
  dataShqip,
  llojiILojes,
  lojeratESortuara,
  renditjaELojes,
  sot,
  tabelaEPergjithshme,
} from '../llogaritjet.ts';
import { RADHA, rregullat } from '../lojerat.ts';
import { FJALA, fjalaE, pergjithshmetEMagarecit } from '../magareci.ts';
import { perfundoiMbremja } from '../fundi.ts';
import { emratERinj } from '../fusha.ts';
import { Ikona } from '../ikonat.tsx';
import { MbiTitullin } from '../pjeset/Kreu.tsx';
import { useNgarko } from '../ngarko.ts';
import {
  fshiGrup,
  fshiLoje,
  grupi as lexoGrupin,
  lojerat as lexoLojerat,
  raundetELojerave,
  ruajGrup,
  shtoLoje,
} from '../ruajtja.ts';
import { Fundfaqja } from '../pjeset/Fundfaqja.tsx';
import { PA_KUFI, ZgjedhjaEKufirit } from '../pjeset/Kufiri.tsx';
import { RregullatELojes } from '../pjeset/RregullatELojes.tsx';
import { PergjithshmetEMagarecit } from '../pjeset/PergjithshmetEMagarecit.tsx';
import { TabelaEPergjithshme } from '../pjeset/TabelaEPergjithshme.tsx';
import { shko } from '../rruga.ts';
import type {
  Grupi as TGrupi,
  LlojiILojes,
  Loja,
  Raundi,
  RreshtiRenditjes,
} from '../tipet.ts';

/** Lista boshe si konstante — identiteti i qëndrueshëm i duhet `useMemo`-s. */
const BOSH: never[] = [];

export function Grupi({ id }: { id: number }) {
  const { te_dhenat, rifresko } = useNgarko(async () => {
    const grupi = await lexoGrupin(id);
    if (!grupi) {
      return {
        grupi: null,
        lojerat: [] as Loja[],
        raunde: {} as Record<number, Raundi[]>,
      };
    }

    const lista = await lexoLojerat(id);
    const raunde = await raundetELojerave(lista.map((l) => l.id));

    return { grupi, lojerat: lojeratESortuara(lista), raunde };
  }, [id]);

  const [hapurLojen, hapLojen] = useState(false);
  const [hapurLojtaret, hapLojtaret] = useState(false);

  // Hook-et rrinë mbi kthimet e para: React-i i numëron sipas radhës, dhe një
  // `useMemo` nën një `return` të kushtëzuar e rrëzon vizatimin e dytë.
  const grupi = te_dhenat?.grupi ?? null;
  const lojerat = te_dhenat?.lojerat ?? BOSH;
  const raunde = te_dhenat?.raunde ?? null;

  /*
   * Tabela e grupit dhe renditja e secilës mbrëmje, të dyja nga një vend.
   *
   * Ekrani i grupit lexon raundet e të gjitha lojërave — dyzet mbrëmje me
   * tridhjetë raunde janë mbi një mijë regjistra — dhe pa këtë, çdo shkronjë e
   * shkruar te kutia e emrit të lojtarit i rillogaritte të gjitha nga e para
   * bashkë me dyzet nënpemë React-i.
   *
   * Renditja e secilës lojë dilte më parë brenda JSX-it, te `.map()`. Atje
   * llogaritej sërish te çdo vizatim, dhe rezultati as nuk mund të mbahej.
   */
  const { tabelat, magarecat, saMagareca, renditjet } = useMemo(() => {
    const raundetELojes = (loja: Loja) => raunde?.[loja.id] ?? BOSH;
    const luajtura = lojerat.filter((loja) => raundetELojes(loja).length > 0);
    const eLlojit = (lloji: LlojiILojes) =>
      luajtura
        .filter((loja) => llojiILojes(loja) === lloji)
        .map((loja) => ({
          selectedPlayers: loja.selectedPlayers,
          raundet: raundetELojes(loja),
        }));

    const magarecet = eLlojit('magarec');

    return {
      /*
       * Një tabelë për lojë, e jo një për grup.
       *
       * Pikët e bridzhit dhe ato të dominës mblidhen njësoj si numra, por nuk
       * janë e njëjta gjë — dhe ato të pishpirikut fitohen nga ana tjetër.
       * Magareci rri veç për arsyen e vjetër: aty numri është shkronjë nga zero
       * në shtatë, dhe një mesatare mbi të dyja do të ishte numër pa kuptim.
       *
       * Tabelat e lojërave që grupi nuk i ka luajtur dalin bosh, dhe vetë
       * tabela nuk vizatohet fare kur s'ka rreshta — prandaj një grup që luan
       * vetëm bridzh nuk e sheh kurrë fjalën «pishpirik».
       */
      tabelat: RADHA.filter((lloji) => lloji !== 'magarec').map((lloji) => {
        const lojerat = eLlojit(lloji);

        return {
          lloji,
          emri: rregullat(lloji).emri,
          lojera: lojerat.length,
          rreshtat: tabelaEPergjithshme(lojerat, rregullat(lloji).drejtimi),
        };
      }),
      magarecat: pergjithshmetEMagarecit(magarecet),
      saMagareca: magarecet.length,
      renditjet: new Map(
        lojerat.map((loja) => [
          loja.id,
          // Drejtimi vjen nga lloji i asaj mbrëmjeje: te një grup që luan edhe
          // pishpirik, dy rreshta të njëjtë të kësaj liste renditen nga anë të
          // kundërta, dhe kjo është e vërteta e secilit.
          renditjaELojes(
            loja.selectedPlayers,
            raundetELojes(loja),
            rregullat(llojiILojes(loja)).drejtimi,
          ),
        ]),
      ),
    };
  }, [lojerat, raunde]);

  if (te_dhenat === null) {
    return (
      <div className="faqja">
        <p className="ndihma">Duke lexuar…</p>
      </div>
    );
  }

  if (!grupi) {
    return (
      <div className="faqja">
        <a className="shtegu" href="#/">
          <Ikona emri="kthehu" />
          Grupet
        </a>
        <div className="zbrazet">
          <p className="zbrazet__titull">Ky grup nuk gjendet</p>
          <p>Ndoshta është fshirë, ose lidhja tregon te një grup i një kopjeje tjetër.</p>
        </div>
      </div>
    );
  }

  async function fshiKeteGrup() {
    if (!grupi) return;
    const pyetja =
      lojerat.length > 0
        ? `Të fshihet „${grupi.name}" bashkë me ${lojerat.length} ${lojerat.length === 1 ? 'lojë' : 'lojëra'}? Kjo nuk kthehet prapa.`
        : `Të fshihet „${grupi.name}"?`;

    if (!window.confirm(pyetja)) return;

    await fshiGrup(grupi.id);
    shko('/');
  }

  return (
    <div className="faqja faqja--gjere">
      <header className="kreu">
        <div className="njesi__shkronja njesi__shkronja--hapur marka">
          {grupi.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          {/* «Grupi» mbi emrin e grupit nuk shtonte asgjë; ajo që i duhej
              rreshtit ishte rruga prapa. */}
          <MbiTitullin shtegu={{ href: '#/' }}>Grupet</MbiTitullin>
          <h1 className="kreu__titull">{grupi.name}</h1>
          <p className="kreu__meta">
            <span className="etiketa">
              <Ikona emri="grupi" />
              {grupi.playerNames.length}{' '}
              {grupi.playerNames.length === 1 ? 'lojtar' : 'lojtarë'}
            </span>
            <span className="etiketa">
              <Ikona emri="kalendari" />
              {lojerat.length} {lojerat.length === 1 ? 'lojë' : 'lojëra'}
            </span>
          </p>
        </div>
      </header>

      {!hapurLojen && (
        <div className="veprimet">
          <button
            type="button"
            className="buton buton--kryesor"
            onClick={() => hapLojen(true)}
            disabled={grupi.playerNames.length < 2}
          >
            <Ikona emri="luaj" />
            Lojë e re
          </button>
        </div>
      )}

      {hapurLojen && (
        <ZgjedhjaELojtareve
          grupi={grupi}
          mefundit={lojerat[0]?.selectedPlayers}
          llojiIFundit={lojerat[0] ? llojiILojes(lojerat[0]) : 'bridzh'}
          onAnulo={() => hapLojen(false)}
          onNis={async (date, zgjedhur, lloji, kufiri) => {
            const idELojes = await shtoLoje(
              grupi.id,
              date,
              zgjedhur,
              lloji,
              kufiri,
            );
            shko(`/loja/${idELojes}`);
          }}
        />
      )}

      {/*
        Ekrani i gjerë e ndan atë që hapet nga ajo që shihet.

        Historiku është arsyeja pse hapet një grup — mbrëmja e djeshme ose ajo
        që sapo nisi — prandaj rri i pari dhe majtas. Përgjithshmet dhe dy
        panelat e grupit lexohen kur dikush pyet «kush prin gjithsej?» ose kur
        ndërrohet lista e lojtarëve: një herë, jo çdo mbrëmje.
      */}
      <div className="shtyllat">
        <div className="shtyllat__kryesore">
          <section>
            <h2 className="titull-seksioni">
              <Ikona emri="kalendari" />
              Historiku
              <span className="titull-seksioni__numri">{lojerat.length}</span>
            </h2>

            {lojerat.length === 0 ? (
              <div className="zbrazet">
                <p className="zbrazet__titull">Ende asnjë lojë</p>
                <p>
                  Nis një lojë dhe zgjidh kush erdhi sonte. Nuk është nevoja të
                  luajnë të gjithë të grupit.
                </p>
              </div>
            ) : (
              <ul className="lista">
                {lojerat.map((loja) => (
                  <li key={loja.id}>
                    <a className="njesi" href={`#/loja/${loja.id}`}>
                      <span className="njesi__shkronja">
                        <Ikona emri="kalendari" />
                      </span>
                      <span className="njesi__krye">
                        <span className="njesi__emri">{dataShqip(loja.date)}</span>
                        <span className="njesi__meta">
                          {(raunde?.[loja.id] ?? BOSH).length}{' '}
                          {(raunde?.[loja.id] ?? BOSH).length === 1 ? 'raund' : 'raunde'}
                          {' · '}
                          {loja.selectedPlayers.length} lojtarë
                          {/*
                            Çka u luajt shkruhet për çdo lojë veç bridzhit — ai është
                            parazgjedhja, dhe një «Bridzh» te çdo rresht do të ishte
                            zhurmë te një listë ku shumica janë bridzh. Te magareci
                            del vetë fjala që mbushet.
                          */}
                          {llojiILojes(loja) !== 'bridzh' && (
                            <>
                              {' · '}
                              <span className="njesi__lloji">
                                {llojiILojes(loja) === 'magarec'
                                  ? FJALA
                                  : rregullat(llojiILojes(loja)).emri}
                              </span>
                            </>
                          )}
                          {/*
                            Mbrëmja e kryer thuhet edhe këtu, e jo vetëm brenda: pa
                            të, lista e lojërave nuk dallon atë që pret raundin e
                            radhës nga ajo që u mbyll — dhe të dyja hapen njësoj.
                          */}
                          {perfundoiMbremja(loja, raunde?.[loja.id] ?? BOSH) && (
                            <>
                              {' · '}
                              <span className="njesi__perfunduar">Përfundoi</span>
                            </>
                          )}
                        </span>
                      </span>
                      <span className="njesi__veprimet">
                        <button
                          type="button"
                          className="buton buton--vogel buton--rrezik"
                          onClick={async (e) => {
                            // Butoni rri brenda një lidhjeje: pa këtë, fshirja do
                            // ta hapte njëkohësisht edhe lojën.
                            e.preventDefault();
                            e.stopPropagation();
                            if (
                              window.confirm(
                                `Të fshihet loja e ${dataShqip(loja.date)} me ${(raunde?.[loja.id] ?? BOSH).length} raunde?`,
                              )
                            ) {
                              await fshiLoje(loja.id);
                              rifresko();
                            }
                          }}
                        >
                          <Ikona emri="fshi" />
                          <span className="vetem-lexues">
                            Fshi lojën e {dataShqip(loja.date)}
                          </span>
                        </button>
                      </span>
                    </a>

                    <RenditjaEShkurter
                      rreshtat={renditjet.get(loja.id) ?? BOSH}
                      lloji={llojiILojes(loja)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="shtyllat__anesore">
          {tabelat.map((tabela) => (
            <TabelaEPergjithshme
              key={tabela.lloji}
              rreshtat={tabela.rreshtat}
              lojera={tabela.lojera}
              emriILojes={tabela.emri}
            />
          ))}

          <PergjithshmetEMagarecit rreshtat={magarecat} lojera={saMagareca} />

          <section>
            <details
              className="detaje"
              open={hapurLojtaret}
              onToggle={(e) => hapLojtaret((e.target as HTMLDetailsElement).open)}
            >
              <summary className="detaje__krye">
                <span>Lojtarët e grupit</span>
                <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
              </summary>
              <div className="detaje__trupi">
                <ListaELojtareve grupi={grupi} onRuajtur={rifresko} />
              </div>
            </details>

            <details className="detaje">
              <summary className="detaje__krye">
                <span>Fshi grupin</span>
                <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
              </summary>
              <div className="detaje__trupi">
                <p className="ndihma">
                  Fshihet grupi bashkë me të gjitha lojërat dhe raundet e tij. Nxirr
                  një kopje rezervë më parë nëse ke dyshim.
                </p>
                <div className="veprimet" data-hapesire="lart">
                  <button
                    type="button"
                    className="buton buton--rrezik"
                    onClick={fshiKeteGrup}
                  >
                    <Ikona emri="fshi" />
                    Fshi „{grupi.name}"
                  </button>
                </div>
              </div>
            </details>
          </section>
        </div>
      </div>

      <Fundfaqja />
    </div>
  );
}

/**
 * Renditja përfundimtare e një mbrëmjeje, brenda historikut.
 *
 * Blloku i shkurtër i fletës së vjetër: vend, emër, total. Rri jashtë lidhjes
 * së njësisë, sepse një listë brenda një `<a>`-je do të bënte tërë tabelën një
 * cak të vetëm klikimi.
 */
function RenditjaEShkurter({
  rreshtat,
  lloji,
}: {
  rreshtat: RreshtiRenditjes[];
  lloji: LlojiILojes;
}) {
  if (rreshtat.length === 0) return null;

  return (
    <ol className="renditja-shkurter">
      {rreshtat.map((rreshti) => (
        <li
          key={rreshti.player}
          className={rreshti.rank === 1 ? 'renditja-shkurter--pare' : undefined}
        >
          <span className="renditja-shkurter__vendi">{rreshti.rank}</span>
          <span className="renditja-shkurter__emri">{rreshti.player}</span>
          <span className="renditja-shkurter__totali">
            {/*
              Te magareci numri i vetëm nuk thotë asgjë: «3» lexohet „MAG", dhe
              fjala e plotë do të thotë se ai e humbi atë mbrëmje. Kush s'ka
              marrë asnjë shkronjë del me një vizë e jo me zero, që rreshti të
              lexohet si fjalë e jo si pikë.
            */}
            {lloji === 'magarec'
              ? fjalaE(rreshti.total) || '—'
              : rreshti.total}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Zgjedhja e lojtarëve para se të nisë loja.
 *
 * Grupi mund të ketë gjashtë të rregullt dhe sonte të luajnë katër. Numri mbi
 * çelës tregon radhën e zgjedhjes — ajo bëhet radha e kolonave gjatë tërë lojës.
 */
function ZgjedhjaELojtareve({
  grupi,
  mefundit,
  llojiIFundit,
  onNis,
  onAnulo,
}: {
  grupi: TGrupi;
  /** Kush luajti herën e fundit — nisja e zgjedhjes. */
  mefundit?: string[];
  /** Çka u luajt herën e fundit — nisja e çelësit, për të njëjtën arsye. */
  llojiIFundit: LlojiILojes;
  onNis: (
    date: string,
    zgjedhur: string[],
    lloji: LlojiILojes,
    /** Kufiri i pikëve, ose `undefined` te lojërat që nuk e kanë atë pyetje. */
    kufiri: number | undefined,
  ) => void;
  onAnulo: () => void;
}) {
  // Shoqëria është zakonisht e njëjta nga një mbrëmje te tjetra, prandaj
  // zgjedhja niset nga lojtarët e lojës së fundit e jo nga tërë lista: më
  // shpesh nuk ka çka të preket fare. Kush u hoq nga grupi ndërkohë bie jashtë,
  // dhe një grup pa lojëra ende i merr të gjithë.
  const [zgjedhur, caktoZgjedhur] = useState<string[]>(() => {
    const meparshmit = (mefundit ?? []).filter((emri) =>
      grupi.playerNames.includes(emri),
    );
    return meparshmit.length >= 2 ? meparshmit : grupi.playerNames;
  });
  /*
   * Data e vjen nga telefoni, dhe nuk shkruhet me dorë.
   *
   * Mbrëmja shënohet atë natë që luhet — kjo ishte e vërtetë te çdo lojë e
   * shënuar deri tani — prandaj fusha kërkonte tetë shifra për një numër që
   * pajisja e di. Nuk mbahet te gjendja: llogaritet te vizatimi, që një skedë e
   * lënë hapur para mesnate të mos e nisë lojën me datën e djeshme.
   */
  const date = sot();
  // Njësoj si lista e lojtarëve: shoqëria e nis mbrëmjen aty ku e la, prandaj
  // çelësi nis te loja e fundit e grupit.
  const [lloji, caktoLlojin] = useState<LlojiILojes>(llojiIFundit);
  /*
   * Kufiri i pikëve, i nisur nga parazgjedhja e asaj loje.
   *
   * Ndërrohet bashkë me llojin e jo me një efekt: çdo lojë e ka listën e vet,
   * dhe një kufi i mbetur nga loja e mëparshme do të dilte buton i zgjedhur që
   * nuk ekziston te lista e re — pra asnjë i zgjedhur në ekran.
   */
  const [kufiri, caktoKufirin] = useState<number>(
    () => rregullat(llojiIFundit).kufiriITotalit ?? PA_KUFI,
  );

  function ndrroLlojin(i_ri: LlojiILojes) {
    caktoLlojin(i_ri);
    caktoKufirin(rregullat(i_ri).kufiriITotalit ?? PA_KUFI);
  }

  function ndrysho(lojtari: string) {
    caktoZgjedhur((z) =>
      z.includes(lojtari) ? z.filter((x) => x !== lojtari) : [...z, lojtari],
    );
  }

  return (
    <div className="kartela kartela--kryesore">
      <h2 className="titull-seksioni">
        <Ikona emri="luaj" />
        Kush luan sonte
      </h2>

      <div className="futja">
        <div className="fusha">
          <span className="fusha__etiketa">Çka luhet</span>
          {/*
            Katër lojëra te një çelës i vetëm, në radhën e regjistrit. Rrjeti i
            lejon të bien në dy rreshta te telefoni i ngushtë, dhe secili buton
            mbetet mbi 2.75rem — po ai kufi si te fushat e pikëve (pika 2).
          */}
          <div className="celesi celesi--rrjet" role="group" aria-label="Lloji i lojës">
            {RADHA.map((njeri) => (
              <button
                type="button"
                key={njeri}
                className="celesi__njesi"
                aria-pressed={lloji === njeri}
                onClick={() => ndrroLlojin(njeri)}
              >
                {rregullat(njeri).emri}
              </button>
            ))}
          </div>
        </div>

        <ZgjedhjaEKufirit
          kufijte={rregullat(lloji).kufijteEMundshem}
          vlera={kufiri}
          onNdrysho={caktoKufirin}
        />

        <div className="zgjedhesi">
          {grupi.playerNames.map((lojtari) => {
            const radha = zgjedhur.indexOf(lojtari);

            return (
              <button
                type="button"
                key={lojtari}
                className="zgjedhesi__njesi"
                aria-pressed={radha >= 0}
                onClick={() => ndrysho(lojtari)}
              >
                {radha >= 0 && (
                  <span className="zgjedhesi__radha">{radha + 1}</span>
                )}
                {lojtari}
              </button>
            );
          })}
        </div>

        {/*
          Data tregohet, nuk shkruhet.

          Dikur ishte fushë teksti me tetë shifra — dhe ajo fushë kishte një
          arsye të vetën: `type="date"` e vizaton shfletuesi sipas gjuhës së
          vet, dhe një telefon me anglishten amerikane e nxjerr muajin i pari,
          pra 11 shtatori dilte „09/11". Por vetë shkrimi ishte i tepërt: loja
          shënohet atë natë që luhet, dhe telefoni e di se cila është. Mbetet me
          fjalë, që çka do të shkruhet të rrijë e dukshme para se të shtypet
          «Nis lojën».
        */}
        <div className="fusha">
          <span className="fusha__etiketa">Data</span>
          <p className="vlera-e-lexuar">
            <Ikona emri="kalendari" />
            {dataShqip(date)}
          </p>
        </div>

        <p className="ndihma">
          {/*
            Rregulli i lojës së zgjedhur, ashtu si rri te regjistri. Kjo është
            edhe kontrolli i fundit para se të niset mbrëmja: kush e preku
            çelësin pa dashje e sheh menjëherë se po nis një lojë tjetër.
          */}
          {rregullat(lloji).rregulli}{' '}
          {mefundit && mefundit.length >= 2
            ? 'Nisur nga lojtarët e lojës së fundit. Numri tregon radhën e kolonave.'
            : 'Numri tregon radhën e kolonave. Duhen së paku dy lojtarë.'}
        </p>

        {/*
          Rregullat e plota, po aty ku zgjidhet çka luhet — sepse atje bëhet
          pyetja «si luhej kjo?», para se të ndahen letrat. Rri e mbledhur: kush
          e di lojën nuk e hap kurrë.
        */}
        <RregullatELojes rregulli={rregullat(lloji)} />

        <div className="veprimet">
          <button
            type="button"
            className="buton buton--kryesor"
            disabled={zgjedhur.length < 2}
            onClick={() =>
              onNis(
                date,
                zgjedhur,
                lloji,
                // Shkruhet vetëm te lojërat që e kanë atë pyetje: te bridzhi e
                // magareci fusha mbetet e pashkruar, si te çdo lojë e vjetër.
                rregullat(lloji).kufijteEMundshem.length > 0 ? kufiri : undefined,
              )
            }
          >
            <Ikona emri="luaj" />
            Nis lojën
          </button>
          <button type="button" className="buton" onClick={onAnulo}>
            <Ikona emri="anulo" />
            Anulo
          </button>
        </div>
      </div>
    </div>
  );
}

/** Shtimi, heqja dhe riemërtimi i lojtarëve të grupit. */
function ListaELojtareve({
  grupi,
  onRuajtur,
}: {
  grupi: TGrupi;
  onRuajtur: () => void;
}) {
  const [iRi, caktoTeRin] = useState('');
  const fusha = useRef<HTMLInputElement>(null);

  async function shto() {
    const rinjte = emratERinj(iRi, grupi.playerNames);
    caktoTeRin('');
    fusha.current?.focus();
    if (rinjte.length === 0) return;

    await ruajGrup({
      ...grupi,
      playerNames: [...grupi.playerNames, ...rinjte],
    });
    onRuajtur();
  }

  async function hiq(lojtari: string) {
    if (
      !window.confirm(
        `Të hiqet ${lojtari} nga grupi? Lojërat e kaluara nuk preken — ai mbetet aty ku ka luajtur.`,
      )
    ) {
      return;
    }

    await ruajGrup({
      ...grupi,
      playerNames: grupi.playerNames.filter((x) => x !== lojtari),
    });
    onRuajtur();
  }

  async function riemerto(lojtari: string) {
    const emri = window.prompt(`Emri i ri për ${lojtari}:`, lojtari)?.trim();
    if (!emri || emri === lojtari || grupi.playerNames.includes(emri)) return;

    await ruajGrup({
      ...grupi,
      playerNames: grupi.playerNames.map((x) => (x === lojtari ? emri : x)),
    });
    onRuajtur();
  }

  return (
    <>
      <p className="ndihma">
        Ndryshimet vlejnë për lojërat e reja. Lojërat e kaluara mbajnë lojtarët
        me të cilët u luajtën.
      </p>

      <ul className="shenjat" data-hapesire="lart">
        {grupi.playerNames.map((lojtari) => (
          <li className="shenja-lojtari" key={lojtari}>
            <button
              type="button"
              className="shenja-lojtari__hiq"
              onClick={() => riemerto(lojtari)}
              aria-label={`Riemërto ${lojtari}`}
            >
              <Ikona emri="redakto" />
            </button>
            {lojtari}
            <button
              type="button"
              className="shenja-lojtari__hiq"
              onClick={() => hiq(lojtari)}
              aria-label={`Hiq ${lojtari}`}
            >
              <Ikona emri="anulo" />
            </button>
          </li>
        ))}
      </ul>

      <div className="rreshti-fushave" data-hapesire="lart">
        <div className="fusha">
          <input
            ref={fusha}
            type="text"
            value={iRi}
            placeholder="lojtar i ri, ose disa me presje"
            onChange={(e) => caktoTeRin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void shto();
              }
            }}
            aria-label="Emrat e lojtarëve të rinj"
          />
        </div>
        <button
          type="button"
          className="buton"
          onClick={shto}
          disabled={!iRi.trim()}
        >
          <Ikona emri="shto" />
          Shto
        </button>
      </div>
    </>
  );
}
