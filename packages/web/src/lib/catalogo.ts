/**
 * Retaguarda de preços — o catálogo editável.
 *
 * O arquivo off-line não tem servidor, então a "retaguarda" vive no
 * aparelho: ajustes de preço/mensalidade por veículo e modelos novos ficam
 * em localStorage, por cima do catálogo de referência. Exportar/importar
 * JSON permite distribuir a tabela atualizada para a equipe — quem importa
 * passa a ver os mesmos preços.
 */
import { CATALOGO, CATEGORIAS, type Veiculo } from '@godrive/engine';

export interface AjusteVeiculo {
  /** preço de tabela (R$) */
  p?: number;
  /** mensalidade (R$) */
  m?: number;
}
export interface CatalogoCustom {
  versao: 1;
  atualizadoEm: string;
  /** ajustes por nome exato do veículo do catálogo de referência */
  ajustes: Record<string, AjusteVeiculo>;
  /** modelos acrescentados pela equipe */
  extras: Veiculo[];
}

const LS = 'lexgo.catalogo.v1';

const vazio = (): CatalogoCustom => ({
  versao: 1,
  atualizadoEm: new Date().toISOString(),
  ajustes: {},
  extras: [],
});

export function lerCustom(): CatalogoCustom {
  try {
    const bruto = JSON.parse(localStorage.getItem(LS) ?? 'null') as CatalogoCustom | null;
    if (!bruto || bruto.versao !== 1) return vazio();
    return {
      versao: 1,
      atualizadoEm: typeof bruto.atualizadoEm === 'string' ? bruto.atualizadoEm : '',
      ajustes: typeof bruto.ajustes === 'object' && bruto.ajustes ? bruto.ajustes : {},
      extras: Array.isArray(bruto.extras) ? bruto.extras.filter(veiculoValido) : [],
    };
  } catch {
    return vazio();
  }
}

export function gravarCustom(c: CatalogoCustom): boolean {
  try {
    localStorage.setItem(LS, JSON.stringify({ ...c, atualizadoEm: new Date().toISOString() }));
    return true;
  } catch {
    return false;
  }
}

export function limparCustom(): void {
  try {
    localStorage.removeItem(LS);
  } catch {
    /* sem storage, nada a limpar */
  }
}

function veiculoValido(v: unknown): v is Veiculo {
  if (typeof v !== 'object' || v == null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o['n'] === 'string' &&
    o['n'].trim().length > 0 &&
    typeof o['p'] === 'number' &&
    Number.isFinite(o['p']) &&
    o['p'] > 0 &&
    typeof o['m'] === 'number' &&
    Number.isFinite(o['m']) &&
    typeof o['c'] === 'string' &&
    // categoria precisa EXISTIR — um extra com categoria desconhecida
    // derrubaria o app na hora de escolher o carro (achado da IA local)
    o['c'] in CATEGORIAS
  );
}

/** Catálogo efetivo: referência + ajustes + extras. */
export function catalogoEfetivo(custom: CatalogoCustom): Veiculo[] {
  const base = CATALOGO.map((v) => {
    const aj = custom.ajustes[v.n];
    if (!aj) return v;
    return {
      ...v,
      p: aj.p != null && aj.p > 0 ? aj.p : v.p,
      m: aj.m != null && aj.m > 0 ? aj.m : v.m,
      // preço mexido pela equipe = fonte "mercado local", não mais a publicada
      f: (aj.m != null && aj.m !== v.m ? 'mer' : v.f) as Veiculo['f'],
    };
  });
  return [...base, ...custom.extras];
}

/** Blob de exportação — nomeado com a data para a equipe não se perder. */
export function exportarArquivo(custom: CatalogoCustom): { nome: string; conteudo: string } {
  const data = new Date().toISOString().slice(0, 10);
  return {
    nome: `tabela-precos-${data}.json`,
    conteudo: JSON.stringify(custom, null, 2),
  };
}

/** Valida e normaliza um JSON importado. Devolve erro legível se inválido. */
export function importarArquivo(texto: string): CatalogoCustom | string {
  try {
    const bruto = JSON.parse(texto) as CatalogoCustom;
    if (bruto?.versao !== 1 || typeof bruto.ajustes !== 'object') {
      return 'Este arquivo não é uma tabela de preços desta calculadora.';
    }
    const ajustes: Record<string, AjusteVeiculo> = {};
    for (const [nome, aj] of Object.entries(bruto.ajustes)) {
      if (typeof aj !== 'object' || aj == null) continue;
      const limpo: AjusteVeiculo = {};
      if (typeof aj.p === 'number' && Number.isFinite(aj.p) && aj.p > 0) limpo.p = aj.p;
      if (typeof aj.m === 'number' && Number.isFinite(aj.m) && aj.m > 0) limpo.m = aj.m;
      if (Object.keys(limpo).length) ajustes[nome] = limpo;
    }
    return {
      versao: 1,
      atualizadoEm: typeof bruto.atualizadoEm === 'string' ? bruto.atualizadoEm : '',
      ajustes,
      extras: Array.isArray(bruto.extras) ? bruto.extras.filter(veiculoValido) : [],
    };
  } catch {
    return 'Arquivo ilegível — exporte novamente a partir de um aparelho atualizado.';
  }
}
