/**
 * Rrugëtimi me hash.
 *
 * Një bibliotekë rrugëtimi do të ishte më shumë kod se vetë ekranet: janë katër
 * rrugë dhe asnjëra s'ka nevojë për ngarkim të vonuar apo për rrugë të futura.
 * Hash-i punon edhe kur faqja hapet nga një skedar ose nga një host pa rishkrim
 * rrugësh, dhe butoni «prapa» i telefonit funksionon vetvetiu.
 */

import { useEffect, useState } from 'react';

/** Rruga e çastit, gjithmonë me `/` në fillim. */
export function shtegu(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return hash.startsWith('/') ? hash : '/';
}

/** Rruga e çastit, e rifreskuar sa herë ndryshon hash-i. */
export function useRruga(): string {
  const [rruga, cakto] = useState(shtegu);

  useEffect(() => {
    const ndrysho = () => cakto(shtegu());
    window.addEventListener('hashchange', ndrysho);
    return () => window.removeEventListener('hashchange', ndrysho);
  }, []);

  return rruga;
}

/** Shkon te një rrugë. Kthimi bëhet nga vetë shfletuesi. */
export function shko(rruga: string): void {
  window.location.hash = rruga;
}

/**
 * Ndan rrugën në pjesë: `/grupi/12` → `['grupi', '12']`.
 * Pjesët e zbrazëta hiqen, që `/grupi/12/` të lexohet njësoj.
 */
export function pjeset(rruga: string): string[] {
  return rruga.split('/').filter(Boolean);
}

/** Numri i një pjese të rrugës, ose `null` nëse s'është numër. */
export function numri(pjesa: string | undefined): number | null {
  if (!pjesa) return null;
  const n = Number(pjesa);
  return Number.isInteger(n) && n > 0 ? n : null;
}
