/**
 * Dados de referência — verificados em agosto/2026.
 * Gerado a partir do motor original para garantir fidelidade byte a byte;
 * editar aqui é editar a premissa oficial do produto.
 */

import type { CurvaDepreciacao, TipoEnergia } from './types.js';

export interface UF { n: string; ipva: number; lic: number }
export const UFS: Readonly<Record<string, UF>> = {
  "AC": {
    "n": "Acre",
    "ipva": 2,
    "lic": 194.14
  },
  "AL": {
    "n": "Alagoas",
    "ipva": 2.75,
    "lic": 155.41
  },
  "AP": {
    "n": "Amapá",
    "ipva": 3,
    "lic": 128.54
  },
  "AM": {
    "n": "Amazonas",
    "ipva": 1.5,
    "lic": 110
  },
  "BA": {
    "n": "Bahia",
    "ipva": 2.5,
    "lic": 181.13
  },
  "CE": {
    "n": "Ceará",
    "ipva": 3,
    "lic": 204.71
  },
  "DF": {
    "n": "Distrito Federal",
    "ipva": 3.5,
    "lic": 106.26
  },
  "ES": {
    "n": "Espírito Santo",
    "ipva": 2,
    "lic": 237.04
  },
  "GO": {
    "n": "Goiás",
    "ipva": 3.75,
    "lic": 273.16
  },
  "MA": {
    "n": "Maranhão",
    "ipva": 3,
    "lic": 95.87
  },
  "MT": {
    "n": "Mato Grosso",
    "ipva": 3,
    "lic": 197.79
  },
  "MS": {
    "n": "Mato Grosso do Sul",
    "ipva": 3,
    "lic": 240.5
  },
  "MG": {
    "n": "Minas Gerais",
    "ipva": 4,
    "lic": 39.36
  },
  "PA": {
    "n": "Pará",
    "ipva": 2.5,
    "lic": 214.51
  },
  "PB": {
    "n": "Paraíba",
    "ipva": 2.5,
    "lic": 206.55
  },
  "PR": {
    "n": "Paraná",
    "ipva": 1.9,
    "lic": 94.65
  },
  "PE": {
    "n": "Pernambuco",
    "ipva": 2.4,
    "lic": 158
  },
  "PI": {
    "n": "Piauí",
    "ipva": 2.75,
    "lic": 108.03
  },
  "RJ": {
    "n": "Rio de Janeiro",
    "ipva": 4,
    "lic": 293.71
  },
  "RN": {
    "n": "Rio Grande do Norte",
    "ipva": 3,
    "lic": 90
  },
  "RS": {
    "n": "Rio Grande do Sul",
    "ipva": 3,
    "lic": 114.09
  },
  "RO": {
    "n": "Rondônia",
    "ipva": 3,
    "lic": 220.41
  },
  "RR": {
    "n": "Roraima",
    "ipva": 3,
    "lic": 98.47
  },
  "SC": {
    "n": "Santa Catarina",
    "ipva": 2,
    "lic": 142.69
  },
  "SP": {
    "n": "São Paulo",
    "ipva": 4,
    "lic": 174.08
  },
  "SE": {
    "n": "Sergipe",
    "ipva": 2.5,
    "lic": 250.14
  },
  "TO": {
    "n": "Tocantins",
    "ipva": 2,
    "lic": 79.63
  }
} as const;

export interface Categoria {
  n: string; manut: number; pneus: number; kmPneu: number;
  kml?: number; kwh100?: number; seguro: number; tipo: TipoEnergia;
}
export const CATEGORIAS: Readonly<Record<string, Categoria>> = {
  "popular": {
    "n": "Popular 1.0 (Mobi, Kwid, Gol)",
    "manut": 1300,
    "pneus": 1140,
    "kmPneu": 45000,
    "kml": 13.5,
    "seguro": 5.5,
    "tipo": "comb"
  },
  "hatch": {
    "n": "Hatch/Sedã compacto (Onix, HB20, Polo, Argo)",
    "manut": 1800,
    "pneus": 1300,
    "kmPneu": 45000,
    "kml": 13,
    "seguro": 5,
    "tipo": "comb"
  },
  "suvc": {
    "n": "SUV compacto (Pulse, T-Cross, Creta, Renegade)",
    "manut": 2200,
    "pneus": 2400,
    "kmPneu": 50000,
    "kml": 11.5,
    "seguro": 4.5,
    "tipo": "comb"
  },
  "suvm": {
    "n": "SUV/Sedã médio (Compass, Corolla Cross, Corolla)",
    "manut": 3000,
    "pneus": 2900,
    "kmPneu": 50000,
    "kml": 11,
    "seguro": 4,
    "tipo": "comb"
  },
  "picape": {
    "n": "Picape (Toro, Hilux, S10, Ranger)",
    "manut": 3600,
    "pneus": 3400,
    "kmPneu": 50000,
    "kml": 9,
    "seguro": 4,
    "tipo": "comb"
  },
  "hibrido": {
    "n": "Híbrido (BYD King, Song, Corolla Cross)",
    "manut": 1900,
    "pneus": 2400,
    "kmPneu": 50000,
    "kml": 18,
    "seguro": 3.3,
    "tipo": "comb"
  },
  "eletrico": {
    "n": "Elétrico (BYD Dolphin, Denza)",
    "manut": 1200,
    "pneus": 2400,
    "kmPneu": 45000,
    "kwh100": 15,
    "seguro": 3.3,
    "tipo": "ev"
  }
} as const;

