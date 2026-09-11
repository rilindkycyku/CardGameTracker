/**
 * «Unë jam …» — rreshti i matricës, për atë që po e shikon.
 *
 * Matrica N×N e thotë të tërën, dhe rri poshtë ashtu si ishte. Por kush skanon
 * kodin nuk ka ardhur ta studiojë: ai do vetëm rreshtin e vet — *sa i dal unë
 * kujt*. Me gjashtë lojtarë ai rresht kërkohet mes tridhjetë e gjashtë qelizave,
 * në një ekran telefoni, në gjysmëdritë.
 *
 * Zgjedhja rri vetëm te gjendja e komponentit. Rrugët e ndarjes nuk shkruajnë
 * asgjë askund (pika 7), dhe një emër i mbajtur mend do të ishte shkelja e parë
 * e asaj — për një faqe që hapet një herë e mbyllet, nuk vlen as sa kostoja e të
 * shpjeguarit.
 *
 * Ngjyrat nuk përsëriten këtu. Te matrica pozitivja është jeshile sepse ashtu e
 * kishte fleta origjinale, dhe legjenda e shpjegon; po ajo ngjyrë mbi një
 * rresht që thotë «ti i jep» do të lexohej si fitore. Prandaj drejtimi thuhet
 * me fjalë, dhe numri mbetet i zi.
 */

import { useState } from 'react';

import { shlyerjaEVetes } from '../llogaritjet.ts';
import { FJALA, fjalaE, mbushur } from '../magareci.ts';
import type { RreshtiRenditjes } from '../tipet.ts';
import { Ikona } from '../ikonat.tsx';

export function Vetja({
  rreshtat,
  totalet,
  magarec,
}: {
  /** Renditja e gatshme, që emrat të dalin sipas vendit. */
  rreshtat: RreshtiRenditjes[];
  totalet: Record<string, number>;
  magarec: boolean;
}) {
  const [vetja, caktoVeten] = useState<string | null>(null);

  const emrat = rreshtat.map((rreshti) => rreshti.player);
  if (emrat.length < 2) return null;

  const imi = rreshtat.find((rreshti) => rreshti.player === vetja) ?? null;
  const pari = rreshtat[0]!;

  return (
    <section>
      <h2 className="titull-seksioni">
        <Ikona emri="sy" />
        Unë jam
      </h2>

      <div className="zgjedhesi" role="group" aria-label="Zgjidh veten">
        {emrat.map((emri) => (
          <button
            type="button"
            key={emri}
            className="zgjedhesi__njesi"
            aria-pressed={emri === vetja}
            onClick={() => caktoVeten((tani) => (tani === emri ? null : emri))}
          >
            {emri}
          </button>
        ))}
      </div>

      {!imi ? (
        <p className="ndihma" data-hapesire="lart">
          Prek emrin tënd, dhe rreshti yt del i veçuar: vendi, sa je larg të
          parit
          {magarec ? ', dhe sa shkronja të kanë mbetur.' : ', dhe kujt sa i del.'}
        </p>
      ) : magarec ? (
        <VetjaEMagarecit imi={imi} pari={pari} />
      ) : (
        <VetjaEBridzhit imi={imi} pari={pari} emrat={emrat} totalet={totalet} />
      )}
    </section>
  );
}

/** Vendi, largësia nga i pari, dhe shlyerja kundrejt secilit. */
function VetjaEBridzhit({
  imi,
  pari,
  emrat,
  totalet,
}: {
  imi: RreshtiRenditjes;
  pari: RreshtiRenditjes;
  emrat: string[];
  totalet: Record<string, number>;
}) {
  const rreshti = shlyerjaEVetes(imi.player, emrat, totalet);
  const paguan = rreshti.filter((n) => n.diferenca > 0);
  const marrin = rreshti.filter((n) => n.diferenca < 0);
  const neto = rreshti.reduce((shuma, n) => shuma + n.diferenca, 0);

  return (
    <div className="kartela vetja" data-hapesire="lart">
      <p className="vetja__krye">
        <span className="vetja__vendi">{imi.rank}</span>
        <span className="vetja__emri">{imi.player}</span>
        <span className="vetja__totali">{imi.total}</span>
      </p>

      <p className="ndihma">
        {imi.total === pari.total
          ? 'Ti prin — fiton totali më i vogël.'
          : `Je ${imi.total - pari.total} pikë prapa, dhe prin ${pari.player}.`}
      </p>

      <ul className="vetja__lista">
        {rreshti.map((njesi) => (
          <li className="vetja__njesi" key={njesi.player}>
            <span className="vetja__kujt">{njesi.player}</span>
            {/*
              „ti i jep" e jo „i jep": emri i rreshtit rri kryefjalë, prandaj
              një „i jep" i vetëm lexohet sikur ta jepte ai — pikërisht e
              kundërta. Me „ti" të shkruar, të dy drejtimet lexohen njësoj
              qartë: «delta — ti i jep 146», «beta — të jep 143».
            */}
            <span className="vetja__drejtimi">
              {njesi.diferenca > 0
                ? 'ti i jep'
                : njesi.diferenca < 0
                  ? 'të jep'
                  : 'baras'}
            </span>
            <span className="vetja__sasia">{Math.abs(njesi.diferenca)}</span>
          </li>
        ))}
      </ul>

      <p className="ndihma" data-hapesire="lart">
        {paguan.length === 0
          ? 'Nuk i del asnjërit — ti je vetëm ana që merr.'
          : marrin.length === 0
            ? 'Të gjithë janë para teje.'
            : null}{' '}
        {neto > 0
          ? `Gjithsej i del ${neto} mbi tërë tavolinën.`
          : neto < 0
            ? `Gjithsej të vjen ${-neto} nga tërë tavolina.`
            : 'Gjithsej del baras.'}{' '}
        Matrica e plotë rri poshtë.
      </p>
    </div>
  );
}

/** Shkronjat e mia, dhe sa më kanë mbetur deri te fjala. */
function VetjaEMagarecit({
  imi,
  pari,
}: {
  imi: RreshtiRenditjes;
  pari: RreshtiRenditjes;
}) {
  const marre = Math.max(0, Math.trunc(imi.total));
  const mbetur = Math.max(0, FJALA.length - marre);

  return (
    <div className="kartela vetja" data-hapesire="lart">
      <p className="vetja__krye">
        <span className="vetja__vendi">{imi.rank}</span>
        <span className="vetja__emri">{imi.player}</span>
        <span className="vetja__totali">{fjalaE(marre) || '—'}</span>
      </p>

      <p className="ndihma">
        {mbushur(marre)
          ? `E mbushe fjalën ${FJALA} — mbrëmja të doli ty.`
          : mbetur === 1
            ? 'Të ka mbetur një shkronjë e vetme.'
            : `Të kanë mbetur ${mbetur} shkronja deri te ${FJALA}.`}
        {imi.total !== pari.total &&
          !mbushur(marre) &&
          ` Më larg fundit është ${pari.player}, me ${imi.total - pari.total} ${
            imi.total - pari.total === 1 ? 'shkronjë' : 'shkronja'
          } më pak.`}
      </p>
    </div>
  );
}
