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
 *
 * Pishpiriku është pa shlyerje për arsye tjetër dhe me të njëjtin përfundim:
 * atje pikët mblidhen drejt 101-shit e nuk paguhen, prandaj `total[i] − total[j]`
 * nuk është shumë që i del njërit. Çka vizatohet për cilën lojë rri te
 * `lojerat.ts`, e jo te tri `if`-a nëpër këtë skedar.
 */

import type { ReactNode } from 'react';

import { dataShqip, matricaEShlyerjes, renditja } from '../llogaritjet.ts';
import { rregullat } from '../lojerat.ts';
import { FJALA, rreshtatEMagarecit } from '../magareci.ts';
import type { Pamja } from '../ndarja.ts';
import type { LlojiILojes, RreshtiRenditjes } from '../tipet.ts';
import { Ikona, ShenjaEFaqes } from '../ikonat.tsx';
import { MbiTitullin, type ShtegiIKthimit } from './Kreu.tsx';
import { Parashikimi } from './Parashikimi.tsx';
import { PermbledhjaEPamjes } from './PermbledhjaEPamjes.tsx';
import { Renditja } from './Renditja.tsx';
import { Vetja } from './Vetja.tsx';
import { RrjetiIMagarecit, ShenjaEMagarecit } from './RrjetiIMagarecit.tsx';
import { Shlyerja } from './Shlyerja.tsx';

/** Blloku i gabimit, i njëjti për një adresë të prerë e për një ftesë të prerë. */
export function LidhjaEKeqe({ titulli, shpjegimi }: { titulli: string; shpjegimi: string }) {
  return (
    <div className="faqja faqja--fokus">
      <header className="kreu">
        <ShenjaEFaqes />
        <div>
          <p className="kreu__mbi">Tavolina</p>
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
  koha,
  njoftimi,
  perfundoi = false,
  shtegu,
}: {
  pamja: Pamja;
  /** Ç'lloj pamjeje është — «Vetëm-lexim», «Drejtpërdrejt» a «Përfundoi». */
  etiketa: { emri: string; ikona: string };
  /**
   * Ora e mbrëmjes te kreu, kur thirrësi i ka vulat e saj.
   *
   * Jepet vetëm nga fleta e vetë pajisjes: paketa e ndarë nuk i mban ato vula
   * dhe nuk ka pse t'i mbajë (pika 7), prandaj kush skanon një kod e sheh atë
   * kre pikërisht si më parë. Vjen si nyjë e gatshme e jo si numra, që
   * numërimi — i cili ecën sa mbrëmja vazhdon — të mos hyjë te një komponent
   * që vizaton edhe fotografi të ngrira.
   */
  koha?: React.ReactNode;
  /** Shënimi mbi tabelë: sa i freskët është numri që shihet. */
  njoftimi: React.ReactNode;
  /**
   * A ka mbaruar mbrëmja — dhe atëherë parashikimi hiqet.
   *
   * «Sikur të luajmë edhe një raund» nuk ka kuptim mbi një fletë të mbyllur:
   * nuk luhet më asnjë. Te fotografia e ndarë kjo nuk jepet fare dhe mbetet
   * `false` — paketa nuk e mban, dhe nuk ka pse ta mbajë: kur mbrëmja mbaron
   * sipas rregullit, raundet e mbetura dalin zero vetvetiu dhe parashikimi
   * hiqet po ashtu. Mbetet jashtë vetëm mbyllja e hershme me dorë, dhe ajo nuk
   * vlen sa një fushë e re te një kod QR (pika 7).
   */
  perfundoi?: boolean;
  /**
   * Ku shpie rreshti mbi titullin, kur ka ku.
   *
   * Te fleta e një loje të mbyllur ai kthen te grupi i saj; te `#/shiko` nuk
   * jepet fare — kush e hapi atë adresë nuk erdhi nga asnjë ekran i këtij
   * telefoni, dhe një shigjetë prapa do të shpinte te një aplikacion që ai
   * mund të mos e ketë parë kurrë.
   */
  shtegu?: ShtegiIKthimit;
}) {
  const rregulli = rregullat(pamja.lloji);
  const emrat = pamja.totalet.map(([emri]) => emri);
  const totalat = Object.fromEntries(pamja.totalet);
  const magarec = pamja.lloji === 'magarec';
  // Drejtimi vjen nga lloji i paketës e jo nga ky ekran: te pishpiriku i pari
  // është ai me më shumë pikë, dhe një renditje e ngritur pa të do ta kthente
  // fletën përmbys pikërisht te ana që vetëm lexon.
  const rreshtat = renditja(emrat, totalat, rregulli.drejtimi);

  /*
   * Përmbledhja rri e ndërtuar këtu e jo te secila degë: e njëjta kartelë hap
   * të dyja fletët — atë me pikë dhe atë të magarecit — dhe te të dyja shkon te
   * shtylla kryesore, pra do të shkruhej dy herë me të njëjtat vlera.
   */
  const permbledhja = pamja.raunde > 0 && (
    <PermbledhjaEPamjes
      pamja={pamja}
      rreshtat={rreshtat}
      perfundoi={perfundoi}
    />
  );

  return (
    <>
      <header className="kreu">
        <ShenjaEFaqes />
        <div>
          <MbiTitullin shtegu={shtegu}>{pamja.grupi}</MbiTitullin>
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
            {/*
              Çka u luajt rri te kreu për çdo lojë veç bridzhit — ai është
              parazgjedhja e këtij aplikacioni që nga dita e parë, dhe një
              etiketë «Bridzh» mbi çdo fletë do të ishte zhurmë. Te magareci
              shkruhet vetë fjala që mbushet: ajo është edhe emri, edhe rregulli.
            */}
            {koha}
            {pamja.lloji !== 'bridzh' && (
              <span className="etiketa etiketa--hapur">
                <Ikona emri="luaj" />
                {magarec ? FJALA : rregulli.emri}
              </span>
            )}
          </p>
        </div>
      </header>

      {njoftimi}

      {/*
        Fleta ndahet në dy shtylla sapo ekrani ka gjerësi, dhe ndarja është bërë
        pikërisht aty ku radha e leximit nuk prishet: majtas përmbledhja,
        renditja dhe rreshti i vetes — çka pyet kush sapo skanoi kodin — djathtas
        parashikimi dhe matrica e plotë. Te telefoni shtyllat bien njëra nën
        tjetrën, dhe atëherë radha del pikërisht ajo e dikurshmja.
      */}
      {magarec ? (
        <div className="shtyllat">
          <div className="shtyllat__kryesore">
            {permbledhja}
            <ShenjaEMagarecit
              magareci={
                rreshtatEMagarecit(emrat, totalat).find((r) => r.magarec)?.player
                ?? null
              }
            />
            <RrjetiIMagarecit players={emrat} shkronjat={totalat} />

            {pamja.raunde > 0 && (
              <Vetja rreshtat={rreshtat} totalet={totalat} lloji="magarec" kufiri={null} />
            )}
          </div>

          <div className="shtyllat__anesore">
            {pamja.raunde > 0 && !perfundoi && (
              <Parashikimi
                lloji="magarec"
                players={emrat}
                totalet={totalat}
                luajtur={pamja.raunde}
              />
            )}
          </div>
        </div>
      ) : (
        <PjesaEPikeve
          permbledhja={permbledhja}
          lloji={pamja.lloji}
          kufiri={pamja.kufiri}
          emrat={emrat}
          totalat={totalat}
          rreshtat={rreshtat}
          raunde={pamja.raunde}
          perfundoi={perfundoi}
        />
      )}
    </>
  );
}

