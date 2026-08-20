/*
 * Gera os ARTEFATOS ESTÁTICOS do PWA — ícones, manifesto, QR e o cartão de
 * mesa. Roda uma vez e o resultado é COMMITADO em site/: o Vercel publica a
 * pasta como está (buildCommand vazio), então nada pode depender de gerar
 * na hora do deploy.
 *
 *   node scripts/pwa.mjs
 *
 * O service worker NÃO sai daqui: ele é carimbado a cada `npm run publicar`
 * com o hash do app.html (ver publicar.mjs) — versão de cache é assunto de
 * build, não de arte.
 *
 * Precisa de python3 com Pillow (ícones) e qrcode (QR):
 *   pip install pillow qrcode
 *
 * ── por que estes ícones ──
 * A marca do favicon: disco roxo #892991 com miolo laranja #F19D38. Os
 * PNGs repetem exatamente isso — 192/512 "any" com fundo transparente, e o
 * "maskable" com o roxo sangrando a borda inteira (o launcher do Android
 * recorta ~20% da margem; arte que não sangra vira selo flutuando). O
 * apple-touch-icon leva fundo cheio porque o iOS não aceita transparência.
 *
 * ── por que o QR aponta para /app.html e não para um link mágico ──
 * O QR da mesa é IMPRESSO: precisa valer por meses. Um link mágico carrega
 * a proposta de UM cliente; a mesa atende todos. E o payload curto dá um
 * QR versão 3 (29 módulos), que escaneia de longe e torto — QR denso em
 * papel plastificado na mesa é QR que não lê.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(raiz, 'site');
const URL_APP = 'https://www.uselexgo.com/app.html';

/* ── ícones ─────────────────────────────────────────────────────────── */
try {
  execFileSync('python3', ['-c', 'import PIL, qrcode'], { stdio: 'ignore' });
} catch {
  console.error('✗ preciso de python3 com Pillow e qrcode:  pip install pillow qrcode');
  process.exit(1);
}

execFileSync(
  'python3',
  [
    '-c',
    `
import sys
from PIL import Image, ImageDraw

ROXO = (0x89, 0x29, 0x91, 255)
LARANJA = (0xF1, 0x9D, 0x38, 255)
S = 4  # desenha 4x maior e reduz: círculo sem serrilhado

def disco(d, cx, cy, r, cor):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=cor)

def icone(tam, modo):
    T = tam * S
    if modo == 'any':
        im = Image.new('RGBA', (T, T), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        disco(d, T / 2, T / 2, T * 0.47, ROXO)     # mesma geometria do favicon
        disco(d, T / 2, T / 2, T * 0.1875, LARANJA)
    else:  # maskable / apple: fundo sangra a borda inteira
        im = Image.new('RGBA', (T, T), ROXO)
        d = ImageDraw.Draw(im)
        disco(d, T / 2, T / 2, T * 0.20, LARANJA)
    return im.resize((tam, tam), Image.LANCZOS)

dest = sys.argv[1] if len(sys.argv) > 1 else 'site'
icone(192, 'any').save(f'{dest}/icone-192.png', optimize=True)
icone(512, 'any').save(f'{dest}/icone-512.png', optimize=True)
icone(512, 'mask').save(f'{dest}/icone-512-mask.png', optimize=True)
icone(180, 'mask').convert('RGB').save(f'{dest}/apple-touch-icon.png', optimize=True)
print('icones ok')
`,
    site,
  ],
  { stdio: 'inherit' },
);

