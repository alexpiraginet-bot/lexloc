/**
 * White-label — a calculadora como produto para QUALQUER locadora/assinatura
 * de veículos do Brasil. A marca (nome, cores, contato) é configurável no
 * próprio app e viaja no mesmo arquivo de exportação da tabela de preços:
 * a empresa configura uma vez e distribui o JSON para a equipe.
 *
 * O rodapé carrega o crédito da software house — é o vetor de divulgação.
 */

export interface Marca {
  /** primeira parte do logo (fica na cor primária) — ex.: "Lex" */
  nome: string;
  /** segunda parte do logo (fica na cor de destaque) — ex.: "Go" */
  sufixo: string;
  /**
   * Logo da locadora como data URI (PNG/JPG/SVG, até ~120 KB).
   * Quando presente, substitui o logo textual no app e no PDF.
   */
  logo?: string;
  /** linha pequena sob o logo */
  slogan: string;
  /** cor primária (títulos, veredito) */
  corPrimaria: string;
  /** cor de destaque (números-herói, botões) */
  corDestaque: string;
  /** WhatsApp da empresa (só dígitos, com DDD) — pré-preenche propostas */
  whatsapp: string;
  /** cidades/unidades, uma linha no PDF */
  cidades: string;
  /** crédito no rodapé — a software house que oferece a ferramenta */
  creditoNome: string;
  creditoUrl: string;
}

export const MARCA_PADRAO: Marca = {
  nome: 'Lex',
  sufixo: 'Go',
  slogan: 'assinar ou comprar? a conta completa',
  corPrimaria: '#892991',
  corDestaque: '#C9A227',
  whatsapp: '',
  cidades: '',
  creditoNome: 'LexGo',
  creditoUrl: 'https://uselexgo.com',
};

const LS = 'lexgo.marca.v1';

/** data URI de imagem, com teto de tamanho — nada de payload gigante. */
const LOGO_OK = /^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/;
export const LOGO_MAX_BYTES = 120_000;

export function lerMarca(): Marca {
  try {
    const bruto = JSON.parse(localStorage.getItem(LS) ?? 'null') as Partial<Marca> | null;
    if (!bruto) return MARCA_PADRAO;
    const m: Marca = { ...MARCA_PADRAO };
    for (const k of Object.keys(MARCA_PADRAO) as (keyof Marca)[]) {
      const v = bruto[k];
      if (typeof v === 'string') m[k] = v;
    }
    if (typeof bruto.logo === 'string' && LOGO_OK.test(bruto.logo) && bruto.logo.length <= LOGO_MAX_BYTES * 1.4) {
      m.logo = bruto.logo;
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(m.corPrimaria)) m.corPrimaria = MARCA_PADRAO.corPrimaria;
    if (!/^#[0-9a-fA-F]{6}$/.test(m.corDestaque)) m.corDestaque = MARCA_PADRAO.corDestaque;
    // creditoUrl vira href no rodapé: só http(s), senão um valor `javascript:`
    // gravado aqui executaria no clique com acesso a propostas e preços.
    // Vazio é permitido (rodapé mostra só o nome, sem link).
    if (m.creditoUrl !== '' && !/^https?:\/\//i.test(m.creditoUrl)) {
      m.creditoUrl = MARCA_PADRAO.creditoUrl;
    }
    return m;
  } catch {
    return MARCA_PADRAO;
  }
}

/** Valida um arquivo escolhido pelo vendedor e devolve o data URI. */
export function lerLogoDeArquivo(f: File): Promise<string> {
  return new Promise((ok, erro) => {
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(f.type)) {
      return erro(new Error('Use PNG, JPG, WEBP ou SVG.'));
    }
    if (f.size > LOGO_MAX_BYTES) {
      return erro(new Error(`Imagem muito pesada (máx. ${Math.round(LOGO_MAX_BYTES / 1000)} KB).`));
    }
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result ?? '');
      LOGO_OK.test(s) ? ok(s) : erro(new Error('Arquivo de imagem inválido.'));
    };
    r.onerror = () => erro(new Error('Não consegui ler o arquivo.'));
    r.readAsDataURL(f);
  });
}

export function gravarMarca(m: Marca): boolean {
  try {
    localStorage.setItem(LS, JSON.stringify(m));
    return true;
  } catch {
    return false;
  }
}

export function limparMarca(): void {
  try {
    localStorage.removeItem(LS);
  } catch {
    /* sem storage */
  }
}

/* ── aplicação das cores ── */

function hex2rgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}
function rgb2hex(r: number, g: number, b: number): string {
  const c = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
function misturar(hex: string, alvo: number, peso: number): string {
  const [r, g, b] = hex2rgb(hex);
  return rgb2hex(r + (alvo - r) * peso, g + (alvo - g) * peso, b + (alvo - b) * peso);
}
/** luminância aproximada para decidir texto claro/escuro sobre a cor */
function luminancia(hex: string): number {
  const [r, g, b] = hex2rgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * Aplica a marca nas variáveis de tema. Deriva as variações (escura, suave)
 * da primária; no tema escuro, clareia a primária para manter contraste.
 * Os três tons dos CENÁRIOS dos gráficos não mudam — são a paleta validada
 * (CVD/contraste) e a comparação precisa continuar legível em qualquer marca.
 */
export function aplicarMarca(m: Marca): void {
  const r = document.documentElement.style;
  const p = m.corPrimaria;
  const d = m.corDestaque;
  r.setProperty('--brand', p);
  r.setProperty('--brand-deep', p);
  r.setProperty('--brand-dark', misturar(p, 0, 0.25));
  r.setProperty('--brand-text', misturar(p, 0, 0.22));
  r.setProperty('--brand-soft', misturar(p, 255, 0.92));
  r.setProperty('--accent', d);
  r.setProperty('--accent-deep', misturar(d, 0, 0.4));
  r.setProperty('--accent-soft', misturar(d, 255, 0.9));
  r.setProperty('--accent-ink', luminancia(d) > 0.55 ? '#1c1206' : '#ffffff');
}
