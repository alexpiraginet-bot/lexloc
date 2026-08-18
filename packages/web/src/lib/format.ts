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

/**
 * "1.500,50" → 1500.5 · tolerante a lixo.
 * Convenção pt-BR: vírgula é decimal. Ponto é milhar — EXCETO quando é
 * claramente decimal ("1.5", "2.75"): sem vírgula na entrada e com 1–2
 * dígitos após o único ponto, trata como decimal. Evita a armadilha de
 * "2.5" em seguro % virar 25.
 */
export function parseNum(s: string): number {
  let limpo = String(s)
    .trim()
    .replace(/\s/g, '')
    .replace(/[^0-9.,\-]/g, '');
  const temVirgula = limpo.includes(',');
  const pontos = (limpo.match(/\./g) ?? []).length;
  if (!temVirgula && pontos === 1 && /\.\d{1,2}$/.test(limpo)) {
    // "1.5" → decimal
  } else {
    limpo = limpo.replace(/\./g, '');
  }
  limpo = limpo.replace(',', '.');
  const v = parseFloat(limpo);
  return Number.isFinite(v) ? v : 0;
}
