// src/domain/card/cardService.js — Etapa 7B.2 (createCardWithAssets + wrapper createCard)
// Serviço de domínio para Cards.
// Abre o banco internamente. A UI nunca manipula db diretamente.

import { openDB }        from '../../db/db.js';
import { today }         from '../../vrvs3p/vrvs3p.js';
import { buildCardAsset } from './cardAssetService.js';

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

// Privada: valida que o Tema existe e pertence ao profileId.
async function _validateTema(db, profileId, temaId) {
  const tx   = db.transaction(['temas'], 'readonly');
  const tema = await idbReq(tx.objectStore('temas').get(temaId));
  await txDone(tx);
  if (!tema)                        throw new Error('tema_nao_encontrado');
  if (tema.profileId !== profileId) throw new Error('tema_profile_invalido');
  return tema;
}

// Lista Cards do Tema, excluindo arquivados.
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

// Cria Card sem imagens — retrocompatível com todas as chamadas existentes.
export async function createCard(profileId, temaId, front, back) {
  return createCardWithAssets(profileId, temaId, front, back, []);
}

// Cria Card com assets opcionais já processados em memória.
// assets: [{ side, blob, thumbBlob, width, height, size, mimeType }]
// Transação atômica única: cards + cardAssets.
export async function createCardWithAssets(profileId, temaId, front, back, assets = []) {
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
    nextReviewDate:  today(),
    currentInterval: 0,
    lastReviewedAt:  null,
    lastResult:      null,
    createdAt:       ts,
    updatedAt:       ts,
    archivedAt:      null,
  };

  // Montar objetos asset com cardId já definido — antes de abrir transação de escrita
  const assetObjects = assets.map(a => buildCardAsset(profileId, cardId, a.side, a, ts));

  // Transação atômica: cards + cardAssets sempre juntos.
  // Se assets = [], nenhuma escrita em cardAssets — mas o padrão de transação é único.
  const tx = db.transaction(['cards', 'cardAssets'], 'readwrite');
  tx.objectStore('cards').add(card);
  assetObjects.forEach(asset => tx.objectStore('cardAssets').add(asset));
  await txDone(tx);

  return { card, assets: assetObjects };
}
