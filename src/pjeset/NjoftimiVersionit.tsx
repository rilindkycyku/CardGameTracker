import { useState } from 'react';
import { kaloTeIRi, useVersionIRi } from '../instalimi.ts';
import { Ikona } from '../ikonat.tsx';

export function NjoftimiVersionit() {
  const kaVersion = useVersionIRi();
  const [mbyllur, caktoMbyllur] = useState(false);

  if (!kaVersion || mbyllur) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="njoftim-versioni"
    >
      <div className="njoftim-versioni__trupi">
        <Ikona emri="info" />
        <div className="njoftim-versioni__teksti">
          <strong>Ka një version më të ri të Tavolinës!</strong>
          <span>Përditësojeni tani për të marrë ndryshimet më të fundit.</span>
        </div>
      </div>
      <div className="njoftim-versioni__veprimet">
        <button type="button" className="buton buton--kryesor buton--vogel" onClick={kaloTeIRi}>
          <Ikona emri="ruaj" />
          Përditëso tani
        </button>
        <button type="button" className="buton buton--vogel" onClick={() => caktoMbyllur(true)}>
          Më vonë
        </button>
      </div>
    </aside>
  );
}
