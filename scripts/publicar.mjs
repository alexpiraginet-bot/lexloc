/**
 * Monta a pasta `site/` — o que o Vercel publica.
 *
 * Três alvos saem do MESMO código-fonte; a diferença é compilada, não escondida:
 *   dist/                   → app hospedado (site/app.html), usado pelo link mágico
 *   dist-offline-cliente/   → arquivo único do cliente
 *   dist-offline-vendedor/  → arquivo único da equipe, com retaguarda e propostas
 *
 * Rode `node scripts/publicar.mjs` depois de qualquer mudança no app.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const web = join(raiz, 'packages', 'web');
const site = join(raiz, 'site');

const ALVOS = [
  {
    // é o arquivo do cliente servido pelo nosso domínio: é ele que o link
    // mágico abre no iPhone. Autocontido de propósito — um arquivo, zero
    // requisições, nada a configurar em servidor.
    rot: 'cliente (hospedado + envio)',
    env: { OFFLINE: '1', PERFIL: 'cliente' },
    de: 'dist-offline-cliente/index.html',
    para: ['app.html', 'lexgo-cliente.html'],
  },
  {
    rot: 'vendedor (off-line)',
    env: { OFFLINE: '1', PERFIL: 'vendedor' },
    de: 'dist-offline-vendedor/index.html',
    // 'equipe.html' é o gêmeo HOSPEDADO: no iPhone o Quick Look não executa
    // JS, então o arquivo local abre em branco na mão do vendedor. O que
    // fica exposto é só a casca — preços, propostas e marca vivem no
    // localStorage do aparelho dele, nunca no servidor.
    para: ['lexgo-vendedor.html', 'equipe.html'],
  },
];

const kb = (p) => `${Math.round(statSync(p).size / 1024)} KB`;

/*
 * Chamamos tsc e vite pelo próprio node, e não por `npm run`: no Windows o
 * npm é um .cmd, que o Node 24 recusa em execFileSync sem `shell: true` — e
 * `shell: true` com argumentos é justamente o que a depreciação DEP0190
 * desaconselha. Assim não há shell no caminho.
 */
const TSC = join(raiz, 'node_modules', 'typescript', 'bin', 'tsc');
const VITE = join(raiz, 'node_modules', 'vite', 'bin', 'vite.js');

/** roda um binário JS local; em caso de falha, mostra a saída real da ferramenta */
function rodar(bin, args, env) {
  try {
    execFileSync(process.execPath, [bin, ...args], {
      cwd: web,
      env: { ...process.env, OFFLINE: '', PERFIL: '', ...env },
      stdio: 'pipe',
    });
  } catch (e) {
    console.error('\n' + (e.stdout?.toString() || '') + (e.stderr?.toString() || ''));
    throw new Error(`falhou: node ${bin} ${args.join(' ')}`);
  }
}

for (const alvo of ALVOS) {
  process.stdout.write(`· ${alvo.rot} … `);
  rodar(TSC, ['-p', 'tsconfig.json', '--noEmit'], alvo.env);
  rodar(VITE, ['build'], alvo.env);
  const origem = join(web, alvo.de);
  if (!existsSync(origem)) throw new Error(`build não gerou ${alvo.de}`);
  for (const nome of alvo.para) copyFileSync(origem, join(site, nome));
  console.log(`${alvo.para.join(', ')} (${kb(join(site, alvo.para[0]))})`);
}

/*
 * Guarda do corte por build.
 *
 * O cliente não pode receber as telas da equipe. Mas um teste que só procura
 * strings proibidas passa por vacuidade no dia em que o texto mudar de redação
 * — e nós nunca saberíamos que a guarda parou de guardar. Por isso a asserção
 * é nos dois sentidos: cada marca TEM de existir no arquivo do vendedor e NÃO
 * pode existir no do cliente.
 */
const MARCAS_DA_EQUIPE = [
  'Retaguarda',
  'Mensalidade de empate',
  'Propostas salvas',
  'Vale negociar',            // medidor de negociação
  'Prova de estresse',        // diagnóstico do vendedor, nunca do cliente
  'Copiloto de negociação',   // repertório de objeções — mesa do vendedor
];
const cliente = readFileSync(join(site, 'lexgo-cliente.html'), 'utf8');
const vendedor = readFileSync(join(site, 'lexgo-vendedor.html'), 'utf8');

const sumiu = MARCAS_DA_EQUIPE.filter((t) => !vendedor.includes(t));
if (sumiu.length) {
  console.error(`\n✗ o arquivo do VENDEDOR não contém: ${sumiu.join(', ')}`);
  console.error('  a guarda ficaria vazia — atualize a lista ou conserte o build.');
  process.exit(1);
}
/* O dist/ (build sem PERFIL) é o que a API serve em '/'. Ele também não
   pode conter as telas da equipe — foi por aí que o vazamento passou antes. */
const distApi = join(web, 'dist');
if (existsSync(distApi)) {
  const bundles = readdirSync(join(distApi, 'assets'), { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.js'))
    .map((d) => readFileSync(join(distApi, 'assets', d.name), 'utf8'))
    .join('');
  const vazouApi = MARCAS_DA_EQUIPE.filter((t) => bundles.includes(t));
  if (vazouApi.length) {
    console.error(`\n✗ vazou para o dist/ servido pela API: ${vazouApi.join(', ')}`);
    console.error('  rode `npm run build -w @godrive/web` sem PERFIL=vendedor.');
    process.exit(1);
  }
}

const vazou = MARCAS_DA_EQUIPE.filter((t) => cliente.includes(t));
if (vazou.length) {
  console.error(`\n✗ vazou para o arquivo do CLIENTE: ${vazou.join(', ')}`);
  process.exit(1);
}
console.log('\n✓ site/ pronto — o corte por build está de pé nos dois sentidos.');
