// src/vrvs3p/vrvs3p.js — Etapa 7A
// Função pura VRVS 3P. Nenhum IO. Nenhum efeito colateral.

const INTERVALS = [1, 2, 4, 7, 12, 20, 35, 60, 90, 135, 200];
const MAX_STAGE = 10;
const MIN_STAGE = 0;
const RESULTADOS_VALIDOS = new Set(['esqueci', 'lembrei', 'facil']);

// Retorna YYYY-MM-DD na timezone LOCAL do dispositivo.
// toLocaleDateString('sv') usa locale sueco que produz formato ISO
// em horário local — sem depender de UTC. Evita troca de dia por DST.
export function today() {
  return new Date().toLocaleDateString('sv');
}

// Soma n dias a uma string YYYY-MM-DD sem risco de UTC shift.
// Decompõe a string em partes numéricas e usa o construtor local de Date.
// new Date('YYYY-MM-DD') interpreta como UTC — não usar aqui.
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d); // construtor local
  dt.setDate(dt.getDate() + n);
  return dt.toLocaleDateString('sv');
}

// Função pura principal.
// Entrada: card atual, resultado ('esqueci'|'lembrei'|'facil'), timestamp ISO.
// Saída: { updatedCardFields, reviewPayload } — sem gravar nada.
export function applyReview(card, result, reviewedAt) {
  if (!RESULTADOS_VALIDOS.has(result)) {
    throw new Error(`resultado_invalido: ${result}`);
  }

  const stageBefore    = card.vrvsStage;
  const intervalBefore = card.currentInterval;

  let newStage = stageBefore;
  if (result === 'esqueci') {
    newStage = stageBefore <= 1 ? MIN_STAGE : stageBefore - 2;
  } else if (result === 'lembrei') {
    newStage = stageBefore + 1;
  } else if (result === 'facil') {
    newStage = stageBefore + 2;
  }

  // Clamp defensivo
  newStage = Math.max(MIN_STAGE, Math.min(MAX_STAGE, newStage));

  const newInterval    = INTERVALS[newStage];
  const nextReviewDate = addDays(today(), newInterval);

  const updatedCardFields = {
    vrvsStage:       newStage,
    currentInterval: newInterval,
    nextReviewDate,
    lastReviewedAt:  reviewedAt,
    lastResult:      result,
    updatedAt:       reviewedAt,
  };

  const reviewPayload = {
    stageBefore,
    stageAfter:          newStage,
    intervalBefore,
    intervalAfter:       newInterval,
    nextReviewDateAfter: nextReviewDate,
  };

  return { updatedCardFields, reviewPayload };
}
