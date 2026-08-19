/**
 * Prepara as fotos de categoria para embutir no HTML off-line.
 *
 * Os PNGs do FLUX têm ~300 KB cada; sete deles dobrariam o tamanho do
 * arquivo que a locadora manda por WhatsApp. Aqui eles viram WEBP de
 * largura 560 e qualidade 72 — o card exibe a ~180 px, então isso já é
 * o dobro da resolução necessária para tela retina.
 *
 * Saída: packages/web/src/fotos/categorias.ts (data URIs).
 *   node scripts/fotos-otimizar.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(raiz, 'packages', 'web', 'src', 'fotos');
const PY = 'C:/Users/R2/IA/ComfyUI_windows_portable/python_embeded/python.exe';
if (!existsSync(PY)) throw new Error(`python do ComfyUI não encontrado: ${PY}`);

/** acima disto o arquivo off-line engorda demais para mandar por WhatsApp */
const TETO_TOTAL = 220_000;

const script = `
import sys, io
from PIL import Image
origem, destino = sys.argv[1], sys.argv[2]
im = Image.open(origem).convert("RGB")
larg = 560
im = im.resize((larg, round(im.height * larg / im.width)), Image.LANCZOS)
im.save(destino, "WEBP", quality=72, method=6)
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
  linhas.push(`  ${id}: 'data:image/webp;base64,${b64}',`);
  console.log(`· ${id} → ${Math.round(b64.length / 1000)} KB`);
}

if (total > TETO_TOTAL) {
  console.error(`\n✗ ${Math.round(total / 1000)} KB no total — acima do teto de ${TETO_TOTAL / 1000} KB.`);
  console.error('  reduza a largura ou a qualidade em fotos-otimizar.mjs.');
  process.exit(1);
}

writeFileSync(
  join(DIR, 'categorias.ts'),
  `/* GERADO por scripts/fotos-otimizar.mjs — não edite à mão.
 *
 * Fotos de CATEGORIA, geradas no FLUX local (licença nossa): carro genérico,
 * mesmo estúdio e mesmo ângulo para todos. Não são fotos de modelo real, e é
 * de propósito — a locadora sobrepõe com a foto da frota dela na Retaguarda,
 * e aí sim é o carro exato que o cliente vai receber.
 */
export const FOTO_CATEGORIA: Record<string, string> = {
${linhas.join('\n')}
};
`,
);
console.log(`\n✓ categorias.ts — ${Math.round(total / 1000)} KB embutidos`);
