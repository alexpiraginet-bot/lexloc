import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { migrarChaves } from './lib/migrar';
import { FAVICON_LEXGO } from './marca/simbolo';
import App from './App';
import './theme.css';

/*
 * © LexGo — uselexgo.com. Uso gratuito por locadoras autorizado;
 * redistribuição hospedada fora dos domínios oficiais não é.
 *
 * Trava honesta de clonagem: HTML no navegador é sempre copiável — o que dá
 * para impedir é o clone HOSPEDADO passar por original. file:// e localhost
 * continuam livres (distribuição por WhatsApp é recurso do produto).
 */
(() => {
  /*
   * 1) Checagem de hospedeiro — roda PRIMEIRO e num try próprio: o
   *    anti-iframe abaixo pode lançar em sandbox, e antes ele engolia esta
   *    checagem junto (clone dentro de iframe = banner nenhum).
   * 2) A lista não usa mais *.vercel.app inteiro: qualquer pessoa registra
   *    um subdomínio lá de graça. Vale o projeto oficial e seus previews.
   */
  try {
    const { protocol, hostname } = window.location;
    if (protocol.startsWith('http')) {
      const ok =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === 'uselexgo.com' ||
        hostname.endsWith('.uselexgo.com') ||
        hostname === 'godrive-plataforma-comercial.vercel.app' ||
        hostname.startsWith('godrive-plataforma-comercial-');
      if (!ok) {
        document.addEventListener('DOMContentLoaded', () => {
          const aviso = document.createElement('div');
          aviso.setAttribute('role', 'alert');
          aviso.style.cssText =
            'position:fixed;inset:auto 0 0 0;z-index:99999;background:#6b1f73;color:#fff;' +
            'padding:12px 16px;font:600 13px/1.5 system-ui,sans-serif;text-align:center';
          aviso.innerHTML =
            'Cópia não autorizada — a calculadora oficial e gratuita está em ' +
            '<a href="https://locadoras.uselexgo.com" style="color:#d9b76b">locadoras.uselexgo.com</a>';
          document.body.appendChild(aviso);
        });
      }
    }
  } catch {
    /* nunca derrubar o app pela trava */
  }

  // anti-iframe em try separado: lançar aqui não pode calar o banner acima
  try {
    if (window.top !== window.self) window.top!.location.replace(window.location.href);
  } catch {
    /* sandbox sem permissão de navegação — o banner acima já fez o papel */
  }
})();

// marca d'água para quem abrir o console
console.info(
  '%cLexGo © Lex Technology — locadoras.uselexgo.com',
  'color:#8f31aa;font-weight:700;font-size:14px',
);

/*
 * Favicon: o índice traz um provisório inline para a primeira pintura não
 * ficar sem ícone, e aqui ele vira a marca de verdade. Vai por data URI
 * porque o arquivo do vendedor roda em file:// — nenhum caminho de servidor
 * resolveria.
 */
(() => {
  const l = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (l) l.href = FAVICON_LEXGO;
})();

// rebrand: recupera dados gravados sob as chaves antigas antes do 1º render
migrarChaves();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
