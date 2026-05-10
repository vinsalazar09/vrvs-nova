// src/domain/tema/temaService.js — Etapa 4
// Serviço de domínio para Temas.
// Abre o banco internamente. A UI nunca manipula db diretamente.

import { openDB } from '../../db/db.js';

function idbReq(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
    tx.onabort    = () => reject(new Error('transação abortada'));
  });
}

function isoNow() {
  return new Date().toISOString();
}

// Privada: busca areaId da Area "Geral" usando conexão já aberta.
// Transação readonly própria, um get por índice composto.
async function _getGeralAreaId(db, profileId) {
  const tx   = db.transaction(['areas'], 'readonly');
  const area = await idbReq(
    tx.objectStore('areas')
      .index('by_profile_nameNormalized')
      .get([profileId, 'geral'])
  );
  await txDone(tx);
  return area?.areaId ?? null;
}

// Lista todos os Temas do profile ativo, excluindo arquivados.
// Retorna array ordenado por createdAt desc (mais recente primeiro).
export async function listTemas(profileId) {
  const db  = await openDB();
  const tx  = db.transaction(['temas'], 'readonly');
  const all = await idbReq(
    tx.objectStore('temas')
      .index('by_profileId')
      .getAll(profileId)
  );
  await txDone(tx);
  return all
    .filter(t => t.archivedAt === null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Busca um Tema pelo temaId, validando que pertence ao profileId ativo.
// Retorna o objeto ou null se não existir ou não pertencer ao profile.
export async function getTema(profileId, temaId) {
  const db   = await openDB();
  const tx   = db.transaction(['temas'], 'readonly');
  const tema = await idbReq(tx.objectStore('temas').get(temaId));
  await txDone(tx);
  if (!tema || tema.profileId !== profileId) return null;
  return tema;
}

// Busca uma Area pelo areaId, validando que pertence ao profileId ativo.
// Retorna o objeto ou null se não existir ou não pertencer ao profile.
export async function getArea(profileId, areaId) {
  const db   = await openDB();
  const tx   = db.transaction(['areas'], 'readonly');
  const area = await idbReq(tx.objectStore('areas').get(areaId));
  await txDone(tx);
  if (!area || area.profileId !== profileId) return null;
  return area;
}

// Cria um Tema novo vinculado à Area "Geral" do profile.
// Lança 'nome_vazio' se nome vazio.
// Lança 'area_geral_nao_encontrada' se Area não existir no banco.
export async function createTema(profileId, nome) {
  const nomeTrimmed = (nome ?? '').trim();
  if (!nomeTrimmed) throw new Error('nome_vazio');

  const db     = await openDB();
  const areaId = await _getGeralAreaId(db, profileId);
  if (!areaId) throw new Error('area_geral_nao_encontrada');

  const temaId = `tema_${crypto.randomUUID()}`;
  const ts     = isoNow();

  const tema = {
    temaId,
    profileId,
    areaId,
    name:             nomeTrimmed,
    status:           'not_started',
    notes:            '',
    priority:         null,
    tags:             [],
    recurrenceConfig: null,
    createdAt:        ts,
    updatedAt:        ts,
    archivedAt:       null,
  };

  const txWrite = db.transaction(['temas'], 'readwrite');
  txWrite.objectStore('temas').add(tema);
  await txDone(txWrite);

  return tema;
}
