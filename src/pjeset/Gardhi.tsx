/**
 * Gardhi: çka shihet kur diçka bie, dhe kur baza nuk hapet dot.
 *
 * React-i e zbraz tërë pemën kur një komponent hedh gabim gjatë vizatimit. Pa
 * një kufi, pasoja është faqja e bardhë — pa tekst, pa buton, pa asnjë shenjë se
 * të dhënat janë ende aty. Kjo është forma më e keqe e dështimit që mund të ketë
 * ky aplikacion, sepse pikërisht në atë çast njeriu mendon se e humbi mbrëmjen:
 * pikët rrinë te IndexedDB-ja dhe nuk i preku asgjë, por ekrani nuk e thotë.
 *
 * Prandaj kjo kartelë thotë tri gjëra me radhë: të dhënat nuk humbën, ja si
 * provohet sërish, dhe ja çka tha gabimi — e fundit sepse pa të një raportim
 * është «nuk punon».
 *
 * Kufiri duhet të jetë klasë: `componentDidCatch` nuk ka hook që e zëvendëson.
 * Është i vetmi vend te projekti ku shkruhet një klasë komponenti, dhe rri këtu
 * i vetëm pikërisht për atë arsye.
 */

import { Component, useEffect, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

import { Ikona } from '../ikonat.tsx';
import { onBllokimBaze } from '../ruajtja.ts';

type Gjendja = { gabimi: Error | null };

export class Gardhi extends Component<{ children: ReactNode }, Gjendja> {
  override state: Gjendja = { gabimi: null };

  static getDerivedStateFromError(gabimi: Error): Gjendja {
    return { gabimi };
  }

  override componentDidCatch(gabimi: Error, info: ErrorInfo): void {
    // Konsola është i vetmi vend ku mbetet gjurma e plotë: asgjë nuk dërgohet
    // askund (pika 1), dhe pa këtë rresht një raport i përdoruesit do të vinte
    // pa asnjë varg për t'u kërkuar te kodi.
    console.error('Tavolina — gabim i papritur:', gabimi, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.gabimi) return this.props.children;

    return (
      <div className="faqja">
        <section>
          <h2 className="titull-seksioni">
            <Ikona emri="kujdes" />
            Diçka nuk shkoi
          </h2>

          <div className="kartela kartela--kryesore">
            <p className="njoftim njoftim--mire">
              <Ikona emri="ruaj" />
              <span>
                <strong>Pikët janë të sigurta.</strong> Gjithçka rri te ky
                shfletues dhe nuk u prek — ky është vetëm ekrani që nuk u vizatua
                dot.
              </span>
            </p>

            <p className="ndihma">
              Provo ta rifreskosh faqen. Nëse bie sërish te i njëjti vend, kthehu
              te grupet dhe nxirr një kopje rezervë para se të vazhdosh.
            </p>

            <div className="veprimet">
              <button
                type="button"
                className="buton buton--kryesor"
                onClick={() => window.location.reload()}
              >
                <Ikona emri="sinkronizimi" />
                Rifresko faqen
              </button>
              <a
                className="buton"
                href="#/"
                onClick={() => this.setState({ gabimi: null })}
              >
                <Ikona emri="kthehu" />
                Kthehu te grupet
              </a>
            </div>

            <details className="detaje detaje--brenda">
              <summary className="detaje__krye">
                <span>Çka tha gabimi</span>
                <Ikona emri="shigjeta" klasa="ikona detaje__shigjeta" />
              </summary>
              <div className="detaje__trupi">
                <p className="ndihma">{this.state.gabimi.message}</p>
              </div>
            </details>
          </div>
        </section>
      </div>
    );
  }
}

/**
 * «Një skedë tjetër e mban bazën hapur.»
 *
 * Ndodh një herë të vetme: kur një version i ri i aplikacionit do ta migrojë
 * bazën dhe një skedë e vjetër rri hapur diku. Pa këtë rresht faqja mbetet te
 * «Duke lexuar…» pa fund, dhe shkaku — një skedë tjetër, ndoshta te një dritare
 * tjetër — nuk merret me mend kurrë.
 */
export function NjoftimiIBazes() {
  const [bllokuar, cakto] = useState(false);
  useEffect(() => onBllokimBaze(cakto), []);

  if (!bllokuar) return null;

  return (
    <div className="faqja">
      <p className="njoftim njoftim--kujdes">
        <Ikona emri="kujdes" />
        <span>
          Baza pret një skedë tjetër të Tavolinës që rri hapur me një version më
          të vjetër. Mbylle atë skedë — ose të gjitha, dhe hape faqen sërish.
        </span>
      </p>
    </div>
  );
}
