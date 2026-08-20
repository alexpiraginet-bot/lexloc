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
/*
 * O app instalado NÃO carrega o nome LexGo — decisão do dono: um app
 * genérico ("Calculadora de Assinatura") com as cores da identidade serve
 * TODA locadora que usar o produto, sem gerar um app por empresa. A marca
 * de cada loja aparece DENTRO do app, pelo sistema de marca de sempre.
 */
const manifesto = {
  name: 'Calculadora de Assinatura',
  short_name: 'Calculadora',
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
 * A6 (105×148mm), para imprimir e plastificar — agora com a MESMA
 * linguagem visual da calculadora: a atmosfera de radiais roxo/dourado
 * que respira, vidro com blur e a paleta inteira copiada de
 * packages/web/src/theme.css (mudou lá, muda aqui à mão — são 12 linhas).
 *
 * O botão "imprimir" sozinho falhava no celular (navegador embutido de
 * WhatsApp/Instagram ignora window.print). Por isso os downloads apontam
 * para ARQUIVOS ESTÁTICOS (/cartao-qr.png e /cartao-qr.pdf), gerados
 * logo abaixo e commitados — link direto para arquivo pronto funciona em
 * qualquer celular, sempre.
 *
 * `?exportar=1` liga o modo de captura: só o cartão, na medida exata de
 * impressão — é o que o Chromium fotografa para gerar o PNG.
 * Autocontido como tudo aqui: fonte do sistema, QR inline, zero
 * requisição. `noindex` porque é utilitário de balcão.
 */
const mesa = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<meta name="theme-color" content="#892991" />
<title>Calculadora de assinatura · QR da mesa</title>
<link rel="icon" type="image/png" href="/favicon.png" />
<style>
  :root {
    --brand: #8f31aa; --brand-deep: #892991; --brand-dark: #6b1f73;
    --brand-soft: #f3e9f8; --accent: #c9a227;
    --ink: #1a1520; --muted: #645b71; --paper: #fbf9fd; --line: #e7dff0;
    --vidro: color-mix(in srgb, var(--paper) 72%, transparent);
    --vidro-borda: color-mix(in srgb, var(--ink) 8%, transparent);
    --vidro-brilho: inset 0 1px 0 rgba(255, 255, 255, 0.65);
    --sh-2: 0 2px 4px rgba(58, 32, 74, 0.05), 0 12px 28px -14px rgba(58, 32, 74, 0.18);
    --sh-3: 0 8px 40px -12px rgba(107, 31, 115, 0.32);
    --e-out: cubic-bezier(0.22, 1, 0.36, 1);
  }
  * { margin: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html { overflow-x: hidden; }
  body {
    font: 400 16px/1.55 ui-sans-serif, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: var(--paper); color: var(--ink);
    min-height: 100dvh; overflow-x: hidden;
    display: grid; place-items: center; padding: 28px 16px 40px;
    -webkit-font-smoothing: antialiased;
  }
  /* a mesma atmosfera da calculadora — quatro radiais que respiram */
  body::before {
    content: ''; position: fixed; inset: -10% -10% auto; height: 120vh;
    z-index: -2; pointer-events: none; filter: saturate(1.25);
    background:
      radial-gradient(46vw 40vh at 12% 6%, color-mix(in srgb, var(--brand) 32%, transparent), transparent 62%),
      radial-gradient(40vw 36vh at 88% 12%, color-mix(in srgb, var(--accent) 30%, transparent), transparent 60%),
      radial-gradient(52vw 42vh at 74% 62%, color-mix(in srgb, var(--brand) 20%, transparent), transparent 64%),
      radial-gradient(38vw 34vh at 22% 88%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 62%);
  }
  @media (prefers-reduced-motion: no-preference) {
    body::before { animation: respirar 24s ease-in-out infinite alternate; }
  }
  @keyframes respirar {
    from { transform: translate3d(0, 0, 0) scale(1); }
    to { transform: translate3d(0, -2.5%, 0) scale(1.06); }
  }
  /* véu que segura o contraste do texto sobre a atmosfera */
  body::after {
    content: ''; position: fixed; inset: 0; z-index: -1; pointer-events: none;
    background: color-mix(in srgb, var(--paper) 42%, transparent);
  }
  main { display: flex; flex-direction: column; align-items: center; gap: 18px; }
  .cartao {
    width: min(105mm, 100%);
    aspect-ratio: 105 / 148;
    background:
      radial-gradient(46% 30% at 88% -4%, color-mix(in srgb, var(--accent) 13%, transparent), transparent 70%),
      radial-gradient(52% 34% at 6% 104%, color-mix(in srgb, var(--brand) 11%, transparent), transparent 70%),
      linear-gradient(180deg, #faf4fc, #ffffff 44%);
    border: 1px solid var(--line);
    border-radius: 20px;
    box-shadow: var(--sh-3), var(--sh-2), var(--vidro-brilho);
    padding: 9.5mm 9mm 7.5mm;
    display: flex; flex-direction: column; align-items: center; text-align: center;
  }
  .marca { display: flex; align-items: center; gap: 7px; }
  .marca svg { width: 21px; height: 21px; }
  .marca b { font-size: 15.5px; font-weight: 600; letter-spacing: -0.01em; }
  h1 { font-size: 25px; font-weight: 600; line-height: 1.18; letter-spacing: -0.02em; margin-top: 7mm; }
  h1 i {
    font-style: normal; font-weight: 700;
    background: linear-gradient(94deg, var(--brand-dark), var(--brand) 72%, var(--accent) 165%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  p.sub { font-size: 13px; line-height: 1.45; color: var(--muted); margin-top: 2.2mm; }
  .qr {
    margin-top: 6.5mm; padding: 4.5mm; background: #fff;
    border: 2px solid var(--brand-deep); border-radius: 14px;
    box-shadow: 0 1px 2px rgba(58, 32, 74, 0.07), 0 10px 26px -14px color-mix(in srgb, var(--brand-dark) 38%, transparent);
  }
  .qr svg { display: block; width: 47mm; height: 47mm; }
  .passos { display: flex; align-items: center; gap: 8px; margin-top: 5.5mm; font-size: 12px; font-weight: 600; }
  .passos b {
    display: inline-grid; place-items: center; width: 17px; height: 17px;
    border-radius: 99px; background: var(--brand-soft); color: var(--brand-dark);
    font-size: 10.5px; font-weight: 700; margin-right: 4px;
  }
  .passos i { font-style: normal; color: color-mix(in srgb, var(--muted) 55%, transparent); font-weight: 400; }
  p.url { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12.5px; color: var(--brand-dark); margin-top: 2mm; }
  .pe { margin-top: auto; font-size: 10.5px; line-height: 1.4; color: var(--muted); }
  .acoes { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
  .bt {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    min-height: 48px; padding: 12px 20px; border: 0; border-radius: 14px;
    font: 600 14.5px/1 inherit; text-decoration: none; cursor: pointer;
    transition: transform 0.18s var(--e-out), box-shadow 0.18s var(--e-out), background 0.18s var(--e-out);
  }
  .bt:active { transform: scale(0.97); }
  .bt svg { width: 19px; height: 19px; flex: none; }
  .bt-cheio { background: var(--brand-deep); color: #fff; box-shadow: var(--sh-2); }
  .bt-cheio:hover { background: var(--brand-dark); }
  .bt-vidro {
    background: var(--vidro); color: var(--brand-dark);
    border: 1px solid var(--vidro-borda); box-shadow: var(--vidro-brilho), var(--sh-2);
    backdrop-filter: saturate(1.8) blur(22px); -webkit-backdrop-filter: saturate(1.8) blur(22px);
  }
  .bt-vidro:hover { background: color-mix(in srgb, var(--paper) 86%, transparent); }
  /* sem border-radius aqui: o anel segue o raio do próprio elemento —
     forçar 8px "encolhia" o canto dos botões (14px) durante o foco */
  :focus-visible { outline: 3px solid color-mix(in srgb, var(--brand) 45%, transparent); outline-offset: 2px; }
  .dica { font-size: 12.5px; color: var(--muted); text-align: center; max-width: 46ch; }
  /* impressão: só o cartão, na medida exata, sem cenografia */
  @media print {
    body { background: #fff; padding: 0; display: block; }
    body::before, body::after, .acoes, .dica { display: none; }
    .cartao { width: 105mm; height: 148mm; aspect-ratio: auto; box-shadow: none; border: 0; border-radius: 0; }
  }
  @page { size: A6 portrait; margin: 0; }
  /* modo de captura do PNG: idêntico à impressão, mas mantém o arredondado */
  body[data-exportar] { background: transparent; padding: 0; display: block; }
  body[data-exportar]::before, body[data-exportar]::after { display: none; }
  body[data-exportar] .acoes, body[data-exportar] .dica { display: none; }
  body[data-exportar] .cartao { width: 105mm; height: 148mm; aspect-ratio: auto; box-shadow: none; }
</style>
</head>
<body>
<main>
  <section class="cartao" id="cartao" aria-label="Cartão de mesa com QR code da calculadora">
    <div class="marca">
      <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#892991"/><circle cx="16" cy="16" r="6" fill="#F19D38"/></svg>
      <b>Calculadora de assinatura</b>
    </div>
    <h1>Assinar ou comprar?<br /><i>Faça a conta.</i></h1>
    <p class="sub">Todos os custos, impostos e o rendimento<br />do seu dinheiro — em um minuto.</p>
    <div class="qr">
      <svg viewBox="${caixaQr}" role="img" aria-label="QR code para abrir a calculadora"><path d="${pathQr}" fill="#1c1230"/></svg>
    </div>
    <p class="passos"><span><b>1</b>Aponte a câmera</span><i>·</i><span><b>2</b>Toque no link</span></p>
    <p class="url">uselexgo.com/app.html</p>
    <p class="pe">Grátis · sem cadastro · funciona até sem internet<br />Seus dados não saem do seu celular</p>
  </section>
  <nav class="acoes" aria-label="Exportar o cartão">
    <a class="bt bt-cheio" href="/cartao-qr.png" download="calculadora-assinatura-qr.png">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Baixar imagem
    </a>
    <a class="bt bt-vidro" href="/cartao-qr.pdf" download="calculadora-assinatura-qr.pdf">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      Baixar PDF (A6)
    </a>
    <button class="bt bt-vidro" type="button" onclick="print()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Imprimir
    </button>
  </nav>
  <p class="dica">A imagem serve para WhatsApp e redes; o PDF sai no tamanho exato de gráfica — A6 (10,5 × 14,8 cm).</p>
</main>
<script>
  if (new URLSearchParams(location.search).has('exportar')) {
    document.body.dataset.exportar = '1';
  }
</script>
</body>
</html>
`;
writeFileSync(join(site, 'mesa.html'), mesa);
console.log('cartão de mesa ok — site/mesa.html');

/* ── PNG e PDF do cartão ────────────────────────────────────────────── */
/*
 * Os botões de download da mesa.html apontam para cá. São ESTÁTICOS e
 * commitados pelo mesmo motivo de tudo em site/: o Vercel não builda.
 * PNG em 300dpi de A6 (1240×1748) — serve para WhatsApp e para gráfica;
 * PDF na medida exata da folha. Gerados fotografando a própria
 * mesa.html?exportar=1 num Chromium de verdade: uma fonte só de layout,
 * sem redesenhar o cartão em outra linguagem.
 */
const { chromium } = await import('playwright-core');
let navegador;
// --no-sandbox: o gerador roda em container como root, onde o sandbox do
// Chromium se recusa a subir; aqui só se renderiza arquivo local nosso.
for (const executablePath of [undefined, '/opt/pw-browsers/chromium']) {
  try {
    navegador = await chromium.launch({
      args: ['--no-sandbox'],
      ...(executablePath ? { executablePath } : {}),
    });
    break;
  } catch {
    /* tenta o próximo caminho */
  }
}
if (!navegador) {
  console.error('✗ Chromium não encontrado (playwright-core) — PNG/PDF do cartão não gerados.');
  process.exit(1);
}
// 105mm = 396.85px CSS; ×3.125 = 1240px ≈ 300dpi de A6
const pagina = await navegador.newPage({ deviceScaleFactor: 3.125, viewport: { width: 520, height: 720 } });
await pagina.goto('file://' + join(site, 'mesa.html') + '?exportar=1');
await pagina.locator('#cartao').screenshot({
  path: join(site, 'cartao-qr.png'),
  omitBackground: true,
});
await pagina.emulateMedia({ media: 'print' });
await pagina.pdf({
  path: join(site, 'cartao-qr.pdf'),
  width: '105mm',
  height: '148mm',
  printBackground: true,
  pageRanges: '1',
});
await navegador.close();

// um cartão cujo QR não lê é um cartão morto: decodifica o PNG gerado
execFileSync(
  'python3',
  [
    '-c',
    `
import sys, cv2
val, _, _ = cv2.QRCodeDetector().detectAndDecode(cv2.imread(sys.argv[1]))
assert val == sys.argv[2], f'QR do cartao decodificou {val!r}, esperava {sys.argv[2]!r}'
print('qr do cartão lê:', val)
`,
    join(site, 'cartao-qr.png'),
    URL_APP,
  ],
  { stdio: 'inherit' },
);
console.log('cartão exportável ok — site/cartao-qr.png e site/cartao-qr.pdf');

/* conferência final: nada pode ter ficado pela metade */
for (const f of ['icone-192.png', 'icone-512.png', 'icone-512-mask.png', 'apple-touch-icon.png', 'manifest.webmanifest', 'qr-app.png', 'mesa.html', 'cartao-qr.png', 'cartao-qr.pdf']) {
  readFileSync(join(site, f));
}
console.log('✓ artefatos do PWA prontos em site/');
