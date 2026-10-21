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

/**
 * Eventos que llevan muchos intentos fallidos. No salen de la cola — se
 * siguen reintentando con el delay tope — pero la capa de datos puede
 * marcarlos para revisión en la UI.
 */
export function isExhausted(e: OutboxEvent): boolean {
  return e.attempts >= MAX_ATTEMPTS;
}

/**
 * Selecciona los eventos listos para enviar; el caller marca
 * attempts/nextRetryAt al fallar. No hay corte por intentos: un corte
 * permanente dejaría transacciones sin sincronizar tras un apagón largo.
 */
export function dueEvents(events: OutboxEvent[], now = Date.now()): OutboxEvent[] {
  return events.filter((e) => e.nextRetryAt <= now);
}
