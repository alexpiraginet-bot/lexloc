/**
 * Auditoria VISUAL — a que faltava.
 *
 * `getComputedStyle` não vê texto encostando na borda, nem elemento
 * cortado, nem CTA fora da dobra. Este script abre a página num navegador
 * de verdade, em três larguras, RODA as checagens geométricas e deixa os
 * prints para serem olhados antes de publicar.
 *
 *   node scripts/auditar-visual.mjs [url] [--estrito]
 *
 * `--estrito` faz o comando sair com código 1 se houver falha, para
 * poder travar uma publicação.
 *
 * ── por que Playwright, e não mais o print do Edge ──
 * O headless do Edge MENTE sobre largura de layout: `--window-size` não
 * redimensiona o viewport de forma confiável, e ele já acusou corte
 * lateral duas vezes em página que o navegador real mediu como
 * `scrollWidth === 375`, sem overflow nenhum. Playwright define o
 * viewport de verdade. E a sonda, que antes era escrita num arquivo para
 * alguém colar no console à mão — ou seja, nunca rodava —, agora roda.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(raiz, '.auditoria');

const argumentos = process.argv.slice(2);
const estrito = argumentos.includes('--estrito');
const alvo = argumentos.find((a) => !a.startsWith('--')) ?? 'https://locadoras.uselexgo.com/';

const TELAS = [
  { nome: 'iphone', w: 390, h: 844, movel: true },
  { nome: 'tablet', w: 768, h: 1024, movel: false },
  { nome: 'desktop', w: 1280, h: 900, movel: false },
];

/**
 * O navegador. Nada é baixado: usa o Edge ou o Chrome que a máquina já
 * tem — o dono roda no Windows —, ou um binário apontado à mão.
 */
async function abrirNavegador() {
  const tentativas = [
    process.env['LEXGO_CHROMIUM'] && { executablePath: process.env['LEXGO_CHROMIUM'] },
    { executablePath: '/opt/pw-browsers/chromium' },
    { channel: 'msedge' },
    { channel: 'chrome' },
    {},
  ].filter(Boolean);
  for (const opcao of tentativas) {
    try {
      return await chromium.launch(opcao);
    } catch {
      /* próximo candidato */
    }
  }
  return null;
}

/**
 * Medições feitas DENTRO da página. Cada uma corresponde a um defeito que
 * já escapou de olho nu neste projeto — por isso viram regra, não checklist.
 */
function sonda() {
  const falhas = [];
  const vw = window.innerWidth;
  const RESPIRO = 12; // px mínimos entre texto e a borda da tela
  const nome = (el) =>
    el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).trim().split(/\s+/)[0] : '');

  /*
   * Escondido para o olho, presente para o leitor de tela — o "pular para o
   * conteúdo" é 1px recortado no canto. Cobrar borda ou alvo de toque dele é
   * ruído: ninguém o vê nem o toca até o foco chegar.
   */
  const invisivel = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) return true;
    const e = getComputedStyle(el);
    if (e.visibility === 'hidden' || e.opacity === '0') return true;
    return (e.clip !== 'auto' && e.clip !== '') || (e.clipPath !== 'none' && e.position === 'absolute');
  };

  // 1) texto colado na borda (o bug do .hero sobrescrevendo o .wrap)
  for (const el of document.querySelectorAll('h1,h2,h3,p,li,span,a,button,label')) {
    if (!el.textContent.trim()) continue;
    const r = el.getBoundingClientRect();
    if (invisivel(el)) continue;
    if (getComputedStyle(el).position === 'fixed') continue;
    if (r.left < RESPIRO || vw - r.right < RESPIRO) {
      falhas.push({ tipo: 'texto-na-borda', el: nome(el), esq: Math.round(r.left),
        dir: Math.round(vw - r.right), txt: el.textContent.trim().slice(0, 40) });
    }
  }

  // 2) rolagem horizontal
  if (document.documentElement.scrollWidth > vw + 1) {
    falhas.push({ tipo: 'rolagem-lateral', largura: document.documentElement.scrollWidth, tela: vw });
  }

  // 3) alvo de toque menor que 44px (Apple HIG). Link dentro de parágrafo
  //    não é alvo de toque isolado — cobrá-lo só produziria ruído.
  for (const el of document.querySelectorAll('a,button,input,select')) {
    const r = el.getBoundingClientRect();
    if (invisivel(el)) continue;
    if (el.type === 'range' || el.type === 'hidden') continue;
    if (el.tagName === 'A' && el.closest('p,li,.foot')) continue;
    if (r.height < 44) {
      falhas.push({ tipo: 'alvo-pequeno', el: nome(el), altura: Math.round(r.height),
        txt: (el.textContent || '').trim().slice(0, 30) });
    }
  }

  // 4) texto miúdo demais no corpo
  for (const el of document.querySelectorAll('p,li,span')) {
    if (!el.textContent.trim() || el.children.length || invisivel(el)) continue;
    const t = parseFloat(getComputedStyle(el).fontSize);
    if (t && t < 12) falhas.push({ tipo: 'texto-miudo', tamanho: t, txt: el.textContent.trim().slice(0, 30) });
  }

  return { url: location.href, largura: vw, falhas };
}

