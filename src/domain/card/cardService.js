// src/domain/card/cardService.js — Etapa 6
// Serviço de domínio para Cards.
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

function isoToday() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// Privada: valida que o Tema existe e pertence ao profileId.
// Recebe conexão db já aberta. Lança erro controlado se inválido.
async function _validateTema(db, profileId, temaId) {
  const tx   = db.transaction(['temas'], 'readonly');
  const tema = await idbReq(tx.objectStore('temas').get(temaId));
  await txDone(tx);
  if (!tema)                        throw new Error('tema_nao_encontrado');
  if (tema.profileId !== profileId) throw new Error('tema_profile_invalido');
  return tema;
}

// Lista Cards do Tema, excluindo arquivados.
// Usa índice composto by_profile_temaId — retorna apenas Cards do profile E do tema.
// Ordena por createdAt asc (ordem de criação).
export async function listCards(profileId, temaId) {
  const db  = await openDB();
  const tx  = db.transaction(['cards'], 'readonly');
  const all = await idbReq(
    tx.objectStore('cards')
      .index('by_profile_temaId')
      .getAll([profileId, temaId])
  );
  await txDone(tx);
  return all
    .filter(c => c.archivedAt === null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// Cria Card novo vinculado ao Tema.
// Valida front e back não vazios.
// Valida que o Tema existe e pertence ao profileId (isolamento absoluto).
// Inicializa campos do VRVS 3P com valores zerados conforme schema.
export async function createCard(profileId, temaId, front, back) {
  const frontTrimmed = (front ?? '').trim();
  const backTrimmed  = (back  ?? '').trim();
  if (!frontTrimmed) throw new Error('front_vazio');
  if (!backTrimmed)  throw new Error('back_vazio');

  const db = await openDB();
  await _validateTema(db, profileId, temaId);

  const cardId = `card_${crypto.randomUUID()}`;
  const ts     = isoNow();

  const card = {
    cardId,
    profileId,
    temaId,
    front:           frontTrimmed,
    back:            backTrimmed,
    vrvsStage:       0,
    nextReviewDate:  isoToday(),
    currentInterval: 0,
    lastReviewedAt:  null,
    lastResult:      null,
    createdAt:       ts,
    updatedAt:       ts,
    archivedAt:      null,
  };

  const txWrite = db.transaction(['cards'], 'readwrite');
  txWrite.objectStore('cards').add(card);
  await txDone(txWrite);

  return card;
}
