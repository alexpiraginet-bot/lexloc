/**
 * Prepara a arte da história para embutir no HTML off-line.
 *
 * Teto de 90 KB para os seis quadros: o arquivo do cliente tem 333 KB e
 * viaja por WhatsApp. Arte chapada comprime muito bem em WEBP, então 640px
 * de largura com qualidade 68 já cobre tela retina no tamanho exibido.
 *
 *   node scripts/historia-otimizar.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(raiz, 'packages', 'web', 'src', 'historia');
const PY = 'C:/Users/R2/IA/ComfyUI_windows_portable/python_embeded/python.exe';
if (!existsSync(PY)) throw new Error(`python do ComfyUI não encontrado: ${PY}`);

/** acima disto o arquivo off-line engorda demais para mandar por WhatsApp */
const TETO_TOTAL = 90_000;

const script = `
import sys, io
from PIL import Image
origem, destino = sys.argv[1], sys.argv[2]
im = Image.open(origem).convert("RGB")
larg = 640
im = im.resize((larg, round(im.height * larg / im.width)), Image.LANCZOS)
im.save(destino, "WEBP", quality=68, method=6)
print(destino)
`;

const fotos = readdirSync(DIR).filter((f) => f.endsWith('.png')).sort();
if (!fotos.length) throw new Error('sem PNG em src/fotos — rode fotos-categoria.mjs antes');

const linhas = [];
let total = 0;
for (const png of fotos) {
  const id = png.replace(/\.png$/, '');
  const webp = join(DIR, `${id}.webp`);
  execFileSync(PY, ['-c', script, join(DIR, png), webp], { stdio: 'pipe' });
  const b64 = readFileSync(webp).toString('base64');
  total += b64.length;
  linhas.push(`  '${id}': 'data:image/webp;base64,${b64}',`);
  console.log(`· ${id} → ${Math.round(b64.length / 1000)} KB`);
}

if (total > TETO_TOTAL) {
  console.error(`\n✗ ${Math.round(total / 1000)} KB no total — acima do teto de ${TETO_TOTAL / 1000} KB.`);
  console.error('  reduza a largura ou a qualidade em historia-otimizar.mjs.');
  process.exit(1);
}

writeFileSync(
  join(DIR, 'quadros.ts'),
  `/* GERADO por scripts/historia-otimizar.mjs — não edite à mão.
 *
 * Arte da sequência animada do resultado, gerada no FLUX local. Sem letra e
 * sem número de propósito: o texto entra por cima, em React, com os valores
 * REAIS da simulação de cada cliente e a marca de cada locadora.
 */
export const QUADROS_HISTORIA: Record<string, string> = {
${linhas.join('\n')}
};
`,
);
console.log(`\n✓ quadros.ts — ${Math.round(total / 1000)} KB embutidos`);
