/**
 * Fotos POR MODELO para os cards do catálogo.
 *
 * As fotos de categoria (scripts/fotos-categoria.mjs) dão padrão único, mas
 * um Kwid e um Compass viram o mesmo carro genérico na tela. Estas são do
 * modelo em si.
 *
 * ── decisão do dono, registrada ──
 * Puxar a semelhança do modelo real aproxima a imagem do *trade dress* da
 * montadora, e tirar o emblema não tira a semelhança. Levantei isso e o dono
 * assumiu o risco conscientemente. O prompt continua proibindo emblema,
 * badge, nome e qualquer letra — o que se busca é a silhueta, não a marca.
 *
 * A locadora ainda sobrepõe qualquer uma pela Retaguarda, e aí é o carro
 * exato da frota dela.
 *
 *   OPENAI_API_KEY=sk-... node scripts/fotos-modelo.mjs [--so=nome-parcial]
 *
 * A chave NUNCA entra no repositório. Sem ela o script recusa rodar.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const FONTE = join(raiz, 'fotos-fonte');   // PNGs grandes, fora do git
const SAIDA = join(raiz, 'packages', 'web', 'src', 'fotos');

const CHAVE = process.env['OPENAI_API_KEY'];
if (!CHAVE) {
  console.error('✗ falta OPENAI_API_KEY no ambiente.');
  console.error('  OPENAI_API_KEY=sk-... node scripts/fotos-modelo.mjs');
  process.exit(1);
}

/** o que NÃO muda entre os modelos — é isto que mantém o padrão do catálogo */
const ESTILO =
  'photographed at a 45 degree three-quarter angle showing the front and the driver side, ' +
  'the car is turned diagonally to the camera, professional automotive studio photograph, ' +
  'seamless light grey studio backdrop, soft large softbox from upper left, ' +
  'subtle floor reflection. CRITICAL: completely blank smooth grille with no emblem, ' +
  'no badge, no manufacturer logo, no model name, no lettering anywhere on the car, ' +
  'no wheel centre logo, empty license plate area. No people. ' +
  'Photorealistic, sharp focus, commercial catalogue photography.';

/** corpo + cor por modelo. A cor varia para o catálogo não virar monocromia. */
const MODELOS = [
  ['Toyota Yaris Cross XR', 'a Toyota Yaris Cross compact crossover SUV, pearl white'],
  ['BYD Dolphin Mini GL', 'a BYD Dolphin Mini small electric hatchback, light blue, closed smooth front'],
  ['BYD Dolphin GS', 'a BYD Dolphin electric hatchback, white with dark roof, closed smooth front'],
  ['BYD King GL DM-i', 'a BYD King plug-in hybrid sedan, dark grey'],
  ['BYD Song Pro GL', 'a BYD Song Pro hybrid crossover SUV, silver'],
  ['BYD Song Plus', 'a BYD Song Plus hybrid midsize SUV, pearl white'],
  ['BYD Song Plus Premium', 'a BYD Song Plus hybrid midsize SUV, deep blue'],
  ['Denza B5', 'a Denza B5 boxy off-road hybrid SUV, dark green'],
  ['Renault Kwid Zen', 'a Renault Kwid tiny city hatchback, orange'],
  ['Chevrolet Onix 1.0', 'a Chevrolet Onix compact hatchback, silver'],
  ['VW Polo Track', 'a Volkswagen Polo compact hatchback, white'],
  ['Hyundai HB20 Limited', 'a Hyundai HB20 compact hatchback, dark grey'],
  ['Fiat Argo Drive', 'a Fiat Argo compact hatchback, red'],
  ['Fiat Pulse Drive', 'a Fiat Pulse compact crossover SUV, white'],
  ['Jeep Renegade Sport', 'a Jeep Renegade boxy compact SUV, dark blue'],
  ['Nissan Kicks', 'a Nissan Kicks compact crossover SUV, silver with black roof'],
  ['VW T-Cross Sense', 'a Volkswagen T-Cross compact crossover SUV, white'],
  ['Hyundai Creta Comfort', 'a Hyundai Creta compact crossover SUV, dark grey'],
  ['Toyota Corolla XEi', 'a Toyota Corolla sedan, pearl white'],
  ['Toyota Corolla Cross XR', 'a Toyota Corolla Cross midsize SUV, silver'],
  ['Jeep Compass Sport', 'a Jeep Compass midsize SUV, dark grey'],
  ['Corolla Cross Hybrid', 'a Toyota Corolla Cross hybrid midsize SUV, deep blue'],
];

