/**
 * A fronteira do corte cliente/vendedor como TESTE, não só como etapa do
 * publicar.mjs: `npm test` precisa ficar vermelho se alguém importar uma
 * tela da equipe por fora da porta `@vendedor` — porque é exatamente assim
 * que a retaguarda vazaria para o arquivo do cliente.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src');

/** telas que só existem para a equipe — a lista que `real.ts` exporta */
const RESTRITAS = ['components/Retaguarda', 'components/Propostas'];

function todosOsFontes(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return todosOsFontes(p);
    return /\.(ts|tsx)$/.test(d.name) ? [p] : [];
  });
}

describe('fronteira do corte por build', () => {
  const fontes = todosOsFontes(SRC);

  it('nenhum arquivo importa tela restrita por fora de @vendedor', () => {
    const violacoes: string[] = [];
    for (const arq of fontes) {
      if (arq.replace(/\\/g, '/').endsWith('src/vendedor/real.ts')) continue;
      const texto = readFileSync(arq, 'utf8');
      for (const restrita of RESTRITAS) {
        // pega `from './components/Retaguarda'`, `from "../components/Propostas"` etc.
        const padrao = new RegExp(`from\\s+['"][^'"]*${restrita}['"]`);
        if (padrao.test(texto)) violacoes.push(`${arq} importa ${restrita}`);
      }
    }
    expect(violacoes, violacoes.join('\n')).toEqual([]);
  });

  it('o stub cobre exatamente o que a fachada real exporta', () => {
    const real = readFileSync(join(SRC, 'vendedor', 'real.ts'), 'utf8');
    const vazio = readFileSync(join(SRC, 'vendedor', 'vazio.tsx'), 'utf8');
    const exportadas = [...real.matchAll(/export \{ (\w+) \}/g)].map((m) => m[1]!);
    expect(exportadas.length).toBeGreaterThan(0);
    for (const nome of exportadas) {
      expect(vazio, `vazio.tsx não tem o stub de ${nome}`).toContain(`export function ${nome}`);
    }
  });

  it('a dobra de perfil usa a constante PERFIL, não __PERFIL__ solto', () => {
    // Comparar __PERFIL__ direto num componente funciona, mas é a grafia que
    // um refactor perde sem erro de tipo. Fora de state.ts (o dono) e do
    // d.ts, ninguém deve tocar o define cru.
    const violacoes = fontes.filter((arq) => {
      const rel = arq.replace(/\\/g, '/');
      if (rel.endsWith('src/state.ts')) return false;
      return readFileSync(arq, 'utf8').includes('__PERFIL__');
    });
    expect(violacoes, violacoes.join('\n')).toEqual([]);
  });
});
