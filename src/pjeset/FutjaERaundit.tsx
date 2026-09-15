/**
 * Futja e një raundi — me dorë, ose përmes llogaritësit.
 *
 * Ky bllok përdoret më shumë se çdo tjetër: dhjetëra herë në një mbrëmje, nga
 * dikush që mban letrat me dorën tjetër. Prandaj çdo prekje e kursyer këtu
 * vlen më shumë se një ekran i tërë diku tjetër.
 *
 * Tri gjëra e mbajnë të shpejtë:
 *
 *   • «Next» i tastierës kalon te lojtari tjetër, dhe te i fundit e ruan
 *     raundin. Me gjashtë lojtarë kjo është gjashtë prekje më pak për raund,
 *     dhe dora nuk lëviz nga tastiera.
 *   • Rreshti i veprimeve rri i ngjitur në fund të kartelës. Me tastierën e
 *     hapur, ekrani i mbetur është nën gjysmën e telefonit — pa këtë, butoni
 *     „Ruaj" bie poshtë çdo here që lojtarët janë shumë.
 *   • Llogaritësi rri te një kuti e vetën dhe hapet me prekje. Sa kohë ishte
 *     bllok i shpalosur brenda kartelës, me gjashtë lojtarë dilte 742 piksela
 *     i gjatë — pra e zinte tërë ekranin e telefonit dhe tërë shtyllën e futjes
 *     te tableta, dhe çka rrinte poshtë tij (renditja, panelat) shtyhej jashtë
 *     pamjes. Kutia e mban ekranin për vete sa shënohet raundi dhe e kthen
 *     prapa ashtu si ishte.
 *
 * Fushat mbeten burimi i vërtetë gjithsesi, dhe llogaritësi mban edhe daljen
 * e dytë — «Vendosi te fushat», që i shkruan pikët pa i ruajtur: te fleta
 * origjinale ka një raund me mbyllës −50, që nuk e jep asnjë nga dy mbylljet,
 * dhe një aplikacion që pranon vetëm kombinimet e lejuara nuk do ta shënonte
 * dot.
 *
 * Shenja ka butonin e vet sepse tastiera numerike e Androidit s'ka minus;
 * arsyetimi i plotë dhe përpunimi i tekstit rrinë te `fusha.ts`.
 *
 * I njëjti bllok shënon edhe raundet e dominës e të pishpirikut, vetëm pa
 * llogaritës: atje numri numërohet te tavolina — gurët e mbetur në dorë,
 * pikët e dorës — dhe aplikacioni nuk i njeh as gurët as letrat. Ajo që mbetet
 * është pikërisht ky rrjet fushash, dhe ai është i njëjti për të tri.
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
   * pishpiriku numri numërohet te tavolina, ku janë gurët dhe letrat — atje
   * aplikacioni nuk ka çka të llogarisë, dhe një buton «Llogaritësi» që hap një
   * kuti të zbrazët do të ishte premtim i pambajtur.
   */
  llogaritesi?: boolean;
  /** Shënimi nën fushat: çka pritet të dalë ai numër, kur rregulli e thotë. */
  ndihma?: string;
  onRuaj: (scores: Record<string, number | null>) => void;
  onAnulo?: () => void;
}) {
  const [vlerat, caktoVlerat] = useState<Vlerat>(() => nga(players, fillestare));
  const fushat = useRef<(HTMLInputElement | null)[]>([]);
  const kutia = useRef<HTMLDialogElement>(null);
  /*
   * Sa herë është hapur kutia — hyn te `key`-i i llogaritësit.
   *
   * Kutia rri e montuar edhe e mbyllur (ashtu e kërkon `showModal()`), prandaj
   * gjendja e saj nuk pastrohet vetvetiu. `key`-i e ringre bllokun nga e para
   * te çdo hapje: dora e raundit të kaluar nuk ka pse të rrijë e shkruar te
   * raundi tjetër.
   */
  const [hapje, caktoHapjen] = useState(0);

  // Kur ndërrohet raundi që redaktohet, fushat duhet të ndjekin atë e jo të
  // mbajnë pikët e raundit të mëparshëm.
  useEffect(() => {
    caktoVlerat(nga(players, fillestare));
  }, [players, fillestare, roundNumber]);

  const sashenuar = players.filter((p) => numri(vlerat[p]) !== null).length;
  const shuma = players.reduce((s, p) => s + (numri(vlerat[p]) ?? 0), 0);
  const shume = players.length >= SHUME;
  const etiketaERuajtjes = fillestare
    ? 'Ruaj ndryshimet'
    : `Ruaj raundin ${roundNumber}`;

  /**
   * Ruan raundin nga fushat.
   *
   * `rifokuso` vjen vetëm nga tastiera. Pas një prekjeje të butonit fokusi rri
   * ku është: hapja e tastierës pa u kërkuar do ta mbulonte gjysmën e ekranit
   * pikërisht kur përdoruesi po shikon renditjen e sapondryshuar.
   */
  function ruaj(rifokuso = false) {
    if (sashenuar === 0) return;

    const scores: Record<string, number | null> = {};
    for (const player of players) scores[player] = numri(vlerat[player]);
    dergo(scores, rifokuso);
  }

  /**
   * Dërgon pikët e gatshme — nga fushat, ose drejt nga llogaritësi.
   *
   * Llogaritësi i kalon këtu të vetat pa i shkruar te fushat: raundi që del
   * ashtu si e jep rregulli nuk ka pse të prekë dy butona. Fushat mbeten
   * burimi i vërtetë për çdo raund tjetër, dhe «Vendosi te fushat» rri brenda
   * llogaritësit pikërisht për raundin që rregulli nuk e mbulon.
   */
  function dergo(scores: Record<string, number | null>, rifokuso = false) {
    onRuaj(scores);
    // Redaktimi mbaron me ruajtjen — ekrani kthehet te lista.
    if (fillestare) return;

    caktoVlerat(nga(players, null));
    if (rifokuso) fushat.current[0]?.focus();
  }

  function hapLlogaritesin() {
    caktoHapjen((n) => n + 1);
    kutia.current?.showModal();
  }

  function mbyllLlogaritesin() {
    kutia.current?.close();
  }

  /** «Next» shkon te lojtari tjetër; te i fundit ruan raundin. */
  function neTaste(e: React.KeyboardEvent, i: number) {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const tjetra = fushat.current[i + 1];
    if (tjetra) tjetra.focus();
    else ruaj(true);
  }

  return (
    <div className="futja">
      <div className="futja__rrjeti" data-shume={shume || undefined}>
        {players.map((player, i) => (
          <div className="futja__njesi" key={player}>
            <span className="futja__emri">{player}</span>
            <div className="futja__vlera">
              <button
                type="button"
                className="futja__shenja"
                aria-pressed={negative(vlerat[player])}
                onClick={() => ndrroShenjen(player)}
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
                Mbledhësja rri brenda të njëjtit kontroll, e treta pas shenjës
                dhe numrit: dora mblidhet te tavolina — gurët e mbetur, letrat
                e mbetura — dhe deri tani ajo mbledhje bëhej jashtë
                aplikacionit. Shenjën nuk e prek: kthen një numër pa shenjë dhe
                e ruan atë që ka fusha, sepse «−» aty do të thotë mbyllje e jo
                dorë më e vogël.
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

      {ndihma && <p className="ndihma">{ndihma}</p>}

      <div className="futja__fund">
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
            onClick={() => ruaj()}
            disabled={sashenuar === 0}
          >
            <Ikona emri="ruaj" />
            {etiketaERuajtjes}
          </button>

          {llogaritesi && (
            <button
              type="button"
              className="buton"
              aria-haspopup="dialog"
              onClick={hapLlogaritesin}
            >
              <Ikona emri="llogaritesi" />
              Llogaritësi
            </button>
          )}

          {onAnulo && (
            <button type="button" className="buton" onClick={onAnulo}>
              <Ikona emri="anulo" />
              Anulo
            </button>
          )}
        </div>
      </div>

      {/*
        Llogaritësi rri te një kuti e vërtetë, si mbledhësja e dorës.

        Ishte bllok i shpalosur brenda kësaj kartele, dhe atje kishte një çmim
        që nuk u pa derisa faqja mori shtylla: me gjashtë lojtarë dilte 742
        piksela i gjatë, pra e mbushte tërë shtyllën e futjes te tableta dhe
        tërë ekranin te telefoni. Çka rrinte poshtë tij — renditja, panelat —
        shtyhej jashtë pamjes, dhe shtylla e ngjitur e mbante atë lartësi sa
        rrëshqitej faqja.

        Kutia e zgjidh atë pa e prekur asnjë llogari: ekrani i mbetur është i
        tëri i saj sa shënohet raundi, «Esc» ose prekja jashtë e heqin në çast,
        dhe prapa saj kartela mbetet e shkurtër — fushat dhe një rresht
        butonash.
      */}
      {llogaritesi && (
        <dialog
          ref={kutia}
          className="kutia kutia--llogaritesi"
          aria-label={`Llogaritësi i raundit ${roundNumber}`}
          /* Prekja jashtë kutisë e mbyll, si te mbledhësja: te tableta ajo
             është lëvizja e parë e dorës. Ngjarja vjen nga vetë `<dialog>`-u
             kur prekja bie te sfondi i tij. */
          onClick={(e) => {
            if (e.target === kutia.current) mbyllLlogaritesin();
          }}
        >
          <Llogaritesi
            key={hapje}
            players={players}
            roundNumber={roundNumber}
            etiketaERuajtjes={etiketaERuajtjes}
            onRuaj={(pike) => {
              mbyllLlogaritesin();
              dergo(pike);
            }}
            onVendos={(pike) => {
              caktoVlerat(
                Object.fromEntries(
                  players.map((p) => [p, String(pike[p] ?? 0)]),
                ) as Vlerat,
              );
              mbyllLlogaritesin();
            }}
            onMbyll={mbyllLlogaritesin}
          />
        </dialog>
      )}
    </div>
  );

  function ndrroShenjen(player: string) {
    caktoVlerat((v) => ({ ...v, [player]: ndrro(v[player]) }));
  }
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
 *
 * Trupi rrëshqet brenda kutisë dhe rreshti i veprimeve rri i ngjitur në fund
 * të saj, si te kartela e futjes: me tetë lojtarë lista e duarve del më e gjatë
 * se ekrani, dhe «Ruaj raundin» nuk guxon të bjerë poshtë tij.
 */
function Llogaritesi({
  players,
  roundNumber,
  etiketaERuajtjes,
  onRuaj,
  onVendos,
  onMbyll,
}: {
  players: string[];
  roundNumber: number;
  /** E njëjta fjalë si te kartela: «Ruaj raundin N», ose «Ruaj ndryshimet». */
  etiketaERuajtjes: string;
  /** Ruan raundin drejt nga llogaritësi, pa kaluar nëpër fushat. */
  onRuaj: (pike: Record<string, number>) => void;
  /** I shkruan pikët te fushat, që të preken me dorë para ruajtjes. */
  onVendos: (pike: Record<string, number>) => void;
  onMbyll: () => void;
}) {
  /*
   * Nis pa mbyllës të zgjedhur, me kërkesë të pronarit.
   *
   * Zgjedhja është pyetja e parë e raundit, prandaj rri e papërgjigjur derisa
   * të përgjigjet: pa të pikët nuk llogariten fare (`pike` del `null`) dhe të
   * dy butonat e daljes rrinë të fikur. Një emër i zgjedhur vetvetiu do të
   * shkruante raundin te lojtari i gabuar me një prekje të vetme.
   */
  const [mbyllesi, caktoMbyllesin] = useState('');
  const [lloji, caktoLlojin] = useState<LlojiMbylljes>('normal');
  const [duart, caktoDuart] = useState<Record<string, string>>({});
  /*
   * A rrinë të shpalosur emrat.
   *
   * Pa mbyllës rrinë gjithmonë — ajo është pyetja e parë e raundit. Pas tij
   * mblidhen, dhe hapen sërish vetëm me «Ndërro». Gjendja nuk ka nevojë të
   * pastrohet: `key`-i i llogaritësit ndërrohet te çdo hapje e kutisë, pra çdo
   * hapje e ringre këtë bllok nga e para.
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

  const tjeret = players.filter((player) => player !== mbyllesi);
  const shuma = pike ? Object.values(pike).reduce((s, n) => s + n, 0) : 0;

  return (
    <div className="llogaritesi">
      <p className="kutia__krye">
        <span className="kutia__titull">Raundi {roundNumber}</span>
        <span className="kutia__ndihma">kush e mbylli, dhe si</span>
      </p>

      <div className="llogaritesi__trupi">
        {/*
          Mbyllësi zgjidhet me emra të prekshëm, jo me listë të shpalosur.

          Një `<select>` i kërkonte dy prekje — hape, zgjidhe — dhe lista e tij
          vizatohet nga sistemi: shkronja të vogla, të tjera nga faqja, dhe te
          tableta një kolonë e ngushtë në mes të ekranit. Emrat janë dy deri tetë
          dhe hyjnë të gjithë në ekran, prandaj rrinë të shkruar: një prekje, caku
          mbi 2.75rem, dhe kush mbylli duket pa hapur asgjë.

          Por emrat e shkruar e kanë një çmim që lista nuk e kishte: lartësia
          rritet me lojtarët. Prandaj dy gjëra e mbajnë të shkurtër:

            • **Sapo zgjidhet mbyllësi, rreshtat mblidhen te një i vetëm** — emri i
              zgjedhur dhe «Ndërro». Pyetja është përgjigjur, dhe hapësira i kthehet
              duarve që shënohen menjëherë pas saj. «Ndërro» i kthen të gjithë.
            • **Nga pesë lojtarë e tutje shtrëngohen** (`data-shume`, si te fushat e
              te tabelat): ulet vetëm ajri dhe shkronja, kurse caku i prekjes mbetet
              2.75rem.

          Prekja e dytë mbi të njëjtin emër nuk e zhbën zgjedhjen. Raundi nuk
          ruhet dot pa mbyllës gjithsesi (pika 3), prandaj zbrazja nuk hap asnjë
          rrugë — vetëm do t'i fshinte pikët e llogaritura me një prekje të
          pakujdesshme. Mbyllësi i gabuar ndërrohet duke prekur atë të duhurin.
        */}
        {/* Etiketa e bllokut nuk përsëritet këtu: kreu i kutisë e thotë tashmë
            («Raundi N — kush e mbylli, dhe si»), dhe dy herë e njëjta fjali
            njëra mbi tjetrën lexohet si dy pyetje e jo si një. Emri i grupit
            mbetet te `aria-label`, për atë që e dëgjon e nuk e sheh. */}
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
            radhës pas «Lesa». Etiketa e bllokut i thotë të dyja bashkë, prandaj
            ndarja e tyre nuk mund të mbetet te fjalët.
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
                  mbledhësja rri krah fushës e jo diku poshtë: kush i numëron
                  letrat një nga një e shtyp atë, kush e di shumën shkruan numrin.
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
      </div>

      {/*
        Rreshti i fundit: çka doli, dhe dy daljet.

        Sa kohë llogaritësi ishte bllok brenda kartelës, «Ruaj» i takonte
        rreshtit të ngjitur poshtë tij — brenda do të kishte rënë nën fund të
        ekranit sapo lojtarët ishin shumë. Kutia e mban atë arsye të zgjidhur
        vetë: trupi rrëshqet, ky rresht rri i ngjitur në fund, dhe raundi që bie
        brenda rregullit mbaron me një prekje pa u prekur fushat fare.

        «Vendosi te fushat» mbetet dalja e dytë, dhe nuk guxon të hiqet: te
        fleta origjinale ka një raund me mbyllës −50, që nuk e jep asnjë nga dy
        mbylljet, dhe një raund të papërfunduar pa asnjë mbyllës.
      */}
      <div className="llogaritesi__fund">
        <p className="futja__shuma">
          {pike ? (
            <>
              <span>
                {mbyllesi} merr <strong>{pike[mbyllesi]}</strong>
              </span>
              <span>
                shuma <strong>{shuma}</strong>
              </span>
            </>
          ) : (
            <span>Zgjidh kush e mbylli raundin.</span>
          )}
        </p>

        <div className="veprimet">
          <button
            type="button"
            className="buton buton--kryesor"
            onClick={() => pike && onRuaj(pike)}
            disabled={!pike}
          >
            <Ikona emri="ruaj" />
            {etiketaERuajtjes}
          </button>

          <button
            type="button"
            className="buton"
            onClick={() => pike && onVendos(pike)}
            disabled={!pike}
          >
            <Ikona emri="llogaritesi" />
            Vendosi te fushat
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
