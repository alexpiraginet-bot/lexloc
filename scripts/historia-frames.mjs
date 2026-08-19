/**
 * A HISTÓRIA — arte dos quadros da sequência animada do resultado.
 *
 * Vive DENTRO do app, não como vídeo: um MP4 de 30 s são megabytes, e o
 * arquivo do cliente tem 333 KB e precisa abrir sem internet. Aqui a arte
 * é estática (WebP de ~10 KB cada) e o movimento é CSS — com a vantagem
 * de cada quadro mostrar o número REAL da simulação, não um genérico.
 *
 * Sem personagem recorrente de propósito: o FLUX está sem ControlNet e
 * sem IPAdapter, então cara de pessoa muda a cada frame. A história é
 * contada por objetos, que o estilo chapado repete bem.
 *
 * Nenhuma letra ou número na arte — o FLUX erra letra, e é justamente o
 * texto que muda por locadora e por cliente.
 *
 *   node scripts/historia-frames.mjs
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(raiz, 'packages', 'web', 'src', 'historia');
const COMFY = 'http://127.0.0.1:8188';

/* A trava de estilo — repetida palavra por palavra. É ela que faz seis
   imagens parecerem do mesmo desenhista. Não mexer sem regerar todas. */
const ESTILO =
  'flat vector cartoon illustration, bold uniform black outlines, simple geometric shapes, ' +
  'limited palette of deep purple and warm gold and cream white, subtle paper grain, ' +
  'centered composition on plain cream background, generous empty margin, ' +
  'no text, no letters, no numbers, no words, no signage, no logos, ' +
  'clean childrens-book clarity, editorial explainer style';

const QUADROS = [
  {
    id: '1-hoje',
    o:
      'a small car surrounded by a floating cloud of paper bills and envelopes and a wrench ' +
      'and a tire, papers scattered chaotically around it, feeling of accumulation',
  },
  {
    id: '2-desvaloriza',
    // corrigido: no teste a escada SUBIA, e desvalorização precisa descer
    o:
      'a car sliding down a steep descending ramp that goes from upper left to lower right, ' +
      'the ramp clearly points downward, small dust puffs behind it, feeling of falling value',
  },
  {
    id: '3-oficina',
    o:
      'a car raised on a workshop lift with a wrench and an oil can and a tire beside it, ' +
      'tools arranged around, feeling of maintenance and unexpected repair',
  },
  {
    id: '4-parcela',
    o:
      'a single clean envelope with a calendar page beside it and one car key resting on top, ' +
      'orderly and calm arrangement, feeling of one simple monthly payment',
  },
  {
    id: '5-chave',
    o:
      'an open hand giving back a car key, a car driving away in the background, ' +
      'feeling of handing over responsibility and walking away free',
  },
  {
    id: '6-livre',
    o:
      'a stack of coins and a small potted plant growing beside it, a paper airplane flying up, ' +
      'open and airy composition, feeling of money kept and freedom',
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
  '7': { class_type: 'SaveImage', inputs: { filename_prefix: 'lexgo-hist', images: ['6', 0] } },
});

async function gerar(q) {
  const r = await fetch(`${COMFY}/prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // semente única para todos: mais uma amarra de consistência
    body: JSON.stringify({ prompt: grafo(`${q.o}, ${ESTILO}`, 77_2026) }),
  });
  if (!r.ok) throw new Error(`ComfyUI recusou ${q.id}: ${r.status}`);
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
  throw new Error(`tempo esgotado em ${q.id}`);
}

if (!existsSync(SAIDA)) mkdirSync(SAIDA, { recursive: true });
for (const q of QUADROS) {
  process.stdout.write(`· ${q.id} … `);
  const png = await gerar(q);
  writeFileSync(join(SAIDA, `${q.id}.png`), png);
  console.log(`${Math.round(png.length / 1000)} KB`);
}
console.log('\n✓ arte em packages/web/src/historia/');
console.log('  Próximo: node scripts/historia-otimizar.mjs');
