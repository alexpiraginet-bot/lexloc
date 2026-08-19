/**
 * Imagem de prévia de link (Open Graph) — a que o WhatsApp mostra.
 *
 * Sem ela o cartão sai só com título e texto, que era o caso: `app.html`,
 * o arquivo que o vendedor manda, não tinha NENHUMA tag Open Graph.
 *
 * Regras do WhatsApp que ditaram o formato:
 *   · a imagem é buscada por URL ABSOLUTA — data URI não serve, então ela
 *     mora em site/ e não embutida no HTML (não pesa no arquivo off-line);
 *   · acima de ~300 KB o WhatsApp desiste e mostra o cartão sem imagem, daí
 *     JPEG e o teto abaixo;
 *   · 1200×630 é o formato do cartão grande.
 *
 *   node scripts/og.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODELO = join(raiz, 'scripts', 'og', 'modelo.html');
const DESTINO = join(raiz, 'site', 'og.jpg');
/** acima disto o WhatsApp ignora a imagem e mostra o cartão pelado */
const TETO = 300_000;

async function abrir() {
  for (const o of [
    process.env['LEXGO_CHROMIUM'] && { executablePath: process.env['LEXGO_CHROMIUM'] },
    { executablePath: '/opt/pw-browsers/chromium' },
    { channel: 'msedge' },
    { channel: 'chrome' },
    {},
  ].filter(Boolean)) {
    try {
      return await chromium.launch(o);
    } catch {
      /* próximo */
    }
  }
  return null;
}

const nav = await abrir();
if (!nav) {
  console.error('✗ não achei navegador. LEXGO_CHROMIUM=/caminho/do/chrome node scripts/og.mjs');
  process.exit(1);
}
const pg = await nav.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await pg.goto(`file://${MODELO}`, { waitUntil: 'load' });
await pg.waitForTimeout(400);
const rascunho = mkdtempSync(join(tmpdir(), 'lexgo-og-'));
const png = join(rascunho, 'og.png');
await pg.screenshot({ path: png });
await nav.close();

/* PNG → JPEG: o fundo é degradê, e em PNG isso passa de 900 KB */
const py = ['python3', 'python', process.env['LEXGO_PYTHON']].filter(Boolean);
let python = null;
for (const p of py) {
  try {
    execFileSync(p, ['-c', 'import PIL'], { stdio: 'ignore' });
    python = p;
    break;
  } catch {
    /* próximo */
  }
}
if (!python) {
  console.error('✗ não achei python com Pillow.  pip install pillow');
  process.exit(1);
}
execFileSync(python, [
  '-c',
  `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB")
im.save(sys.argv[2], "JPEG", quality=88, optimize=True, progressive=True)`,
  png,
  DESTINO,
]);

rmSync(rascunho, { recursive: true, force: true });

const bytes = readFileSync(DESTINO).length;
if (bytes > TETO) {
  console.error(`✗ ${Math.round(bytes / 1000)} KB — acima do teto de ${TETO / 1000} KB do WhatsApp.`);
  console.error('  baixe a qualidade do JPEG em scripts/og.mjs.');
  process.exit(1);
}
console.log(`✓ site/og.jpg · 1200×630 · ${Math.round(bytes / 1000)} KB (teto ${TETO / 1000} KB)`);
