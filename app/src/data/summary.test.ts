import { describe, expect, it } from 'vitest';

import {
  monthCurrencies,
  monthKey,
  monthLabel,
  monthTotals,
  shiftMonth,
  totalsByCategory,
} from './summary';
import type { Transaction } from './schema';

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(36),
    currency: 'PEN',
    direction: 'out',
    occurredAt: 0,
    counterparty: 'X',
    status: 'confirmed',
    fingerprint: 'a',
    looseFingerprint: 'b',
    source: 'manual',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

const OCT = new Date(2026, 9, 15).getTime(); // 2026-10
const SEP = new Date(2026, 8, 20).getTime(); // 2026-09

describe('monthKey / shiftMonth / monthLabel', () => {
  it('arma la clave YYYY-MM', () => {
    expect(monthKey(new Date(2026, 0, 5))).toBe('2026-01');
    expect(monthKey(new Date(2026, 9, 31))).toBe('2026-10');
  });

  it('desplaza meses cruzando años', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-10', -10)).toBe('2025-12');
  });

  it('etiqueta en español', () => {
    expect(monthLabel('2026-10')).toBe('Octubre 2026');
  });
});

describe('monthTotals', () => {
  it('suma ingresos y gastos solo del mes pedido', () => {
    const txs = [
      tx({ amount: 100, occurredAt: OCT }),
      tx({ amount: 40, direction: 'in', occurredAt: OCT }),
      tx({ amount: 999, occurredAt: SEP }),
      tx({ amount: 50, occurredAt: OCT, status: 'dismissed' }),
      tx({ amount: 10, occurredAt: OCT, status: 'pending' }),
    ];
    expect(monthTotals(txs, '2026-10')).toEqual({ income: 40, expenses: 110 });
  });
});

describe('monedas', () => {
  it('monthCurrencies lista las monedas del mes con PEN primero', () => {
    const txs = [
      tx({ currency: 'USD', occurredAt: OCT }),
      tx({ currency: 'pen', occurredAt: OCT }),
      tx({ currency: 'EUR', occurredAt: SEP }),
    ];
    expect(monthCurrencies(txs, '2026-10')).toEqual(['PEN', 'USD']);
  });

  it('los totales no mezclan monedas', () => {
    const txs = [
      tx({ amount: 100, currency: 'PEN', occurredAt: OCT }),
      tx({ amount: 100, currency: 'USD', occurredAt: OCT }),
      tx({ amount: 5, currency: 'USD', direction: 'in', occurredAt: OCT }),
    ];
    expect(monthTotals(txs, '2026-10', 'PEN')).toEqual({ income: 0, expenses: 100 });
    expect(monthTotals(txs, '2026-10', 'USD')).toEqual({ income: 5, expenses: 100 });
    expect(
      totalsByCategory(txs, '2026-10', [], 'USD').reduce((s, r) => s + r.total, 0),
    ).toBe(100);
  });
});

describe('totalsByCategory', () => {
  it('agrupa gastos por categoría desc y usa Otros sin categoría', () => {
    const cats = [
      { id: 'comida', name: 'Comida', isDefault: true },
      { id: 'otros', name: 'Otros', isDefault: true },
    ];
    const txs = [
      tx({ amount: 30, categoryId: 'comida', occurredAt: OCT }),
      tx({ amount: 20, categoryId: 'comida', occurredAt: OCT }),
      tx({ amount: 15, occurredAt: OCT }),
      tx({ amount: 60, direction: 'in', categoryId: 'comida', occurredAt: OCT }),
      tx({ amount: 500, categoryId: 'comida', occurredAt: SEP }),
    ];
    expect(totalsByCategory(txs, '2026-10', cats)).toEqual([
      { categoryId: 'comida', name: 'Comida', total: 50, count: 2 },
      { categoryId: 'otros', name: 'Otros', total: 15, count: 1 },
    ]);
  });
});
