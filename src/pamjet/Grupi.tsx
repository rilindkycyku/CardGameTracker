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
import { FJALA, fjalaE, pergjithshmetEMagarecit } from '../magareci.ts';
import { emratERinj } from '../fusha.ts';
import { Ikona } from '../ikonat.tsx';
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
  const { pergjithshmet, magarecat, saLuajtura, renditjet } = useMemo(() => {
    const raundetELojes = (loja: Loja) => raunde?.[loja.id] ?? BOSH;
    const luajtura = lojerat.filter((loja) => raundetELojes(loja).length > 0);
    const eLlojit = (lloji: LlojiILojes) =>
      luajtura
        .filter((loja) => llojiILojes(loja) === lloji)
        .map((loja) => ({
          selectedPlayers: loja.selectedPlayers,
          raundet: raundetELojes(loja),
        }));

    const bridzhi = eLlojit('bridzh');
    const magarecet = eLlojit('magarec');

    return {
      // Dy tabela e jo një: aty mblidhen pikë me qindra, këtu shkronja nga zero
      // në shtatë, dhe një mesatare mbi të dyja do të ishte numër pa kuptim.
      pergjithshmet: tabelaEPergjithshme(bridzhi),
      magarecat: pergjithshmetEMagarecit(magarecet),
      saLuajtura: { bridzh: bridzhi.length, magarec: magarecet.length },
      renditjet: new Map(
        lojerat.map((loja) => [
          loja.id,
          renditjaELojes(loja.selectedPlayers, raundetELojes(loja)),
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
    <div className="faqja">
      <a className="shtegu" href="#/">
        <Ikona emri="kthehu" />
        Grupet
      </a>

      <header className="kreu">
        <div className="njesi__shkronja njesi__shkronja--hapur marka">
          {grupi.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="kreu__mbi">Grupi</p>
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
          onNis={async (date, zgjedhur, lloji) => {
            const idELojes = await shtoLoje(grupi.id, date, zgjedhur, lloji);
            shko(`/loja/${idELojes}`);
          }}
        />
      )}

      <TabelaEPergjithshme rreshtat={pergjithshmet} lojera={saLuajtura.bridzh} />

      <PergjithshmetEMagarecit rreshtat={magarecat} lojera={saLuajtura.magarec} />

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
                      {llojiILojes(loja) === 'magarec' && (
                        <>
                          {' · '}
                          <span className="njesi__lloji">{FJALA}</span>
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
  onNis: (date: string, zgjedhur: string[], lloji: LlojiILojes) => void;
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
  const [date, caktoDaten] = useState(sot());
  // Njësoj si lista e lojtarëve: shoqëria e nis mbrëmjen aty ku e la, prandaj
  // çelësi nis te loja e fundit e grupit.
  const [lloji, caktoLlojin] = useState<LlojiILojes>(llojiIFundit);

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
          <div className="celesi" role="group" aria-label="Lloji i lojës">
            <button
              type="button"
              className="celesi__njesi"
              aria-pressed={lloji === 'bridzh'}
              onClick={() => caktoLlojin('bridzh')}
            >
              Bridzh
            </button>
            <button
              type="button"
              className="celesi__njesi"
              aria-pressed={lloji === 'magarec'}
              onClick={() => caktoLlojin('magarec')}
            >
              {FJALA}
            </button>
          </div>
        </div>

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

        <label className="fusha">
          <span className="fusha__etiketa">Data</span>
          <input
            type="date"
            value={date}
            onChange={(e) => caktoDaten(e.target.value)}
          />
        </label>

        <p className="ndihma">
          {lloji === 'magarec'
            ? `Kush e humb raundin merr një shkronjë; kush e mbush ${FJALA}-in e humb mbrëmjen.`
            : 'Pikët shënohen për raund, dhe fiton totali më i vogël.'}
          {' '}
          {mefundit && mefundit.length >= 2
            ? 'Nisur nga lojtarët e lojës së fundit. Numri tregon radhën e kolonave.'
            : 'Numri tregon radhën e kolonave. Duhen së paku dy lojtarë.'}
        </p>

        <div className="veprimet">
          <button
            type="button"
            className="buton buton--kryesor"
            disabled={zgjedhur.length < 2 || !date}
            onClick={() => onNis(date, zgjedhur, lloji)}
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
