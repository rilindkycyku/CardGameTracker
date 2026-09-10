/**
 * Ekrani i një loje — futja e raundit, renditja, raundet dhe shlyerja.
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

import { useState } from 'react';

import {
  dataShqip,
  eshteIMbushur,
  matricaEShlyerjes,
  pjesemarrjeEBarabarte,
  raundetELuajtura,
  raundiNeVijim,
  renditja,
  totalet,
} from '../llogaritjet.ts';
import { Ikona } from '../ikonat.tsx';
import { useNgarko } from '../ngarko.ts';
import { FutjaERaundit } from '../pjeset/FutjaERaundit.tsx';
import { LojtaretELojes } from '../pjeset/LojtaretELojes.tsx';
import { Ndarja } from '../pjeset/Ndarja.tsx';
import { Raundet } from '../pjeset/Raundet.tsx';
import { Renditja } from '../pjeset/Renditja.tsx';
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

  if (te_dhenat === null) {
    return (
      <div className="faqja">
        <p className="ndihma">Duke lexuar…</p>
      </div>
    );
  }

  if (!te_dhenat.loja) {
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

  const { loja, grupi, raundet } = te_dhenat;
  const players = loja.selectedPlayers;

  const totalat = totalet(players, raundet);
  const rreshtat = renditja(players, totalat);
  const matrica = matricaEShlyerjes(players, totalat);
  const luajtur = raundetELuajtura(players, raundet);
  const iRadhes = raundiNeVijim(raundet);

  // Kolona „raunde" te renditja del vetëm kur ka çka të tregojë. Raundet e
  // pashënuara nuk numërohen: një fletë me raunde bosh në fund nuk është
  // pjesëmarrje e pabarabartë.
  const barabarte = pjesemarrjeEBarabarte(
    players,
    raundet.filter((r) => eshteIMbushur(players, r)),
  );

  const raundiQeRedaktohet =
    dukeRedaktuar === null
      ? null
      : (raundet.find((r) => r.id === dukeRedaktuar) ?? null);

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

  async function fshi(idERaundit: number) {
    const raundi = raundet.find((r) => r.id === idERaundit);
    if (!raundi) return;
    if (!window.confirm(`Të fshihet raundi ${raundi.roundNumber}?`)) return;

    await fshiRaund(idERaundit);
    if (dukeRedaktuar === idERaundit) caktoRedaktimin(null);
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
              {raundet.length} {raundet.length === 1 ? 'raund' : 'raunde'}
            </span>
          </p>
        </div>
      </header>

      <section>
        <h2 className="titull-seksioni">
          <Ikona emri={raundiQeRedaktohet ? 'redakto' : 'shto'} />
          {raundiQeRedaktohet
            ? `Raundi ${raundiQeRedaktohet.roundNumber}`
            : `Raundi ${iRadhes}`}
        </h2>

        <div className="kartela kartela--kryesore">
          <FutjaERaundit
            players={players}
            roundNumber={raundiQeRedaktohet?.roundNumber ?? iRadhes}
            fillestare={raundiQeRedaktohet?.scores ?? null}
            onRuaj={ruaj}
            onAnulo={
              raundiQeRedaktohet ? () => caktoRedaktimin(null) : undefined
            }
          />
        </div>
      </section>

      <LojtaretELojes
        players={players}
        grupi={grupi}
        luajtur={luajtur}
        onShto={shtoLojtar}
        onHiq={hiqLojtar}
      />

      {raundet.length > 0 && (
        <Ndarja
          pamja={pamjaELojes(
            grupi?.name ?? 'Bridzh',
            loja,
            totalat,
            raundet.length,
          )}
          rreshtat={rreshtat}
        />
      )}

      {raundet.length === 0 ? (
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

          <Raundet
            players={players}
            raundet={raundet}
            totalet={totalat}
            dukeRedaktuar={dukeRedaktuar}
            onRedakto={(idERaundit) =>
              caktoRedaktimin((tani) =>
                tani === idERaundit ? null : idERaundit,
              )
            }
            onFshi={fshi}
          />

          <Shlyerja
            players={rreshtat.map((rreshti) => rreshti.player)}
            matrica={matrica}
          />
        </>
      )}
    </div>
  );
}
