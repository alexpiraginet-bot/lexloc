import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

/**
 * Alvos com o mesmo código:
 *  - build normal (dist/)  → servido pela API em produção (app completo)
 *  - OFFLINE=1             → UM arquivo HTML autocontido, sem rede
 *  - PERFIL=cliente        → versão do CLIENTE: modo vendedor inexistente,
 *    sem retaguarda, sem propostas — travado no build, não por botão
 *  - PERFIL=vendedor       → versão completa da equipe
 */
export default defineConfig(({ mode }) => {
  const offline = process.env.OFFLINE === '1' || mode === 'offline';
  /* O padrão é CLIENTE, de propósito: quem esquece de definir PERFIL recebe
     o build restrito, nunca a retaguarda. O  da raiz gera o
     dist/ que a API serve em '/' — com o padrão anterior ('vendedor'), subir
     a API publicava a mesa do vendedor na internet aberta. Menor privilégio
     por omissão; a versão da equipe agora exige PERFIL=vendedor explícito. */
  const perfil = process.env.PERFIL === 'vendedor' ? 'vendedor' : 'cliente';
  return {
    plugins: [react(), ...(offline ? [viteSingleFile()] : [])],
    resolve: {
      alias: {
        // as telas da equipe saem do bundle do cliente aqui, no resolver —
        // não por condicional em runtime (ver src/vendedor/real.ts)
        '@vendedor': fileURLToPath(
          new URL(perfil === 'cliente' ? './src/vendedor/vazio.tsx' : './src/vendedor/real.ts', import.meta.url),
        ),
      },
    },
    define: { __PERFIL__: JSON.stringify(perfil) },
    build: {
      outDir: offline ? `dist-offline-${perfil}` : 'dist',
      target: 'es2019',
      cssTarget: 'chrome80',
      reportCompressedSize: false,
    },
    server: { port: 5199, strictPort: true },
  };
});
