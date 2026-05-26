// src/domain/card/cardAssetService.js — Etapa 7B.2
// Responsabilidades: processar imagem em memória, montar objetos asset,
// ler cardAssets do banco, helpers de object URL.
// NÃO cria Cards. NÃO escreve no banco.

import { openDB } from '../../db/db.js';

function idbReq(req) {
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

function txDone(tx) {
  return new Promise((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
    tx.onabort    = () => rej(new Error('transação abortada'));
  });
}

const MAX_INPUT_BYTES  = 10 * 1024 * 1024; // 10 MB
const MAX_OUTPUT_BYTES =  2 * 1024 * 1024; //  2 MB
const FULL_MAX_DIM     = 1920;
const THUMB_MAX_DIM    = 200;
const THUMB_QUALITY    = 0.8;

function _loadImage(blob) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload  = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('imagem_invalida')); };
    img.src = url;
  });
}

function _canvasToBlob(canvas, quality) {
  return new Promise((res, rej) => {
    canvas.toBlob(
      b => b ? res(b) : rej(new Error('canvas_toBlob_falhou')),
      'image/jpeg',
      quality
    );
  });
}

function _drawScaled(img, maxDim) {
  const ratio  = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w      = Math.round(img.naturalWidth  * ratio);
  const h      = Math.round(img.naturalHeight * ratio);
  const canvas = document.createElement('canvas');
  canvas.width  = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  return { canvas, w, h };
}

async function _compressToTarget(img) {
  let dim     = FULL_MAX_DIM;
  let quality = 0.85;

  while (true) {
    const { canvas } = _drawScaled(img, dim);
    const blob = await _canvasToBlob(canvas, quality);
    if (blob.size <= MAX_OUTPUT_BYTES) return blob;

    quality -= 0.10;
    if (quality < 0.30) {
      quality = 0.85;
      dim = Math.round(dim * 0.9);
      if (dim < 200) throw new Error('imagem_impossivel_comprimir');
    }
  }
}

// Valida File e processa → retorna dados em memória, sem IO de banco.
// Aceita image/* e type vazio (iPhone / HEIC).
export async function processarImagem(file) {
  if (!file) throw new Error('arquivo_ausente');

  const tipo = file.type ?? '';
  if (tipo !== '' && !tipo.startsWith('image/')) {
    throw new Error('arquivo_nao_e_imagem');
  }

  if (file.size > MAX_INPUT_BYTES) throw new Error('arquivo_muito_grande');

  const img      = await _loadImage(file);
  const fullBlob = await _compressToTarget(img);
  const { canvas: tCanvas } = _drawScaled(img, THUMB_MAX_DIM);
  const thumbBlob = await _canvasToBlob(tCanvas, THUMB_QUALITY);

  return {
    blob:     fullBlob,
    thumbBlob,
    width:    img.naturalWidth,
    height:   img.naturalHeight,
    size:     fullBlob.size,
    mimeType: 'image/jpeg',
  };
}

// Monta objeto asset — sem IO. Chamado por cardService antes da transação.
export function buildCardAsset(profileId, cardId, side, processedImage, ts) {
  if (side !== 'front' && side !== 'back') throw new Error('side_invalido');

  return {
    assetId:    `asset_${crypto.randomUUID()}`,
    profileId,
    cardId,
    side,
    kind:       'image',
    mimeType:   processedImage.mimeType,
    blob:       processedImage.blob,
    thumbBlob:  processedImage.thumbBlob,
    width:      processedImage.width,
    height:     processedImage.height,
    size:       processedImage.size,
    createdAt:  ts,
    updatedAt:  ts,
    archivedAt: null,
  };
}

// Lê todos os assets ativos de um Card (índice by_profile_cardId)
export async function getCardAssets(profileId, cardId) {
  const db  = await openDB();
  const tx  = db.transaction(['cardAssets'], 'readonly');
  const all = await idbReq(
    tx.objectStore('cardAssets')
      .index('by_profile_cardId')
      .getAll([profileId, cardId])
  );
  await txDone(tx);
  return all.filter(a => a.archivedAt === null);
}

// Lê asset ativo de uma side específica usando índice by_profile_card_side.
// Filtra archivedAt === null em memória (resultado típico: 0-1 registros).
export async function getCardAssetBySide(profileId, cardId, side) {
  const db  = await openDB();
  const tx  = db.transaction(['cardAssets'], 'readonly');
  const all = await idbReq(
    tx.objectStore('cardAssets')
      .index('by_profile_card_side')
      .getAll([profileId, cardId, side])
  );
  await txDone(tx);
  const active = all.filter(a => a.archivedAt === null);
  return active[0] ?? null;
}

// Cria object URL de um blob
export function criarThumbUrl(blob) {
  return URL.createObjectURL(blob);
}

// Revoga lista de URLs
export function revogarUrls(urls) {
  urls.forEach(u => { try { if (u) URL.revokeObjectURL(u); } catch (_) {} });
}
