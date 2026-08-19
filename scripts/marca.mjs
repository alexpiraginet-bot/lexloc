/**
 * Encaixe da marca LexGo a partir de UM arquivo.
 *
 * Ponha o símbolo em `marca/lexgo-mark.png` (fundo branco ou transparente) e
 * rode `npm run marca`. O script recorta a margem, deixa o fundo transparente,
 * gera os tamanhos e escreve:
 *
 *   site/favicon.png                    → aba do navegador da landing
 *   packages/web/src/marca/simbolo.ts   → data URI usado no app e no PDF
 *
 * Depois rode `npm run publicar`. Nada aqui é gerado por IA em tempo de build:
 * o arquivo de origem é versionado e o resultado é determinístico.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEM = join(raiz, 'marca', 'lexgo-mark.png');

/**
 * Qual python usar. O dono roda no Windows com o do ComfyUI, que já vem com
 * PIL; a nuvem e o CI rodam com o do sistema. Em vez de fixar um caminho de
 * uma máquina só, procura — e exige que o PIL importe, porque python sem
 * Pillow só falha lá na frente, com erro que não diz o que fazer.
 */
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
      /* próximo candidato */
    }
  }
  return null;
}

/** o símbolo é embutido no HTML off-line: acima disto o arquivo engorda demais */
const TETO_BYTES = 12_000;

if (!existsSync(ORIGEM)) {
  console.error(`✗ não achei ${ORIGEM}`);
  console.error('  salve o símbolo da marca aí e rode de novo.');
  process.exit(1);
}
const PY = acharPython();
if (!PY) {
  console.error('✗ não achei um python com Pillow.');
  console.error('  instale:  pip install pillow');
  console.error('  ou aponte o seu:  LEXGO_PYTHON=/caminho/do/python npm run marca');
  process.exit(1);
}

const saidaWeb = join(raiz, 'packages', 'web', 'src', 'marca');
mkdirSync(saidaWeb, { recursive: true });
const favicon = join(raiz, 'site', 'favicon.png');
const simbolo = join(saidaWeb, 'simbolo.png');

/*
 * Recorte + fundo transparente + redução, em PIL.
 * O branco vira alfa só nas bordas conectadas (flood fill a partir dos quatro
 * cantos), senão o miolo branco de um logotipo seria comido junto.
 */
const script = `
import sys
from PIL import Image, ImageDraw

orig, fav, simb = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(orig).convert("RGBA")

# fundo transparente a partir dos cantos, com tolerância para JPEG/antialias
larg, alt = im.size
fundo = im.getpixel((0, 0))
if fundo[3] > 0 and min(fundo[:3]) > 235:
    mascara = Image.new("L", (larg + 2, alt + 2), 0)
    for canto in ((0, 0), (larg - 1, 0), (0, alt - 1), (larg - 1, alt - 1)):
        ImageDraw.floodfill(im, canto, (0, 0, 0, 0), thresh=42)

# recorta a moldura vazia
caixa = im.getbbox()
if caixa:
    im = im.crop(caixa)

def salvar(destino, altura):
    escala = altura / im.height
    novo = im.resize((max(1, round(im.width * escala)), altura), Image.LANCZOS)
    novo.save(destino, "PNG", optimize=True)
    return novo.size

print("simbolo", *salvar(simb, 96))

# favicon quadrado, com o símbolo centralizado e uma folga de 6%
lado = 64
escala = (lado * 0.88) / max(im.size)
mini = im.resize((max(1, round(im.width * escala)), max(1, round(im.height * escala))), Image.LANCZOS)
quadro = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
quadro.paste(mini, ((lado - mini.width) // 2, (lado - mini.height) // 2), mini)
quadro.save(fav, "PNG", optimize=True)
print("favicon", lado, lado)
`;

const saida = execFileSync(PY, ['-c', script, ORIGEM, favicon, simbolo], {
  encoding: 'utf8',
});
console.log(saida.trim());

const bytes = readFileSync(simbolo);
if (bytes.length > TETO_BYTES) {
  console.error(
    `✗ símbolo com ${Math.round(bytes.length / 1000)} KB — acima do teto de ` +
      `${TETO_BYTES / 1000} KB para embutir no HTML off-line.`,
  );
  console.error('  simplifique o arquivo de origem (menos detalhe, menos cores).');
  process.exit(1);
}

writeFileSync(
  join(saidaWeb, 'simbolo.ts'),
  `/* GERADO por scripts/marca.mjs a partir de marca/lexgo-mark.png — não edite à mão. */
export const SIMBOLO_LEXGO =
  'data:image/png;base64,${bytes.toString('base64')}';
`,
);

console.log(`✓ favicon ${Math.round(statSync(favicon).size / 1000)} KB · símbolo ${Math.round(bytes.length / 1000)} KB`);
console.log('  agora rode: npm run publicar');
