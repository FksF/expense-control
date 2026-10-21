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

/**
 * Huella de deduplicación multi-fuente: la misma operación puede llegar por
 * notificación, SMS y correo. Monto ausente (wallet sin monto) forma su propia
 * huella por contraparte+tiempo y se fusiona cuando llega la versión con monto.
 */
export function fingerprint(tx: Pick<ParsedTransaction, 'amount' | 'occurredAt' | 'counterparty' | 'direction'>): string {
  const amount = tx.amount != null ? tx.amount.toFixed(2) : 'na';
  const bucket = Math.floor(tx.occurredAt / DEDUP_BUCKET_MS);
  const who = normalizeCounterparty(tx.counterparty);
  return fnv1a(`${amount}|${bucket}|${who}|${tx.direction}`);
}

/** Huella relajada sin monto — cruza el evento sin monto con la versión que sí lo trae. */
export function looseFingerprint(tx: Pick<ParsedTransaction, 'occurredAt' | 'counterparty' | 'direction'>): string {
  const bucket = Math.floor(tx.occurredAt / DEDUP_BUCKET_MS);
  const who = normalizeCounterparty(tx.counterparty);
  return fnv1a(`loose|${bucket}|${who}|${tx.direction}`);
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
