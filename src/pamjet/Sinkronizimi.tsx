/**
 * Ekrani i sinkronizimit — projekti i vetë përdoruesit, dhe asgjë tjetër.
 *
 * Është i vetmi vend ku pikët e një shoqërie dalin nga pajisja si të dhëna e jo
 * si fotografi (pika 19), prandaj rregulli i pikës 7 vlen këtu më fort se kudo
 * tjetër: **çka del nga pajisja thuhet para butonit**, dhe thuhet atje ku
 * lexohet. Asgjë këtu nuk niset vetvetiu para se dikush ta ketë lidhur një
 * projekt me dorë.
 *
 * Ekrani ka katër gjendje, dhe secila ka një pyetje të vetme:
 *
 *   1. **I palidhur** — «çfarë është kjo, dhe a e dua?»
 *   2. **I lidhur, projekt i pangritur** — «ekzekutoje skriptin te projekti yt».
 *   3. **I lidhur, pa vendim** — «cila anë është e vërteta?» Derisa të
 *      përgjigjet, kjo pajisje vetëm lexon.
 *   4. **I lidhur e i vendosur** — gjendja, pajisjet, dhe veprimet e rrezikshme.
 */

import { useCallback, useEffect, useState } from 'react';

import { Ikona } from '../ikonat.tsx';
import { MENYRAT } from '../bashkimi.ts';
import type { Menyra, PermbledhjaELidhjes } from '../bashkimi.ts';
import { pajisjaKjo, riemertoPajisjen } from '../pajisja.ts';
import {
  EMRAT_E_STOREVE,
  dukeSinkronizuar,
  fshiCloud,
  harroPajisjen,
  lexoPajisjet,
  numeroCloud,
  numeroLokal,
  permbledhjaLidhjes,
  riparoTani,
  sinkronizo,
} from '../sinkronizimi.ts';
import type { PajisjaERegjistruar } from '../sinkronizimi.ts';
import {
  SQL_INSTALIMI,
  dil,
  eshteKonfiguruar,
  eshteLidhur,
  gjendjaSkemes,
  hyr,
  kontrolloCelesin,
  lexoKonfigurimin,
  linkuSkriptit,
  normalizoUrl,
  onKonfigurim,
  pastroKonfigurimin,
  regjistrohu,
  ruajKonfigurimin,
  verifikoSkemen,
} from '../supabase.ts';
import type { GjendjaESkemes, Konfigurimi } from '../supabase.ts';

/** Fjala që duhet shkruar para një veprimi që nuk kthehet prapa. */
const FJALA_E_POHIMIT = 'ZEVENDESO';

function gabimiIThene(err: unknown): string {
  return (err as Error)?.message || 'Diçka nuk shkoi.';
}

/** `{ groups: 2, games: 31 }` → «2 grupe · 31 lojëra». */
function meFjale(numrat: Record<string, number>): string {
  const pjeset = Object.entries(numrat)
    .filter(([, sa]) => sa > 0)
    .map(([store, sa]) => `${sa} ${EMRAT_E_STOREVE[store] ?? store}`);
  return pjeset.length > 0 ? pjeset.join(' · ') : 'asgjë';
}

function kurShqip(iso: string | null): string {
  if (!iso) return 'kurrë';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'kurrë';
  const dy = (n: number) => String(n).padStart(2, '0');
  return `${dy(d.getDate())}.${dy(d.getMonth() + 1)}.${d.getFullYear()} ${dy(d.getHours())}:${dy(
    d.getMinutes(),
  )}`;
}

export function Sinkronizimi() {
  const [konfigurimi, caktoKonfigurimin] = useState<Konfigurimi>(lexoKonfigurimin);
  useEffect(() => onKonfigurim(caktoKonfigurimin), []);

  const lidhur = eshteLidhur(konfigurimi);
  const konfiguruar = eshteKonfiguruar(konfigurimi);

  return (
    <div className="faqja">
      <header className="kreu">
        <a className="buton buton--ikona" href="#/" aria-label="Kthehu te grupet">
          <Ikona emri="kthehu" />
        </a>
        <div>
          <p className="kreu__mbi">Tavolina</p>
          <h1 className="kreu__titull">Sinkronizimi</h1>
          <p className="kreu__meta">
            <span className="etiketa">
              <Ikona emri="reja" />
              {lidhur ? konfigurimi.email || 'I lidhur' : 'I palidhur'}
            </span>
          </p>
        </div>
      </header>

      {!lidhur ? (
        <Lidhja konfiguruar={konfiguruar} />
      ) : (
        <Puna konfigurimi={konfigurimi} />
      )}
    </div>
  );
}

