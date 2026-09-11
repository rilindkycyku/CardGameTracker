/**
 * Pamja vetëm-lexim e një rezultati.
 *
 * E ndarë sepse tregohet nga dy rrugë: fotografia e adresës (`#/shiko/`) dhe
 * kanali i drejtpërdrejtë (`#/lidhu/`). Të dyja lexojnë të njëjtat bajte të
 * `ndarja.ts`, prandaj kanë një vend të vetëm vizatimi — dy kopje do të dilnin
 * jashtë sinkronie pikërisht atje ku numri duhet të jetë i njëjti.
 *
 * Renditja dhe shlyerja llogaritjen e kanë të njëjtën me atë të lojës —
 * `renditja` dhe `matricaEShlyerjes`, pa kopje të dytë — sepse matrica është
 * `total[i] − total[j]` dhe totalet i mban paketa.
 *
 * Magareci vizatohet me rrjetin e vet dhe pa shlyerje: aty numri është shkronjë
 * e jo pikë, prandaj një diferencë mes dy lojtarëve nuk do të thoshte asgjë që
 * shlyhet. Rrjeti i plotë del nga po ato totale — shkronja është vetë totali —
 * prandaj paketa nuk u bë as një bajt më e gjatë për të.
 */

import { dataShqip, matricaEShlyerjes, renditja } from '../llogaritjet.ts';
import { FJALA, rreshtatEMagarecit } from '../magareci.ts';
import type { Pamja } from '../ndarja.ts';
import type { RreshtiRenditjes } from '../tipet.ts';
import { Ikona, ShenjaEFaqes } from '../ikonat.tsx';
import { Parashikimi } from './Parashikimi.tsx';
import { PermbledhjaEPamjes } from './PermbledhjaEPamjes.tsx';
import { Renditja } from './Renditja.tsx';
import { Vetja } from './Vetja.tsx';
import { RrjetiIMagarecit, ShenjaEMagarecit } from './RrjetiIMagarecit.tsx';
import { Shlyerja } from './Shlyerja.tsx';

/** Blloku i gabimit, i njëjti për një adresë të prerë e për një ftesë të prerë. */
export function LidhjaEKeqe({ titulli, shpjegimi }: { titulli: string; shpjegimi: string }) {
  return (
    <div className="faqja">
      <header className="kreu">
        <ShenjaEFaqes />
        <div>
          <p className="kreu__mbi">Bridzh</p>
          <h1 className="kreu__titull">Lidhja nuk lexohet</h1>
        </div>
      </header>

      <div className="zbrazet">
        <p className="zbrazet__titull">{titulli}</p>
        <p>{shpjegimi}</p>
        <a className="buton" href="#/">
          <Ikona emri="kthehu" />
          Hap aplikacionin
        </a>
      </div>
    </div>
  );
}

export function PamjaERezultatit({
  pamja,
  etiketa,
  njoftimi,
}: {
  pamja: Pamja;
  /** Ç'lloj pamjeje është — «Vetëm-lexim» a «Drejtpërdrejt». */
  etiketa: { emri: string; ikona: string };
  /** Shënimi mbi tabelë: sa i freskët është numri që shihet. */
  njoftimi: React.ReactNode;
}) {
  const emrat = pamja.totalet.map(([emri]) => emri);
  const totalat = Object.fromEntries(pamja.totalet);
  const magarec = pamja.lloji === 'magarec';
  const rreshtat = renditja(emrat, totalat);

  return (
    <>
      <header className="kreu">
        <ShenjaEFaqes />
        <div>
          <p className="kreu__mbi">{pamja.grupi}</p>
          <h1 className="kreu__titull">{dataShqip(pamja.data)}</h1>
          <p className="kreu__meta">
            <span className="etiketa">
              <Ikona emri={etiketa.ikona} />
              {etiketa.emri}
            </span>
            {/*
              Numri i raundeve rri te përmbledhja poshtë, bashkë me sa kanë
              mbetur. Këtu del vetëm kur ajo mungon — pra te një lojë e ndarë
              para raundit të parë — që i njëjti numër të mos dalë dy herë.
            */}
            {pamja.raunde === 0 && (
              <span className="etiketa">
                <Ikona emri="shlyerja" />
                ende asnjë raund
              </span>
            )}
            {magarec && (
              <span className="etiketa etiketa--hapur">
                <Ikona emri="luaj" />
                {FJALA}
              </span>
            )}
          </p>
        </div>
      </header>

      {njoftimi}

      {pamja.raunde > 0 && (
        <PermbledhjaEPamjes pamja={pamja} rreshtat={rreshtat} />
      )}

      {magarec ? (
        <>
          <ShenjaEMagarecit
            magareci={
              rreshtatEMagarecit(emrat, totalat).find((r) => r.magarec)?.player
              ?? null
            }
          />
          <RrjetiIMagarecit players={emrat} shkronjat={totalat} />

          {pamja.raunde > 0 && (
            <>
              <Vetja rreshtat={rreshtat} totalet={totalat} magarec />

              <Parashikimi
                lloji="magarec"
                players={emrat}
                totalet={totalat}
                luajtur={pamja.raunde}
              />
            </>
          )}
        </>
      ) : (
        <PjesaEBridzhit
          emrat={emrat}
          totalat={totalat}
          rreshtat={rreshtat}
          raunde={pamja.raunde}
        />
      )}
    </>
  );
}

/**
 * Renditja, vetja dhe shlyerja e bridzhit — i njëjti vizatim si te ekrani i lojës.
 *
 * «Unë jam» rri mes renditjes dhe matricës me qëllim: renditja thotë ku janë të
 * gjithë, rreshti i vetes thotë ku je ti, dhe matrica e plotë mbetet poshtë për
 * kë e do të tërën. Kush skanoi kodin e gjen përgjigjen e vet pa e prekur atë.
 */
function PjesaEBridzhit({
  emrat,
  totalat,
  rreshtat,
  raunde,
}: {
  emrat: string[];
  totalat: Record<string, number>;
  rreshtat: RreshtiRenditjes[];
  /** Sa raunde janë luajtur — pa asnjë, parashikimi s'ka çka të thotë. */
  raunde: number;
}) {
  return (
    <>
      <Renditja rreshtat={rreshtat} />

      {raunde > 0 && (
        <>
          <Vetja rreshtat={rreshtat} totalet={totalat} magarec={false} />

          <Parashikimi
            lloji="bridzh"
            players={emrat}
            totalet={totalat}
            luajtur={raunde}
          />
        </>
      )}

      <Shlyerja
        players={rreshtat.map((rreshti) => rreshti.player)}
        matrica={matricaEShlyerjes(emrat, totalat)}
      />
    </>
  );
}