/**
 * Renditja, vetja dhe shlyerja e lojërave me pikë — i njëjti vizatim si te
 * ekrani i lojës.
 *
 * «Unë jam» rri mes renditjes dhe matricës me qëllim: renditja thotë ku janë të
 * gjithë, rreshti i vetes thotë ku je ti, dhe matrica e plotë mbetet poshtë për
 * kë e do të tërën. Kush skanoi kodin e gjen përgjigjen e vet pa e prekur atë.
 *
 * Te ekrani i gjerë ajo radhë bëhet dy shtylla — renditja e vetja majtas,
 * parashikimi e matrica djathtas — dhe kjo është e njëjta gjë e thënë me
 * hapësirë: e para mbetet e para, dhe e tëra shihet pa rrëshqitur. Sapo shtyllat
 * bien njëra nën tjetrën, radha del pikërisht ajo e mësipërmja.
 *
 * Tri lojëra e ndajnë këtë vizatim, dhe dy gjëra i ndajnë ato mes vete:
 * shlyerja (bridzh e domina po, pishpiriku jo) dhe parashikimi (vetëm bridzhi).
 * Të dyja lexohen nga regjistri, prandaj një lojë e pestë nuk e prek këtë
 * skedar fare.
 */
function PjesaEPikeve({
  permbledhja,
  lloji,
  kufiri,
  emrat,
  totalat,
  rreshtat,
  raunde,
  perfundoi,
}: {
  /** Kartela e përmbledhjes, e ndërtuar nga thirrësi — hap shtyllën kryesore. */
  permbledhja: ReactNode;
  lloji: LlojiILojes;
  /** Kufiri me të cilin u luajt, nga paketa; `null` kur nuk thuhet. */
  kufiri: number | null;
  emrat: string[];
  totalat: Record<string, number>;
  rreshtat: RreshtiRenditjes[];
  /** Sa raunde janë luajtur — pa asnjë, parashikimi s'ka çka të thotë. */
  raunde: number;
  /** Mbi një fletë të mbyllur nuk parashikohet asgjë. */
  perfundoi: boolean;
}) {
  const rregulli = rregullat(lloji);

  return (
    <div className="shtyllat">
      <div className="shtyllat__kryesore">
        {permbledhja}
        <Renditja rreshtat={rreshtat} drejtimi={rregulli.drejtimi} />

        {raunde > 0 && (
          <Vetja
            rreshtat={rreshtat}
            totalet={totalat}
            lloji={lloji}
            kufiri={kufiri}
          />
        )}
      </div>

      <div className="shtyllat__anesore">
        {raunde > 0 && !perfundoi && rregulli.parashikimi && (
          <Parashikimi
            lloji={lloji}
            players={emrat}
            totalet={totalat}
            luajtur={raunde}
          />
        )}

        {rregulli.shlyerja && (
          <Shlyerja
            players={rreshtat.map((rreshti) => rreshti.player)}
            matrica={matricaEShlyerjes(emrat, totalat)}
          />
        )}
      </div>
    </div>
  );
}
