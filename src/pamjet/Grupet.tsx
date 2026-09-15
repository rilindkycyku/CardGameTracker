/**
 * Ekrani i parë — grupet.
 *
 * Një grup është shoqëria që luan bashkë: „Brigj", „Mendja". Emrat e lojtarëve
 * futen një herë dhe pastaj vetëm zgjidhen, sepse shkrimi i gjashtë emrave në
 * telefon para çdo loje do të ishte pengesa që e lë aplikacionin pa përdorur.
 *
 * Grupi nuk i takon një loje të vetme: e njëjta shoqëri luan bridzh një mbrëmje
 * e pishpirik tjetrën, prandaj çka luhet zgjidhet te loja e jo te grupi.
 */

import { useRef, useState } from 'react';

import { emratERinj } from '../fusha.ts';
import { RADHA, rregullat } from '../lojerat.ts';
import { Ikona, ShenjaEFaqes } from '../ikonat.tsx';
import { useNgarko } from '../ngarko.ts';
import { Fundfaqja } from '../pjeset/Fundfaqja.tsx';
import { PanelaEKopjes } from '../pjeset/PanelaEKopjes.tsx';
import { grupet as lexoGrupet, numriILojerave, shtoGrup } from '../ruajtja.ts';
import { shko } from '../rruga.ts';
import { eshteKonfiguruar, eshteLidhur, lexoKonfigurimin } from '../supabase.ts';

