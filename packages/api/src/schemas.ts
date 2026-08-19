/**
 * Validação de entrada da API com zod.
 * Limites generosos porém finitos: a API nunca deve virar DoS de CPU
 * (meses ≤ 120, buscas binárias limitadas etc.).
 */
import { z } from 'zod';

export const simulacaoSchema = z.object({
  preco: z.number().positive().max(5_000_000),
  meses: z.number().int().min(1).max(120),
  kmMes: z.number().min(0).max(20_000),
  ipca: z.number().min(0).max(50),
  cdi: z.number().min(0).max(60),
  cdiPct: z.number().min(0).max(200),
  curva: z.array(z.number().min(0).max(60)).min(1).max(10),
  ipvaAliq: z.number().min(0).max(10),
  licenc: z.number().min(0).max(5_000),
  seguroPct: z.number().min(0).max(20),
  manutAno: z.number().min(0).max(60_000),
  pneusJogo: z.number().min(0).max(30_000),
  kmPneu: z.number().min(0).max(120_000),
  emplacamento: z.number().min(0).max(20_000),
  mensalidade: z.number().min(0).max(60_000),
  reajusteAssinatura: z.number().min(0).max(50),
  kmFranquia: z.number().min(0).max(20_000),
  kmExcedente: z.number().min(0).max(50),
  entradaPct: z.number().min(0).max(100),
  jurosFinMes: z.number().min(0).max(15),
  prazoFin: z.number().int().min(1).max(120),
  tipoEnergia: z.enum(['comb', 'ev']),
  kml: z.number().positive().max(60),
  kwh100: z.number().positive().max(80),
  precoComb: z.number().min(0).max(30),
  precoKwh: z.number().min(0).max(10),
  incluirEnergia: z.boolean(),
  ipvaIsento: z.boolean(),
});

export const pjSchema = z.object({
  regime: z.enum(['real', 'presumido', 'simples']),
  anoInicio: z.number().int().min(2025).max(2040),
  ref: z.object({
    cbs: z.number().min(0).max(30),
    ibs: z.number().min(0).max(40),
  }),
  irpjCsll: z.number().min(0).max(60),
  /** faturamento anual da empresa — define a alíquota marginal de IRPJ e o teto do Simples */
  faturamentoAnual: z.number().min(0).max(1e12),
  /** margem de lucro sobre o faturamento, em % — base do lucro tributável */
  margemPct: z.number().min(0).max(100),
  /**
   * Simples que optou pelo regime regular de IBS/CBS (LC 214/2025).
   * Só quem optou credita o imposto embutido na locação.
   */
  simplesHibrido: z.boolean(),
});

export const simulatePJBody = z.object({
  simulacao: simulacaoSchema,
  pj: pjSchema,
});

export type SimulacaoInput = z.infer<typeof simulacaoSchema>;
export type PJInput = z.infer<typeof pjSchema>;
