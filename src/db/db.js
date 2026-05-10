// src/db/db.js — abre o banco e cria o schema v2
// Schema versão 2: 12 stores (v1: 11 + cardAssets), conforme MIGRACAO_v1_v2_CARD_ASSETS.md

const DB_NAME    = 'vrvs-nova';
const DB_VERSION = 2;

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = e => createSchema(e.target.result, e.oldVersion);
    request.onsuccess       = e => resolve(e.target.result);
    request.onerror         = () => reject(request.error);
    request.onblocked       = () => reject(new Error('IDB: banco bloqueado por outra aba'));
  });
}

function createSchema(db, oldVersion) {
  if (oldVersion < 1) {

    // _meta — singleton, sem índices
    db.createObjectStore('_meta', { keyPath: 'id' });

    // profiles
    const profiles = db.createObjectStore('profiles', { keyPath: 'profileId' });
    profiles.createIndex('by_archivedAt', 'archivedAt');
    profiles.createIndex('by_name',       'name');

    // appSettings — singleton, sem índices
    db.createObjectStore('appSettings', { keyPath: 'id' });

    // backupMetadata
    const bkMeta = db.createObjectStore('backupMetadata', { keyPath: 'backupId' });
    bkMeta.createIndex('by_createdAt', 'createdAt');

    // areas
    const areas = db.createObjectStore('areas', { keyPath: 'areaId' });
    areas.createIndex('by_profileId',             'profileId');
    areas.createIndex('by_profile_archived',      ['profileId', 'archivedAt']);
    areas.createIndex('by_profile_order',         ['profileId', 'order']);
    areas.createIndex('by_profile_nameNormalized',
      ['profileId', 'nameNormalized'], { unique: true });

    // temas
    const temas = db.createObjectStore('temas', { keyPath: 'temaId' });
    temas.createIndex('by_profileId',        'profileId');
    temas.createIndex('by_profile_area',     ['profileId', 'areaId']);
    temas.createIndex('by_profile_status',   ['profileId', 'status']);
    temas.createIndex('by_profile_archived', ['profileId', 'archivedAt']);

    // cards
    const cards = db.createObjectStore('cards', { keyPath: 'cardId' });
    cards.createIndex('by_profileId',              'profileId');
    cards.createIndex('by_temaId',                 'temaId');
    cards.createIndex('by_profile_temaId',         ['profileId', 'temaId']);
    cards.createIndex('by_profile_nextReviewDate', ['profileId', 'nextReviewDate']);
    cards.createIndex('by_profile_archived',       ['profileId', 'archivedAt']);

    // cardReviews
    const reviews = db.createObjectStore('cardReviews', { keyPath: 'cardReviewId' });
    reviews.createIndex('by_profileId',          'profileId');
    reviews.createIndex('by_cardId',             'cardId');
    reviews.createIndex('by_profile_reviewedAt', ['profileId', 'reviewedAt']);
    reviews.createIndex('by_profile_temaId',     ['profileId', 'temaId']);
    reviews.createIndex('by_sessionId',          'sessionId');

    // sessions
    const sessions = db.createObjectStore('sessions', { keyPath: 'sessionId' });
    sessions.createIndex('by_profileId',          'profileId');
    sessions.createIndex('by_profile_date',       ['profileId', 'date']);
    sessions.createIndex('by_profile_temaId',     ['profileId', 'temaId']);
    sessions.createIndex('by_profile_type',       ['profileId', 'type']);
    sessions.createIndex('by_pendingAssociation', ['profileId', 'pendingAssociation']);
    sessions.createIndex('by_profile_archived',   ['profileId', 'archivedAt']);

    // agendaItems
    const agenda = db.createObjectStore('agendaItems', { keyPath: 'agendaItemId' });
    agenda.createIndex('by_profileId',             'profileId');
    agenda.createIndex('by_profile_scheduledDate', ['profileId', 'scheduledDate']);
    agenda.createIndex('by_profile_status',        ['profileId', 'status']);
    agenda.createIndex('by_profile_type',          ['profileId', 'type']);
    agenda.createIndex('by_targetId',              'targetId');

    // captures
    const captures = db.createObjectStore('captures', { keyPath: 'captureId' });
    captures.createIndex('by_profileId',         'profileId');
    captures.createIndex('by_profile_status',    ['profileId', 'status']);
    captures.createIndex('by_profile_createdAt', ['profileId', 'createdAt']);
  }

  // ── v2: adiciona cardAssets ──────────────────────────────────────────────
  if (oldVersion < 2) {
    if (!db.objectStoreNames.contains('cardAssets')) {
      const assets = db.createObjectStore('cardAssets', { keyPath: 'assetId' });
      assets.createIndex('by_profileId',         'profileId');
      assets.createIndex('by_cardId',            'cardId');
      assets.createIndex('by_profile_cardId',    ['profileId', 'cardId']);
      assets.createIndex('by_profile_card_side', ['profileId', 'cardId', 'side']);
      assets.createIndex('by_profile_archived',  ['profileId', 'archivedAt']);
    }
  }
}
