// src/domain/review/reviewService.js — Etapa 7A
// Dois serviços de revisão: buscar fila e gravar review + atualizar card.

import { openDB }             from '../../db/db.js';
import { applyReview, today } from '../../vrvs3p/vrvs3p.js';

const RESULTADOS_VALIDOS = new Set(['esqueci', 'lembrei', 'facil']);

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

// Retorna todos os Cards vencidos do profile, ordenados para revisão.
// Usa índice by_profile_nextReviewDate com range até hoje (inclusive).
// Filtra archivedAt === null em memória.
// Ordena: nextReviewDate asc (mais atrasados primeiro); desempate createdAt asc.
export async function getCardsVencidos(profileId) {
  if (!profileId) throw new Error('profileId_obrigatorio');

  const db    = await openDB();
  const tx    = db.transaction(['cards'], 'readonly');
  const index = tx.objectStore('cards').index('by_profile_nextReviewDate');
  const hoje  = today();

  // Range composto: [profileId, data_antiga] até [profileId, hoje inclusive]
  const range = IDBKeyRange.bound(
    [profileId, '0000-01-01'],
    [profileId, hoje]
  );

  const all = await idbReq(index.getAll(range));
  await txDone(tx);

  return all
    .filter(c => c.archivedAt === null)
    .sort((a, b) => {
      const byDate = a.nextReviewDate.localeCompare(b.nextReviewDate);
      if (byDate !== 0) return byDate;
      return a.createdAt.localeCompare(b.createdAt);
    });
}

// Grava revisão de um Card em transação atômica — R12 do schema.
// add em cardReviews + put em cards em UMA transação readwrite.
// Se qualquer escrita falhar, a transação inteira aborta — sem inconsistência.
export async function recordReview(profileId, card, result) {
  if (!profileId)                      throw new Error('profileId_obrigatorio');
  if (!card?.cardId)                   throw new Error('card_invalido');
  if (card.profileId !== profileId)    throw new Error('card_profile_invalido');
  if (!RESULTADOS_VALIDOS.has(result)) throw new Error(`resultado_invalido: ${result}`);

  const reviewedAt = new Date().toISOString();
  const { updatedCardFields, reviewPayload } = applyReview(card, result, reviewedAt);

  const cardReviewId = `cardrev_${crypto.randomUUID()}`;

  const cardReview = {
    cardReviewId,
    profileId,
    cardId:              card.cardId,
    temaId:              card.temaId,              // denormalizado — snapshot do momento
    reviewedAt,                                    // ISO timestamp — indexado
    result,
    stageBefore:         reviewPayload.stageBefore,
    stageAfter:          reviewPayload.stageAfter,
    intervalBefore:      reviewPayload.intervalBefore,
    intervalAfter:       reviewPayload.intervalAfter,
    nextReviewDateAfter: reviewPayload.nextReviewDateAfter,
    sessionId:           null,                     // sem sessão formal na Etapa 7A
  };

  const updatedCard = { ...card, ...updatedCardFields };

  const db = await openDB();
  // Transação única com os dois stores — R12
  const tx = db.transaction(['cards', 'cardReviews'], 'readwrite');
  tx.objectStore('cards').put(updatedCard);        // atualiza cache VRVS 3P
  tx.objectStore('cardReviews').add(cardReview);   // cria review imutável
  await txDone(tx);                                // aguarda commit conjunto

  return { updatedCard, cardReview };
}