/* ── 1. I palidhur ──────────────────────────────────────────────────────── */

function Lidhja({ konfiguruar }: { konfiguruar: boolean }) {
  const ruajtur = lexoKonfigurimin();
  const [url, caktoUrl] = useState(ruajtur.url);
  const [celesi, caktoCelesin] = useState(ruajtur.anonKey);
  const [email, caktoEmail] = useState(ruajtur.email);
  const [fjalekalimi, caktoFjalekalimin] = useState('');
  const [pune, caktoPunen] = useState(false);
  const [gabimi, caktoGabimin] = useState<string | null>(null);
  const [mesazhi, caktoMesazhin] = useState<string | null>(null);

  async function nis(krijo: boolean) {
    caktoGabimin(null);
    caktoMesazhin(null);

    const adresa = normalizoUrl(url);
    if (!adresa) {
      caktoGabimin('Adresa e projektit nuk lexohet — kopjoje nga Supabase → Settings → API.');
      return;
    }
    const kontrolli = kontrolloCelesin(celesi);
    if (!kontrolli.ok) {
      caktoGabimin(kontrolli.gabimi);
      return;
    }

    caktoPunen(true);
    try {
      if (krijo) {
        const { konfirmim } = await regjistrohu({
          email,
          password: fjalekalimi,
          url: adresa,
          anonKey: kontrolli.vlera,
        });
        if (konfirmim) {
          caktoMesazhin(
            'Llogaria u krijua. Supabase të dërgoi një email konfirmimi — hape atë link, pastaj kthehu këtu dhe shtyp «Hyr».',
          );
        }
      } else {
        await hyr({ email, password: fjalekalimi, url: adresa, anonKey: kontrolli.vlera });
      }
    } catch (err) {
      caktoGabimin(gabimiIThene(err));
    } finally {
      caktoPunen(false);
      caktoFjalekalimin('');
    }
  }

  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="reja" />
        Mbrëmjet te më shumë se një telefon
      </h2>

      <div className="kartela kartela--kryesore">
        <p className="ndihma">
          Tavolina nuk ka server. Nëse i do të njëjtat mbrëmje te telefoni dhe te
          tableti, sjell <strong>projektin tënd</strong> Supabase: baza është e
          jotja, llogaria ekziston vetëm brenda saj, dhe asgjë nuk kalon nga
          ndonjë server i këtij aplikacioni — sepse nuk ka.
        </p>

        {/*
          Çka del nga pajisja, thënë para butonit — kushti i njëjtë si te mënyra
          me kod (pika 7). Kush e lexon këtë e di saktësisht se çka po pranon;
          kush nuk e lexon nuk e ka prekur butonin gjithsesi.
        */}
        <p className="njoftim njoftim--kujdes">
          <Ikona emri="kujdes" />
          <span>
            Me këtë të ndezur, grupet, lojërat dhe raundet — emrat dhe pikët —
            shkruhen te baza që ti e zotëron. Kopja rezervë (pika e parë e ekranit
            të parë) mbetet aty ku ishte dhe nuk zëvendësohet nga kjo.
          </span>
        </p>

        <div className="futja">
          <label className="fusha">
            <span className="fusha__etiketa">Adresa e projektit</span>
            <input
              type="url"
              inputMode="url"
              autoComplete="off"
              value={url}
              placeholder="abcdefghij.supabase.co"
              onChange={(e) => caktoUrl(e.target.value)}
            />
          </label>

          <label className="fusha">
            <span className="fusha__etiketa">Çelësi publik</span>
            <input
              type="text"
              autoComplete="off"
              value={celesi}
              placeholder="sb_publishable_… ose anon public"
              onChange={(e) => caktoCelesin(e.target.value)}
            />
            <p className="ndihma">
              Ai publiku, jo ai sekreti. Çelësi sekret nuk pranohet këtu me
              qëllim: ai i anashkalon rregullat e sigurisë dhe nuk rri kurrë te
              një shfletues.
            </p>
          </label>

          <label className="fusha">
            <span className="fusha__etiketa">Email</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="username"
              value={email}
              onChange={(e) => caktoEmail(e.target.value)}
            />
          </label>

          <label className="fusha">
            <span className="fusha__etiketa">Fjalëkalimi</span>
            <input
              type="password"
              autoComplete="current-password"
              value={fjalekalimi}
              onChange={(e) => caktoFjalekalimin(e.target.value)}
            />
          </label>

          <div className="veprimet">
            <button
              type="button"
              className="buton buton--kryesor"
              disabled={pune}
              onClick={() => void nis(false)}
            >
              <Ikona emri="drejtperdrejt" />
              Hyr
            </button>
            <button type="button" className="buton" disabled={pune} onClick={() => void nis(true)}>
              <Ikona emri="shto" />
              Krijo llogari
            </button>
          </div>
        </div>

        {gabimi && (
          <p className="njoftim njoftim--gabim">
            <Ikona emri="kujdes" />
            <span>{gabimi}</span>
          </p>
        )}
        {mesazhi && !gabimi && (
          <p className="njoftim njoftim--mire">
            <Ikona emri="info" />
            <span>{mesazhi}</span>
          </p>
        )}
      </div>

      <details className="detaje">
        <summary className="detaje__krye">
          <span>Si ngrihet një projekt</span>
          <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
        </summary>
        <div className="detaje__trupi">
          <ol className="hapat">
            <li>
              Hap <code>supabase.com</code>, krijo një projekt falas dhe prit sa
              të ngrihet.
            </li>
            <li>
              Te <strong>Settings → API</strong> merr adresën e projektit dhe
              çelësin publik, dhe ngjiti më sipër.
            </li>
            <li>
              Shtyp «Krijo llogari» me një email e fjalëkalim që do t'i përdorësh
              te të gjitha pajisjet.
            </li>
            <li>
              Pastaj këtu del një buton që e hap skriptin SQL te projekti yt —
              një prekje, dhe «Run».
            </li>
          </ol>
        </div>
      </details>

      {konfiguruar && (
        <div className="veprimet" data-hapesire="lart">
          <button
            type="button"
            className="buton buton--rrezik"
            onClick={() => pastroKonfigurimin()}
          >
            <Ikona emri="fshi" />
            Harroje projektin
          </button>
        </div>
      )}
    </section>
  );
}

