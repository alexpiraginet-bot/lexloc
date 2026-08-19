/**
 * O link mágico e o armazenamento são as duas portas de entrada de dado não
 * confiável do app. Estes testes cobrem o que a auditoria flagrou:
 *  - chave de tabela inválida vinda do link derrubava o app PERMANENTEMENTE
 *  - a migração de rebrand não pode perder a tabela de preços de ninguém
 *  - creditoUrl é href: só http(s) pode sobreviver à leitura
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/* localStorage de mentira, suficiente para os módulos sob teste */
export function instalarStorage() {
  const m = new Map<string, string>();
  (globalThis as Record<string, unknown>)['localStorage'] = {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  };
  return m;
}
function instalarLocation(hash: string) {
  (globalThis as Record<string, unknown>)['location'] = {
    hash,
    protocol: 'https:',
    origin: 'https://uselexgo.com',
    pathname: '/locadoras/app.html',
  };
}

beforeEach(() => {
  instalarStorage();
  instalarLocation('');
});
afterEach(() => {
  delete (globalThis as Record<string, unknown>)['localStorage'];
  delete (globalThis as Record<string, unknown>)['location'];
});

const b64url = (s: string) =>
  Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

describe('lerLink', () => {
  it('descarta chave de tabela que não existe (o caso da tela branca)', async () => {
    const { lerLink } = await import('../src/lib/link');
    instalarLocation('#d=' + b64url(JSON.stringify({ v: 1, e: { categoria: 'x', preco: 100000 }, m: {} })));
    const lido = lerLink();
    expect(lido).not.toBeNull();
    expect(lido!.estado.categoria).toBeUndefined(); // chave venenosa não passa
    expect(lido!.estado.preco).toBe(100000); // o resto do link sobrevive
  });

  it('aceita chaves reais de uf/categoria/curva', async () => {
    const { lerLink } = await import('../src/lib/link');
    instalarLocation(
      '#d=' + b64url(JSON.stringify({ v: 1, e: { categoria: 'suvc', uf: 'SP', curva: 'fipe' }, m: {} })),
    );
    const lido = lerLink()!;
    expect(lido.estado).toMatchObject({ categoria: 'suvc', uf: 'SP', curva: 'fipe' });
  });

  it('ida e volta: o que gerarLink escreve, lerLink lê', async () => {
    const { gerarLink, lerLink } = await import('../src/lib/link');
    const { estadoInicial } = await import('../src/state');
    const { MARCA_PADRAO } = await import('../src/lib/marca');
    const url = gerarLink(estadoInicial, { ...MARCA_PADRAO, nome: 'Loca', sufixo: 'Top' });
    instalarLocation(url.slice(url.indexOf('#')));
    const lido = lerLink()!;
    expect(lido.marca.nome).toBe('Loca');
    expect(lido.estado.preco).toBe(estadoInicial.preco);
  });

  it('lixo no fragmento nunca lança', async () => {
    const { lerLink } = await import('../src/lib/link');
    for (const hash of ['#d=%%%', '#d=abc', '#d=' + b64url('{"v":9}'), '#outra']) {
      instalarLocation(hash);
      expect(() => lerLink()).not.toThrow();
    }
  });
});

describe('migrarChaves (rebrand LexLoc → LexGo)', () => {
  it('copia a chave antiga e apaga, sem tocar a nova quando já existe', async () => {
    const m = instalarStorage();
    m.set('lexloc.catalogo.v1', '{"a":1}');
    m.set('lexloc.marca.v1', '{"velha":true}');
    m.set('lexgo.marca.v1', '{"nova":true}');
    const { migrarChaves } = await import('../src/lib/migrar');
    migrarChaves();
    expect(m.get('lexgo.catalogo.v1')).toBe('{"a":1}');
    expect(m.get('lexgo.marca.v1')).toBe('{"nova":true}'); // a nova vence
    expect(m.has('lexloc.catalogo.v1')).toBe(false);
    expect(m.has('lexloc.marca.v1')).toBe(false);
  });

  it('storage lançando não derruba o boot', async () => {
    (globalThis as Record<string, unknown>)['localStorage'] = {
      getItem: () => {
        throw new Error('bloqueado');
      },
    };
    const { migrarChaves } = await import('../src/lib/migrar');
    expect(() => migrarChaves()).not.toThrow();
  });
});

