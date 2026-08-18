import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './theme.css';

/*
 * © LexGo (uselexgo.com) — LexLoc. Uso gratuito por locadoras autorizado;
 * redistribuição hospedada fora dos domínios oficiais não é.
 *
 * Trava honesta de clonagem: HTML no navegador é sempre copiável — o que dá
 * para impedir é o clone HOSPEDADO passar por original. file:// e localhost
 * continuam livres (distribuição por WhatsApp é recurso do produto).
 */
(() => {
  try {
    // anti-iframe: ninguém embute a calculadora no site alheio
    if (window.top !== window.self) {
      window.top!.location.href = window.location.href;
      return;
    }
    const { protocol, hostname } = window.location;
    if (!protocol.startsWith('http')) return; // file:// = uso legítimo off-line
    const ok =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === 'uselexgo.com' ||
      hostname.endsWith('.uselexgo.com') ||
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.claude.ai') ||
      hostname.endsWith('.claudeusercontent.com');
    if (ok) return;
    document.addEventListener('DOMContentLoaded', () => {
      const aviso = document.createElement('div');
      aviso.setAttribute('role', 'alert');
      aviso.style.cssText =
        'position:fixed;inset:auto 0 0 0;z-index:99999;background:#6b1f73;color:#fff;' +
        'padding:12px 16px;font:600 13px/1.5 system-ui,sans-serif;text-align:center';
      aviso.innerHTML =
        'Cópia não autorizada — a calculadora oficial e gratuita está em ' +
        '<a href="https://uselexgo.com/locadoras" style="color:#d9b76b">uselexgo.com/locadoras</a>';
      document.body.appendChild(aviso);
    });
  } catch {
    /* nunca derrubar o app por causa da trava */
  }
})();

// marca d'água para quem abrir o console
console.info(
  '%cLexLoc © LexGo — uselexgo.com/locadoras',
  'color:#8f31aa;font-weight:700;font-size:14px',
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
