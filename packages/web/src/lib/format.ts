/** Formatação e parsing pt-BR. */

const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function reais(v: number): string {
  return 'R$ ' + nf0.format(Math.round(v));
}
export function reais2(v: number): string {
  return 'R$ ' + nf2.format(v);
}
export function n0(v: number): string {
  return nf0.format(Math.round(v));
}
export function n2(v: number): string {
  return nf2.format(v);
}

/** "1.500,50" → 1500.5 · tolerante a lixo. */
export function parseNum(s: string): number {
  const limpo = String(s)
    .trim()
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.\-]/g, '');
  const v = parseFloat(limpo);
  return Number.isFinite(v) ? v : 0;
}
