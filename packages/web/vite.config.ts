import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Dois alvos com o mesmo código:
 *  - build normal (dist/)            → servido pela API em produção
 *  - build OFFLINE=1 (dist-offline/) → UM arquivo HTML autocontido, sem rede,
 *    que abre de WhatsApp, e-mail ou pendrive. Nenhuma fonte externa.
 */
export default defineConfig(({ mode }) => {
  const offline = process.env.OFFLINE === '1' || mode === 'offline';
  return {
    plugins: [react(), ...(offline ? [viteSingleFile()] : [])],
    build: {
      outDir: offline ? 'dist-offline' : 'dist',
      target: 'es2019',
      cssTarget: 'chrome80',
      reportCompressedSize: false,
    },
    server: { port: 5199, strictPort: true },
  };
});
