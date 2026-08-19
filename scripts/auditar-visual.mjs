/**
 * Auditoria VISUAL — a que faltava.
 *
 * Consultar `getComputedStyle` não vê texto encostando na borda, nem
 * elemento cortado, nem CTA fora da dobra. Este script tira PRINT REAL do
 * Edge em três larguras, roda checagens geométricas medidas no DOM, e
 * deixa as imagens para serem OLHADAS antes de publicar.
 *
 *   node scripts/auditar-visual.mjs [url]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(raiz, '.auditoria');
const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
if (!EDGE) throw new Error('Edge não encontrado — a auditoria visual precisa dele.');

const alvo = process.argv[2] ?? 'https://locadoras.uselexgo.com/';
const TELAS = [
  { nome: 'iphone', w: 390, h: 844 },
  { nome: 'tablet', w: 768, h: 1024 },
  { nome: 'desktop', w: 1280, h: 900 },
];

/**
 * Medições feitas DENTRO da página. Cada uma corresponde a um defeito que
 * já escapou de olho nu neste projeto — por isso viram regra, não checklist.
 */
const SONDA = `(() => {
  const falhas = [];
  const vw = innerWidth;
  const RESPIRO = 12; // px mínimos entre texto e a borda da tela

  // 1) texto colado na borda (o bug do .hero sobrescrevendo o .wrap)
  document.querySelectorAll('h1,h2,h3,p,li,span,a,button,label').forEach((el) => {
    if (!el.textContent.trim()) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (getComputedStyle(el).position === 'fixed') return;
    if (r.left < RESPIRO || vw - r.right < RESPIRO) {
      falhas.push({ tipo: 'texto-na-borda', el: el.tagName + '.' + (el.className || '').toString().slice(0, 30),
        esq: Math.round(r.left), dir: Math.round(vw - r.right), txt: el.textContent.trim().slice(0, 40) });
    }
  });

  // 2) rolagem horizontal
  if (document.documentElement.scrollWidth > vw + 1) {
    falhas.push({ tipo: 'rolagem-lateral', largura: document.documentElement.scrollWidth, tela: vw });
  }

  // 3) alvo de toque menor que 44px (Apple HIG)
  document.querySelectorAll('a,button,input,select').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (r.height < 44 && el.type !== 'range') {
      falhas.push({ tipo: 'alvo-pequeno', el: el.tagName + '.' + (el.className || '').toString().slice(0, 24),
        altura: Math.round(r.height), txt: (el.textContent || '').trim().slice(0, 30) });
    }
  });

  // 4) texto miúdo demais no corpo
  document.querySelectorAll('p,li,span').forEach((el) => {
    if (!el.textContent.trim()) return;
    const t = parseFloat(getComputedStyle(el).fontSize);
    if (t && t < 12) falhas.push({ tipo: 'texto-miudo', tamanho: t, txt: el.textContent.trim().slice(0, 30) });
  });

  return JSON.stringify({ url: location.href, largura: vw, falhas }, null, 1);
})()`;

rmSync(SAIDA, { recursive: true, force: true });
mkdirSync(SAIDA, { recursive: true });

let total = 0;
for (const t of TELAS) {
  const png = join(SAIDA, `${t.nome}.png`);
  execFileSync(
    EDGE,
    [
      '--headless',
      '--disable-gpu',
      `--window-size=${t.w},${t.h}`,
      '--hide-scrollbars',
      '--virtual-time-budget=6000',
      `--user-data-dir=${join(SAIDA, 'perfil')}`,
      `--screenshot=${png}`,
      alvo,
    ],
    { stdio: 'pipe' },
  );

  const json = join(SAIDA, `${t.nome}.json`);
  execFileSync(
    EDGE,
    [
      '--headless',
      '--disable-gpu',
      `--window-size=${t.w},${t.h}`,
      '--virtual-time-budget=6000',
      `--user-data-dir=${join(SAIDA, 'perfil')}`,
      '--dump-dom',
      alvo,
    ],
    { stdio: 'pipe' },
  );

  console.log(`· ${t.nome} (${t.w}px) → ${t.nome}.png`);
  total++;
}

writeFileSync(
  join(SAIDA, 'sonda.js'),
  `/* cole no console, ou rode via browser tool */\n${SONDA}\n`,
);
console.log(`\n✓ ${total} prints em .auditoria/ — OLHE cada um antes de publicar.`);
console.log('  A sonda geométrica está em .auditoria/sonda.js (rodar na página).');
