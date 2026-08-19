/**
 * Fotos de categoria para os cards — geradas no FLUX local.
 *
 * Uma foto por CATEGORIA (não por modelo): carro genérico, mesmo estúdio,
 * mesmo ângulo 3/4, mesma luz, fundo neutro. Assim o catálogo fica com
 * padrão único — que era o pedido — sem depender de banco de imagem e sem
 * estampar marca de montadora que a locadora não representa.
 *
 * A locadora sobrepõe qualquer uma delas com a foto real da frota, pela
 * Retaguarda. Aí sim é o carro exato, na cor exata.
 *
 *   node scripts/fotos-categoria.mjs
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(raiz, 'packages', 'web', 'src', 'fotos');
const COMFY = 'http://127.0.0.1:8188';

/** o que não muda entre as categorias — é isto que garante o padrão único */
const ESTILO =
  'photographed at a 45 degree three-quarter angle showing the front and the driver side, ' +
  'the car is turned diagonally to the camera, professional automotive studio photograph, ' +
  'seamless light grey studio backdrop, soft large softbox from upper left, ' +
  'subtle floor reflection, completely blank smooth grille with no emblem and no badge, ' +
  'unbranded generic concept vehicle, empty license plate area, no text anywhere, ' +
  'no people, photorealistic, sharp focus, commercial catalogue photography';

const CATEGORIAS = [
  { id: 'popular', o: 'a modern compact silver hatchback city car' },
  { id: 'hatch', o: 'a modern white compact sedan' },
  { id: 'suvc', o: 'a modern compact crossover SUV in dark grey' },
  { id: 'suvm', o: 'a modern midsize SUV in deep blue' },
  { id: 'picape', o: 'a modern midsize pickup truck in silver' },
  { id: 'hibrido', o: 'a modern hybrid crossover SUV in pearl white' },
  { id: 'eletrico', o: 'a modern electric compact car in light blue, closed grille' },
];

const grafo = (prompt, semente) => ({
  '1': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'flux1-dev-fp8.safetensors' } },
  '2': { class_type: 'CLIPTextEncode', inputs: { text: prompt, clip: ['1', 1] } },
  '3': { class_type: 'CLIPTextEncode', inputs: { text: '', clip: ['1', 1] } },
  '4': { class_type: 'EmptyLatentImage', inputs: { width: 768, height: 432, batch_size: 1 } },
  '5': {
    class_type: 'KSampler',
    inputs: {
      seed: semente, steps: 20, cfg: 1, sampler_name: 'euler', scheduler: 'simple',
      denoise: 1, model: ['1', 0], positive: ['2', 0], negative: ['3', 0], latent_image: ['4', 0],
    },
  },
  '6': { class_type: 'VAEDecode', inputs: { samples: ['5', 0], vae: ['1', 2] } },
  '7': { class_type: 'SaveImage', inputs: { filename_prefix: 'lexgo-cat', images: ['6', 0] } },
});

async function gerar(cat, i) {
  const prompt = `${cat.o}, ${ESTILO}`;
  const r = await fetch(`${COMFY}/prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // semente fixa por categoria: mesma foto toda vez que rodar
    body: JSON.stringify({ prompt: grafo(prompt, 202608 + i * 7) }),
  });
  if (!r.ok) throw new Error(`ComfyUI recusou ${cat.id}: ${r.status}`);
  const { prompt_id } = await r.json();

  // espera o job sair da fila
  for (let t = 0; t < 180; t++) {
    await new Promise((ok) => setTimeout(ok, 2000));
    const h = await (await fetch(`${COMFY}/history/${prompt_id}`)).json();
    const item = h[prompt_id];
    if (!item) continue;
    const img = item.outputs?.['7']?.images?.[0];
    if (!img) continue;
    const url =
      `${COMFY}/view?filename=${encodeURIComponent(img.filename)}` +
      `&subfolder=${encodeURIComponent(img.subfolder ?? '')}&type=${img.type ?? 'output'}`;
    const bytes = Buffer.from(await (await fetch(url)).arrayBuffer());
    return bytes;
  }
  throw new Error(`tempo esgotado em ${cat.id}`);
}

if (!existsSync(SAIDA)) mkdirSync(SAIDA, { recursive: true });

const mapa = {};
for (const [i, cat] of CATEGORIAS.entries()) {
  process.stdout.write(`· ${cat.id} … `);
  const png = await gerar(cat, i);
  writeFileSync(join(SAIDA, `${cat.id}.png`), png);
  mapa[cat.id] = `${cat.id}.png`;
  console.log(`${Math.round(png.length / 1000)} KB`);
}

console.log('\n✓ fotos em packages/web/src/fotos/');
console.log('  Próximo: node scripts/fotos-otimizar.mjs (recorta, comprime e embute)');
