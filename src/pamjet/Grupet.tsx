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
import { kaloTeIRi, useVersionIRi } from '../instalimi.ts';
import { RADHA, rregullat } from '../lojerat.ts';
import { Ikona, ShenjaEFaqes, Zemra } from '../ikonat.tsx';
import { useNgarko } from '../ngarko.ts';
import { CelesiINdricimit } from '../pjeset/Ndricimi.tsx';
import { PanelaEKopjes } from '../pjeset/PanelaEKopjes.tsx';
import { grupet as lexoGrupet, numriILojerave, shtoGrup } from '../ruajtja.ts';
import { shko } from '../rruga.ts';
import { VERSIONI } from '../versioni.ts';

export function Grupet() {
  const { te_dhenat, rifresko } = useNgarko(async () => {
    const lista = await lexoGrupet();
    const sa = await numriILojerave(lista.map((g) => g.id));
    return lista.map((grupi) => ({ grupi, lojera: sa[grupi.id] ?? 0 }));
  }, []);

  const [hapurFormen, hapFormen] = useState(false);
  const versionIRi = useVersionIRi();

  return (
    <div className="faqja">
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
        Versioni rri te ekrani i parë, jo te ndonjë ekran „rreth".

        Aplikacioni hapet nga një adresë dhe telefoni e mban në cache: pa një
        numër të dukshëm, «e ke të renë apo të vjetrën?» nuk i përgjigjet dot
        kush. Numri është ai i `package.json`-it, prandaj ajo që thotë ekrani
        dhe ajo që u ndërtua janë i njëjti varg.
      */}
      <footer className="fundfaqja">
        <p>
          Bërë me <Zemra /> për tavolinën.
        </p>
        <p className="fundfaqja__versioni">v{VERSIONI}</p>

        {/*
          Çka del nga pajisja, thënë aty ku lexohet.

          Të dhënat rrinë te telefoni (pika 1), dhe kjo nuk ndryshoi: te matja
          shkon emri i rrugës — «/loja/[id]», «/shiko» — e asgjë tjetër. Rri
          krah versionit sepse ky është i vetmi vend ku faqja flet për vete, dhe
          sepse një fjali e fshehur te një ekran „rreth" nuk e lexon kush.
        */}
        <p className="fundfaqja__matja">
          Numërohen vetëm hapjet e faqes — pa pikë, pa emra, pa lojëra.
        </p>

        {/*
          Ndriçimi: ajo që e thotë telefoni, ose ajo që e thotë tavolina.

          Tema e ndiqte vetëm pajisjen, dhe kjo e mbulonte mbrëmjen — ora kur
          luhet e ka telefonin në terr gjithsesi. Ajo që nuk e mbulonte ishte
          dita, dhe një telefon nuk e ndërron temën e vet për një aplikacion.
          Rri këtu sepse këtu rrinë zgjedhjet që bëhen një herë.
        */}
        <CelesiINdricimit />

        {/*
          Versioni i ri rri e pret, dhe nuk merr pushtetin pa u thënë.

          Faqja tani ruhet te koshi i punëtorit të shërbimit, prandaj ajo që
          hapet është ajo që u ruajt — edhe kur serveri ka diçka më të re. Pa
          këtë rresht, «e ke të renë apo të vjetrën?» do të kthehej pikërisht
          pyetja që numri i versionit erdhi ta mbyllte. Rri këtu sepse këtu rri
          numri, dhe shfaqet vetëm kur ka vërtet çka të merret.
        */}
        {versionIRi && (
          <p className="fundfaqja__i-ri">
            <span>Ka një version më të ri.</span>
            <button type="button" className="buton buton--vogel" onClick={kaloTeIRi}>
              <Ikona emri="ruaj" />
              Merre tani
            </button>
          </p>
        )}
      </footer>
    </div>
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
