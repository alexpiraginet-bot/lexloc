/**
 * TESTE DE ESTILO — quadrinhos para o vídeo explicativo.
 *
 * O ambiente tem FLUX puro (sem ControlNet, IPAdapter ou LoRA), então
 * personagem recorrente NÃO se sustenta: a cara muda a cada frame. Este
 * teste verifica a hipótese que contorna isso — cenas de OBJETOS em estilo
 * chapado e paleta travada, que o FLUX repete bem.
 *
 * Nada de texto ou número na imagem: o FLUX erra letra, e além disso é o
 * texto que precisa mudar por locadora. Ele entra depois, no Remotion.
 *
 *   node scripts/quadrinhos-teste.mjs
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(raiz, '.quadrinhos');
const COMFY = 'http://127.0.0.1:8188';

/* A trava do estilo. Repetida palavra por palavra em todos os frames — é
   ela que faz oito imagens parecerem do mesmo desenhista. */
const ESTILO =
  'flat vector cartoon illustration, bold uniform black outlines, simple geometric shapes, ' +
  'limited palette of deep purple and warm gold and cream white, subtle paper grain, ' +
  'centered composition on plain cream background, generous empty margin, ' +
  'no text, no letters, no numbers, no words, no signage, no logos, ' +
  'clean childrens-book clarity, editorial explainer style';

/* As cenas são OBJETOS e SITUAÇÕES, não uma pessoa que precisa ser a mesma. */
const CENAS = [
  {
    id: '1-contas',
    o:
      'a small car surrounded by a floating cloud of paper bills and envelopes and a wrench ' +
      'and a tire, papers scattered chaotically around it, feeling of accumulation',
  },
  {
    id: '2-parcela',
    o:
      'a single clean envelope with a calendar page beside it and one car key resting on top, ' +
      'orderly and calm arrangement, feeling of one simple monthly payment',
  },
  {
    id: '3-desvaloriza',
    o:
      'a car on top of a descending staircase of blocks going down to the right, ' +
      'each step lower than the previous, feeling of losing value over time',
  },
  {
    id: '4-chave',
    o:
      'an open hand giving back a car key, a car driving away in the background, ' +
      'feeling of handing over responsibility and walking away free',
  },
];

const grafo = (prompt, semente) => ({
  '1': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'flux1-dev-fp8.safetensors' } },
  '2': { class_type: 'CLIPTextEncode', inputs: { text: prompt, clip: ['1', 1] } },
  '3': { class_type: 'CLIPTextEncode', inputs: { text: '', clip: ['1', 1] } },
  '4': { class_type: 'EmptyLatentImage', inputs: { width: 832, height: 480, batch_size: 1 } },
  '5': {
    class_type: 'KSampler',
    inputs: {
      seed: semente, steps: 22, cfg: 1, sampler_name: 'euler', scheduler: 'simple',
      denoise: 1, model: ['1', 0], positive: ['2', 0], negative: ['3', 0], latent_image: ['4', 0],
    },
  },
  '6': { class_type: 'VAEDecode', inputs: { samples: ['5', 0], vae: ['1', 2] } },
  '7': { class_type: 'SaveImage', inputs: { filename_prefix: 'lexgo-hq', images: ['6', 0] } },
});

async function gerar(cena, semente) {
  const r = await fetch(`${COMFY}/prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: grafo(`${cena.o}, ${ESTILO}`, semente) }),
  });
  if (!r.ok) throw new Error(`ComfyUI recusou ${cena.id}: ${r.status}`);
  const { prompt_id } = await r.json();
  for (let t = 0; t < 200; t++) {
    await new Promise((ok) => setTimeout(ok, 2000));
    const h = await (await fetch(`${COMFY}/history/${prompt_id}`)).json();
    const img = h[prompt_id]?.outputs?.['7']?.images?.[0];
    if (!img) continue;
    const url =
      `${COMFY}/view?filename=${encodeURIComponent(img.filename)}` +
      `&subfolder=${encodeURIComponent(img.subfolder ?? '')}&type=${img.type ?? 'output'}`;
    return Buffer.from(await (await fetch(url)).arrayBuffer());
  }
  throw new Error(`tempo esgotado em ${cena.id}`);
}

if (!existsSync(SAIDA)) mkdirSync(SAIDA, { recursive: true });
// semente igual para todos: mais uma amarra de consistência de estilo
for (const cena of CENAS) {
  process.stdout.write(`· ${cena.id} … `);
  const png = await gerar(cena, 77_2026);
  writeFileSync(join(SAIDA, `${cena.id}.png`), png);
  console.log(`${Math.round(png.length / 1000)} KB`);
}
console.log('\n✓ frames em .quadrinhos/ — avaliar CONSISTÊNCIA entre eles antes de seguir');
