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
import { copyFileSync, existsSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const web = join(raiz, 'packages', 'web');
const site = join(raiz, 'site');

/*
 * O gêmeo HOSPEDADO da equipe. Existe porque no iPhone o Quick Look não
 * executa JS: o arquivo local abre em branco na mão do vendedor, e ele
 * precisa de uma URL que funcione.
 *
 * O NOME É PROPOSITALMENTE IMPRONUNCIÁVEL, e isso não é enfeite. Este build
 * carrega o Copiloto de negociação, a prova de estresse e a retaguarda — o
 * método de venda inteiro. Servido em '/equipe.html' ele estava a um palpite
 * de distância de qualquer cliente que recebesse o link mágico e resolvesse
 * mexer no endereço. Com 64 bits de sufixo, deixa de ser palpite.
 *
 * O QUE ISTO NÃO RESOLVE: o repositório é público, e `site/` é versionado.
 * Quem chega pelo GitHub lê o mesmo conteúdo em `lexgo-vendedor.html` e no
 * fonte de `negociacao.ts`. Isto fecha a porta da frente — a do cliente
 * curioso —, não a do competidor que procura. Fechar a outra é decisão de
 * visibilidade do repositório, não de nome de arquivo.
 *
 * ESTE SUFIXO NASCEU PÚBLICO. Ele foi commitado enquanto o repositório ainda
 * era público, então quem leu o repo naquela janela já o conhece. Assim que o
 * repositório virar privado, ROTACIONE — só a partir daí a URL é de fato um
 * segredo. Enquanto o repo for público, rotacionar não adianta: o sufixo novo
 * é publicado junto.
 *
 * Para rodar o endereço: troque o sufixo, publique, avise a equipe. O antigo
 * deixa de existir na hora.
 */
const GEMEO_DA_EQUIPE = 'equipe-db09ddc3f2b4f45c.html';

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
    para: ['lexgo-vendedor.html', GEMEO_DA_EQUIPE],
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

/*
 * Constrói TUDO antes de copiar coisa nenhuma.
 *
 * Antes a cópia para site/ acontecia dentro deste laço e a guarda do corte só
 * rodava depois: um vazamento era detectado com o arquivo vazado JÁ em site/
 * — que é versionado e é o outputDirectory do Vercel. O `process.exit(1)` não
 * desfazia nada, então um `git commit -a` ou um deploy no susto publicava o
 * vazamento que a guarda tinha acabado de acusar.
 */
const construidos = [];
for (const alvo of ALVOS) {
  process.stdout.write(`· ${alvo.rot} … `);
  rodar(TSC, ['-p', 'tsconfig.json', '--noEmit'], alvo.env);
  rodar(VITE, ['build'], alvo.env);
  const origem = join(web, alvo.de);
  if (!existsSync(origem)) throw new Error(`build não gerou ${alvo.de}`);
  construidos.push({ alvo, origem });
  console.log(`${alvo.para.join(', ')} (${kb(origem)})`);
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
/*
 * TÍTULOS de tela. Cobrem a tela sumir — e só isso.
 *
 * Esta lista deixou passar um vazamento real: `Resultado.tsx` importava
 * `lib/robustez` no topo do arquivo, fora de qualquer ramo `!cli`. A TELA da
 * prova de estresse não entrava no arquivo do cliente (o título dava 0), mas
 * o MÓDULO entrava inteiro — os 8 mundos e as réplicas de venda do campo
 * `contra`, legíveis em Ctrl+U por qualquer cliente. Por isso a segunda
 * lista abaixo.
 */
const MARCAS_DA_EQUIPE = [
  'Retaguarda',
  'Mensalidade de empate',
  'Propostas salvas',
  'Vale negociar',            // medidor de negociação
  'Prova de estresse',        // diagnóstico do vendedor, nunca do cliente
  'Copiloto de negociação',   // repertório de objeções — mesa do vendedor
];

/*
 * CONTEÚDO. Trechos do miolo dos módulos restritos, que sobrevivem mesmo
 * quando a tela é podada e o título some. É aqui que se pega o vazamento por
 * import solto — mudar a redação de um título não faz esta lista mentir.
 */
const MIOLO_DA_EQUIPE = [
  'CDI despenca',                    // lib/robustez — mundo da prova de estresse
  'Manutenção surpreende',           // idem
  'Quanto dele você quer imobilizado', // réplica de VENDA do campo `contra`
  'parcela-financiamento-menor',     // lib/objecoes — id do repertório
  'Atacar o financiamento',          // campo `evite` — o que o vendedor NÃO deve dizer
];
/* lê o que ACABOU de ser construído, não o que já está publicado em site/ */
const lido = (perfil) =>
  readFileSync(construidos.find((c) => c.alvo.env.PERFIL === perfil).origem, 'utf8');
const cliente = lido('cliente');
const vendedor = lido('vendedor');

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

const vazou = [...MARCAS_DA_EQUIPE, ...MIOLO_DA_EQUIPE].filter((t) => cliente.includes(t));
if (vazou.length) {
  console.error(`\n✗ vazou para o arquivo do CLIENTE: ${vazou.join(', ')}`);
  process.exit(1);
}
/* o miolo também tem de EXISTIR no vendedor, senão esta lista vira decoração */
const miolonSumiu = MIOLO_DA_EQUIPE.filter((t) => !vendedor.includes(t));
if (miolonSumiu.length) {
  console.error(`\n✗ o arquivo do VENDEDOR não contém: ${miolonSumiu.join(', ')}`);
  console.error('  a guarda de conteúdo ficaria vazia — atualize a lista.');
  process.exit(1);
}

/*
 * O nome do gêmeo tem de continuar impronunciável. Sem isto, alguém
 * "arruma" o nome para algo legível numa refatoração e a porta da frente
 * reabre em silêncio, com todos os outros testes passando.
 */
if (!/^equipe-[0-9a-f]{16}\.html$/.test(GEMEO_DA_EQUIPE)) {
  console.error(`\n✗ GEMEO_DA_EQUIPE = '${GEMEO_DA_EQUIPE}' — nome adivinhável.`);
  console.error('  o gêmeo carrega o Copiloto e a retaguarda; precisa de sufixo de 16 hex.');
  process.exit(1);
}

/*
 * E o robots.txt NÃO pode citá-lo. Parece contraintuitivo, mas `Disallow:`
 * é um anúncio: o arquivo é público por definição, então listar o caminho
 * ali entrega exatamente o que se queria esconder. Quem lê robots.txt
 * primeiro é justamente quem está procurando o que não deveria achar.
 * Para não indexar, o certo é o cabeçalho noindex do vercel.json.
 */
const robots = join(site, 'robots.txt');
if (existsSync(robots) && readFileSync(robots, 'utf8').includes('equipe')) {
  console.error('\n✗ site/robots.txt cita o gêmeo da equipe — isso publica o caminho.');
  console.error('  tire a linha; o noindex vive no vercel.json.');
  process.exit(1);
}

/*
 * O gêmeo e o arquivo da equipe saem com noindex NO PRÓPRIO HTML, e não só
 * no cabeçalho do vercel.json. Motivo: o catch-all '/(.*)' de lá também
 * escreve X-Robots-Tag, e a regra de precedência entre os dois é do Vercel,
 * não nossa — se um dia ela mudar, o cabeçalho some sem avisar. A meta tag
 * viaja dentro do arquivo e não depende de configuração de servidor.
 */
const NOINDEX = '<meta name="robots" content="noindex, nofollow, noarchive" />';

/* passou em tudo: agora sim o site/ pode ser tocado */
for (const { alvo, origem } of construidos) {
  const daEquipe = alvo.env.PERFIL === 'vendedor';
  for (const nome of alvo.para) {
    const destino = join(site, nome);
    if (!daEquipe) {
      copyFileSync(origem, destino);
      continue;
    }
    const html = readFileSync(origem, 'utf8');
    if (!html.includes('<head>')) throw new Error(`sem <head> para marcar noindex: ${nome}`);
    writeFileSync(destino, html.replace('<head>', `<head>${NOINDEX}`));
  }
}

/*
 * Varre gêmeos de endereços antigos. Sem isto, trocar o sufixo publicaria o
 * novo e deixaria o velho servindo do mesmo jeito — a troca não trocaria nada.
 */
for (const nome of readdirSync(site)) {
  if (/^equipe[-.]/.test(nome) && nome !== GEMEO_DA_EQUIPE) {
    unlinkSync(join(site, nome));
    console.log(`· endereço antigo removido: ${nome}`);
  }
}

console.log('\n✓ site/ pronto — o corte por build está de pé nos dois sentidos.');
console.log(`· gêmeo da equipe: /${GEMEO_DA_EQUIPE}`);
