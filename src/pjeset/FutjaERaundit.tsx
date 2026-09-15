/**
 * Futja e një raundi — kartela e mbledhur, dhe detajet te një kuti.
 *
 * Kartela e raundit nuk mban më asnjë fushë: mban atë që lexohet pa u prekur —
 * cili raund është dhe kush përzien (te kreu, nga `Loja`), çka pritet të dalë
 * numri (`ndihma`) — dhe një buton të vetëm që hap detajet. Kjo është kërkesë e
 * shprehur e pronarit, dhe arsyeja është ekrani: gjashtë a tetë rreshta fushash
 * që rrinë të zbrazëta tërë mbrëmjen e shtynin poshtë renditjen, e cila është
 * pikërisht ajo që lexohet pas çdo raundi.
 *
 * Brenda kutisë rrinë të dyja rrugët e shënimit, dhe «Ruaj raundin N» është një
 * i vetëm për të dyja — prekja e tij e ruan raundin drejtpërdrejt dhe e mbyll
 * kutinë, pra një raund mbaron me hape-shëno-ruaj:
 *
 *   • **Llogaritësi** (vetëm te bridzhi): kush e mbylli, si e mbylli, dhe çfarë
 *     i mbeti secilit në dorë. Rruga e shpeshtë — pothuajse çdo raund bie brenda
 *     rregullit.
 *   • **Fushat me dorë**: një numër për lojtar. Te domina e pishpiriku kjo është
 *     e vetmja rrugë, sepse atje numri numërohet te tavolina — gurët e mbetur,
 *     pikët e dorës — dhe aplikacioni nuk i njeh as gurët as letrat. Te bridzhi
 *     rri një prekje larg dhe **nuk guxon të hiqet**: te fleta origjinale ka një
 *     raund me mbyllës −50, që nuk e jep asnjë nga dy mbylljet, dhe një raund të
 *     papërfunduar pa asnjë mbyllës. Një aplikacion që pranon vetëm kombinimet e
 *     lejuara nuk do t'i shënonte dot.
 *
 * Dy gjëra e mbajnë të shpejtë futjen me dorë, dhe asnjëra nuk u prek nga kutia:
 * «Next» i tastierës kalon te lojtari tjetër e te i fundit ruan raundin, dhe nga
 * pesë lojtarë e tutje shtrëngohen rreshtat (`data-shume`) — ulet vetëm ajri,
 * kurse fushat mbeten 2.75rem, sepse ai është kufiri nën të cilin gishti nuk i
 * zë.
 *
 * Shenja ka butonin e vet sepse tastiera numerike e Androidit s'ka minus;
 * arsyetimi i plotë dhe përpunimi i tekstit rrinë te `fusha.ts`.
 */

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  piketERaundit,
  shpjegimi,
  type GjendjaLojtarit,
  type LlojiMbylljes,
} from '../pikezimi.ts';
import { negative, ndrroShenjen as ndrro, numri, pastro } from '../fusha.ts';
import { Ikona } from '../ikonat.tsx';
import { Mbledhesja } from './Mbledhesja.tsx';

type Vlerat = Record<string, string>;

/** Nga sa lojtarë e tutje shtrëngohen rreshtat. */
const SHUME = 5;

