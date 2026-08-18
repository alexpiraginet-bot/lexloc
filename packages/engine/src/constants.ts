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
}
/** % do valor do carro por mês — mediana das mensalidades publicadas. */
export const TX_REF = 2.129;
export const CATALOGO: readonly Veiculo[] = [
  {
    "n": "Toyota Yaris Cross XR",
    "p": 149990,
    "c": "suvc",
    "m": 2990,
    "f": "pub",
    "gd": 1,
    "e": 12.6,
    "d": "SUV compacto flex, CVT, 5 lugares"
  },
  {
    "n": "BYD Dolphin Mini GL",
    "p": 118990,
    "c": "eletrico",
    "m": 2831,
    "f": "mer",
    "gd": 1,
    "e": 13.6,
    "d": "Elétrico · 38 kWh · 280 km de autonomia"
  },
  {
    "n": "BYD Dolphin GS",
    "p": 149900,
    "c": "eletrico",
    "m": 3551,
    "f": "mer",
    "gd": 1,
    "e": 15.4,
    "d": "Elétrico · 44,9 kWh · 291 km"
  },
  {
    "n": "BYD King GL DM-i",
    "p": 172990,
    "c": "hibrido",
    "m": 3683,
    "f": "mer",
    "gd": 1,
    "e": 43.5,
    "d": "Híbrido plug-in · 32 km só no elétrico"
  },
  {
    "n": "BYD Song Pro GL",
    "p": 189990,
    "c": "hibrido",
    "m": 4040,
    "f": "est",
    "gd": 1,
    "e": 13.9,
    "d": "SUV híbrido plug-in · 49 km elétricos"
  },
  {
    "n": "BYD Song Plus",
    "p": 249990,
    "c": "hibrido",
    "m": 5320,
    "f": "est",
    "gd": 1,
    "e": 39.5,
    "d": "SUV médio híbrido · 63 km elétricos"
  },
  {
    "n": "BYD Song Plus Premium",
    "p": 299800,
    "c": "hibrido",
    "m": 5275,
    "f": "mer",
    "gd": 1,
    "e": 12.2,
    "d": "SUV médio AWD · 87 km elétricos"
  },
  {
    "n": "Denza B5",
    "p": 436000,
    "c": "hibrido",
    "m": 9280,
    "f": "est",
    "gd": 1,
    "e": 8.4,
    "d": "SUV off-road híbrido · chassi sobre longarinas"
  },
  {
    "n": "Renault Kwid Zen",
    "p": 78000,
    "c": "popular",
    "m": 1499,
    "f": "mer",
    "gd": 0,
    "e": 14.6,
    "d": "Hatch de entrada"
  },
  {
    "n": "Chevrolet Onix 1.0",
    "p": 78720,
    "c": "hatch",
    "m": 2000,
    "f": "mer",
    "gd": 0,
    "e": 13.7,
    "d": "O carro mais econômico do país (Inmetro)"
  },
  {
    "n": "VW Polo Track",
    "p": 84690,
    "c": "hatch",
    "m": 1898,
    "f": "mer",
    "gd": 0,
    "e": 13.5,
    "d": "Hatch compacto"
  },
  {
    "n": "Hyundai HB20 Limited",
    "p": 91090,
    "c": "hatch",
    "m": 1940,
    "f": "est",
    "gd": 0,
    "e": 13.3,
    "d": "Hatch compacto"
  },
  {
    "n": "Fiat Argo Drive",
    "p": 97990,
    "c": "hatch",
    "m": 2090,
    "f": "est",
    "gd": 0,
    "e": 13,
    "d": "Hatch compacto"
  },
  {
    "n": "Fiat Pulse Drive",
    "p": 102990,
    "c": "suvc",
    "m": 2190,
    "f": "est",
    "gd": 0,
    "e": 11.5,
    "d": "SUV compacto"
  },
  {
    "n": "Jeep Renegade Sport",
    "p": 115990,
    "c": "suvc",
    "m": 2470,
    "f": "est",
    "gd": 0,
    "e": 11,
    "d": "SUV compacto T270"
  },
  {
    "n": "Nissan Kicks",
    "p": 118685,
    "c": "suvc",
    "m": 3239,
    "f": "mer",
    "gd": 0,
    "e": 11.5,
    "d": "SUV compacto"
  },
  {
    "n": "VW T-Cross Sense",
    "p": 119272,
    "c": "suvc",
    "m": 3159,
    "f": "mer",
    "gd": 0,
    "e": 11.9,
    "d": "SUV compacto"
  },
  {
    "n": "Hyundai Creta Comfort",
    "p": 142044,
    "c": "suvc",
    "m": 3351,
    "f": "mer",
    "gd": 0,
    "e": 12,
    "d": "SUV compacto"
  },
  {
    "n": "Toyota Corolla XEi",
    "p": 157328,
    "c": "suvm",
    "m": 3350,
    "f": "est",
    "gd": 0,
    "e": 11,
    "d": "Sedã médio"
  },
  {
    "n": "Toyota Corolla Cross XR",
    "p": 167844,
    "c": "suvm",
    "m": 3570,
    "f": "est",
    "gd": 0,
    "e": 11,
    "d": "SUV médio"
  },
  {
    "n": "Jeep Compass Sport",
    "p": 171990,
    "c": "suvm",
    "m": 3660,
    "f": "est",
    "gd": 0,
    "e": 10.5,
    "d": "SUV médio"
  },
  {
    "n": "Corolla Cross Hybrid",
    "p": 211844,
    "c": "hibrido",
    "m": 4510,
    "f": "est",
    "gd": 0,
    "e": 18,
    "d": "SUV médio híbrido"
  }
] as const;
