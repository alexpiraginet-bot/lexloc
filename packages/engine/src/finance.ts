/**
 * Utilitários financeiros puros.
 * Fórmulas idênticas ao motor original (paridade verificada por golden tests).
 */

import { MACRO } from './constants.js';

/**
 * Alíquota de IR regressivo sobre renda fixa — Lei 11.033/2004.
 *
 * A lei conta DIAS CORRIDOS. O motor original convertia mês em 30 dias, e
 * isso punha 12 meses em 360 e 24 meses em 720 — exatamente no teto da faixa
 * anterior, nos dois casos. Na vida real são 365 e 730 dias, que caem na
 * faixa seguinte: 17,5% e 15%, não 20% e 17,5%.
 *
 * O erro não era neutro. Alíquota alta demais reduz o rendimento líquido do
 * dinheiro investido, o que barateia artificialmente o cenário que imobiliza
 * capital no mês zero — comprar à vista. Numa varredura de 1650 cenários do
 * catálogo, 27 vereditos viravam de "assinar" para "comprar" só por causa
 * disto.
 *
 * 365/12 = 30,4167 dias por mês é a conversão honesta para um modelo de
 * granularidade mensal.
 */
export function aliquotaIR(meses: number): number {
  const dias = (meses * 365) / 12;
  if (dias <= 180) return 0.225;
  if (dias <= 360) return 0.2;
  if (dias <= 720) return 0.175;
  return 0.15;
}

/** Taxa mensal líquida de IR a partir de uma taxa anual bruta (%). */
export function taxaMensalLiquida(anualPct: number, meses: number): number {
  const mBruta = Math.pow(1 + anualPct / 100, 1 / 12) - 1;
  return mBruta * (1 - aliquotaIR(meses));
}

/** Taxa anual (%) → taxa mensal equivalente (fração). */
export function taxaMensal(anualPct: number): number {
  return Math.pow(1 + anualPct / 100, 1 / 12) - 1;
}

/** Parcela pela Tabela Price. `iMes` é fração (0.0197 = 1,97% a.m.). */
export function parcelaPrice(pv: number, iMes: number, n: number): number {
  if (n <= 0) return 0;
  if (iMes === 0) return pv / n;
  return (pv * iMes) / (1 - Math.pow(1 + iMes, -n));
}

/** Saldo devedor após k parcelas pagas (Price). */
export function saldoDevedor(pv: number, iMes: number, n: number, k: number): number {
  if (k >= n) return 0;
  const p = parcelaPrice(pv, iMes, n);
  if (iMes === 0) return pv - p * k;
  return pv * Math.pow(1 + iMes, k) - (p * (Math.pow(1 + iMes, k) - 1)) / iMes;
}

/**
 * IOF de financiamento PF: 0,38% fixo + 0,0082% ao dia sobre o principal,
 * com o componente diário limitado a 3,00% e o total ao teto de 3,38%.
 * (Decreto 6.306/2007, redação vigente em 2026.)
 *
 * Mesma conversão de dias do IR acima, e pelo mesmo motivo: o decreto conta
 * DIAS CORRIDOS. Muda todo prazo de ATÉ 12 meses — de 13 em diante os dois
 * jeitos batem no teto de 365 e dão o mesmo número. Em R$ 100 mil
 * financiados: 6 meses vai de R$ 1.856 para R$ 1.876, e 12 meses de
 * R$ 3.332 para R$ 3.373.
 *
 * O erro é pequeno, mas apontava para o mesmo lado que o do IR: subestimar
 * o custo do financiamento é jogar contra a assinatura. E deixar duas
 * contagens de dias diferentes no mesmo arquivo é como o primeiro erro
 * sobreviveu tanto tempo — por isso esta também foi corrigida.
 */
export function iofFinanciamento(valorFinanciado: number, prazoMeses: number): number {
  const dias = Math.min((prazoMeses * 365) / 12, 365);
  let pct = MACRO.iofFixo + Math.min(MACRO.iofDia * dias, 3.0);
  pct = Math.min(pct, MACRO.iofTeto);
  return (valorFinanciado * pct) / 100;
}

/**
 * Valor do veículo no mês m, aplicando a curva anual de depreciação
 * de forma composta mês a mês. Do último ano da curva em diante,
 * repete a última taxa.
 */
export function valorNoMes(
  precoInicial: number,
  curva: readonly number[],
  m: number,
): number {
  let v = precoInicial;
  let restante = m;
  for (let ano = 0; restante > 0; ano++) {
    const taxa = (curva[Math.min(ano, curva.length - 1)] ?? 0) / 100;
    const mesesNoAno = Math.min(12, restante);
    v = v * Math.pow(1 - taxa, mesesNoAno / 12);
    restante -= mesesNoAno;
  }
  return v;
}
