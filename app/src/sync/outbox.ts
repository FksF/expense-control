import type { OutboxEvent, Transaction } from '../data/schema';

export const MAX_ATTEMPTS = 8;
export const BASE_DELAY_MS = 30_000;

/** Backoff exponencial con tope de ~1 h. */
export function nextRetryAt(attempts: number, now = Date.now()): number {
  const delay = Math.min(BASE_DELAY_MS * 2 ** attempts, 60 * 60 * 1000);
  return now + delay;
}

/** Clave de idempotencia estable para POST /events. */
export function idempotencyKey(tx: Transaction): string {
  return `${tx.fingerprint}:${tx.source}`;
}

export function transactionConfirmedEvent(tx: Transaction): Omit<OutboxEvent, 'id' | 'createdAt'> {
  return {
    kind: 'transaction_confirmed',
    payload: JSON.stringify({
      idempotencyKey: idempotencyKey(tx),
      transaction: tx,
    }),
    attempts: 0,
    nextRetryAt: 0,
  };
}

/** Selecciona los eventos listos para enviar; el caller marca attempts/nextRetryAt al fallar. */
export function dueEvents(events: OutboxEvent[], now = Date.now()): OutboxEvent[] {
  return events.filter((e) => e.attempts < MAX_ATTEMPTS && e.nextRetryAt <= now);
}