export interface CurvaInfo { n: string; c: CurvaDepreciacao }
export const DEPREC: Readonly<Record<string, CurvaInfo>> = {
  "fipe": {
    "n": "Suave — FIPE nominal",
    "c": [
      13,
      10,
      8,
      7,
      6
    ]
  },
  "mercado": {
    "n": "Acelerada — regra clássica",
    "c": [
      20,
      15,
      12,
      10,
      7
    ]
  },
  "eletrico": {
    "n": "Elétrico — medido IBV/BV",
    "c": [
      13,
      21,
      21,
      15,
      10
    ]
  }
} as const;

/** Premissas macroeconômicas — data-base 18/08/2026. */
export const MACRO = {
  "cdi": 13.9,
  "selic": 14,
  "ipca": 4.44,
  "jurosFin": 1.97,
  "iofFixo": 0.38,
  "iofDia": 0.0082,
  "iofTeto": 3.38,
  "emplacamento": 1800,
  "aliqRef": 27.91,
  "aliqCBS": 9.21,
  "aliqIBS": 18.7,
  "pisCofins": 9.25,
  "irpjCsll": 34
} as const;

export interface Veiculo {
  n: string; p: number; c: string; m: number;
  f: 'pub' | 'mer' | 'est'; gd: 0 | 1; e: number; d: string;
  /** tabela oficial de planos da locadora — ausente nos carros que a equipe cadastra */
  pl?: readonly PlanoAssinatura[];
}
/**
 * Uma faixa de km da tabela oficial (agosto/2026, fornecida pela godrive).
 * `m12/m18/m24` é a mensalidade por prazo de contrato; `exc` é o R$/km
 * excedente. Os números são TRANSCRITOS da tabela, não derivados — a
 * regularidade dela (cada 500 km custam exatamente 500·exc a mais, cada
 * prazo desce R$ 200) serviu de CONFERÊNCIA da transcrição, mas gravar a
 * fórmula no lugar dos números faria a próxima tabela, se quebrar o padrão,
 * entrar errada em silêncio.
 */
export interface PlanoAssinatura {
  km: number; exc: number; m12: number; m18: number; m24: number;
}
/**
 * % do valor do carro por mês — mediana de m/p dos oito carros da tabela
 * oficial de agosto/2026, na base de referência (24 meses, 1.000 km).
 * Era 2,129 na tabela anterior; serve só para ESTIMAR a mensalidade de
 * carro que a equipe cadastra sem preço publicado.
 */
export const TX_REF = 2.28;
/*
 * A TABELA OFICIAL — agosto/2026, fornecida pela godrive. Decisão do dono:
 * estes oito carros, e SÓ eles, são as referências do site a partir de
 * agora; os catorze de mercado que existiam aqui saíram.
 *
 * `m` é a mensalidade "a partir de": 24 meses com 1.000 km/mês, a mais
 * barata da matriz — a mesma base da tabela anterior (o Yaris continuou
 * 2.990, o que serviu de âncora de conferência). A matriz completa vai em
 * `pl`; quem escolhe prazo e km de verdade é o Simulador.
 *
 * A ARMADILHA DE TRANSCRIÇÃO, para o próximo: a extração de TEXTO do PDF
 * embaralha os rótulos dos três últimos blocos (Song Plus, Premium e
 * Denza). A transcrição correta sai das COORDENADAS y de cada rótulo
 * contra as dos blocos de preço — o Denza a 5.990/mês (errado por 2,5×)
 * era o que a leitura ingênua gravava.
 */