export function Grupet() {
  const { te_dhenat, rifresko } = useNgarko(async () => {
    const lista = await lexoGrupet();
    const sa = await numriILojerave(lista.map((g) => g.id));
    return lista.map((grupi) => ({ grupi, lojera: sa[grupi.id] ?? 0 }));
  }, []);

  const [hapurFormen, hapFormen] = useState(false);

  return (
    <div className="faqja faqja--gjere">
      <header className="kreu">
        <ShenjaEFaqes />
        <div>
          <p className="kreu__mbi">Lojërat e tavolinës</p>
          <h1 className="kreu__titull">Pikët e mbrëmjes</h1>
          <p className="kreu__meta">
            {/*
              Dikur këtu rrinte «Fiton totali më i vogël». Ajo ishte e vërtetë
              sa kohë kishte vetëm bridzh e magarec; me pishpirikun në tavolinë
              nuk është më, dhe një rregull i shkruar gabi te faqja e parë është
              më keq se asnjë. Rregulli i secilës lojë rri atje ku zgjidhet çka
              luhet, dhe këtu mbetet vetëm se cilat janë.
            */}
            <span className="etiketa">
              <Ikona emri="info" />
              {RADHA.map((lloji) => rregullat(lloji).emri).join(' · ')}
            </span>
          </p>
        </div>
      </header>

      {/*
        Ekrani i gjerë i ndan dy pyetjet e tij: te cili grup po luhet sonte,
        dhe ku shkojnë këto të dhëna. E para është arsyeja pse hapet faqja,
        prandaj rri majtas dhe e merr gjerësinë; tri të tjerat preken një herë
        — kur dikush hyn si shikues, kur nxirret një kopje, kur lidhet
        projekti — dhe te telefoni rrinë poshtë saj ashtu si më parë.
      */}
      <div className="shtyllat">
        <div className="shtyllat__kryesore">
          <section>
            <h2 className="titull-seksioni">
              <Ikona emri="grupi" />
              Grupet
              {te_dhenat && (
                <span className="titull-seksioni__numri">{te_dhenat.length}</span>
              )}
            </h2>

            {te_dhenat === null ? (
              <p className="ndihma">Duke lexuar…</p>
            ) : te_dhenat.length === 0 ? (
              <div className="zbrazet">
                <p className="zbrazet__titull">Ende asnjë grup</p>
                <p>
                  Nis me shoqërinë me të cilën luan më shpesh. Emrat futen një herë;
                  para çdo loje zgjedh vetëm kush erdhi.
                </p>
                <button
                  type="button"
                  className="buton buton--kryesor"
                  onClick={() => hapFormen(true)}
                >
                  <Ikona emri="shto" />
                  Krijo grupin e parë
                </button>
              </div>
            ) : (
              <ul className="lista lista--dysh">
                {te_dhenat.map(({ grupi, lojera }) => (
                  <li key={grupi.id}>
                    <a className="njesi" href={`#/grupi/${grupi.id}`}>
                      <span className="njesi__shkronja njesi__shkronja--hapur">
                        {grupi.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="njesi__krye">
                        <span className="njesi__emri">{grupi.name}</span>
                        <span className="njesi__meta">
                          {grupi.playerNames.length}{' '}
                          {grupi.playerNames.length === 1 ? 'lojtar' : 'lojtarë'} ·{' '}
                          {lojera} {lojera === 1 ? 'lojë' : 'lojëra'}
                        </span>
                      </span>
                      <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {te_dhenat !== null && te_dhenat.length > 0 && !hapurFormen && (
              <div className="veprimet" data-hapesire="lart">
                <button
                  type="button"
                  className="buton"
                  onClick={() => hapFormen(true)}
                >
                  <Ikona emri="shto" />
                  Grup i ri
                </button>
              </div>
            )}

            {hapurFormen && (
              <FormaEGrupit
                onRuajtur={() => {
                  hapFormen(false);
                  rifresko();
                }}
                onAnulo={() => hapFormen(false)}
              />
            )}
          </section>
        </div>

        <div className="shtyllat__anesore">
          {/*
            Hyrja e atij që vjen vetëm të shikojë.
            Pa të, kodi i shkurtër do të ishte i papërdorshëm pa skanuar një kod QR —
            dhe pikërisht diktimi me zë është arsyeja pse ai kod ekziston.
          */}
          <details className="detaje">
            <summary className="detaje__krye">
              <span>Bashkohu me kod</span>
              <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
            </summary>

            <div className="detaje__trupi">
              <p className="ndihma">
                Nëse dikush tjetër mban pikët dhe ta dha një kod, hyr me të dhe
                shiko pikët drejtpërdrejt.
              </p>

              <div className="veprimet" data-hapesire="lart">
                <a className="buton" href="#/bashkohu">
                  <Ikona emri="drejtperdrejt" />
                  Fut kodin
                </a>
              </div>
            </div>
          </details>

          <PanelaEKopjes onKthyer={rifresko} />

          {/*
            Sinkronizimi rri krah kopjes rezervë sepse është e njëjta pyetje e parë —
            «ku shkojnë këto të dhëna kur ndërroj telefonin?» — dhe dy përgjigje të
            ndryshme: skedari, ose projekti yt (pika 19). Mbetet lidhje e jo panel:
            ngritja bëhet një herë, kurse ky ekran hapet çdo mbrëmje.
          */}
          <LidhjaESinkronizimit />
        </div>
      </div>

      <Fundfaqja plote />
    </div>
  );
}

/**
 * Hyrja te sinkronizimi, me gjendjen e shkruar krah saj.
 *
 * Teksti ndryshon me gjendjen sepse pyetja ndryshon: kush nuk e ka lidhur ende
 * pyet «çka është kjo», kurse kush e ka lidhur pyet «a po punon». Konfigurimi
 * lexohet te vizatimi e nuk mbahet te gjendja — ky ekran rivizatohet gjithsesi
 * pas çdo shkrimi, dhe një kopje e dytë do të dilte jashtë sinkronie pikërisht
 * pas shkëputjes.
 */
function LidhjaESinkronizimit() {
  const konfigurimi = lexoKonfigurimin();
  const lidhur = eshteLidhur(konfigurimi);
  const konfiguruar = eshteKonfiguruar(konfigurimi);

  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="reja" />
        Sinkronizimi
      </h2>

      <div className="kartela">
        <p className="ndihma">
          {lidhur
            ? `Mbrëmjet shkojnë te projekti yt Supabase (${konfigurimi.email}).`
            : konfiguruar
              ? 'Projekti është i shkruar, por sesioni ka skaduar — hyr sërish.'
              : 'Nëse i do të njëjtat mbrëmje te dy telefona, lidhi me një projekt Supabase që e zotëron vetë. Pa këtë, gjithçka rri vetëm te ky shfletues.'}
        </p>

        <div className="veprimet">
          <a className="buton" href="#/sinkronizimi">
            <Ikona emri="sinkronizimi" />
            {lidhur ? 'Shiko gjendjen' : 'Lidh një projekt'}
          </a>
        </div>
      </div>
    </section>
  );
}

/** Forma e grupit të ri: emri dhe lojtarët, radha ashtu si futen. */
function FormaEGrupit({
  onRuajtur,
  onAnulo,
}: {
  onRuajtur: (id: number) => void;
  onAnulo: () => void;
}) {
  const [emri, caktoEmrin] = useState('');
  const [lojtaret, caktoLojtaret] = useState<string[]>([]);
  const [iRi, caktoTeRin] = useState('');
  const fusha = useRef<HTMLInputElement>(null);

  /** Pranon një emër ose të gjithë njëherësh: «alfa, beta, gama, delta». */
  function shtoLojtarin() {
    const rinjte = emratERinj(iRi, lojtaret);
    caktoTeRin('');
    // Fokusi mbetet te fusha, që emri tjetër të shkruhet pa u prekur ekrani.
    fusha.current?.focus();
    if (rinjte.length > 0) caktoLojtaret((l) => [...l, ...rinjte]);
  }

  async function ruaj() {
    const pastruar = emri.trim();
    if (!pastruar || lojtaret.length < 2) return;

    const id = await shtoGrup(pastruar, lojtaret);
    onRuajtur(id);
    shko(`/grupi/${id}`);
  }

  return (
    <div className="kartela kartela--kryesore" data-hapesire="lart">
      <h3 className="titull-seksioni">
        <Ikona emri="shto" />
        Grup i ri
      </h3>

      <div className="futja">
        <label className="fusha">
          <span className="fusha__etiketa">Emri i grupit</span>
          <input
            type="text"
            value={emri}
            placeholder="Brigj"
            onChange={(e) => caktoEmrin(e.target.value)}
          />
        </label>

        <div className="fusha">
          <span className="fusha__etiketa">Lojtarët</span>
          <div className="rreshti-fushave">
            <div className="fusha">
              <input
                ref={fusha}
                type="text"
                value={iRi}
                placeholder="alfa, beta, gama…"
                onChange={(e) => caktoTeRin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    shtoLojtarin();
                  }
                }}
                aria-label="Emrat e lojtarëve"
              />
            </div>
            <button
              type="button"
              className="buton"
              onClick={shtoLojtarin}
              disabled={!iRi.trim()}
            >
              <Ikona emri="shto" />
              Shto
            </button>
          </div>
          <p className="ndihma">
            Shkruaji të gjithë njëherësh, të ndarë me presje. Radha ruhet —
            kështu ulen rreth tavolinës. Duhen së paku dy.
          </p>
        </div>

        {lojtaret.length > 0 && (
          <ul className="shenjat">
            {lojtaret.map((lojtari) => (
              <li className="shenja-lojtari" key={lojtari}>
                {lojtari}
                <button
                  type="button"
                  className="shenja-lojtari__hiq"
                  onClick={() =>
                    caktoLojtaret((l) => l.filter((x) => x !== lojtari))
                  }
                  aria-label={`Hiq ${lojtari}`}
                >
                  <Ikona emri="anulo" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="veprimet">
          <button
            type="button"
            className="buton buton--kryesor"
            onClick={ruaj}
            disabled={!emri.trim() || lojtaret.length < 2}
          >
            <Ikona emri="ruaj" />
            Krijo grupin
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