export function FutjaERaundit({
  players,
  roundNumber,
  fillestare,
  llogaritesi = true,
  ndihma,
  onRuaj,
  onAnulo,
}: {
  players: string[];
  roundNumber: number;
  /** Pikët ekzistuese kur raundi po redaktohet; `null` kur është i ri. */
  fillestare?: Record<string, number | null> | null;
  /**
   * A ka kjo lojë llogaritës raundi.
   *
   * Vetëm bridzhi e ka, sepse vetëm ai ka formulë: mbyllësi merr −40 ose −20,
   * i mbyllti 200 ose 100, dhe i hapuri dorën e vet një a dy herë. Te domina e
   * pishpiriku kutia hapet drejt te fushat: atje aplikacioni nuk ka çka të
   * llogarisë, dhe një çelës «Llogaritësi» që hap një kuti të zbrazët do të
   * ishte premtim i pambajtur.
   */
  llogaritesi?: boolean;
  /** Shënimi nën butonin: çka pritet të dalë ai numër, kur rregulli e thotë. */
  ndihma?: string;
  onRuaj: (scores: Record<string, number | null>) => void;
  onAnulo?: () => void;
}) {
  const kutia = useRef<HTMLDialogElement>(null);
  /*
   * Sa herë është hapur kutia — hyn te `key`-i i detajeve.
   *
   * Kutia rri e montuar edhe e mbyllur (ashtu e kërkon `showModal()`), prandaj
   * gjendja e saj nuk pastrohet vetvetiu. `key`-i e ringre bllokun nga e para te
   * çdo hapje: dora e raundit të kaluar nuk ka pse të rrijë e shkruar te raundi
   * tjetër.
   */
  const [hapje, caktoHapjen] = useState(0);
  const redaktim = !!fillestare;

  function hap() {
    caktoHapjen((n) => n + 1);
    kutia.current?.showModal();
  }

  function mbyll() {
    kutia.current?.close();
  }

  /*
   * Redaktimi e hap kutinë vetë.
   *
   * Kush shtyp «Redakto raundin 3» te lista e ka thënë tashmë çka do; një prekje
   * e dytë mbi një buton që sapo u shfaq do të ishte pyetje e bërë dy herë. Raundi
   * i ri nuk e merr këtë — atje kutia pret butonin (pika 3).
   */
  useEffect(() => {
    if (!fillestare) return;
    caktoHapjen((n) => n + 1);
    kutia.current?.showModal();
  }, [fillestare, roundNumber]);

  function dergo(scores: Record<string, number | null>) {
    mbyll();
    onRuaj(scores);
  }

  return (
    <div className="futja">
      {ndihma && <p className="ndihma">{ndihma}</p>}

      <div className="veprimet">
        <button
          type="button"
          className="buton buton--kryesor buton--i-plote"
          aria-haspopup="dialog"
          onClick={hap}
        >
          <Ikona emri={redaktim ? 'redakto' : 'shto'} />
          {redaktim
            ? `Ndrysho detajet e raundit ${roundNumber}`
            : `Shto detajet e raundit ${roundNumber}`}
        </button>

        {onAnulo && (
          <button type="button" className="buton" onClick={onAnulo}>
            <Ikona emri="anulo" />
            Anulo
          </button>
        )}
      </div>

      <dialog
        ref={kutia}
        className="kutia kutia--llogaritesi"
        aria-label={`Detajet e raundit ${roundNumber}`}
        /* Prekja jashtë kutisë e mbyll, si te mbledhësja: te tableta ajo është
           lëvizja e parë e dorës. Ngjarja vjen nga vetë `<dialog>`-u kur prekja
           bie te sfondi i tij. */
        onClick={(e) => {
          if (e.target === kutia.current) mbyll();
        }}
      >
        <DetajetERaundit
          key={`${roundNumber}:${hapje}`}
          players={players}
          roundNumber={roundNumber}
          fillestare={fillestare ?? null}
          llogaritesi={llogaritesi}
          onRuaj={dergo}
          onMbyll={mbyll}
        />
      </dialog>
    </div>
  );
}

/**
 * Trupi i kutisë: dy rrugë shënimi, dhe një «Ruaj» i vetëm për të dyja.
 *
 * Rrugët nuk janë dy ekrane — janë dy përgjigje të së njëjtës pyetje, prandaj
 * ndërrimi mes tyre nuk fshin asgjë: pikët e llogaritësit rrinë te llogaritësi,
 * ato të shkruara me dorë te fushat, dhe «Vendosi te fushat» i kalon të parat te
 * të dytat kur raundi kërkon një prekje me dorë para se të ruhet.
 *
 * Trupi rrëshqet brenda kutisë dhe rreshti i veprimeve rri i ngjitur në fund të
 * saj: me tetë lojtarë as lista e duarve as rrjeti i fushave nuk hyjnë te një
 * ekran telefoni, dhe «Ruaj raundin N» nuk guxon të bjerë poshtë tij.
 */