export const CATALOGO: readonly Veiculo[] = [
  {
    n: 'BYD Dolphin Mini GL', p: 118990, c: 'eletrico', m: 2990, f: 'pub', gd: 1, e: 13.6,
    d: 'Elétrico · 38 kWh · 280 km de autonomia',
    pl: [
      { km: 1000, exc: 1.15, m12: 3390, m18: 3190, m24: 2990 },
      { km: 1500, exc: 1.15, m12: 3965, m18: 3765, m24: 3565 },
      { km: 2000, exc: 1.15, m12: 4540, m18: 4340, m24: 4140 },
      { km: 2500, exc: 1.15, m12: 5115, m18: 4915, m24: 4715 },
    ],
  },
  {
    n: 'BYD Dolphin', p: 149900, c: 'eletrico', m: 3390, f: 'pub', gd: 1, e: 15.4,
    d: 'Elétrico · 44,9 kWh · 291 km',
    pl: [
      { km: 1000, exc: 1.15, m12: 3790, m18: 3590, m24: 3390 },
      { km: 1500, exc: 1.15, m12: 4365, m18: 4165, m24: 3965 },
      { km: 2000, exc: 1.15, m12: 4940, m18: 4740, m24: 4540 },
      { km: 2500, exc: 1.15, m12: 5515, m18: 5315, m24: 5115 },
    ],
  },
  {
    n: 'BYD King GL', p: 172990, c: 'hibrido', m: 3490, f: 'pub', gd: 1, e: 43.5,
    d: 'Híbrido plug-in · 32 km só no elétrico',
    pl: [
      { km: 1000, exc: 1.15, m12: 3890, m18: 3690, m24: 3490 },
      { km: 1500, exc: 1.15, m12: 4465, m18: 4265, m24: 4065 },
      { km: 2000, exc: 1.15, m12: 5040, m18: 4840, m24: 4640 },
      { km: 2500, exc: 1.15, m12: 5615, m18: 5415, m24: 5215 },
    ],
  },
  {
    n: 'BYD Song Pro GL', p: 189990, c: 'hibrido', m: 4390, f: 'pub', gd: 1, e: 13.9,
    d: 'SUV híbrido plug-in · 49 km elétricos',
    pl: [
      { km: 1000, exc: 2.2, m12: 4790, m18: 4590, m24: 4390 },
      { km: 1500, exc: 2.2, m12: 5890, m18: 5690, m24: 5490 },
      { km: 2000, exc: 2.2, m12: 6990, m18: 6790, m24: 6590 },
      { km: 2500, exc: 2.2, m12: 8090, m18: 7890, m24: 7690 },
    ],
  },
  {
    n: 'Toyota Yaris Cross XR', p: 149990, c: 'suvc', m: 2990, f: 'pub', gd: 1, e: 12.6,
    d: 'SUV compacto flex, CVT, 5 lugares',
    pl: [
      { km: 1000, exc: 1.15, m12: 3390, m18: 3190, m24: 2990 },
      { km: 1500, exc: 1.15, m12: 3965, m18: 3765, m24: 3565 },
      { km: 2000, exc: 1.15, m12: 4540, m18: 4340, m24: 4140 },
      { km: 2500, exc: 1.15, m12: 5115, m18: 4915, m24: 4715 },
    ],
  },
  {
    n: 'BYD Song Plus', p: 249990, c: 'hibrido', m: 5590, f: 'pub', gd: 1, e: 39.5,
    d: 'SUV médio híbrido · 63 km elétricos',
    pl: [
      { km: 1000, exc: 2.2, m12: 5990, m18: 5790, m24: 5590 },
      { km: 1500, exc: 2.2, m12: 7090, m18: 6890, m24: 6690 },
      { km: 2000, exc: 2.2, m12: 8190, m18: 7990, m24: 7790 },
      { km: 2500, exc: 2.2, m12: 9290, m18: 9090, m24: 8890 },
    ],
  },
  {
    n: 'BYD Song Plus Premium', p: 299800, c: 'hibrido', m: 6890, f: 'pub', gd: 1, e: 12.2,
    d: 'SUV médio AWD · 87 km elétricos',
    pl: [
      { km: 1000, exc: 2.2, m12: 7290, m18: 7090, m24: 6890 },
      { km: 1500, exc: 2.2, m12: 8390, m18: 8190, m24: 7990 },
      { km: 2000, exc: 2.2, m12: 9490, m18: 9290, m24: 9090 },
      { km: 2500, exc: 2.2, m12: 10590, m18: 10390, m24: 10190 },
    ],
  },
  {
    n: 'Denza B5', p: 436000, c: 'hibrido', m: 14690, f: 'pub', gd: 1, e: 8.4,
    d: 'SUV off-road híbrido · chassi sobre longarinas',
    pl: [
      { km: 1000, exc: 2.2, m12: 15090, m18: 14890, m24: 14690 },
      { km: 1500, exc: 2.2, m12: 16190, m18: 15990, m24: 15790 },
      { km: 2000, exc: 2.2, m12: 17290, m18: 17090, m24: 16890 },
      { km: 2500, exc: 2.2, m12: 18390, m18: 18190, m24: 17990 },
    ],
  },
] as const;
