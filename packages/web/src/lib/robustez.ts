/**
 * O que nenhuma calculadora do Brasil tem: PROVA DE ESTRESSE da decisão.
 *
 * Em vez de um número único, o veredito é re-testado em 8 mundos
 * alternativos (CDI para cima/baixo, depreciação mais dura, juros piores,
 * rodagem maior…). Se "assinar" continua na frente na maioria deles, a
 * recomendação é robusta — e o cliente ouve isso ANTES de perguntar
 * "mas e se…". Cada cenário roda o motor completo, nada é estimado.
 */
import { DEPREC, simular, type ParametrosSimulacao } from '@godrive/engine';
import { CATALOGO, TX_REF } from '@godrive/engine';

export type Cenario = 'assinar' | 'aVista' | 'financiar';

export interface MundoAlternativo {
  nome: string;
  detalhe: string;
  vencedor: Cenario;
  /** distância do assinar para o melhor (0 quando assinar vence) */
  gapAssinar: number;
}

export interface Robustez {
  base: Cenario;
  mundos: MundoAlternativo[];
  vitoriasAssinar: number;
  total: number;
}

function vencedorDe(p: ParametrosSimulacao): { v: Cenario; gap: number } {
  const r = simular(p);
  const custos: [Cenario, number][] = [
    ['assinar', r.assinar.custo],
    ['aVista', r.aVista.custo],
    ['financiar', r.financiar.custo],
  ];
  custos.sort((a, b) => a[1] - b[1]);
  const melhor = custos[0]!;
  const assinar = r.assinar.custo;
  return { v: melhor[0], gap: assinar - melhor[1] };
}

export function provaDeEstresse(p: ParametrosSimulacao): Robustez {
  const curvaDura = DEPREC['mercado']!.c;
  const curvaSuave = DEPREC['fipe']!.c;
  const mundos: [string, string, Partial<ParametrosSimulacao>][] = [
    ['CDI despenca', 'juro básico 3 p.p. menor', { cdi: Math.max(2, p.cdi - 3) }],
    ['CDI dispara', 'juro básico 3 p.p. maior', { cdi: p.cdi + 3 }],
    ['Carro desvaloriza rápido', 'curva de mercado (20% no 1º ano)', { curva: curvaDura }],
    ['Carro segura o preço', 'curva FIPE suave (13% no 1º ano)', { curva: curvaSuave }],
    ['Financiamento mais caro', 'juros +0,5 p.p. ao mês', { jurosFinMes: p.jurosFinMes + 0.5 }],
    ['Financiamento promocional', 'juros −0,5 p.p. ao mês', { jurosFinMes: Math.max(0.4, p.jurosFinMes - 0.5) }],
    ['Você roda 50% mais', 'excedente de km entra na conta', { kmMes: Math.round(p.kmMes * 1.5) }],
    ['Manutenção surpreende', 'custo de oficina 40% maior', { manutAno: p.manutAno * 1.4 }],
  ];
  const base = vencedorDe(p).v;
  const resultado: MundoAlternativo[] = mundos.map(([nome, detalhe, delta]) => {
    const { v, gap } = vencedorDe({ ...p, ...delta });
    return { nome, detalhe, vencedor: v, gapAssinar: gap };
  });
  return {
    base,
    mundos: resultado,
    vitoriasAssinar: resultado.filter((m) => m.vencedor === 'assinar').length,
    total: resultado.length,
  };
}

/* ─────────── posição da mensalidade no mercado real ─────────── */

export interface PosicaoMercado {
  /** mensalidade como % do valor do carro ao mês */
  razao: number;
  /** mediana do mercado (mensalidades publicadas/praticadas) */
  mediana: number;
  /** 0–100: % do catálogo de referência com razão MAIOR que a sua */
  maisBarataQue: number;
}

export function posicaoMercado(preco: number, mensalidade: number): PosicaoMercado | null {
  if (!(preco > 0) || !(mensalidade > 0)) return null;
  const razao = (mensalidade / preco) * 100;
  const razoes = CATALOGO.map((v) => (v.m / v.p) * 100).sort((a, b) => a - b);
  const piores = razoes.filter((r) => r > razao).length;
  return {
    razao,
    mediana: TX_REF,
    maisBarataQue: Math.round((piores / razoes.length) * 100),
  };
}
