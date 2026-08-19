/**
 * Rebrand LexLoc → LexGo (ago/2026). Quem já tinha tabela de preços, propostas
 * ou marca gravadas no aparelho não pode perder nada por causa da troca de nome:
 * na primeira abertura da versão nova, copiamos as chaves antigas e apagamos.
 * Roda uma vez só — depois disso não há mais chave `lexloc.*` para achar.
 */
const RENOMEADAS: [string, string][] = [
  ['lexloc.catalogo.v1', 'lexgo.catalogo.v1'],
  ['lexloc.calc.v1', 'lexgo.calc.v1'],
  ['lexloc.propostas.v1', 'lexgo.propostas.v1'],
  ['lexloc.marca.v1', 'lexgo.marca.v1'],
];

export function migrarChaves(): void {
  /*
   * Sessão de link é SALA LIMPA: não lê nem grava nada no aparelho. Esta
   * função rodava sempre, antes do React montar, e além de ler quatro chaves
   * ela APAGA as antigas — então o vendedor que abrisse o próprio link para
   * conferir tinha o storage dele mexido por uma sessão que prometeu não
   * tocar em nada.
   */
  if (typeof location !== 'undefined' && /[#&]d=/.test(location.hash)) return;
  try {
    for (const [velha, nova] of RENOMEADAS) {
      const v = localStorage.getItem(velha);
      if (v == null) continue;
      if (localStorage.getItem(nova) == null) localStorage.setItem(nova, v);
      localStorage.removeItem(velha);
    }
  } catch {
    /* sem storage (aba privada, file:// travado) — segue com os padrões */
  }
}
