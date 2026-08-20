/*
 * Service worker do app do CLIENTE — o que torna o LexGo instalável.
 *
 * O QR na mesa do vendedor aponta para /app.html. O cliente escaneia, usa,
 * e pode "Adicionar à tela de início": este arquivo é o que faz o app abrir
 * depois disso MESMO SEM INTERNET. Como o app inteiro é UM arquivo (fotos e
 * fonte embutidas, requisição externa nenhuma), o cache guarda um único
 * documento e pronto — a arquitetura de arquivo único paga o aluguel aqui.
 *
 * ── VERSÃO CARIMBADA, NÃO ESCRITA À MÃO ──
 * O placeholder em VERSAO (logo abaixo) é trocado pelo publicar.mjs pelo
 * hash do próprio app.html. (O nome dele não pode aparecer escrito neste
 * comentário: a guarda do publicar procura o literal para acusar carimbo
 * esquecido, e um replace de primeira ocorrência acertaria o comentário.)
 * App igual → versão igual → nenhuma reinstalação; app novo → versão nova
 * → o activate abaixo apaga o cache velho. Editar a versão à mão é o
 * caminho clássico para usuário preso em app antigo para sempre.
 *
 * ── ESCOPO CIRÚRGICO: só /app.html ──
 * O registro usa {scope: '/app.html'}. A landing (/), o gêmeo da equipe e
 * o resto do site passam LONGE deste worker — um fetch handler ganancioso
 * num site multi-página é como nasce "a página que nunca atualiza".
 *
 * ── A SALA LIMPA CONTINUA LIMPA ──
 * O cache guarda os bytes GENÉRICOS do app, nada mais. O fragmento #d= do
 * link mágico nem chega ao worker (fragmento não vai na requisição), e
 * nenhum dado do cliente é lido ou gravado aqui.
 *
 * ── estratégia: entrega o guardado, atualiza por trás ──
 * (stale-while-revalidate) O cliente na mesa não espera rede; a visita
 * seguinte já abre a versão nova. Nunca se guarda resposta que não seja
 * 200 do próprio domínio.
 */
const VERSAO = '8de75c1db49e';
const CACHE = `lexgo-app-${VERSAO}`;
const APP = '/app.html';

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches
      .open(CACHE)
      /*
       * cache: 'reload' — pula o cache HTTP do navegador. Sem isto o
       * install de uma versão NOVA do worker enchia o cache novo com o
       * app VELHO que o navegador tinha guardado, e o usuário ficava
       * preso na versão antiga para sempre. Medido no teste de
       * atualização: título não mudava nem na terceira visita.
       */
      .then((c) => c.add(new Request(APP, { cache: 'reload' })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evt) => {
  // só navegações GET; subrecurso não existe num app de arquivo único
  if (evt.request.method !== 'GET' || evt.request.mode !== 'navigate') return;
  evt.respondWith(entregar(evt));
});

async function entregar(evt) {
  const cache = await caches.open(CACHE);
  const guardado = await cache.match(APP);
  // 'no-cache' = revalida com o servidor; sem isso o cache HTTP devolve o
  // app velho com cara de novo e o stale-while-revalidate nunca revalida nada
  const rede = fetch(APP, { cache: 'no-cache' })
    .then((r) => {
      /*
       * O put roda em segundo plano — e pode rodar num worker que um
       * sucessor já substituiu, recriando pelo nome o cache que o activate
       * do sucessor acabou de apagar. Duas contenções, e uma tolerância:
       * · não grava se este worker já está 'redundant';
       * · não grava se o cache já não consta no registro (caches.has);
       * · a janela entre o has e o put continua existindo. Se ela morder,
       *   sobra um cache FANTASMA de nome velho com conteúdo NOVO — o
       *   usuário nunca vê versão velha por isso, e o activate do ciclo
       *   seguinte varre o nome. Aceito: é um arquivo órfão por um ciclo,
       *   não um usuário preso.
       */
      const moribundo = self.serviceWorker && self.serviceWorker.state === 'redundant';
      if (r && r.ok && !moribundo) {
        return caches.has(CACHE).then((vivo) => {
          if (vivo) cache.put(APP, r.clone());
          return r;
        });
      }
      return r;
    })
    .catch(() => null);

  if (guardado) {
    evt.waitUntil(rede); // atualiza por trás, sem segurar a resposta
    return guardado;
  }
  const vivo = await rede;
  return (
    vivo ||
    new Response('Sem internet e ainda sem cópia guardada — abra uma vez conectado.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  );
}
