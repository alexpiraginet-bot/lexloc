/**
 * Tipos do motor de cálculo.
 *
 * Convenções, herdadas do motor original e mantidas à risca:
 *  - Dinheiro em reais (number), arredondado apenas na apresentação.
 *  - Taxas percentuais entram como "4.44" (= 4,44%), nunca como 0.0444.
 *  - Todas as funções são puras: mesmo input → mesmo output.
 */

/** Curva de depreciação: perda anual (%) sobre o valor do ano anterior. */
export type CurvaDepreciacao = readonly number[];

export type TipoEnergia = 'comb' | 'ev';

/** Parâmetros da simulação PF — espelho 1:1 do motor original. */
export interface ParametrosSimulacao {
  /** Preço do veículo 0 km (R$). */
  preco: number;
  /** Horizonte da análise, em meses. */
  meses: number;
  /** Quilometragem mensal (km). */
  kmMes: number;
  /** IPCA projetado, % a.a. */
  ipca: number;
  /** CDI bruto, % a.a. */
  cdi: number;
  /** Percentual do CDI que o dinheiro rende (ex.: 100). */
  cdiPct: number;
  /** Curva de depreciação anual. */
  curva: CurvaDepreciacao;
  /** Alíquota de IPVA, % a.a. sobre o valor venal. */
  ipvaAliq: number;
  /** Licenciamento anual (R$). */
  licenc: number;
  /** Seguro, % a.a. sobre o valor do veículo. */
  seguroPct: number;
  /** Manutenção no 1º ano (R$/ano); cresce 12% a.a. com a idade. */
  manutAno: number;
  /** Preço do jogo de 4 pneus (R$). */
  pneusJogo: number;
  /** Vida útil dos pneus (km). */
  kmPneu: number;
  /** Emplacamento + taxas de 0 km (R$, só na compra). */
  emplacamento: number;
  /** Mensalidade da assinatura (R$). */
  mensalidade: number;
  /** Reajuste anual da assinatura, % a.a. (contrato godrive: IPCA). */
  reajusteAssinatura: number;
  /** Franquia mensal de km da assinatura (0 = ilimitada). */
  kmFranquia: number;
  /** Custo do km excedente (R$/km). */
  kmExcedente: number;
  /** Entrada do financiamento, % do preço. */
  entradaPct: number;
  /** Juros do financiamento, % a.m. */
  jurosFinMes: number;
  /** Prazo do financiamento, em meses. */
  prazoFin: number;
  /** Combustão ou elétrico. */
  tipoEnergia: TipoEnergia;
  /** Consumo (km/L) — combustão. */
  kml: number;
  /** Consumo (kWh/100 km) — elétrico. */
  kwh100: number;
  /** Preço do combustível (R$/L). */
  precoComb: number;
  /** Preço da energia (R$/kWh). */
  precoKwh: number;
  /** Somar energia aos fluxos (é neutro entre cenários). */
  incluirEnergia: boolean;
  /** Isenção de IPVA para veículos com 20+ anos (EC 137/2025). */
  ipvaIsento: boolean;
}

/** Custos mensais de quem é dono (IPVA, licenciamento, seguro, manutenção, pneus). */
export interface CustoPosseMes {
  ipva: number;
  lic: number;
  seguro: number;
  manut: number;
  pneus: number;
  total: number;
}

export interface ResultadoCenarioBase {
  /** Patrimônio ao fim do horizonte (saldo investido + ativo − dívida). */
  pat: number;
  /** Custo líquido do período = capital de referência capitalizado − patrimônio final. */
  custo: number;
  /** Trajetória mensal do saldo financeiro. */
  saldo: number[];
  /** Somatório dos custos diretos do cenário. */
  custos: number;
  /** Desembolso no ato (t=0). */
  desembolso: number;
  /** Fluxo mensal de caixa (saídas). */
  fluxo: number[];
}

export interface ResultadoAssinar extends ResultadoCenarioBase {
  /** Total pago em km excedente. */
  excedente: number;
}

export interface ResultadoFinanciar extends ResultadoCenarioBase {
  parcela: number;
  iof: number;
  juros: number;
  /** Saldo devedor remanescente ao fim do horizonte. */
  devedor: number;
  financiado: number;
}

export interface ResultadoSimulacao {
  /** Taxa mensal líquida de IR usada na capitalização. */
  iLiq: number;
  /** Equivalente anual da taxa líquida, %. */
  iLiqAA: number;
  /** Alíquota de IR aplicada (fração, ex.: 0.15). */
  aliqIR: number;
  /** Valor residual do veículo ao fim do horizonte. */
  residual: number;
  /** Gasto total com combustível/energia no período (informativo). */
  energiaTotal: number;
  /** Capital de referência (preço + emplacamento). */
  C0: number;
  /** Capital de referência capitalizado até o fim. */
  C0f: number;
  posse: CustoPosseMes[];
  aVista: ResultadoCenarioBase;
  assinar: ResultadoAssinar;
  financiar: ResultadoFinanciar;
}

/* ─────────────────────────── Camada PJ ─────────────────────────── */

export type RegimeTributario = 'real' | 'presumido' | 'simples';

export interface AliquotasReferencia {
  /** CBS, % (Resolução CGIBS 14/2026: 9,21). */
  cbs: number;
  /** IBS, % (18,70). */
  ibs: number;
}

export interface ParametrosPJ {
  regime: RegimeTributario;
  /** Ano-calendário do início do contrato. */
  anoInicio: number;
  ref: AliquotasReferencia;
  /** IRPJ+CSLL, % (34 no Lucro Real pleno). */
  irpjCsll: number;
}

export interface LinhaAnoPJ {
  ano: number;
  /** Alíquota efetivamente aproveitada no ano (0 fora do Lucro Real). */
  aliq: number;
  /** Alíquota prevista em lei para o ano (informativa). */
  aliqLei: number;
  credAss: number;
  credCompra: number;
  dedAss: number;
  dedCompra: number;
}

export interface ResultadoPJ {
  regime: RegimeTributario;
  anoInicio: number;
  /** true apenas no Lucro Real. */
  aproveita: boolean;
  credAssinatura: number;
  credCompra: number;
  dedAssinatura: number;
  dedCompra: number;
  beneficioAssinatura: number;
  beneficioCompra: number;
  custoLiqAssinatura: number;
  custoLiqCompra: number;
  dedJuros: number;
  custoLiqFinanciar: number;
  linhas: LinhaAnoPJ[];
}