/* ── 2–4. I lidhur ──────────────────────────────────────────────────────── */

function Puna({ konfigurimi }: { konfigurimi: Konfigurimi }) {
  const [skema, caktoSkemen] = useState<GjendjaESkemes | null>(null);
  const [gabimi, caktoGabimin] = useState<string | null>(null);
  const [pune, caktoPunen] = useState(false);

  const lexoSkemen = useCallback(async () => {
    try {
      caktoSkemen(await gjendjaSkemes());
      caktoGabimin(null);
    } catch (err) {
      caktoGabimin(gabimiIThene(err));
    }
  }, []);

  useEffect(() => {
    void lexoSkemen();
  }, [lexoSkemen]);

  async function verifiko() {
    caktoPunen(true);
    caktoGabimin(null);
    try {
      await verifikoSkemen(0);
      await lexoSkemen();
    } catch (err) {
      caktoGabimin(gabimiIThene(err));
    } finally {
      caktoPunen(false);
    }
  }

  // Derisa projekti të mos e ketë tabelën, asnjë nga blloqet e tjera nuk ka çka
  // të tregojë: çdo lexim i tyre do të dështonte me të njëjtin gabim.
  if (skema?.mungon || skema?.perditeso) {
    return (
      <section>
        <h2 className="titull-seksioni">
          <Ikona emri="llogaritesi" />
          {skema.mungon ? 'Projekti pret skriptin' : 'Projekti kërkon përditësim'}
        </h2>

        <div className="kartela kartela--kryesore">
          <p className="ndihma">
            {skema.mungon
              ? 'Tabela nuk ekziston ende. Skripti e krijon atë bashkë me rregullin e sigurisë që bën që rreshtat e tu t’i shohë vetëm llogaria jote.'
              : `Projekti është te migrimi ${skema.versioni}; ky version i aplikacionit pret ${skema.iFundit}.`}
          </p>

          <ul className="lista">
            {skema.pezull.map((m) => (
              <li className="njesi" key={m.versioni}>
                <span className="njesi__shkronja">{m.versioni}</span>
                <span className="njesi__krye">
                  <span className="njesi__emri">{m.emri}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="veprimet">
            <a
              className="buton buton--kryesor"
              href={linkuSkriptit(konfigurimi.url)}
              target="_blank"
              rel="noreferrer"
            >
              <Ikona emri="ndaj" />
              Hap skriptin te projekti
            </a>
            <button type="button" className="buton" disabled={pune} onClick={() => void verifiko()}>
              <Ikona emri="ruaj" />
              E ekzekutova
            </button>
          </div>

          <p className="ndihma">
            Lidhja e hap SQL Editor-in tënd me skriptin brenda; mbetet vetëm
            «Run». Përsëritja nuk prish gjë. Nëse dashte ta shohësh i pari:
          </p>
          <textarea className="kodi-fusha" readOnly rows={6} value={SQL_INSTALIMI} />
        </div>

        {gabimi && (
          <p className="njoftim njoftim--gabim">
            <Ikona emri="kujdes" />
            <span>{gabimi}</span>
          </p>
        )}

        <Rrezikshme />
      </section>
    );
  }

  if (konfigurimi.lidhjaVerifikuar === false) return <Vendimi />;

  return (
    <>
      <Gjendja konfigurimi={konfigurimi} />
      <Pajisjet />
      <Rrezikshme />
    </>
  );
}

/* ── 3. Cila anë është e vërteta ────────────────────────────────────────── */

function Vendimi() {
  const [permbledhja, caktoPermbledhjen] = useState<PermbledhjaELidhjes | null>(null);
  const [gabimi, caktoGabimin] = useState<string | null>(null);
  const [zgjedhur, caktoZgjedhjen] = useState<Menyra | null>(null);
  const [fjala, caktoFjalen] = useState('');
  const [pune, caktoPunen] = useState(false);

  useEffect(() => {
    permbledhjaLidhjes()
      .then((p) => {
        caktoPermbledhjen(p);
        caktoZgjedhjen(p.rekomandimi);
      })
      .catch((err: unknown) => caktoGabimin(gabimiIThene(err)));
  }, []);

  async function zbato() {
    if (!zgjedhur) return;
    caktoPunen(true);
    caktoGabimin(null);
    try {
      await sinkronizo({ menyra: zgjedhur });
    } catch (err) {
      caktoGabimin(gabimiIThene(err));
    } finally {
      caktoPunen(false);
    }
  }

  const kerkonFjale = zgjedhur === MENYRAT.DERGO || zgjedhur === MENYRAT.MERR;
  const gati = Boolean(zgjedhur) && (!kerkonFjale || fjala.trim() === FJALA_E_POHIMIT);

  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="kujdes" />
        Kjo pajisje sapo u lidh
      </h2>

      <div className="kartela kartela--kryesore">
        <p className="ndihma">
          Derisa ta thuash ti, kjo pajisje vetëm <strong>lexon</strong> nga
          projekti dhe nuk dërgon asgjë. Kjo është rrjeta që ndalon një telefon të
          sapopastruar t'i shkruajë mbrëmjet e veta të zbrazëta mbi historikun e
          një viti.
        </p>

        {permbledhja === null ? (
          <p className="ndihma">Duke numëruar të dyja anët…</p>
        ) : (
          <>
            <div className="permbledhja">
              <div className="permbledhja__fakte">
                <p>
                  <strong>Kjo pajisje:</strong> {meFjale(permbledhja.lokalSipasStorit)}
                </p>
                <p>
                  <strong>Te projekti:</strong> {meFjale(permbledhja.cloudSipasStorit)}
                </p>
                <p>
                  Të njëjta te të dyja: {permbledhja.teNjejta} · vetëm këtu:{' '}
                  {permbledhja.vetemLokale} · vetëm atje: {permbledhja.vetemCloud}
                </p>
              </div>
            </div>

            <div className="menyrat">
              <div className="celesi celesi--rrjet">
                <button
                  type="button"
                  className="celesi__njesi"
                  aria-pressed={zgjedhur === MENYRAT.BASHKO}
                  onClick={() => caktoZgjedhjen(MENYRAT.BASHKO)}
                >
                  Bashkoji
                </button>
                <button
                  type="button"
                  className="celesi__njesi"
                  aria-pressed={zgjedhur === MENYRAT.MERR}
                  onClick={() => caktoZgjedhjen(MENYRAT.MERR)}
                >
                  Merr projektin
                </button>
                <button
                  type="button"
                  className="celesi__njesi"
                  aria-pressed={zgjedhur === MENYRAT.DERGO}
                  onClick={() => caktoZgjedhjen(MENYRAT.DERGO)}
                >
                  Dërgo këtë pajisje
                </button>
              </div>

              <p className="ndihma">
                {zgjedhur === MENYRAT.BASHKO &&
                  'Të dyja anët mbijetojnë: aty ku i njëjti regjistër rri te të dyja, fiton ai i projektit; çka e ka vetëm kjo pajisje ngarkohet.'}
                {zgjedhur === MENYRAT.MERR &&
                  'Gjithçka që mban ky shfletues zëvendësohet me atë të projektit. Nuk kthehet prapa — nxirre një kopje rezervë së pari.'}
                {zgjedhur === MENYRAT.DERGO &&
                  'Gjithçka që mban ky shfletues shkon lart, mbi atë që mban projekti. Nuk kthehet prapa.'}
              </p>

              {kerkonFjale && (
                <label className="fusha">
                  <span className="fusha__etiketa">
                    Shkruaj „{FJALA_E_POHIMIT}" për ta pohuar
                  </span>
                  <input
                    type="text"
                    autoComplete="off"
                    value={fjala}
                    onChange={(e) => caktoFjalen(e.target.value)}
                  />
                </label>
              )}

              <div className="veprimet">
                <button
                  type="button"
                  className="buton buton--kryesor"
                  disabled={!gati || pune}
                  onClick={() => void zbato()}
                >
                  <Ikona emri="sinkronizimi" />
                  Vazhdo
                </button>
              </div>
            </div>
          </>
        )}

        {gabimi && (
          <p className="njoftim njoftim--gabim">
            <Ikona emri="kujdes" />
            <span>{gabimi}</span>
          </p>
        )}
      </div>
    </section>
  );
}

/* ── 4. Gjendja e përditshme ────────────────────────────────────────────── */

function Gjendja({ konfigurimi }: { konfigurimi: Konfigurimi }) {
  const [pune, caktoPunen] = useState(false);
  const [gabimi, caktoGabimin] = useState<string | null>(null);
  const [mesazhi, caktoMesazhin] = useState<string | null>(null);
  const [numrat, caktoNumrat] = useState<{ lokal: number; cloud: number | null } | null>(null);

  const numero = useCallback(async () => {
    try {
      caktoNumrat({ lokal: await numeroLokal(), cloud: await numeroCloud() });
    } catch {
      // Numrat janë kontekst, jo sinkronizim: një lexim i dështuar nuk ka pse ta
      // mbushë ekranin me gabim kur butoni kryesor punon gjithsesi.
      caktoNumrat(null);
    }
  }, []);

  useEffect(() => {
    void numero();
  }, [numero]);

  async function tani(ngaFillimi = false) {
    caktoPunen(true);
    caktoGabimin(null);
    caktoMesazhin(null);
    try {
      const dala = await sinkronizo({ ngaFillimi });
      caktoMesazhin(`U morën ${dala.marre}, u dërguan ${dala.derguar}.`);
      await numero();
    } catch (err) {
      caktoGabimin(gabimiIThene(err));
    } finally {
      caktoPunen(false);
    }
  }

  async function riparo() {
    caktoPunen(true);
    caktoGabimin(null);
    try {
      const sa = await riparoTani();
      caktoMesazhin(
        sa === 0
          ? 'Projekti i ka të gjitha — s’kishte çka riparohej.'
          : `${sa} regjistra u shënuan sërish për dërgim.`,
      );
      if (sa > 0) await sinkronizo();
      await numero();
    } catch (err) {
      caktoGabimin(gabimiIThene(err));
    } finally {
      caktoPunen(false);
    }
  }

  const fundit = konfigurimi.fundit;

  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="sinkronizimi" />
        Gjendja
      </h2>

      <div className="kartela kartela--kryesore">
        <div className="permbledhja__fakte">
          <p>
            <strong>Hera e fundit:</strong> {kurShqip(fundit?.kur ?? null)}
            {fundit && !fundit.gabim
              ? ` — u morën ${fundit.marre}, u dërguan ${fundit.derguar}`
              : ''}
          </p>
          {numrat && (
            <p>
              <strong>Regjistra:</strong> {numrat.lokal} këtu ·{' '}
              {numrat.cloud === null ? '—' : numrat.cloud} te projekti
            </p>
          )}
          <p>
            <strong>Automatik:</strong>{' '}
            {konfigurimi.automatik === false ? 'i fikur' : 'i ndezur'}
          </p>
        </div>

        {fundit?.gabim && (
          <p className="njoftim njoftim--gabim">
            <Ikona emri="kujdes" />
            <span>{fundit.gabim}</span>
          </p>
        )}

        <div className="veprimet">
          <button
            type="button"
            className="buton buton--kryesor"
            disabled={pune || dukeSinkronizuar()}
            onClick={() => void tani()}
          >
            <Ikona emri="sinkronizimi" />
            Sinkronizo tani
          </button>
          <button type="button" className="buton" disabled={pune} onClick={() => void riparo()}>
            <Ikona emri="ruaj" />
            Kontrollo e riparo
          </button>
          <button type="button" className="buton" disabled={pune} onClick={() => void tani(true)}>
            <Ikona emri="ngarko" />
            Nga fillimi
          </button>
        </div>

        <p className="ndihma">
          Sinkronizimi bie vetvetiu pak sekonda pas çdo raundi të ruajtur, kur
          kthehesh te skeda, dhe kur rrjeti kthehet. Çelësi poshtë e fik atë:
          atëherë asgjë nuk del nga pajisja veç kur e shtyp «Sinkronizo tani».
        </p>

        <CelesiIAutomatikut automatik={konfigurimi.automatik !== false} />

        {gabimi && (
          <p className="njoftim njoftim--gabim">
            <Ikona emri="kujdes" />
            <span>{gabimi}</span>
          </p>
        )}
        {mesazhi && !gabimi && (
          <p className="njoftim njoftim--mire">
            <Ikona emri="info" />
            <span>{mesazhi}</span>
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * Çelësi i dy gjendjeve. Nuk mban gjendje të veten: `ruajKonfigurimin` i njofton
 * dëgjuesit, dhe `Sinkronizimi` rivizatohet me vlerën e re — pra ajo që shihet
 * është gjithmonë ajo që u shkrua vërtet.
 */
function CelesiIAutomatikut({ automatik }: { automatik: boolean }) {
  return (
    <div className="celesi celesi--vogel">
      <button
        type="button"
        className="celesi__njesi"
        aria-pressed={automatik}
        onClick={() => ruajKonfigurimin({ automatik: true })}
      >
        Vetvetiu
      </button>
      <button
        type="button"
        className="celesi__njesi"
        aria-pressed={!automatik}
        onClick={() => ruajKonfigurimin({ automatik: false })}
      >
        Vetëm me dorë
      </button>
    </div>
  );
}

/* ── Pajisjet ───────────────────────────────────────────────────────────── */

function Pajisjet() {
  const [lista, caktoListen] = useState<PajisjaERegjistruar[] | null>(null);
  const [emri, caktoEmrin] = useState(() => pajisjaKjo().emri);

  const lexo = useCallback(() => {
    lexoPajisjet()
      .then(caktoListen)
      .catch(() => caktoListen([]));
  }, []);

  useEffect(lexo, [lexo]);

  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="telefoni" />
        Pajisjet
        {lista && <span className="titull-seksioni__numri">{lista.length}</span>}
      </h2>

      <div className="kartela">
        <p className="ndihma">
          I njëjti email hyn te të gjitha pajisjet, prandaj llogaria nuk e thotë
          dot cila e shkroi çka. Secila i vë vetes një emër, dhe ai emër udhëton
          me çdo rresht që dërgon.
        </p>

        <label className="fusha">
          <span className="fusha__etiketa">Emri i kësaj pajisjeje</span>
          <input
            type="text"
            value={emri}
            onChange={(e) => caktoEmrin(e.target.value)}
            onBlur={() => caktoEmrin(riemertoPajisjen(emri).emri)}
          />
        </label>

        {lista === null ? (
          <p className="ndihma">Duke lexuar…</p>
        ) : lista.length === 0 ? (
          <p className="ndihma">Asnjë pajisje nuk ka sinkronizuar ende.</p>
        ) : (
          <ul className="lista">
            {lista.map((p) => (
              <li className="njesi" key={p.id}>
                <span className={`njesi__shkronja${p.kjo ? ' njesi__shkronja--hapur' : ''}`}>
                  {p.emri.slice(0, 1).toUpperCase()}
                </span>
                <span className="njesi__krye">
                  <span className="njesi__emri">
                    {p.emri}
                    {p.kjo ? ' · kjo' : ''}
                  </span>
                  <span className="njesi__meta">
                    {kurShqip(p.sinkFundit)} · {p.rreshta} regjistra
                  </span>
                </span>
                {!p.kjo && (
                  <button
                    type="button"
                    className="buton buton--ikona"
                    aria-label={`Harro ${p.emri}`}
                    onClick={() => {
                      void harroPajisjen(p.id).then(lexo);
                    }}
                  >
                    <Ikona emri="fshi" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ── Veprimet që nuk kthehen prapa ──────────────────────────────────────── */

function Rrezikshme() {
  const [fjala, caktoFjalen] = useState('');
  const [pune, caktoPunen] = useState(false);
  const [gabimi, caktoGabimin] = useState<string | null>(null);

  async function zbraz() {
    caktoPunen(true);
    caktoGabimin(null);
    try {
      await fshiCloud();
      caktoFjalen('');
    } catch (err) {
      caktoGabimin(gabimiIThene(err));
    } finally {
      caktoPunen(false);
    }
  }

  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="kujdes" />
        Shkëputja
      </h2>

      <div className="kartela">
        <div className="veprimet">
          <button
            type="button"
            className="buton"
            onClick={() => {
              void dil();
            }}
          >
            <Ikona emri="anulo" />
            Dil nga llogaria
          </button>
          <button
            type="button"
            className="buton buton--rrezik"
            onClick={() => pastroKonfigurimin()}
          >
            <Ikona emri="fshi" />
            Harroje projektin
          </button>
        </div>

        <p className="ndihma">
          Të dyja e lënë bazën e kësaj pajisjeje krejt të paprekur, dhe po ashtu
          atë te projekti. E dyta harron vetëm adresën, çelësin dhe sesionin.
        </p>

        <details className="detaje detaje--brenda">
          <summary className="detaje__krye">
            <span>Zbraz kopjen te projekti</span>
            <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
          </summary>
          <div className="detaje__trupi">
            <p className="njoftim njoftim--kujdes">
              <Ikona emri="kujdes" />
              <span>
                Fshin çdo rresht që projekti mban për këtë llogari. Bazat e
                pajisjeve nuk preken — dhe pikërisht prandaj kjo pajisje do ta
                ngarkojë sërish të vetën te sinkronizimi tjetër. Nuk kthehet prapa.
              </span>
            </p>
            <label className="fusha">
              <span className="fusha__etiketa">Shkruaj „{FJALA_E_POHIMIT}"</span>
              <input
                type="text"
                autoComplete="off"
                value={fjala}
                onChange={(e) => caktoFjalen(e.target.value)}
              />
            </label>
            <div className="veprimet">
              <button
                type="button"
                className="buton buton--rrezik"
                disabled={pune || fjala.trim() !== FJALA_E_POHIMIT}
                onClick={() => void zbraz()}
              >
                <Ikona emri="fshi" />
                Zbraze
              </button>
            </div>
            {gabimi && (
              <p className="njoftim njoftim--gabim">
                <Ikona emri="kujdes" />
                <span>{gabimi}</span>
              </p>
            )}
          </div>
        </details>
      </div>
    </section>
  );
}
