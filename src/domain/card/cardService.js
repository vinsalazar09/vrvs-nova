// src/domain/card/cardService.js — Etapa 7B.2 + 7C + 7E (getCard, updateCardWithAssets)
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
  const hasFrontAsset = assets.some(a => a.side === 'front');
  const hasBackAsset  = assets.some(a => a.side === 'back');
  if (!frontTrimmed && !hasFrontAsset) throw new Error('front_vazio');
  if (!backTrimmed  && !hasBackAsset)  throw new Error('back_vazio');

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

// Lê um Card ativo do perfil.
export async function getCard(profileId, cardId) {
  if (!profileId) throw new Error('profileId_obrigatorio');
  if (!cardId)    throw new Error('cardId_obrigatorio');

  const db   = await openDB();
  const tx   = db.transaction(['cards'], 'readonly');
  const card = await idbReq(tx.objectStore('cards').get(cardId));
  await txDone(tx);

  if (!card)                        throw new Error('card_nao_encontrado');
  if (card.profileId !== profileId) throw new Error('card_profile_invalido');
  if (card.archivedAt !== null)     throw new Error('card_arquivado');
  return card;
}

// Atualiza texto e assets de um Card existente.
// assetChanges: { upsert: [{ side, blob, thumbBlob, ... }], remove: ['front'|'back'] }
// Não altera vrvsStage, nextReviewDate, lastReviewedAt, lastResult.
export async function updateCardWithAssets(profileId, cardId, front, back, assetChanges = {}) {
  const frontTrimmed = (front ?? '').trim();
  const backTrimmed  = (back  ?? '').trim();
  const upsert       = assetChanges.upsert ?? [];
  const remove       = assetChanges.remove ?? [];

  const db = await openDB();

  const txRead = db.transaction(['cards', 'cardAssets'], 'readonly');
  const card   = await idbReq(tx.objectStore('cards').get(cardId));
  const allAssets = await idbReq(
    txRead.objectStore('cardAssets')
      .index('by_profile_cardId')
      .getAll([profileId, cardId])
  );
  await txDone(txRead);

  if (!card)                        throw new Error('card_nao_encontrado');
  if (card.profileId !== profileId) throw new Error('card_profile_invalido');
  if (card.archivedAt !== null)     throw new Error('card_arquivado');

  const activeAssets = allAssets.filter(a => a.archivedAt === null);

  function sideWillHaveContent(side, textTrimmed) {
    if (textTrimmed) return true;
    if (upsert.some(a => a.side === side)) return true;
    if (remove.includes(side)) return false;
    return activeAssets.some(a => a.side === side);
  }

  if (!sideWillHaveContent('front', frontTrimmed)) throw new Error('front_vazio');
  if (!sideWillHaveContent('back',  backTrimmed))  throw new Error('back_vazio');

  const ts = isoNow();
  const updatedCard = {
    ...card,
    front:     frontTrimmed,
    back:      backTrimmed,
    updatedAt: ts,
  };

  const tx = db.transaction(['cards', 'cardAssets'], 'readwrite');
  tx.objectStore('cards').put(updatedCard);

  for (const u of upsert) {
    activeAssets
      .filter(a => a.side === u.side)
      .forEach(a => tx.objectStore('cardAssets').delete(a.assetId));
    tx.objectStore('cardAssets').add(
      buildCardAsset(profileId, cardId, u.side, u, ts)
    );
  }

  for (const side of remove) {
    if (upsert.some(u => u.side === side)) continue;
    const asset = activeAssets.find(a => a.side === side);
    if (asset) tx.objectStore('cardAssets').delete(asset.assetId);
  }

  await txDone(tx);
  return { card: updatedCard };
}

// Hard delete: card + cardAssets + cardReviews (cascade — sem órfãos).
export async function deleteCard(profileId, cardId) {
  if (!profileId) throw new Error('profileId_obrigatorio');
  if (!cardId)    throw new Error('cardId_obrigatorio');

  const db = await openDB();

  const txRead = db.transaction(['cards', 'cardAssets', 'cardReviews'], 'readonly');
  const card = await idbReq(txRead.objectStore('cards').get(cardId));
  const assets = await idbReq(
    txRead.objectStore('cardAssets')
      .index('by_profile_cardId')
      .getAll([profileId, cardId])
  );
  const reviews = await idbReq(
    txRead.objectStore('cardReviews')
      .index('by_cardId')
      .getAll(cardId)
  );
  await txDone(txRead);

  if (!card)                        throw new Error('card_nao_encontrado');
  if (card.profileId !== profileId) throw new Error('card_profile_invalido');

  const tx = db.transaction(['cards', 'cardAssets', 'cardReviews'], 'readwrite');
  tx.objectStore('cards').delete(cardId);
  assets.forEach(a => tx.objectStore('cardAssets').delete(a.assetId));
  reviews.forEach(r => tx.objectStore('cardReviews').delete(r.cardReviewId));
  await txDone(tx);
}
