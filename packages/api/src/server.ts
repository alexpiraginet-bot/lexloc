/** Entrada de produção: sobe o app na porta 8890 (ou PORT). */
import { buildApp } from './app.js';

const port = Number(process.env['PORT'] ?? 8890);
const app = buildApp({ logger: true });

app
  .listen({ port, host: '127.0.0.1' })
  .then(() => console.log(`calculadora godrive · http://127.0.0.1:${port}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
