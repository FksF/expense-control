import { describe, expect, it } from 'vitest';
import { fingerprint, looseFingerprint, mergeTransactions, normalizeCounterparty } from './fingerprint';
import type { ParsedTransaction } from '../parsing/types';

const base: ParsedTransaction = {
  ruleId: 'yape-out-v1',
  sourceApp: 'com.bcp.innovacxion.yapeapp',
  amount: 15,
  currency: 'PEN',
  direction: 'out',
  counterparty: 'Juan Pérez',
  channel: 'yape',
  occurredAt: 1_700_000_000_000,
  rawExcerpt: 'Yapeaste S/ 15.00 a Juan Pérez',
};

describe('fingerprint', () => {
  it('misma operación por dos fuentes → misma huella', () => {
    const emailVersion: ParsedTransaction = {
      ...base,
      sourceApp: 'email:bcp.pe',
      ruleId: 'bcp-email-v1',
      occurredAt: base.occurredAt + 60_000, // el correo llega un minuto después
      rawExcerpt: 'Cargo por compra...',
    };
    expect(fingerprint(base)).toBe(fingerprint(emailVersion));
  });

  it('montos distintos → huellas distintas', () => {
    expect(fingerprint(base)).not.toBe(fingerprint({ ...base, amount: 16 }));
  });

  it('fuera de la ventana de 5 min → huellas distintas', () => {
    expect(fingerprint(base)).not.toBe(
      fingerprint({ ...base, occurredAt: base.occurredAt + 10 * 60_000 }),
    );
  });

  it('normaliza acentos, mayúsculas y ruido en contraparte', () => {
    expect(normalizeCounterparty('  Juan   Pérez!! ')).toBe('juan perez');
    expect(fingerprint({ ...base, counterparty: 'JUAN PEREZ' })).toBe(fingerprint(base));
  });

  it('loose fingerprint cruza evento sin monto con versión con monto', () => {
    const sinMonto = { ...base, amount: undefined };
    expect(looseFingerprint(sinMonto)).toBe(looseFingerprint(base));
  });
});

describe('mergeTransactions', () => {
  it('conserva el monto de la versión que lo tiene y el mejor timestamp', () => {
    const fromWallet: ParsedTransaction = {
      ...base,
      amount: undefined,
      sourceApp: 'com.google.android.apps.walletnfcrel',
      counterparty: 'STARBUCKS',
      occurredAt: base.occurredAt + 30_000,
      rawExcerpt: 'Pagaste con Visa',
    };
    const merged = mergeTransactions(fromWallet, base);
    expect(merged.amount).toBe(15);
    expect(merged.occurredAt).toBe(base.occurredAt);
  });
});
