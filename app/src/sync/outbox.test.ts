import { describe, expect, it } from 'vitest';
import { dueEvents, isExhausted, MAX_ATTEMPTS, nextRetryAt } from './outbox';
import type { OutboxEvent } from '../data/schema';

const ev = (attempts: number, nextRetry: number): OutboxEvent => ({
  id: 'e',
  kind: 'transaction_confirmed',
  payload: '{}',
  attempts,
  nextRetryAt: nextRetry,
  createdAt: 0,
});

describe('dueEvents', () => {
  it('eventos agotados siguen en la cola: reaparecen al vencer el backoff', () => {
    const stuck = ev(MAX_ATTEMPTS + 3, Date.now() - 1);
    expect(isExhausted(stuck)).toBe(true);
    expect(dueEvents([stuck])).toContain(stuck);
  });

  it('respeta nextRetryAt futuro', () => {
    const later = ev(0, Date.now() + 60_000);
    expect(dueEvents([later])).toHaveLength(0);
  });

  it('backoff con tope de 1 hora', () => {
    const before = Date.now();
    expect(nextRetryAt(0)).toBe(before + 30_000);
    expect(nextRetryAt(20)).toBeLessThanOrEqual(before + 60 * 60 * 1000 + 1000);
  });
});
