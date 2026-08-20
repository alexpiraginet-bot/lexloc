/**
 * Fotos por nome, com apelidos — ESCRITO À MÃO, ao contrário dos vizinhos.
 *
 * A tabela oficial de agosto/2026 chama os carros como a godrive chama
 * ("BYD Dolphin", "BYD King GL"), e as fotos foram geradas com os nomes
 * completos de versão ("BYD Dolphin GS", "BYD King GL DM-i"). O carro é o
 * mesmo; só o rótulo encurtou. Regenerar 22 fotos por causa de dois nomes
 * seria pagar API para resolver um problema de dicionário.
 *
 * Se um dia a tabela renomear de novo, é AQUI que se mexe — modelos.ts é
 * gerado e avisa para não editar.
 */
import { FOTO_MODELO } from './modelos';

const APELIDO: Record<string, string> = {
  'BYD Dolphin': 'BYD Dolphin GS',
  'BYD King GL': 'BYD King GL DM-i',
};

export function fotoDoModelo(nome: string): string | undefined {
  return FOTO_MODELO[nome] ?? FOTO_MODELO[APELIDO[nome] ?? ''];
}