/** o card exibe a ~180 px de largura; 480 cobre retina com folga */
const LARGURA = 480;
const QUALIDADE = 60;
/** o mesmo teto de scripts/fotos-otimizar.mjs: o off-line vai por WhatsApp */
const TETO_TOTAL = 220_000;

function acharPython() {
  const tentativas = [
    process.env['LEXGO_PYTHON'],
    'python3',
    'python',
    'C:/Users/R2/IA/ComfyUI_windows_portable/python_embeded/python.exe',
  ].filter((x) => typeof x === 'string' && x.length > 0);
  for (const py of tentativas) {
    try {
      execFileSync(py, ['-c', 'import PIL'], { stdio: 'ignore' });
      return py;
    } catch {
      /* próximo */
    }
  }
  return null;
}
const PY = acharPython();
if (!PY) {
  console.error('✗ não achei um python com Pillow.  pip install pillow');
  process.exit(1);
}

const so = process.argv.find((a) => a.startsWith('--so='))?.slice(5)?.toLowerCase();
const fila = MODELOS.filter(([n]) => !so || n.toLowerCase().includes(so));
mkdirSync(FONTE, { recursive: true });

const arquivo = (nome) => nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function gerar([nome, corpo]) {
  const destino = join(FONTE, `${arquivo(nome)}.png`);
  if (existsSync(destino)) return { nome, destino, pulou: true };
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${CHAVE}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: `Studio catalogue photograph of ${corpo}. Faithful body proportions and silhouette of that model. ${ESTILO}`,
      size: '1536x1024',
      n: 1,
    }),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(`${nome}: ${j.error?.message ?? r.status}`);
  writeFileSync(destino, Buffer.from(j.data[0].b64_json, 'base64'));
  return { nome, destino, pulou: false };
}

/* três de cada vez: a API é lenta (~25 s) e serial levaria dez minutos */
const feitos = [];
for (let i = 0; i < fila.length; i += 3) {
  const lote = await Promise.allSettled(fila.slice(i, i + 3).map(gerar));
  for (const p of lote) {
    if (p.status === 'fulfilled') {
      feitos.push(p.value);
      console.log(`· ${p.value.nome}${p.value.pulou ? ' (já existia)' : ''}`);
    } else console.error(`✗ ${p.reason.message}`);
  }
}

/* PNG grande → WEBP estreito, o que de fato viaja no HTML */
const otimiza = `
import sys
from PIL import Image
origem, destino, larg, q = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
im = Image.open(origem).convert("RGB")
im = im.resize((larg, round(im.height * larg / im.width)), Image.LANCZOS)
im.save(destino, "WEBP", quality=q, method=6)
`;

const entradas = [];
let total = 0;
for (const [nome] of fila) {
  const png = join(FONTE, `${arquivo(nome)}.png`);
  if (!existsSync(png)) continue;
  const webp = join(SAIDA, `m-${arquivo(nome)}.webp`);
  execFileSync(PY, ['-c', otimiza, png, webp, String(LARGURA), String(QUALIDADE)]);
  const bytes = readFileSync(webp);
  total += bytes.length;
  entradas.push(`  ${JSON.stringify(nome)}:\n    'data:image/webp;base64,${bytes.toString('base64')}',`);
}

if (total > TETO_TOTAL) {
  console.error(`✗ ${Math.round(total / 1000)} KB de fotos — acima do teto de ${TETO_TOTAL / 1000} KB.`);
  console.error('  baixe LARGURA ou QUALIDADE e rode de novo.');
  process.exit(1);
}

writeFileSync(
  join(SAIDA, 'modelos.ts'),
  `/* GERADO por scripts/fotos-modelo.mjs — não edite à mão.
 *
 * Uma foto POR MODELO do catálogo. Sem emblema, sem badge, sem letra: o que
 * se busca é a silhueta do carro, não a marca da montadora. A locadora
 * sobrepõe qualquer uma pela Retaguarda, e aí é o carro exato da frota dela.
 */
export const FOTO_MODELO: Record<string, string> = {
${entradas.join('\n')}
};
`,
);
console.log(`\n✓ ${entradas.length} fotos · ${Math.round(total / 1000)} KB (teto ${TETO_TOTAL / 1000} KB)`);
console.log('  agora rode: npm run publicar');
