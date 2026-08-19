/* cole no console, ou rode via browser tool */
(() => {
  const falhas = [];
  const vw = innerWidth;
  const RESPIRO = 12; // px mínimos entre texto e a borda da tela

  // 1) texto colado na borda (o bug do .hero sobrescrevendo o .wrap)
  document.querySelectorAll('h1,h2,h3,p,li,span,a,button,label').forEach((el) => {
    if (!el.textContent.trim()) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (getComputedStyle(el).position === 'fixed') return;
    if (r.left < RESPIRO || vw - r.right < RESPIRO) {
      falhas.push({ tipo: 'texto-na-borda', el: el.tagName + '.' + (el.className || '').toString().slice(0, 30),
        esq: Math.round(r.left), dir: Math.round(vw - r.right), txt: el.textContent.trim().slice(0, 40) });
    }
  });

  // 2) rolagem horizontal
  if (document.documentElement.scrollWidth > vw + 1) {
    falhas.push({ tipo: 'rolagem-lateral', largura: document.documentElement.scrollWidth, tela: vw });
  }

  // 3) alvo de toque menor que 44px (Apple HIG)
  document.querySelectorAll('a,button,input,select').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (r.height < 44 && el.type !== 'range') {
      falhas.push({ tipo: 'alvo-pequeno', el: el.tagName + '.' + (el.className || '').toString().slice(0, 24),
        altura: Math.round(r.height), txt: (el.textContent || '').trim().slice(0, 30) });
    }
  });

  // 4) texto miúdo demais no corpo
  document.querySelectorAll('p,li,span').forEach((el) => {
    if (!el.textContent.trim()) return;
    const t = parseFloat(getComputedStyle(el).fontSize);
    if (t && t < 12) falhas.push({ tipo: 'texto-miudo', tamanho: t, txt: el.textContent.trim().slice(0, 30) });
  });

  return JSON.stringify({ url: location.href, largura: vw, falhas }, null, 1);
})()
