/**
 * Injetado pelo vite (define: __PERFIL__) — vale 'cliente' ou 'vendedor'.
 * É literal em tempo de compilação: comparações com ele são dobradas pelo
 * bundler, e é assim que as telas da equipe somem do arquivo do cliente.
 * Fora do vite (vitest, ts-node) não existe — sempre proteja com `typeof`.
 */
declare const __PERFIL__: 'cliente' | 'vendedor' | undefined;
