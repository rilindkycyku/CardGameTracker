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

import { useRef, useState } from 'react';

import {
  dataShqip,
  lojeratESortuara,
  renditjaELojes,
  sot,
  tabelaEPergjithshme,
} from '../llogaritjet.ts';
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
import { TabelaEPergjithshme } from '../pjeset/TabelaEPergjithshme.tsx';
import { shko } from '../rruga.ts';
import type {
  Grupi as TGrupi,
  Loja,
  Raundi,
  RreshtiRenditjes,
} from '../tipet.ts';

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

  if (te_dhenat === null) {
    return (
      <div className="faqja">
        <p className="ndihma">Duke lexuar…</p>
      </div>
    );
  }

  const { grupi, lojerat, raunde } = te_dhenat;

  const pergjithshmet = tabelaEPergjithshme(
    lojerat.map((loja) => ({
      selectedPlayers: loja.selectedPlayers,
      raundet: raunde[loja.id] ?? [],
    })),
  );

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
          onAnulo={() => hapLojen(false)}
          onNis={async (date, zgjedhur) => {
            const idELojes = await shtoLoje(grupi.id, date, zgjedhur);
            shko(`/loja/${idELojes}`);
          }}
        />
      )}

      <TabelaEPergjithshme
        rreshtat={pergjithshmet}
        lojera={
          lojerat.filter((loja) => (raunde[loja.id] ?? []).length > 0).length
        }
      />

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
                      {(raunde[loja.id] ?? []).length}{' '}
                      {(raunde[loja.id] ?? []).length === 1 ? 'raund' : 'raunde'}
                      {' · '}
                      {loja.selectedPlayers.length} lojtarë
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
                            `Të fshihet loja e ${dataShqip(loja.date)} me ${(raunde[loja.id] ?? []).length} raunde?`,
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
                  rreshtat={renditjaELojes(
                    loja.selectedPlayers,
                    raunde[loja.id] ?? [],
                  )}
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
function RenditjaEShkurter({ rreshtat }: { rreshtat: RreshtiRenditjes[] }) {
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
          <span className="renditja-shkurter__totali">{rreshti.total}</span>
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
  onNis,
  onAnulo,
}: {
  grupi: TGrupi;
  /** Kush luajti herën e fundit — nisja e zgjedhjes. */
  mefundit?: string[];
  onNis: (date: string, zgjedhur: string[]) => void;
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
          {mefundit && mefundit.length >= 2
            ? 'Nisur nga lojtarët e lojës së fundit. Numri tregon radhën e kolonave.'
            : 'Numri tregon radhën e kolonave. Duhen së paku dy lojtarë.'}
        </p>

        <div className="veprimet">
          <button
            type="button"
            className="buton buton--kryesor"
            disabled={zgjedhur.length < 2 || !date}
            onClick={() => onNis(date, zgjedhur)}
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
