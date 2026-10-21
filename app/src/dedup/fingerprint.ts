import type { ParsedTransaction } from '../parsing/types';

/** Ventana de tiempo (5 min) para considerar que dos eventos son la misma operación. */
export const DEDUP_BUCKET_MS = 5 * 60 * 1000;

export function normalizeCounterparty(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** FNV-1a 64-bit → hex. Determinista, sincrónico y portable (RN sin crypto.subtle). */
function fnv1a(input: string): string {
  let h = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < input.length; i++) {
    h ^= BigInt(input.charCodeAt(i));
    h = (h * prime) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, '0');
}

type FingerprintInput = Pick<
  ParsedTransaction,
  'amount' | 'occurredAt' | 'counterparty' | 'direction' | 'currency'
>;
type LooseFingerprintInput = Pick<
  ParsedTransaction,
  'occurredAt' | 'counterparty' | 'direction' | 'currency'
>;

function bucketIndex(occurredAt: number): number {
  return Math.floor(occurredAt / DEDUP_BUCKET_MS);
}

function fingerprintAt(tx: FingerprintInput, bucket: number): string {
  const amount = tx.amount != null ? tx.amount.toFixed(2) : 'na';
  const who = normalizeCounterparty(tx.counterparty);
  const ccy = tx.currency.toLowerCase();
  return fnv1a(`${amount}|${ccy}|${bucket}|${who}|${tx.direction}`);
}

function looseFingerprintAt(tx: LooseFingerprintInput, bucket: number): string {
  const who = normalizeCounterparty(tx.counterparty);
  const ccy = tx.currency.toLowerCase();
  return fnv1a(`loose|${ccy}|${bucket}|${who}|${tx.direction}`);
}

/**
 * Huella de deduplicación multi-fuente: la misma operación puede llegar por
 * notificación, SMS y correo. La huella es clave de búsqueda, no prueba de
 * igualdad: dos eventos a cada lado del corte de 5 min tienen huellas
 * distintas pero son la misma operación. Usa fingerprintCandidates para
 * localizar candidatos y isSameOperation para confirmar.
 */
export function fingerprint(tx: FingerprintInput): string {
  return fingerprintAt(tx, bucketIndex(tx.occurredAt));
}

/** Huellas en los buckets adyacentes (b-1, b, b+1) para localizar candidatos. */
export function fingerprintCandidates(tx: FingerprintInput): string[] {
  const b = bucketIndex(tx.occurredAt);
  return [b - 1, b, b + 1].map((bucket) => fingerprintAt(tx, bucket));
}

/** Huella relajada sin monto — cruza el evento sin monto con la versión que sí lo trae. */
export function looseFingerprint(tx: LooseFingerprintInput): string {
  return looseFingerprintAt(tx, bucketIndex(tx.occurredAt));
}

export function looseFingerprintCandidates(tx: LooseFingerprintInput): string[] {
  const b = bucketIndex(tx.occurredAt);
  return [b - 1, b, b + 1].map((bucket) => looseFingerprintAt(tx, bucket));
}

/**
 * Confirmación de dedup: compara los campos reales dentro de la ventana
 * exacta de 5 min. Cubre el caso de dos reportes de la misma operación
 * separados por el corte de bucket (12:04:59 vs 12:05:01).
 * También sirve como match relajado: si falta el monto en un lado, no se compara.
 */
export function isSameOperation(a: ParsedTransaction, b: ParsedTransaction): boolean {
  if (a.direction !== b.direction) return false;
  if (a.currency && b.currency && a.currency.toLowerCase() !== b.currency.toLowerCase()) {
    return false;
  }
  if (a.amount != null && b.amount != null && Math.abs(a.amount - b.amount) > 0.005) {
    return false;
  }
  if (normalizeCounterparty(a.counterparty) !== normalizeCounterparty(b.counterparty)) {
    return false;
  }
  return Math.abs(a.occurredAt - b.occurredAt) <= DEDUP_BUCKET_MS;
}

/**
 * Fusiona dos representaciones de la misma operación conservando el registro
 * con más datos: el correo suele traer el comercio completo, la notificación
 * el mejor timestamp.
 */
export function mergeTransactions(
  base: ParsedTransaction,
  incoming: ParsedTransaction,
): ParsedTransaction {
  return {
    ...base,
    amount: base.amount ?? incoming.amount,
    counterparty:
      base.counterparty.length >= incoming.counterparty.length
        ? base.counterparty
        : incoming.counterparty,
    occurredAt: Math.min(base.occurredAt, incoming.occurredAt),
    rawExcerpt: base.rawExcerpt.length >= incoming.rawExcerpt.length ? base.rawExcerpt : incoming.rawExcerpt,
    currency: base.currency || incoming.currency,
    channel: base.channel !== 'bank_generic' ? base.channel : incoming.channel,
    ruleId: base.amount != null ? base.ruleId : incoming.ruleId,
    direction: base.direction,
    sourceApp: base.sourceApp,
  };
}
