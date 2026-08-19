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
import { sanearMarca, type Marca } from './marca';

export interface AjusteVeiculo {
  /** preço de tabela (R$) */
  p?: number;
  /** mensalidade (R$) */
  m?: number;
  /**
   * Foto DA FROTA DA LOCADORA como data URI (até ~90 KB).
   * De propósito não embarcamos fotos de fábrica: imagem de imprensa é
   * protegida por direito autoral e o produto vai para centenas de
   * empresas. A locadora sobe a foto do carro dela — que é o carro que o
   * cliente vai receber, na cor certa.
   */
  fo?: string;
}
/** foto da frota: só imagem, com teto — o arquivo da equipe não pode explodir */
const FOTO_OK = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/;
export const FOTO_MAX = 90_000;

/** Valida a foto escolhida pelo vendedor e devolve o data URI. */
export function lerFotoDeArquivo(f: File): Promise<string> {
  return new Promise((ok, erro) => {
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return erro(new Error('Use PNG, JPG ou WEBP.'));
    if (f.size > FOTO_MAX) {
      return erro(new Error(`Foto muito pesada (máx. ${Math.round(FOTO_MAX / 1000)} KB).`));
    }
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result ?? '');
      FOTO_OK.test(s) ? ok(s) : erro(new Error('Arquivo de imagem inválido.'));
    };
    r.onerror = () => erro(new Error('Não consegui ler o arquivo.'));
    r.readAsDataURL(f);
  });
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

export const vazio = (): CatalogoCustom => ({
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
/** Veículo do catálogo + o que a locadora acrescenta no aparelho dela. */
export type VeiculoLoja = Veiculo & { fo?: string };

export function catalogoEfetivo(custom: CatalogoCustom): VeiculoLoja[] {
  const base: VeiculoLoja[] = CATALOGO.map((v) => {
    const aj = custom.ajustes[v.n];
    if (!aj) return v;
    return {
      ...v,
      p: aj.p != null && aj.p > 0 ? aj.p : v.p,
      m: aj.m != null && aj.m > 0 ? aj.m : v.m,
      // preço mexido pela equipe = fonte "mercado local", não mais a publicada
      f: (aj.m != null && aj.m !== v.m ? 'mer' : v.f) as Veiculo['f'],
      ...(aj.fo ? { fo: aj.fo } : {}),
    };
  });
  // extras também aceitam foto: ela vive em `ajustes`, indexada pelo nome, para
  // a validação de imagem na importação acontecer num lugar só
  const extras: VeiculoLoja[] = custom.extras.map((v) => {
    const fo = custom.ajustes[v.n]?.fo;
    return fo ? { ...v, fo } : v;
  });
  return [...base, ...extras];
}

/** Blob de exportação — nomeado com a data para a equipe não se perder. */
export function exportarArquivo(
  custom: CatalogoCustom,
  marca?: Marca,
): { nome: string; conteudo: string } {
  const data = new Date().toISOString().slice(0, 10);
  return {
    nome: `tabela-precos-${data}.json`,
    // a marca (logo, cores, consultor) viaja JUNTO com a tabela: quem
    // importa o arquivo do gestor herda a identidade inteira da loja
    conteudo: JSON.stringify(marca ? { ...custom, marca } : custom, null, 2),
  };
}

/** Valida e normaliza um JSON importado. Devolve erro legível se inválido. */
export interface ArquivoImportado {
  custom: CatalogoCustom;
  /** presente quando o arquivo foi exportado já com a identidade da loja */
  marca: Marca | null;
}

export function importarArquivo(texto: string): ArquivoImportado | string {
  try {
    const bruto = JSON.parse(texto) as CatalogoCustom & { marca?: unknown };
    if (bruto?.versao !== 1 || typeof bruto.ajustes !== 'object') {
      return 'Este arquivo não é uma tabela de preços desta calculadora.';
    }
    const ajustes: Record<string, AjusteVeiculo> = {};
    for (const [nome, aj] of Object.entries(bruto.ajustes)) {
      if (typeof aj !== 'object' || aj == null) continue;
      const limpo: AjusteVeiculo = {};
      if (typeof aj.p === 'number' && Number.isFinite(aj.p) && aj.p > 0) limpo.p = aj.p;
      if (typeof aj.m === 'number' && Number.isFinite(aj.m) && aj.m > 0) limpo.m = aj.m;
      if (typeof aj.fo === 'string' && FOTO_OK.test(aj.fo) && aj.fo.length <= FOTO_MAX * 1.4) {
        limpo.fo = aj.fo;
      }
      if (Object.keys(limpo).length) ajustes[nome] = limpo;
    }
    return {
      custom: {
        versao: 1,
        atualizadoEm: typeof bruto.atualizadoEm === 'string' ? bruto.atualizadoEm : '',
        ajustes,
        extras: Array.isArray(bruto.extras) ? bruto.extras.filter(veiculoValido) : [],
      },
      marca: bruto.marca != null ? sanearMarca(bruto.marca) : null,
    };
  } catch {
    return 'Arquivo ilegível — exporte novamente a partir de um aparelho atualizado.';
  }
}