describe('lerMarca', () => {
  it('creditoUrl javascript: cai para o padrão (o rodapé é um href)', async () => {
    const m = instalarStorage();
    m.set(
      'lexgo.marca.v1',
      JSON.stringify({ nome: 'X', creditoNome: 'Y', creditoUrl: 'javascript:alert(1)' }),
    );
    const { lerMarca, MARCA_PADRAO } = await import('../src/lib/marca');
    expect(lerMarca().creditoUrl).toBe(MARCA_PADRAO.creditoUrl);
  });

  it('creditoUrl vazio é permitido; https passa intacto', async () => {
    const m = instalarStorage();
    m.set('lexgo.marca.v1', JSON.stringify({ creditoUrl: '' }));
    const { lerMarca } = await import('../src/lib/marca');
    expect(lerMarca().creditoUrl).toBe('');
    m.set('lexgo.marca.v1', JSON.stringify({ creditoUrl: 'https://minhaloja.com.br' }));
    expect(lerMarca().creditoUrl).toBe('https://minhaloja.com.br');
  });

  it('cor fora de #rrggbb cai para o padrão', async () => {
    const m = instalarStorage();
    m.set('lexgo.marca.v1', JSON.stringify({ corPrimaria: 'url(x)', corDestaque: '#12345g' }));
    const { lerMarca, MARCA_PADRAO } = await import('../src/lib/marca');
    const lida = lerMarca();
    expect(lida.corPrimaria).toBe(MARCA_PADRAO.corPrimaria);
    expect(lida.corDestaque).toBe(MARCA_PADRAO.corDestaque);
  });
});

describe('o link mágico nunca aponta para o build do vendedor', () => {
  it('gerado a partir de lexgo-vendedor.html, sai apontando para app.html', async () => {
    (globalThis as Record<string, unknown>)['location'] = {
      hash: '',
      protocol: 'https:',
      origin: 'https://locadoras.uselexgo.com',
      pathname: '/lexgo-vendedor.html',
    };
    const { gerarLink } = await import('../src/lib/link');
    const { estadoInicial } = await import('../src/state');
    const { MARCA_PADRAO } = await import('../src/lib/marca');
    const url = gerarLink(estadoInicial, MARCA_PADRAO);
    expect(url).toContain('/app.html#d=');
    expect(url).not.toContain('lexgo-vendedor');
  });

  it('em subpasta, mantém a subpasta e troca só o arquivo', async () => {
    (globalThis as Record<string, unknown>)['location'] = {
      hash: '',
      protocol: 'https:',
      origin: 'https://uselexgo.com',
      pathname: '/locadoras/lexgo-vendedor.html',
    };
    const { gerarLink } = await import('../src/lib/link');
    const { estadoInicial } = await import('../src/state');
    const { MARCA_PADRAO } = await import('../src/lib/marca');
    expect(gerarLink(estadoInicial, MARCA_PADRAO)).toContain('https://uselexgo.com/locadoras/app.html#d=');
  });
});

describe('sala limpa: sessão de link não mexe no aparelho', () => {
  it('com #d= no endereço, migrarChaves não lê nem apaga nada', async () => {
    const m = instalarStorage();
    m.set('lexloc.catalogo.v1', '{"versao":1}');
    instalarLocation('#d=qualquercoisa');
    const { migrarChaves } = await import('../src/lib/migrar');
    migrarChaves();
    expect(m.get('lexloc.catalogo.v1')).toBe('{"versao":1}');
    expect(m.has('lexgo.catalogo.v1')).toBe(false);
  });
});
