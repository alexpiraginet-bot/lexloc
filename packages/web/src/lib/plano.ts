/**
 * Escolhe a linha certa da tabela oficial de planos para um par
 * (prazo da análise, km/mês) — e devolve os três valores que ela manda:
 * mensalidade, franquia e preço do km excedente.
 *
 * As regras, e por que são estas:
 *
 * · FAIXA DE KM: a menor franquia que cobre o que o cliente roda — é o que
 *   um vendedor cotaria. Quem roda mais que a maior faixa (2.500) fica na
 *   maior e paga excedente, que o motor já calcula sozinho via
 *   `kmFranquia`/`kmExcedente`.
 *
 * · PRAZO: o contrato só existe em 12/18/24 meses. A análise pode ir além
 *   (36/60): aí vale o preço de 24 — a mesma premissa de renovação ao
 *   mesmo preço que o app sempre fez quando só havia uma mensalidade.
 *   Análise de 18 para baixo arredonda para o degrau de cima mais próximo
 *   (13–18 → 18, ≤12 → 12): cotar 12 meses de contrato para uma análise de
 *   15 seria inventar um preço que a tabela não tem.
 */
import type { PlanoAssinatura } from '@godrive/engine';

export interface ValoresDoPlano {
  mensalidade: number;
  kmFranquia: number;
  kmExcedente: number;
}

export function planoDaTabela(
  pl: readonly PlanoAssinatura[] | undefined,
  meses: number,
  kmMes: number,
): ValoresDoPlano | null {
  if (!pl || pl.length === 0) return null;
  const faixa = pl.find((f) => f.km >= kmMes) ?? pl[pl.length - 1]!;
  const mensalidade = meses <= 12 ? faixa.m12 : meses <= 18 ? faixa.m18 : faixa.m24;
  return { mensalidade, kmFranquia: faixa.km, kmExcedente: faixa.exc };
}
