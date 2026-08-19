/**
 * Foto da frota por modelo.
 *
 * A locadora sobe a foto DO CARRO DELA — é o que o cliente vai receber, na cor
 * certa — e ela precisa sobreviver a três travessias: o merge do catálogo, o
 * arquivo exportado para a equipe e a leitura do arquivo escolhido no aparelho.
 *
 * O caso do extra é regressão: a foto mora em `ajustes`, indexada pelo nome,
 * mas os modelos que a equipe acrescenta vivem em `extras` — e o merge não
 * olhava para lá, então carro adicionado pela equipe nunca exibia foto.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/** PNG 1×1 real, pequeno o suficiente para caber em qualquer teto */
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function instalarStorage() {
  const m = new Map<string, string>();
  (globalThis as Record<string, unknown>)['localStorage'] = {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  };
}

/** FileReader mínimo: o Node não tem, e é a única peça de DOM que falta */
function instalarFileReader() {
  (globalThis as Record<string, unknown>)['FileReader'] = class {
    result: string | null = null;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    readAsDataURL(f: File) {
      void f.arrayBuffer().then((buf) => {
        this.result = `data:${f.type};base64,${Buffer.from(buf).toString('base64')}`;
        this.onload?.();
      });
    }
  };
}

beforeEach(() => {
  instalarStorage();
  instalarFileReader();
});
afterEach(() => {
  delete (globalThis as Record<string, unknown>)['localStorage'];
  delete (globalThis as Record<string, unknown>)['FileReader'];
});

describe('catalogoEfetivo — a foto chega ao card', () => {
  it('aplica a foto do ajuste ao veículo do catálogo de referência', async () => {
    const { catalogoEfetivo, vazio } = await import('../src/lib/catalogo');
    const c = vazio();
    c.ajustes['Toyota Yaris Cross XR'] = { fo: PNG };

    const achado = catalogoEfetivo(c).find((v) => v.n === 'Toyota Yaris Cross XR');
    expect(achado?.fo).toBe(PNG);
  });

  it('aplica a foto a um modelo ACRESCENTADO pela equipe (o caso que faltava)', async () => {
    const { catalogoEfetivo, vazio } = await import('../src/lib/catalogo');
    const c = vazio();
    c.extras.push({ n: 'Fiat Fastback Turbo', p: 139990, m: 2980, c: 'suvc', f: 'mer', gd: 1, e: 12, d: 'Adicionado pela equipe' });
    c.ajustes['Fiat Fastback Turbo'] = { fo: PNG };

    const achado = catalogoEfetivo(c).find((v) => v.n === 'Fiat Fastback Turbo');
    expect(achado?.fo).toBe(PNG);
  });

  it('sem foto no ajuste, o veículo sai sem `fo` — o card cai na imagem da categoria', async () => {
    const { catalogoEfetivo, vazio } = await import('../src/lib/catalogo');
    const c = vazio();
    c.ajustes['Toyota Yaris Cross XR'] = { p: 155000 };

    const achado = catalogoEfetivo(c).find((v) => v.n === 'Toyota Yaris Cross XR');
    expect(achado?.fo).toBeUndefined();
    expect(achado?.p).toBe(155000);
  });
});

describe('importarArquivo — a foto atravessa o arquivo da equipe', () => {
  const arquivo = (fo: unknown) =>
    JSON.stringify({ versao: 1, atualizadoEm: '', ajustes: { 'Toyota Yaris Cross XR': { fo } }, extras: [] });

  it('preserva foto válida', async () => {
    const { importarArquivo } = await import('../src/lib/catalogo');
    const r = importarArquivo(arquivo(PNG));
    expect(typeof r).not.toBe('string');
    if (typeof r === 'string') return;
    expect(r.custom.ajustes['Toyota Yaris Cross XR']?.fo).toBe(PNG);
  });

  it('descarta data URI que não é imagem (script disfarçado de foto)', async () => {
    const { importarArquivo } = await import('../src/lib/catalogo');
    const r = importarArquivo(arquivo('data:text/html;base64,PHNjcmlwdD4='));
    expect(typeof r).not.toBe('string');
    if (typeof r === 'string') return;
    expect(r.custom.ajustes['Toyota Yaris Cross XR']).toBeUndefined();
  });

  it('descarta foto acima do teto', async () => {
    const { importarArquivo, FOTO_MAX } = await import('../src/lib/catalogo');
    const gorda = `data:image/png;base64,${'A'.repeat(Math.ceil(FOTO_MAX * 1.5))}`;
    const r = importarArquivo(arquivo(gorda));
    expect(typeof r).not.toBe('string');
    if (typeof r === 'string') return;
    expect(r.custom.ajustes['Toyota Yaris Cross XR']).toBeUndefined();
  });
});

describe('lerFotoDeArquivo — o que o vendedor escolhe no aparelho', () => {
  it('devolve o data URI de um PNG válido', async () => {
    const { lerFotoDeArquivo } = await import('../src/lib/catalogo');
    const f = new File([new Uint8Array([137, 80, 78, 71])], 'carro.png', { type: 'image/png' });
    await expect(lerFotoDeArquivo(f)).resolves.toMatch(/^data:image\/png;base64,/);
  });

  it('recusa tipo que não é imagem permitida', async () => {
    const { lerFotoDeArquivo } = await import('../src/lib/catalogo');
    const f = new File([new Uint8Array([1])], 'planilha.pdf', { type: 'application/pdf' });
    await expect(lerFotoDeArquivo(f)).rejects.toThrow(/PNG, JPG ou WEBP/);
  });

  it('recusa arquivo acima do teto — o HTML off-line vai por WhatsApp', async () => {
    const { lerFotoDeArquivo, FOTO_MAX } = await import('../src/lib/catalogo');
    const f = new File([new Uint8Array(FOTO_MAX + 1)], 'enorme.png', { type: 'image/png' });
    await expect(lerFotoDeArquivo(f)).rejects.toThrow(/pesada/);
  });
});
