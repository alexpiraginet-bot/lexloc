import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      // nos testes vale a fachada REAL — o corte por stub é assunto do build
      '@vendedor': fileURLToPath(new URL('./src/vendedor/real.ts', import.meta.url)),
    },
  },
  define: { __PERFIL__: JSON.stringify('vendedor') },
  test: { environment: 'node' },
});
