import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

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
  const perfil = process.env.PERFIL === 'cliente' ? 'cliente' : 'vendedor';
  return {
    plugins: [react(), ...(offline ? [viteSingleFile()] : [])],
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
