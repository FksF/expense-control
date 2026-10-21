import { describe, expect, it } from 'vitest';
import { categorize, learnRule } from './engine';
import { SEED_CATEGORY_RULES } from './seed';
import type { ParsedTransaction } from '../parsing/types';

const tx = (counterparty: string): ParsedTransaction => ({
  ruleId: 'x',
  sourceApp: 'x',
  amount: 10,
  currency: 'PEN',
  direction: 'out',
  counterparty,
  channel: 'card',
  occurredAt: 1_700_000_000_000,
  rawExcerpt: '',
});

describe('categorize', () => {
  it('asigna categoría por regla semilla', () => {
    const r = categorize(tx('PLAZA VEA MIRAFLORES'), SEED_CATEGORY_RULES);
    expect(r.categoryId).toBe('comida');
    expect(r.matchedRuleId).toBe('seed-plazavea');
  });

  it('contraparte desconocida → null (bandeja por revisar)', () => {
    const r = categorize(tx('JUANITO PEREZ'), SEED_CATEGORY_RULES);
    expect(r.categoryId).toBeNull();
    expect(r.matchedRuleId).toBeNull();
  });

  it('la regla con más hits gana', () => {
    const rules = [
      ...SEED_CATEGORY_RULES,
      { id: 'a', pattern: 'METRO', categoryId: 'compras', hits: 1, origin: 'learned' as const },
      { id: 'b', pattern: 'METRO', categoryId: 'transporte', hits: 50, origin: 'learned' as const },
    ];
    expect(categorize(tx('METRO LIMA'), rules).matchedRuleId).toBe('b');
  });

  it('una corrección learned gana a la semilla aunque tenga menos hits', () => {
    // El usuario corrige "Uber Eats" → comida; la semilla Uber→transporte (10 hits) no debe volver a ganar.
    const learned = learnRule('Uber Eats', 'comida', SEED_CATEGORY_RULES);
    const rules = [...SEED_CATEGORY_RULES, learned];
    expect(categorize(tx('UBER EATS'), rules).categoryId).toBe('comida');
    expect(categorize(tx('UBER EATS'), rules).matchedRuleId).toBe(learned.id);
  });
});

describe('learnRule', () => {
  it('corregir de vuelta a la categoría semilla restaura la semilla', () => {
    // Uber→comida, luego de vuelta a transporte (la semilla): debe ganar transporte.
    const toComida = learnRule('Uber', 'comida', SEED_CATEGORY_RULES);
    const restored = learnRule('Uber', 'transporte', [...SEED_CATEGORY_RULES, toComida]);
    // `restored` reemplaza a la learned anterior (mismo patrón y mismo id).
    const rules = [...SEED_CATEGORY_RULES, restored];
    expect(restored.id).toBe(toComida.id);
    expect(restored.categoryId).toBe('transporte');
    expect(categorize(tx('UBER'), rules).categoryId).toBe('transporte');
  });

  it('crea regla learned nueva', () => {
    const r = learnRule('Bodega Don Pepe', 'comida', SEED_CATEGORY_RULES);
    expect(r.origin).toBe('learned');
    expect(r.hits).toBe(1);
    expect(r.categoryId).toBe('comida');
  });

  it('refuerza una regla existente', () => {
    const rules = learnRule('Rappi', 'comida', SEED_CATEGORY_RULES);
    expect(rules.id).toBe('seed-rappi');
    expect(rules.hits).toBe(11);
  });
});