/* ── manifesto ──────────────────────────────────────────────────────── */
const manifesto = {
  name: 'LexGo — Assinar ou comprar?',
  short_name: 'LexGo',
  description:
    'A conta completa entre assinatura, compra à vista e financiamento — grátis, sem cadastro, funciona sem internet.',
  id: '/app.html',
  start_url: '/app.html',
  // escopo colado no app: instalado, ele nunca "vaza" para a landing nem
  // para as páginas da equipe
  scope: '/app.html',
  display: 'standalone',
  background_color: '#fbf9fd',
  theme_color: '#892991',
  icons: [
    { src: '/icone-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icone-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icone-512-mask.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
writeFileSync(join(site, 'manifest.webmanifest'), JSON.stringify(manifesto, null, 2) + '\n');
console.log('manifesto ok');

/* ── QR ─────────────────────────────────────────────────────────────── */
const qrSvg = execFileSync(
  'python3',
  [
    '-c',
    `
import sys, io, qrcode, qrcode.image.svg
q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0, box_size=1)
q.add_data(sys.argv[1])
q.make()
img = q.make_image(image_factory=qrcode.image.svg.SvgPathImage)
buf = io.BytesIO(); img.save(buf)
print(buf.getvalue().decode())
# border=4 e o MINIMO da especificacao (zona de silencio): com 2, o leitor
# do OpenCV ja nao decodificava o PNG avulso. No cartao a moldura branca
# supre a zona; no PNG solto nao ha moldura nenhuma alem desta.
q2 = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=4, box_size=16)
q2.add_data(sys.argv[1]); q2.make()
q2.make_image(fill_color='black', back_color='white').save(sys.argv[2])
`,
    URL_APP,
    join(site, 'qr-app.png'),
  ],
  { encoding: 'utf8' },
).trim();

// o path do QR entra inline no cartão — impressão nítida em qualquer escala.
// O espaço antes do d= não é enfeite: o elemento termina em id="qr-path", e
// um [^>]* guloso engolia o d verdadeiro e casava com o rabo do id — o
// cartão saiu com moldura vazia na primeira geração.
const pathQr = qrSvg.match(/ d="([^"]+)"/)?.[1];
const caixaQr = qrSvg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 29 29';
if (!pathQr || pathQr.length < 500 || !pathQr.startsWith('M')) {
  console.error('✗ path do QR ausente ou curto demais — a lib mudou de formato?');
  console.error(`  capturado: ${String(pathQr).slice(0, 60)}`);
  process.exit(1);
}
console.log('qr ok');

/* ── cartão de mesa ─────────────────────────────────────────────────── */
/*
 * A6 (105×148mm), para imprimir e plastificar. Autocontido como tudo aqui:
 * fonte do sistema, QR inline, zero requisição. `noindex` porque é
 * utilitário de balcão, não página de produto.
 */
const mesa = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>LexGo · QR da mesa</title>
<style>
  :root { --roxo: #892991; --roxo-fundo: #731691; --tinta: #1c1230; --papel: #fbf9fd; }
  * { margin: 0; box-sizing: border-box; }
  body {
    font: 400 16px/1.5 ui-sans-serif, -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: #e9e2ef; color: var(--tinta);
    min-height: 100vh; display: grid; place-items: center; padding: 24px;
  }
  .cartao {
    width: 105mm; height: 148mm; background: var(--papel);
    border-radius: 14px; box-shadow: 0 18px 44px -18px rgba(60, 20, 70, 0.5);
    padding: 11mm 10mm; display: flex; flex-direction: column; align-items: center;
    text-align: center;
  }
  .marca { display: flex; align-items: center; gap: 7px; }
  .marca svg { width: 22px; height: 22px; }
  .marca b { font-size: 17px; letter-spacing: 0.01em; }
  h1 { font-size: 24px; line-height: 1.2; margin-top: 9mm; }
  h1 i { font-style: normal; color: var(--roxo); }
  p.sub { font-size: 13.5px; color: #574d63; margin-top: 2mm; }
  .qr {
    margin-top: 8mm; padding: 5mm; background: #fff;
    border: 2px solid var(--roxo); border-radius: 12px;
  }
  .qr svg { display: block; width: 52mm; height: 52mm; }
  p.como { font-size: 13.5px; margin-top: 6mm; font-weight: 600; }
  p.url { font-family: ui-monospace, Menlo, monospace; font-size: 12.5px; color: var(--roxo-fundo); margin-top: 1.5mm; }
  .pe { margin-top: auto; font-size: 11px; color: #6e6675; }
  .imprimir {
    margin-top: 18px; min-height: 44px; padding: 10px 22px; border: 0;
    border-radius: 99px; background: var(--roxo); color: #fff;
    font: 600 14px/1 inherit; cursor: pointer;
  }
  @media print {
    body { background: #fff; padding: 0; display: block; }
    .cartao { box-shadow: none; border-radius: 0; }
    .imprimir { display: none; }
  }
  @page { size: A6 portrait; margin: 0; }
</style>
</head>
<body>
<div>
  <div class="cartao">
    <div class="marca">
      <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#892991"/><circle cx="16" cy="16" r="6" fill="#F19D38"/></svg>
      <b>LexGo</b>
    </div>
    <h1>Assinar ou comprar?<br /><i>Faça a conta.</i></h1>
    <p class="sub">Todos os custos, impostos e o rendimento<br />do seu dinheiro — em um minuto.</p>
    <div class="qr">
      <svg viewBox="${caixaQr}" role="img" aria-label="QR code para abrir a calculadora LexGo"><path d="${pathQr}" fill="#1c1230"/></svg>
    </div>
    <p class="como">Aponte a câmera do celular</p>
    <p class="url">uselexgo.com/app.html</p>
    <p class="pe">Grátis · sem cadastro · seus dados não saem do seu celular</p>
  </div>
  <center><button type="button" class="imprimir" onclick="print()">Imprimir cartão (A6)</button></center>
</div>
</body>
</html>
`;
writeFileSync(join(site, 'mesa.html'), mesa);
console.log('cartão de mesa ok — site/mesa.html');

/* conferência final: nada pode ter ficado pela metade */
for (const f of ['icone-192.png', 'icone-512.png', 'icone-512-mask.png', 'apple-touch-icon.png', 'manifest.webmanifest', 'qr-app.png', 'mesa.html']) {
  readFileSync(join(site, f));
}
console.log('✓ artefatos do PWA prontos em site/');
