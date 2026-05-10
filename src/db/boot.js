// src/db/boot.js — sequência de boot conforme §11.2 do SCHEMA_INDEXEDDB_v2.md
// Padrão defensivo: uma transação por operação, zero await dentro de transação ativa.

import { openDB } from './db.js';

const APP_VERSION = '0.1.0-etapa2';

function genId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function isoNow() {
  return new Date().toISOString();
}

// Promise para um único request IDB
function idbReq(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}

// Promise para conclusão de transação IDB
function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
    tx.onabort    = () => reject(new Error('transação abortada'));
  });
}

export async function boot() {

  // Passo 1 — Verificar disponibilidade do IDB
  if (!window.indexedDB) {
    return { ok: false, reason: 'indexeddb_unavailable' };
  }

  // Passo 2 — Abrir banco (cria schema v1 via onupgradeneeded se necessário)
  let db;
  try {
    db = await openDB();
  } catch (err) {
    return { ok: false, reason: 'open_failed', error: err.message };
  }

  // Passo 3 — Ler _meta em transação readonly própria
  let existingMeta;
  try {
    const txRead = db.transaction(['_meta'], 'readonly');
    existingMeta = await idbReq(txRead.objectStore('_meta').get('meta'));
    await txDone(txRead);
  } catch (err) {
    return { ok: false, reason: 'read_meta_failed', error: err.message };
  }

  // ── Caso B: banco já inicializado ─────────────────────────────────────────
  if (existingMeta) {

    // B-1: atualizar _meta — readwrite, um único put, sem leituras
    try {
      const txWrite = db.transaction(['_meta'], 'readwrite');
      txWrite.objectStore('_meta').put({
        ...existingMeta,
        lastOpenedAt: isoNow(),
        appVersion:   APP_VERSION,
      });
      await txDone(txWrite);
    } catch (_) {
      // Não fatal — banco funciona, timestamp não atualizado
    }

    // B-2: ler appSettings — transação readonly própria
    let activeProfileId = null;
    try {
      const txSettings = db.transaction(['appSettings'], 'readonly');
      const settings   = await idbReq(txSettings.objectStore('appSettings').get('singleton'));
      await txDone(txSettings);
      activeProfileId  = settings?.activeProfileId ?? null;
    } catch (_) {
      // Não fatal
    }

    // B-3: ler Profile ativo — transação readonly própria
    let profileName = 'desconhecido';
    if (activeProfileId) {
      try {
        const txProfile = db.transaction(['profiles'], 'readonly');
        const profile   = await idbReq(txProfile.objectStore('profiles').get(activeProfileId));
        await txDone(txProfile);
        if (profile?.name) profileName = profile.name;
      } catch (_) {
        // Não fatal
      }
    }

    return { ok: true, firstRun: false, activeProfileId, profileName };
  }

  // ── Caso A: primeira execução — criar todos os registros iniciais ─────────
  const profileId = genId('profile');
  const areaId    = genId('area');
  const installId = genId('install');
  const ts        = isoNow();

  try {
    const tx = db.transaction(
      ['_meta', 'appSettings', 'profiles', 'areas'],
      'readwrite'
    );

    // Todos os puts enfileirados sincronamente — zero await entre eles.
    // Transação permanece aberta até txDone resolver.

    tx.objectStore('_meta').put({
      id:                     'meta',
      schemaVersion:          1,
      installationId:         installId,
      createdAt:              ts,
      lastOpenedAt:           ts,
      appVersion:             APP_VERSION,
      storagePersistedStatus: 'unknown',
      lastBackupKnownAt:      null,
      migrations:             [],
    });

    tx.objectStore('appSettings').put({
      id:              'singleton',
      activeProfileId: profileId,
      createdAt:       ts,
      updatedAt:       ts,
    });

    tx.objectStore('profiles').put({
      profileId,
      name:        'Principal',
      preferences: {},
      createdAt:   ts,
      updatedAt:   ts,
      archivedAt:  null,
    });

    tx.objectStore('areas').put({
      areaId,
      profileId,
      name:           'Geral',
      nameNormalized: 'geral',
      order:          0,
      createdAt:      ts,
      updatedAt:      ts,
      archivedAt:     null,
    });

    await txDone(tx);
  } catch (err) {
    return { ok: false, reason: 'init_failed', error: err.message };
  }

  return { ok: true, firstRun: true, activeProfileId: profileId, profileName: 'Principal' };
}
