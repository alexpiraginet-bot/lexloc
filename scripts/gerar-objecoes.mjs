/**
 * Gera o repertório do Copiloto a partir do catálogo levantado.
 *
 * Duas naturezas convivem de propósito:
 *  · DINÂMICAS — as 8 objeções mais comuns têm `monta(d)` e injetam os
 *    números DESTA simulação na fala. É onde o número decide a conversa.
 *  · ESTÁTICAS — as demais são prosa fixa, escrita sem número justamente
 *    para não envelhecer nem mentir. O Copiloto mostra os números da
 *    simulação numa faixa ao lado, para o vendedor usar como quiser.
 *
 *   node scripts/gerar-objecoes.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRADA = process.argv[2];
if (!ENTRADA) throw new Error('uso: node scripts/gerar-objecoes.mjs <catalogo.json>');

const bruto = JSON.parse(readFileSync(ENTRADA, 'utf8'));

/** as que já vivem em negociacao.ts com números — a estática equivalente é descartada */
const JA_DINAMICAS = new Set([
  'caro-mensal', 'prefiro-ter', 'preso-contrato', 'rodo-muito', 'vou-pensar',
  'falar-com-esposa', 'vi-mais-barato', 'analise-aprovacao',
]);

const FAMILIAS = new Set([
  'preco', 'posse', 'compromisso', 'km', 'seguro', 'manutencao', 'terceiro',
  'concorrente', 'adiamento', 'credito', 'pj', 'confianca', 'veiculo', 'troca',
  'emocional', 'regional',
]);

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const itens = [];
const erros = [];
for (const o of bruto) {
  if (JA_DINAMICAS.has(o.id)) continue;
  if (!FAMILIAS.has(o.familia)) { erros.push(`família desconhecida em ${o.id}: ${o.familia}`); continue; }
  if (!Array.isArray(o.gatilhos) || o.gatilhos.length < 6) { erros.push(`poucos gatilhos em ${o.id}`); continue; }
  for (const campo of ['rotulo', 'fala', 'devolucao', 'evite']) {
    if (typeof o[campo] !== 'string' || !o[campo].trim()) erros.push(`campo vazio: ${o.id}.${campo}`);
  }
  itens.push(o);
}
if (erros.length) {
  console.error('✗ catálogo com problema:\n  ' + erros.join('\n  '));
  process.exit(1);
}

const linhas = itens.map(
  (o) => `  {
    id: '${esc(o.id)}',
    familia: '${o.familia}',
    rotulo: '${esc(o.rotulo)}',
    gatilhos: [${o.gatilhos.map((g) => `'${esc(g)}'`).join(', ')}],
    fala: '${esc(o.fala)}',
    devolucao: '${esc(o.devolucao)}',
    evite: '${esc(o.evite)}',
  },`,
);

writeFileSync(
  join(raiz, 'packages', 'web', 'src', 'lib', 'objecoes.ts'),
  `/* GERADO por scripts/gerar-objecoes.mjs — não edite à mão.
 *
 * Catálogo nacional de objeções de venda de assinatura de veículos.
 * Prosa SEM NÚMERO de propósito: número envelhece e varia por contrato.
 * Os valores da simulação aberta aparecem numa faixa própria no Copiloto.
 *
 * ATENÇÃO ao usar: algumas falas descrevem regras de contrato (franquia,
 * participação em sinistro, carro reserva, prazo de saída). Cada locadora
 * precisa conferir se a redação bate com o contrato DELA antes de usar em
 * atendimento — prometer o que a empresa não pratica é o pior desfecho.
 */
import type { Familia } from './negociacao';

export interface ObjecaoEstatica {
  id: string;
  familia: Familia;
  rotulo: string;
  gatilhos: string[];
  fala: string;
  devolucao: string;
  evite: string;
}

export const CATALOGO_OBJECOES: ObjecaoEstatica[] = [
${linhas.join('\n')}
];
`,
);

const porFamilia = {};
for (const o of itens) porFamilia[o.familia] = (porFamilia[o.familia] ?? 0) + 1;
console.log(`✓ objecoes.ts — ${itens.length} estáticas + 8 dinâmicas = ${itens.length + 8} no total`);
console.log(
  '  por família: ' +
    Object.entries(porFamilia).sort((a, b) => b[1] - a[1]).map(([f, n]) => `${f} ${n}`).join(' · '),
);
