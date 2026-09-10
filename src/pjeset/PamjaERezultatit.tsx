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
import { Ikona, ShenjaEFaqes } from '../ikonat.tsx';
import { Renditja } from './Renditja.tsx';
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
            <span className="etiketa">
              <Ikona emri="shlyerja" />
              {pamja.raunde} {pamja.raunde === 1 ? 'raund' : 'raunde'}
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

      {njoftimi}

      {magarec ? (
        <>
          <ShenjaEMagarecit
            magareci={
              rreshtatEMagarecit(emrat, totalat).find((r) => r.magarec)?.player
              ?? null
            }
          />
          <RrjetiIMagarecit players={emrat} shkronjat={totalat} />
        </>
      ) : (
        <PjesaEBridzhit emrat={emrat} totalat={totalat} />
      )}
    </>
  );
}

/** Renditja dhe shlyerja e bridzhit — i njëjti vizatim si te ekrani i lojës. */
function PjesaEBridzhit({
  emrat,
  totalat,
}: {
  emrat: string[];
  totalat: Record<string, number>;
}) {
  const rreshtat = renditja(emrat, totalat);

  return (
    <>
      <Renditja rreshtat={rreshtat} />

      <Shlyerja
        players={rreshtat.map((rreshti) => rreshti.player)}
        matrica={matricaEShlyerjes(emrat, totalat)}
      />
    </>
  );
}
