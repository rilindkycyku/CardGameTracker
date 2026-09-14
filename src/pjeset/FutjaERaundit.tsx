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
 *   • Llogaritësi rri i hapur që në fillim te raundi i ri, e mban ekranin
 *     vetëm për vete, dhe e ruan raundin me një prekje. Raundi që bie brenda
 *     rregullit — dhe ata janë pothuajse të gjithë — nuk ka pse të kërkojë as
 *     prekjen që e hap, as kalimin nëpër fushat vetëm që të shtypet «Ruaj»
 *     prapë. Fushat kthehen sapo mbyllet ai.
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
  // Raundi i ri hapet me llogaritësin gati (zgjedhje e pronarit): pikët e
  // mbrëmjes dalin nga rregulli, jo nga koka, prandaj rruga e shpeshtë nuk ka
  // pse të kërkojë një prekje para çdo raundi. Redaktimi nis i mbyllur — atje
  // fushat mbajnë tashmë pikët e shënuara, dhe prekja është pikërisht ajo që
  // duhet rregulluar me dorë.
  const [hapurLlogaritesi, hapLlogaritesin] = useState(
    llogaritesi && !fillestare,
  );
  // Pikët e fundit të llogaritura rrinë këtu e jo brenda llogaritësit, sepse
  // butoni që i ruan rri te rreshti i ngjitur poshtë — përndryshe do të binte
  // nën fund të ekranit pikërisht kur lojtarët janë shumë.
  const [piketELlogaritura, caktoPiketELlogaritura] = useState<Record<
    string,
    number
  > | null>(null);
  // Sa raunde janë ruajtur nga ky bllok. Hyn te `key`-i i llogaritësit, që ai
  // të nisë nga e para pas çdo ruajtjeje: dora e raundit të kaluar nuk ka pse
  // të rrijë e shkruar te raundi tjetër.
  const [ruajtje, caktoRuajtjen] = useState(0);
  const fushat = useRef<(HTMLInputElement | null)[]>([]);

  // Kur ndërrohet raundi që redaktohet, fushat duhet të ndjekin atë e jo të
  // mbajnë pikët e raundit të mëparshëm. Bashkë me to kthehet edhe llogaritësi
  // te gjendja e vet e nisjes: hapur për raund të ri, mbyllur për redaktim.
  useEffect(() => {
    caktoVlerat(nga(players, fillestare));
    hapLlogaritesin(llogaritesi && !fillestare);
    // Pikët e llogaritësit nuk zbrazen këtu: ky efekt shkon pas atij të
    // llogaritësit të sapomontuar, dhe do t'i fshinte pikërisht pikët që ai
    // sapo i njoftoi — butoni «Ruaj» do të mbetej i fikur. Me llogaritësin e
    // mbyllur ato nuk lexohen fare, dhe hapja e tij i njofton prapë.
  }, [players, fillestare, roundNumber, llogaritesi]);

  // Me llogaritësin hapur ruhen pikët e tij, prandaj edhe përmbledhja e
  // rreshtit tregon ato: një „shuma 0" nën një llogaritës që thotë 110 do të
  // ishte dy të vërteta njëherësh.
  const piket = hapurLlogaritesi ? piketELlogaritura : null;
  const ngaFushat = players.filter((p) => numri(vlerat[p]) !== null).length;
  const shuma = piket
    ? Object.values(piket).reduce((s, n) => s + n, 0)
    : players.reduce((s, p) => s + (numri(vlerat[p]) ?? 0), 0);
  const sashenuar = piket ? players.length : ngaFushat;
  const shume = players.length >= SHUME;

  /**
   * Ruan raundin.
   *
   * `rifokuso` vjen vetëm nga tastiera. Pas një prekjeje të butonit fokusi rri
   * ku është: hapja e tastierës pa u kërkuar do ta mbulonte gjysmën e ekranit
   * pikërisht kur përdoruesi po shikon renditjen e sapondryshuar.
   */
  function ruaj(rifokuso = false) {
    // Numërohen fushat e jo `sashenuar`: me llogaritësin hapur ai i numëron
    // pikët e tij, dhe «Next» i tastierës do të ruante një raund të zbrazët.
    if (ngaFushat === 0) return;

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
    caktoPiketELlogaritura(null);

    if (fillestare) {
      // Redaktimi mbaron me ruajtjen — ekrani kthehet te lista.
      hapLlogaritesin(false);
      return;
    }

    caktoVlerat(nga(players, null));
    // Llogaritësi mbetet i hapur për raundin tjetër, por nis nga e para:
    // `ruajtje` e ndërron `key`-in e tij, prandaj dora e sapofutur nuk mbetet
    // e shkruar aty. Numri i raundit vjen nga baza pak më vonë — pa këtë,
    // llogaritësi do të tregonte raundin e kaluar deri atëherë.
    caktoRuajtjen((n) => n + 1);
    if (rifokuso) fushat.current[0]?.focus();
  }

  /** Mbyll llogaritësin dhe harron pikët e tij — ato vlejnë sa rri i hapur. */
  function mbyllLlogaritesin() {
    hapLlogaritesin(false);
    caktoPiketELlogaritura(null);
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
      {/*
        Me llogaritësin hapur, fushat hiqen nga ekrani.

        Ato janë të zbrazëta gjithsesi — pikët po dalin nga llogaritësi — dhe
        gjashtë rreshta të zbrazët mbi të vetëm e shtynin poshtë atë që po
        përdoret. Nuk fshihen: «Mbyll llogaritësin» i kthen ashtu si ishin, dhe
        «Vendosi te fushat» i kthen të mbushura. Vlerat e shkruara rrinë te
        gjendja, prandaj asgjë nuk humbet sa rri i hapur.
      */}
      {!hapurLlogaritesi && (
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
      )}

      {ndihma && !hapurLlogaritesi && <p className="ndihma">{ndihma}</p>}

      {hapurLlogaritesi && (
        <Llogaritesi
          key={`${roundNumber}:${ruajtje}`}
          players={players}
          onPike={caktoPiketELlogaritura}
          onVendos={(pike) => {
            caktoVlerat(
              Object.fromEntries(
                players.map((p) => [p, String(pike[p] ?? 0)]),
              ) as Vlerat,
            );
            mbyllLlogaritesin();
          }}
        />
      )}

      <div className="futja__fund">
        <p className="futja__shuma">
          <span>
            {sashenuar} nga {players.length} të shënuar
          </span>
          <span>
            shuma <strong>{shuma}</strong>
          </span>
        </p>

        {/*
          Një buton i vetëm «Ruaj», për të dyja rrugët.

          Me llogaritësin hapur ai ruan pikët e tij; i mbyllur, ato të fushave.
          Dy butona me të njëjtat fjalë — një i gjallë brenda llogaritësit, një
          i fikur këtu — lexoheshin si prishje, dhe ai i llogaritësit binte nën
          fund të ekranit sapo lojtarët ishin shumë.
        */}
        <div className="veprimet">
          <button
            type="button"
            className="buton buton--kryesor"
            onClick={() => (piket ? dergo(piket) : ruaj())}
            disabled={sashenuar === 0}
          >
            <Ikona emri="ruaj" />
            {fillestare ? 'Ruaj ndryshimet' : `Ruaj raundin ${roundNumber}`}
          </button>

          {llogaritesi && (
            <button
              type="button"
              className="buton"
              aria-expanded={hapurLlogaritesi}
              onClick={() =>
                hapurLlogaritesi ? mbyllLlogaritesin() : hapLlogaritesin(true)
              }
            >
              <Ikona emri="llogaritesi" />
              {hapurLlogaritesi ? 'Mbyll llogaritësin' : 'Llogaritësi'}
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
 */
function Llogaritesi({
  players,
  onPike,
  onVendos,
}: {
  players: string[];
  /**
   * Pikët e llogaritura, sa herë ndryshojnë — butoni «Ruaj» rri jashtë.
   *
   * `null` sa kohë mbyllësi nuk është zgjedhur: pa të nuk ka raund, dhe butoni
   * jashtë mbetet i fikur.
   */
  onPike: (pike: Record<string, number> | null) => void;
  /** I shkruan pikët te fushat, që të preken me dorë para ruajtjes. */
  onVendos: (pike: Record<string, number>) => void;
}) {
  /*
   * Nis pa mbyllës të zgjedhur, me kërkesë të pronarit.
   *
   * Më parë hapej me të parin e listës. Meqë llogaritësi tani hapet vetë te
   * raundi i ri (pika 3), ai emër dilte i zgjedhur pa e prekur kush — dhe një
   * prekje e vetme e «Ruaj raundin» e shkruante raundin te lojtari i gabuar.
   * Zgjedhja është pyetja e parë e raundit, prandaj rri e papërgjigjur derisa
   * të përgjigjet.
   */
  const [mbyllesi, caktoMbyllesin] = useState('');
  const [lloji, caktoLlojin] = useState<LlojiMbylljes>('normal');
  const [duart, caktoDuart] = useState<Record<string, string>>({});
  /*
   * A rrinë të shpalosur emrat.
   *
   * Pa mbyllës rrinë gjithmonë — ajo është pyetja e parë e raundit. Pas tij
   * mblidhen, dhe hapen sërish vetëm me «Ndërro». Gjendja nuk ka nevojë të
   * pastrohet mes raundeve: `key`-i i llogaritësit mban numrin e raundit, pra
   * çdo raund i ri e ringre këtë bllok nga e para.
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
    () =>
      mbyllesi ? piketERaundit(players, mbyllesi, lloji, gjendjet) : null,
    [players, mbyllesi, lloji, gjendjet],
  );

  // Pikët ngjiten lart sa herë ndryshojnë, sepse butoni që i ruan rri te
  // rreshti i ngjitur i futjes e jo këtu.
  useEffect(() => {
    onPike(pike);
  }, [pike, onPike]);

  const tjeret = players.filter((player) => player !== mbyllesi);

  return (
    <div className="llogaritesi">
      {/*
        Mbyllësi zgjidhet me emra të prekshëm, jo me listë të shpalosur.

        Një `<select>` i kërkonte dy prekje — hape, zgjidhe — dhe lista e tij
        vizatohet nga sistemi: shkronja të vogla, të tjera nga faqja, dhe te
        tableta një kolonë e ngushtë në mes të ekranit. Emrat janë dy deri tetë
        dhe hyjnë të gjithë në ekran, prandaj rrinë të shkruar: një prekje, caku
        mbi 2.75rem, dhe kush mbylli duket pa hapur asgjë.

        Por emrat e shkruar e kanë një çmim që lista nuk e kishte: lartësia rritet
        me lojtarët. Me tetë veta te telefoni ata do të zinin katër rreshta mbi
        duart — pikërisht ajo që i kushton bllokut më të përdorur të mbrëmjes
        (pika 6). Prandaj dy gjëra e mbajnë të shkurtër:

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
      <div className="fusha">
        <span className="fusha__etiketa">Kush e mbylli, dhe si</span>
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
        Mbyllësi merr {lloji === 'hant' ? '−40' : '−20'}. Lëre bosh atë që s’hapi —
        merr {lloji === 'hant' ? '200' : '100'}.
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

      {/*
        Shuma nuk përsëritet këtu: rreshti i ngjitur poshtë e tregon tashmë,
        dhe dy herë i njëjti numër njëri mbi tjetrin lexohet si dy numra.
        Mbetet ajo që ai rresht nuk e thotë — kush mbylli, dhe sa merr.
      */}
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
        Dalja e dytë, dhe vetë rregulli i pikës 3.

        «Ruaj» rri te rreshti i ngjitur poshtë dhe i merr këto pika ashtu si
        janë — raundi që bie brenda rregullit mbaron me një prekje. Ky buton i
        shkruan te fushat pa i ruajtur, dhe mbetet rruga e raundit që rregulli
        nuk e mbulon: mbyllësi −50 te fleta e vjetër, ose një pikë që duhet
        prekur me dorë para se të ruhet.
      */}
      <button
        type="button"
        className="buton buton--i-plote"
        onClick={() => pike && onVendos(pike)}
        disabled={!pike}
      >
        <Ikona emri="llogaritesi" />
        Vendosi te fushat
      </button>
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