function DetajetERaundit({
  players,
  roundNumber,
  fillestare,
  llogaritesi,
  onRuaj,
  onMbyll,
}: {
  players: string[];
  roundNumber: number;
  fillestare: Record<string, number | null> | null;
  llogaritesi: boolean;
  onRuaj: (scores: Record<string, number | null>) => void;
  onMbyll: () => void;
}) {
  /*
   * Me cilën rrugë nis kutia.
   *
   * Raundi i ri te bridzhi nis me llogaritësin — pikët dalin nga rregulli e jo
   * nga koka. Redaktimi nis te fushat: atje pikët janë shënuar tashmë, dhe ajo
   * që duhet rregulluar është pikërisht një prekje me dorë. Te domina e
   * pishpiriku llogaritës nuk ka fare.
   */
  const [menyra, caktoMenyren] = useState<'llogaritesi' | 'fushat'>(
    llogaritesi && !fillestare ? 'llogaritesi' : 'fushat',
  );
  const [vlerat, caktoVlerat] = useState<Vlerat>(() => nga(players, fillestare));
  const [piketELlogaritura, caktoPiketELlogaritura] = useState<Record<
    string,
    number
  > | null>(null);
  const fushat = useRef<(HTMLInputElement | null)[]>([]);

  const meLlogaritesin = menyra === 'llogaritesi';
  const ngaFushat = players.filter((p) => numri(vlerat[p]) !== null).length;
  const piket = meLlogaritesin ? piketELlogaritura : null;
  const sashenuar = piket ? players.length : ngaFushat;
  const shuma = piket
    ? Object.values(piket).reduce((s, n) => s + n, 0)
    : players.reduce((s, p) => s + (numri(vlerat[p]) ?? 0), 0);
  const shume = players.length >= SHUME;
  const etiketa = fillestare
    ? 'Ruaj ndryshimet'
    : `Ruaj raundin ${roundNumber}`;

  /** Ruan raundin — pikët e llogaritësit, ose ato të fushave. */
  function ruaj() {
    if (piket) {
      onRuaj(piket);
      return;
    }
    if (ngaFushat === 0) return;

    const scores: Record<string, number | null> = {};
    for (const player of players) scores[player] = numri(vlerat[player]);
    onRuaj(scores);
  }

  /** «Next» shkon te lojtari tjetër; te i fundit ruan raundin. */
  function neTaste(e: React.KeyboardEvent, i: number) {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const tjetra = fushat.current[i + 1];
    if (tjetra) tjetra.focus();
    else ruaj();
  }

  return (
    <div className="llogaritesi">
      <p className="kutia__krye">
        <span className="kutia__titull">Raundi {roundNumber}</span>
        <span className="kutia__ndihma">
          {meLlogaritesin ? 'kush e mbylli, dhe si' : 'pikët e secilit'}
        </span>
      </p>

      <div className="llogaritesi__trupi">
        {meLlogaritesin ? (
          <Llogaritesi
            players={players}
            onPike={caktoPiketELlogaritura}
            onVendos={(pike) => {
              caktoVlerat(
                Object.fromEntries(
                  players.map((p) => [p, String(pike[p] ?? 0)]),
                ) as Vlerat,
              );
              caktoPiketELlogaritura(null);
              caktoMenyren('fushat');
            }}
          />
        ) : (
          <>
            <div className="futja__rrjeti" data-shume={shume || undefined}>
              {players.map((player, i) => (
                <div className="futja__njesi" key={player}>
                  <span className="futja__emri">{player}</span>
                  <div className="futja__vlera">
                    <button
                      type="button"
                      className="futja__shenja"
                      aria-pressed={negative(vlerat[player])}
                      onClick={() =>
                        caktoVlerat((v) => ({ ...v, [player]: ndrro(v[player]) }))
                      }
                      aria-label={`Ndërro shenjën e ${player}`}
                    >
                      {negative(vlerat[player]) ? '−' : '+'}
                    </button>
                    <input
                      ref={(el) => {
                        fushat.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="-?[0-9]*"
                      enterKeyHint={i === players.length - 1 ? 'done' : 'next'}
                      value={vlerat[player] ?? ''}
                      onChange={(e) =>
                        caktoVlerat((v) => ({
                          ...v,
                          [player]: pastro(e.target.value),
                        }))
                      }
                      onKeyDown={(e) => neTaste(e, i)}
                      aria-label={`Pikët e ${player} për raundin ${roundNumber}`}
                    />
                    {/*
                      Mbledhësja rri brenda të njëjtit kontroll, e treta pas
                      shenjës dhe numrit: dora mblidhet te tavolina — gurët e
                      mbetur, letrat e mbetura. Shenjën nuk e prek: kthen një
                      numër pa shenjë dhe e ruan atë që ka fusha, sepse «−» aty
                      do të thotë mbyllje e jo dorë më e vogël.
                    */}
                    <Mbledhesja
                      emri={player}
                      vlera={vlerat[player] ?? ''}
                      onCakto={(teksti) =>
                        caktoVlerat((v) => ({
                          ...v,
                          [player]: negative(v[player]) ? `-${teksti}` : teksti,
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            {/*
              Kthimi te llogaritësi rri vetëm te bridzhi, dhe vetëm te raundi i
              ri: te domina e pishpiriku llogaritës nuk ka fare, dhe te
              redaktimi prekja me dorë është pikërisht ajo që u kërkua.
            */}
            {llogaritesi && !fillestare && (
              <button
                type="button"
                className="buton buton--i-plote"
                onClick={() => caktoMenyren('llogaritesi')}
              >
                <Ikona emri="llogaritesi" />
                Kthehu te llogaritësi
              </button>
            )}
          </>
        )}
      </div>

      {/*
        Rreshti i fundit: çka doli, dhe ku shkon.

        «Ruaj raundin N» e ruan raundin drejtpërdrejt dhe e mbyll kutinë — një
        prekje, pa kaluar nga asnjë ekran i dytë. Rri i ngjitur në fund të
        kutisë sepse trupi mbi të rrëshqet: me tetë lojtarë ai del më i gjatë se
        ekrani, dhe butoni që shtypet te çdo raund nuk guxon të bjerë poshtë tij.
      */}
      <div className="llogaritesi__fund">
        <p className="futja__shuma">
          <span>
            {sashenuar} nga {players.length} të shënuar
          </span>
          <span>
            shuma <strong>{shuma}</strong>
          </span>
        </p>

        <div className="veprimet">
          <button
            type="button"
            className="buton buton--kryesor"
            onClick={ruaj}
            disabled={sashenuar === 0}
          >
            <Ikona emri="ruaj" />
            {etiketa}
          </button>

          <button type="button" className="buton" onClick={onMbyll}>
            <Ikona emri="anulo" />
            Mbyll
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Llogaritësi: kush mbylli, si e mbylli, dhe çfarë i mbeti secilit në dorë.
 *
 * Nuk ka çelës „s'hapi / hapi", dhe kjo është vetë pyetja e hequr: dora e thotë.
 * Fushë e zbrazët do të thotë që lojtari nuk hapi fare, prandaj merr dënimin
 * fiks (+100 ose +200); çdo numër do të thotë që hapi, dhe ai numër është dora
 * e tij. Një lojtar që ka hapur e ka mbetur me zero pikë në dorë do ta kishte
 * mbyllur vetë raundin, prandaj zeroja nuk humb asnjë gjendje të vërtetë.
 *
 * Me gjashtë lojtarë kjo e pret llogaritësin përgjysmë dhe heq pesë prekje —
 * më parë secili kërkonte një çelës para se t'i shkruhej dora.
 */
function Llogaritesi({
  players,
  onPike,
  onVendos,
}: {
  players: string[];
  /**
   * Pikët e llogaritura, sa herë ndryshojnë — butoni «Ruaj» rri te rreshti i
   * ngjitur poshtë. `null` sa kohë mbyllësi nuk është zgjedhur: pa të nuk ka
   * raund, dhe ai buton mbetet i fikur.
   */
  onPike: (pike: Record<string, number> | null) => void;
  /** I shkruan pikët te fushat, që të preken me dorë para ruajtjes. */
  onVendos: (pike: Record<string, number>) => void;
}) {
  /*
   * Nis pa mbyllës të zgjedhur, me kërkesë të pronarit.
   *
   * Zgjedhja është pyetja e parë e raundit, prandaj rri e papërgjigjur derisa
   * të përgjigjet: pa të pikët nuk llogariten fare dhe të dy butonat e daljes
   * rrinë të fikur. Një emër i zgjedhur vetvetiu do ta shkruante raundin te
   * lojtari i gabuar me një prekje të vetme.
   */
  const [mbyllesi, caktoMbyllesin] = useState('');
  const [lloji, caktoLlojin] = useState<LlojiMbylljes>('normal');
  const [duart, caktoDuart] = useState<Record<string, string>>({});
  /*
   * A rrinë të shpalosur emrat.
   *
   * Pa mbyllës rrinë gjithmonë — ajo është pyetja e parë e raundit. Pas tij
   * mblidhen, dhe hapen sërish vetëm me «Ndërro»: me tetë veta te telefoni ata
   * do të zinin katër rreshta mbi duart, pra pikërisht hapësirën e bllokut më të
   * përdorur të mbrëmjes.
   */
  const [dukeNdrruar, caktoNdrrimin] = useState(false);
  const zgjedhja = mbyllesi === '' || dukeNdrruar;

  const gjendjet: Record<string, GjendjaLojtarit> = useMemo(
    () =>
      Object.fromEntries(
        players.map((player) => {
          const dora = Number(duart[player] ?? '');
          const hapi = Number.isFinite(dora) && dora > 0;
          return [player, { mbyllur: !hapi, dora: hapi ? dora : 0 }];
        }),
      ),
    [players, duart],
  );

  // Pa mbyllës nuk ka pikë: `piketERaundit` do t'i jepte dënimin e plotë
  // secilit dhe shuma do të dukej si raund i vërtetë.
  const pike = useMemo(
    () => (mbyllesi ? piketERaundit(players, mbyllesi, lloji, gjendjet) : null),
    [players, mbyllesi, lloji, gjendjet],
  );

  // Pikët ngjiten lart sa herë ndryshojnë, sepse butoni që i ruan rri te
  // rreshti i ngjitur i kutisë e jo këtu.
  useEffect(() => {
    onPike(pike);
  }, [pike, onPike]);

  const tjeret = players.filter((player) => player !== mbyllesi);

  return (
    <>
      {/*
        Mbyllësi zgjidhet me emra të prekshëm, jo me listë të shpalosur.

        Një `<select>` i kërkonte dy prekje — hape, zgjidhe — dhe lista e tij
        vizatohet nga sistemi: shkronja të vogla, të tjera nga faqja. Emrat janë
        dy deri tetë dhe hyjnë të gjithë në ekran, prandaj rrinë të shkruar: një
        prekje, caku mbi 2.75rem, dhe kush mbylli duket pa hapur asgjë.

        Sapo zgjidhet, rreshtat mblidhen te një i vetëm — emri dhe «Ndërro» —
        sepse pyetja është përgjigjur dhe hapësira i kthehet duarve që shënohen
        menjëherë pas saj. Nga pesë lojtarë e tutje shtrëngohet (`data-shume`):
        ulen ajri dhe shkronja, kurse caku i prekjes mbetet 2.75rem.

        Prekja e dytë mbi të njëjtin emër nuk e zhbën zgjedhjen. Raundi nuk ruhet
        dot pa mbyllës gjithsesi, prandaj zbrazja nuk hap asnjë rrugë — vetëm do
        t'i fshinte pikët me një prekje të pakujdesshme.
      */}
      <div className="fusha">
        <div
          className="celesi celesi--rrjet celesi--emra"
          data-shume={players.length >= SHUME || undefined}
          role="group"
          aria-label="Lojtari që mbylli raundin"
        >
          {(zgjedhja ? players : [mbyllesi]).map((player) => (
            <button
              key={player}
              type="button"
              className="celesi__njesi celesi__njesi--emer"
              aria-pressed={mbyllesi === player}
              onClick={() => {
                caktoMbyllesin(player);
                caktoNdrrimin(false);
              }}
            >
              {player}
            </button>
          ))}

          {!zgjedhja && (
            <button
              type="button"
              className="celesi__njesi"
              onClick={() => caktoNdrrimin(true)}
            >
              Ndërro
            </button>
          )}
        </div>

        {/*
          Vija mes emrave dhe mbylljes.

          Janë dy pyetje te një bllok — kush mbylli, dhe si — dhe pa asgjë mes
          tyre butonat lexohen si një listë e vetme: «Normal» del si emri i
          radhës pas «Lesa».
        */}
        <div className="celesi llogaritesi__si">
          <button
            type="button"
            className="celesi__njesi"
            aria-pressed={lloji === 'normal'}
            onClick={() => caktoLlojin('normal')}
          >
            Normal
          </button>
          <button
            type="button"
            className="celesi__njesi"
            aria-pressed={lloji === 'hant'}
            onClick={() => caktoLlojin('hant')}
          >
            Hant
          </button>
        </div>
      </div>

      <p className="ndihma">
        Mbyllësi merr {lloji === 'hant' ? '−40' : '−20'}. Lëre bosh atë që s’hapi
        — merr {lloji === 'hant' ? '200' : '100'}.
      </p>

      <ul className="llogaritesi__lista">
        {tjeret.map((player) => (
          <li className="llogaritesi__njesi" key={player}>
            <span className="llogaritesi__emri">{player}</span>
            <div className="llogaritesi__vlera">
              <input
                className="llogaritesi__dora"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="s’hapi"
                value={duart[player] ?? ''}
                onChange={(e) =>
                  caktoDuart((d) => ({
                    ...d,
                    [player]: e.target.value.replace(/[^0-9]/g, ''),
                  }))
                }
                aria-label={`Pikët në dorë të ${player}`}
              />
              {/*
                Këtu dora është fjalë për fjalë një mbledhje letrash, prandaj
                mbledhësja rri krah fushës: kush i numëron letrat një nga një e
                shtyp atë, kush e di shumën shkruan numrin.
              */}
              <Mbledhesja
                emri={player}
                vlera={duart[player] ?? ''}
                onCakto={(teksti) =>
                  caktoDuart((d) => ({ ...d, [player]: teksti }))
                }
              />
            </div>
            <span
              className="llogaritesi__pike"
              title={shpjegimi(lloji, gjendjet[player]!)}
            >
              {pike ? pike[player] : '·'}
            </span>
          </li>
        ))}
      </ul>

      <p className="futja__shuma">
        {pike ? (
          <span>
            {mbyllesi} merr <strong>{pike[mbyllesi]}</strong>
          </span>
        ) : (
          <span>Zgjidh kush e mbylli raundin.</span>
        )}
      </p>

      {/*
        Dalja e dytë, dhe ajo që nuk guxon të hiqet.

        I shkruan pikët te fushat pa i ruajtur, dhe kutia kalon te ato: aty
        preken me dorë para se të shtypet «Ruaj». Kjo është rruga e raundit që
        rregulli nuk e mbulon — te fleta origjinale ka një raund me mbyllës −50,
        të cilin nuk e jep asnjë nga dy mbylljet.
      */}
      <button
        type="button"
        className="buton buton--i-plote"
        onClick={() => pike && onVendos(pike)}
        disabled={!pike}
      >
        <Ikona emri="redakto" />
        Vendosi te fushat
      </button>
    </>
  );
}

/** Pikët ekzistuese si tekst për fushat; `null` bëhet fushë e zbrazët. */
function nga(
  players: string[],
  scores: Record<string, number | null> | null | undefined,
): Vlerat {
  return Object.fromEntries(
    players.map((p) => {
      const v = scores?.[p];
      return [p, typeof v === 'number' ? String(v) : ''];
    }),
  );
}
