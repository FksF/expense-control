import { describe, expect, it } from 'vitest';
import {
  DEDUP_BUCKET_MS,
  fingerprint,
  fingerprintCandidates,
  isSameOperation,
  looseFingerprint,
  looseFingerprintCandidates,
  mergeTransactions,
  normalizeCounterparty,
} from './fingerprint';
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

  it('moneda distinta → huellas distintas', () => {
    expect(fingerprint(base)).not.toBe(fingerprint({ ...base, currency: 'USD' }));
    expect(looseFingerprint(base)).not.toBe(looseFingerprint({ ...base, currency: 'USD' }));
  });

  it('a cada lado del corte de bucket: candidatos solapan e isSameOperation confirma', () => {
    // 12:04:59 vs 12:05:01 de la misma operación → buckets distintos
    const boundary = Math.ceil(base.occurredAt / DEDUP_BUCKET_MS) * DEDUP_BUCKET_MS;
    const before = { ...base, occurredAt: boundary - 1000 };
    const after = { ...base, occurredAt: boundary + 1000 };
    expect(fingerprint(before)).not.toBe(fingerprint(after));
    // Pero el evento posterior sí encuentra la huella anterior entre sus candidatos
    expect(fingerprintCandidates(after)).toContain(fingerprint(before));
    expect(isSameOperation(before, after)).toBe(true);
    expect(looseFingerprintCandidates(after)).toContain(looseFingerprint(before));
  });

  it('dos eventos sin monto del mismo comercio no son la misma operación', () => {
    // Dos compras wallet sin monto en 5 min: pendientes separadas hasta que
    // una fuente con monto identifique cada operación.
    const sinMonto = { ...base, amount: undefined };
    const otraSinMonto = { ...base, amount: undefined, occurredAt: base.occurredAt + 60_000 };
    expect(isSameOperation(sinMonto, otraSinMonto)).toBe(false);
    // Pero sin-monto vs con-monto sí cruza (match tentativo)
    expect(isSameOperation(sinMonto, { ...base, occurredAt: base.occurredAt + 60_000 })).toBe(true);
  });

  it('isSameOperation rechaza operaciones distintas', () => {
    expect(isSameOperation(base, { ...base, currency: 'USD' })).toBe(false);
    expect(isSameOperation(base, { ...base, amount: 99 })).toBe(false);
    expect(isSameOperation(base, { ...base, counterparty: 'Otro' })).toBe(false);
    expect(isSameOperation(base, { ...base, direction: 'in' })).toBe(false);
    expect(
      isSameOperation(base, { ...base, occurredAt: base.occurredAt + 6 * 60_000 }),
    ).toBe(false);
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