const navegador = await abrirNavegador();
if (!navegador) {
  console.error('✗ não achei navegador para a auditoria.');
  console.error('  instale o Edge ou o Chrome, ou aponte o seu:');
  console.error('  LEXGO_CHROMIUM=/caminho/do/chrome node scripts/auditar-visual.mjs');
  process.exit(1);
}

rmSync(SAIDA, { recursive: true, force: true });
mkdirSync(SAIDA, { recursive: true });

const relatorio = [];
let totalFalhas = 0;

for (const t of TELAS) {
  const ctx = await navegador.newContext({
    viewport: { width: t.w, height: t.h },
    ...(t.movel ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
  });
  const pg = await ctx.newPage();
  const erros = [];
  pg.on('pageerror', (e) => erros.push(String(e.message).slice(0, 120)));

  const resp = await pg.goto(alvo, { waitUntil: 'load' });
  const http = resp?.status() ?? 0;
  // a atmosfera respira em 24s; parar a animação deixa o print comparável
  await pg.addStyleTag({ content: 'body::before{animation:none!important}' }).catch(() => {});
  await pg.waitForTimeout(700);

  const r = await pg.evaluate(sonda);
  await pg.screenshot({ path: join(SAIDA, `${t.nome}.png`), fullPage: false });
  await pg.screenshot({ path: join(SAIDA, `${t.nome}-inteira.png`), fullPage: true });
  await ctx.close();

  /*
   * Erro de JS e resposta ruim CONTAM. Antes só as medidas geométricas
   * somavam, e página em branco não tem o que medir: o bundle podia quebrar
   * e a auditoria dizia "✓ 0 apontamentos" com --estrito, liberando
   * justamente o pior caso.
   */
  if (http >= 400 || http === 0) {
    r.falhas.push({ tipo: 'resposta-ruim', http, url: alvo });
  }
  for (const e of erros) r.falhas.push({ tipo: 'erro-de-js', msg: e });

  const porTipo = {};
  for (const f of r.falhas) (porTipo[f.tipo] ??= []).push(f);
  totalFalhas += r.falhas.length;
  relatorio.push({ tela: t.nome, largura: t.w, http, erros, falhas: r.falhas });

  const resumo = Object.entries(porTipo).map(([k, v]) => `${k}=${v.length}`).join(' ') || 'nada';
  console.log(`· ${t.nome} (${t.w}px) → ${t.nome}.png · HTTP ${http} · ${resumo}`);
  // três exemplos por tipo bastam para achar o defeito; o resto vai no JSON
  for (const [tipo, lista] of Object.entries(porTipo)) {
    for (const f of lista.slice(0, 3)) console.log(`    ${tipo}: ${JSON.stringify(f)}`);
    if (lista.length > 3) console.log(`    ${tipo}: … e mais ${lista.length - 3} (veja relatorio.json)`);
  }
}

await navegador.close();
writeFileSync(join(SAIDA, 'relatorio.json'), JSON.stringify({ alvo, telas: relatorio }, null, 1));

console.log(`\n${totalFalhas ? '⚠' : '✓'} ${totalFalhas} apontamento(s) · prints e relatorio.json em .auditoria/`);
console.log('  OLHE os prints antes de publicar — medida não vê feiura.');
if (estrito && totalFalhas) process.exit(1);
