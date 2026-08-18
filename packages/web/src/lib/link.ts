/**
 * Link mágico — a resposta ao medo de dados das locadoras.
 *
 * O app hospedado em uselexgo.com é GENÉRICO: nenhum preço, nenhuma marca
 * de locadora fica no servidor. Quando o vendedor gera um link para o
 * cliente, a simulação inteira (carro, preços, marca, cores) viaja
 * codificada no FRAGMENTO da URL (#d=...) — e fragmento não é enviado ao
 * servidor por definição do protocolo HTTP. O dado vai de aparelho a
 * aparelho, como uma mensagem.
 */
import type { Estado } from '../state';
import type { Marca } from './marca';

/** Campos do estado que fazem sentido viajar no link (numéricos + seleção). */
const CAMPOS_ESTADO = [
  'carroIdx', 'uf', 'categoria', 'curva', 'preco', 'meses', 'kmMes',
  'mensalidade', 'kmFranquia', 'kmExcedente', 'entradaPct', 'jurosFinMes',
  'prazoFin', 'ipca', 'cdiPct', 'ipvaAliq', 'licenc', 'seguroPct',
  'manutAno', 'pneusJogo', 'kmPneu', 'emplacamento', 'kml', 'kwh100',
  'precoComb', 'precoKwh',
] as const;

const CAMPOS_MARCA = [
  'nome', 'sufixo', 'slogan', 'corPrimaria', 'corDestaque', 'whatsapp', 'cidades',
] as const;

interface Pacote {
  v: 1;
  e: Partial<Record<(typeof CAMPOS_ESTADO)[number], unknown>>;
  m: Partial<Record<(typeof CAMPOS_MARCA)[number], string>>;
}

function b64urlCodificar(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecodificar(s: string): string {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Monta a URL que o vendedor manda ao cliente. */
export function gerarLink(estado: Estado, marca: Marca): string {
  const p: Pacote = { v: 1, e: {}, m: {} };
  for (const c of CAMPOS_ESTADO) p.e[c] = estado[c];
  for (const c of CAMPOS_MARCA) if (marca[c]) p.m[c] = marca[c];
  const hash = '#d=' + b64urlCodificar(JSON.stringify(p));
  // hospedado: usa a própria origem (uselexgo.com/locadoras, preview etc.);
  // aberto de arquivo: aponta para o endereço oficial
  const base =
    typeof location !== 'undefined' && location.protocol.startsWith('http')
      ? location.origin + location.pathname
      : 'https://uselexgo.com/locadoras/app.html';
  return base + hash;
}

export interface DadosDoLink {
  estado: Partial<Estado>;
  marca: Partial<Marca>;
}

/** Lê e valida o fragmento. Nunca lança: link ruim = app padrão. */
export function lerLink(): DadosDoLink | null {
  try {
    const m = /[#&]d=([A-Za-z0-9_-]+)/.exec(location.hash);
    if (!m) return null;
    const p = JSON.parse(b64urlDecodificar(m[1]!)) as Pacote;
    if (p?.v !== 1) return null;
    const estado: Record<string, unknown> = {};
    for (const c of CAMPOS_ESTADO) {
      const v = p.e?.[c];
      if (typeof v === 'number' && Number.isFinite(v)) estado[c] = v;
      else if (typeof v === 'string' && v.length <= 40) estado[c] = v;
      else if (v === null && c === 'carroIdx') estado[c] = null;
    }
    const marca: Record<string, string> = {};
    for (const c of CAMPOS_MARCA) {
      const v = p.m?.[c];
      if (typeof v === 'string' && v.length <= 120) marca[c] = v;
    }
    if (typeof marca['corPrimaria'] === 'string' && !/^#[0-9a-fA-F]{6}$/.test(marca['corPrimaria']))
      delete marca['corPrimaria'];
    if (typeof marca['corDestaque'] === 'string' && !/^#[0-9a-fA-F]{6}$/.test(marca['corDestaque']))
      delete marca['corDestaque'];
    return { estado: estado as Partial<Estado>, marca: marca as Partial<Marca> };
  } catch {
    return null;
  }
}
