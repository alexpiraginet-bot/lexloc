/**
 * Estado do app: parâmetros da simulação + modo + propostas salvas.
 * Persistência defensiva em localStorage (pode não existir — file://,
 * privacidade, WebView). Nada quebra sem ele.
 */
import { useEffect, useMemo, useReducer } from 'react';
import {
  CATEGORIAS,
  DEPREC,
  MACRO,
  UFS,
  mensalidadeEquilibrio,
  simular,
  type ParametrosSimulacao,
  type ResultadoSimulacao,
} from '@godrive/engine';

export type Modo = 'cliente' | 'vendedor';

/**
 * Perfil do BUILD (não do usuário): a versão "cliente" é um HTML separado
 * onde o modo vendedor não existe — nem botão, nem estado, nem tela.
 * Definido em tempo de compilação pelo vite (define: __PERFIL__).
 */
declare const __PERFIL__: 'cliente' | 'vendedor' | undefined;
export const PERFIL: 'cliente' | 'vendedor' =
  typeof __PERFIL__ !== 'undefined' && __PERFIL__ === 'cliente' ? 'cliente' : 'vendedor';

export interface Estado {
  modo: Modo;
  tema: 'auto' | 'claro' | 'escuro';
  aba: 'simular' | 'resultado' | 'pj' | 'propostas';
  carroIdx: number | null;
  uf: string;
  categoria: string;
  curva: string;
  preco: number;
  meses: number;
  kmMes: number;
  mensalidade: number;
  kmFranquia: number;
  kmExcedente: number;
  entradaPct: number;
  jurosFinMes: number;
  prazoFin: number;
  ipca: number;
  cdiPct: number;
  ipvaAliq: number;
  licenc: number;
  seguroPct: number;
  manutAno: number;
  pneusJogo: number;
  kmPneu: number;
  emplacamento: number;
  kml: number;
  kwh100: number;
  precoComb: number;
  precoKwh: number;
  incluirEnergia: boolean;
  /* PJ */
  regime: 'real' | 'presumido' | 'simples';
  anoInicio: number;
  /** bump a cada edição da tabela de preços — invalida memos do catálogo */
  catVersao: number;
}

export interface Proposta {
  id: string;
  ts: number;
  nome: string;
  fone: string;
  obs: string;
  estado: Estado;
  custoAssinar: number;
  economiaAbsorvida: number;
}

const ES = UFS['ES']!;
const SUVC = CATEGORIAS['suvc']!;

export const estadoInicial: Estado = {
  modo: 'cliente',
  tema: 'auto',
  aba: 'simular',
  carroIdx: 0,
  uf: 'ES',
  categoria: 'suvc',
  curva: 'fipe',
  preco: 149990,
  meses: 36,
  kmMes: 1500,
  mensalidade: 2990,
  kmFranquia: 1000,
  kmExcedente: 1.5,
  entradaPct: 20,
  jurosFinMes: MACRO.jurosFin,
  prazoFin: 36,
  ipca: MACRO.ipca,
  cdiPct: 100,
  ipvaAliq: ES.ipva,
  licenc: ES.lic,
  seguroPct: SUVC.seguro,
  manutAno: SUVC.manut,
  pneusJogo: SUVC.pneus,
  kmPneu: SUVC.kmPneu,
  emplacamento: MACRO.emplacamento,
  kml: 12.6,
  kwh100: 15,
  precoComb: 6.554,
  precoKwh: 0.89,
  incluirEnergia: false,
  regime: 'real',
  anoInicio: 2026,
  catVersao: 0,
};

export type Acao =
  | { t: 'set'; campo: keyof Estado; valor: Estado[keyof Estado] }
  | { t: 'muitos'; valores: Partial<Estado> }
  | { t: 'reset' };

/** No build cliente, o modo vendedor é inalcançável por qualquer caminho. */
function blindar(e: Estado): Estado {
  if (PERFIL === 'cliente' && (e.modo !== 'cliente' || e.aba === 'propostas')) {
    return { ...e, modo: 'cliente', aba: e.aba === 'propostas' ? 'resultado' : e.aba };
  }
  return e;
}

function reducer(e: Estado, a: Acao): Estado {
  switch (a.t) {
    case 'set': {
      const novo = { ...e, [a.campo]: a.valor };
      // Propostas só existe no modo vendedor — voltar para cliente com ela
      // aberta deixaria o usuário num painel sem aba (e com dados de outros
      // clientes na tela). Redireciona.
      if (a.campo === 'modo' && a.valor === 'cliente' && novo.aba === 'propostas') {
        novo.aba = 'resultado';
      }
      return blindar(novo);
    }
    case 'muitos':
      return blindar({ ...e, ...a.valores });
    case 'reset':
      return blindar({ ...estadoInicial, modo: e.modo, tema: e.tema });
  }
}

const LS_ESTADO = 'godrive.calc.v2';
const LS_PROPOSTAS = 'godrive.propostas.v2';

function lerLS<T>(chave: string): T | null {
  try {
    const s = localStorage.getItem(chave);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}
export function gravarLS(chave: string, valor: unknown): boolean {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export function lerPropostas(): Proposta[] {
  return (lerLS<Proposta[]>(LS_PROPOSTAS) ?? []).sort((a, b) => b.ts - a.ts);
}
export function gravarPropostas(l: Proposta[]): boolean {
  return gravarLS(LS_PROPOSTAS, l);
}

export function paramsDe(e: Estado): ParametrosSimulacao {
  const cat = CATEGORIAS[e.categoria] ?? SUVC;
  const curva = DEPREC[e.curva] ?? DEPREC['fipe']!;
  return {
    preco: e.preco,
    meses: e.meses,
    kmMes: e.kmMes,
    ipca: e.ipca,
    cdi: MACRO.cdi,
    cdiPct: e.cdiPct,
    curva: curva.c,
    ipvaAliq: e.ipvaAliq,
    licenc: e.licenc,
    seguroPct: e.seguroPct,
    manutAno: e.manutAno,
    pneusJogo: e.pneusJogo,
    kmPneu: e.kmPneu,
    emplacamento: e.emplacamento,
    mensalidade: e.mensalidade,
    reajusteAssinatura: e.ipca,
    kmFranquia: e.kmFranquia,
    kmExcedente: e.kmExcedente,
    entradaPct: e.entradaPct,
    jurosFinMes: e.jurosFinMes,
    prazoFin: e.prazoFin,
    tipoEnergia: cat.tipo,
    kml: e.kml || cat.kml || 11.5,
    kwh100: e.kwh100 || cat.kwh100 || 15,
    precoComb: e.precoComb,
    precoKwh: e.precoKwh,
    incluirEnergia: e.incluirEnergia,
    ipvaIsento: true,
  };
}

export interface Derivado {
  p: ParametrosSimulacao;
  r: ResultadoSimulacao;
  equilibrio: number;
  /** soma do que a assinatura absorve (depreciação + posse + emplacamento) */
  absorvido: number;
  abs: {
    depreciacao: number;
    ipva: number;
    lic: number;
    seguro: number;
    manut: number;
    pneus: number;
    emplacamento: number;
  };
  vencedor: 'assinar' | 'aVista' | 'financiar';
  diferenca: number;
}

export function derivar(e: Estado): Derivado | null {
  if (!(e.preco > 0) || !(e.meses > 0)) return null;
  const p = paramsDe(e);
  const r = simular(p);
  const equilibrio = mensalidadeEquilibrio(p, r.aVista.custo);
  const abs = {
    depreciacao: p.preco - r.residual,
    ipva: 0,
    lic: 0,
    seguro: 0,
    manut: 0,
    pneus: 0,
    emplacamento: p.emplacamento,
  };
  for (const m of r.posse) {
    abs.ipva += m.ipva;
    abs.lic += m.lic;
    abs.seguro += m.seguro;
    abs.manut += m.manut;
    abs.pneus += m.pneus;
  }
  const absorvido =
    abs.depreciacao + abs.ipva + abs.lic + abs.seguro + abs.manut + abs.pneus + abs.emplacamento;
  const cen = [
    { k: 'assinar' as const, custo: r.assinar.custo },
    { k: 'aVista' as const, custo: r.aVista.custo },
    { k: 'financiar' as const, custo: r.financiar.custo },
  ].sort((a, b) => a.custo - b.custo);
  return {
    p,
    r,
    equilibrio,
    absorvido,
    abs,
    vencedor: cen[0]!.k,
    diferenca: cen[1]!.custo - cen[0]!.custo,
  };
}

/**
 * Saneia o que veio do localStorage: só aceita chaves conhecidas e com o
 * MESMO tipo do estado inicial. Storage é gravável por qualquer script da
 * origem — nunca confiar no formato.
 */
function sanearEstado(bruto: unknown): Partial<Estado> {
  if (typeof bruto !== 'object' || bruto == null) return {};
  const fonte = bruto as Record<string, unknown>;
  const limpo: Record<string, unknown> = {};
  for (const [k, padrao] of Object.entries(estadoInicial)) {
    const v = fonte[k];
    if (typeof v === typeof padrao && (typeof v !== 'number' || Number.isFinite(v))) {
      limpo[k] = v;
    }
  }
  return limpo as Partial<Estado>;
}

export function useApp() {
  const [estado, dispatch] = useReducer(
    reducer,
    undefined,
    () =>
      blindar({
        ...estadoInicial,
        ...sanearEstado(lerLS<unknown>(LS_ESTADO)),
        aba: 'simular' as const,
      }),
  );

  // persistência com debounce: o slider dispara dezenas de estados por
  // segundo e gravar JSON síncrono a cada tick é trabalho jogado fora
  useEffect(() => {
    const t = setTimeout(() => gravarLS(LS_ESTADO, estado), 250);
    return () => clearTimeout(t);
  }, [estado]);

  useEffect(() => {
    const raiz = document.documentElement;
    const prefereEscuro = window.matchMedia('(prefers-color-scheme: dark)');
    const aplicar = () => {
      const escuro = estado.tema === 'escuro' || (estado.tema === 'auto' && prefereEscuro.matches);
      if (escuro) raiz.setAttribute('data-theme', 'dark');
      else raiz.removeAttribute('data-theme');
    };
    aplicar();
    prefereEscuro.addEventListener('change', aplicar);
    return () => prefereEscuro.removeEventListener('change', aplicar);
  }, [estado.tema]);

  // recalcula SÓ quando um parâmetro financeiro muda — trocar aba, tema ou
  // modo não deve reexecutar a busca binária de equilíbrio (71 simulações)
  const chaveFinanceira = JSON.stringify(paramsDe(estado));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const derivado = useMemo(() => derivar(estado), [chaveFinanceira]);
  return { estado, dispatch, derivado };
}
