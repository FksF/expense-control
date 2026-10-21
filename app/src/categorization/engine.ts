import type { ParsedTransaction } from '../parsing/types';
import { normalizeCounterparty } from '../dedup/fingerprint';

export interface Category {
  id: string;
  name: string;
  icon?: string;
  parentId?: string;
  isDefault: boolean;
}

export interface CategoryRule {
  id: string;
  /** Patrón normalizado que se compara contra la contraparte normalizada (substring). */
  pattern: string;
  categoryId: string;
  hits: number;
  origin: 'seed' | 'learned';
}

export interface CategorizationResult {
  categoryId: string | null;
  /** 'rule' si vino de una regla conocida; null → va a la bandeja "por revisar". */
  matchedRuleId: string | null;
}

/**
 * Asigna categoría por reglas comercio→categoría.
 * Prioridad: patrón más específico (más largo) → regla 'learned' sobre 'seed'
 * → más hits. Así una corrección explícita del usuario gana siempre a la
 * semilla genérica para ese comercio.
 */
export function categorize(
  tx: ParsedTransaction,
  rules: CategoryRule[],
): CategorizationResult {
  const who = normalizeCounterparty(tx.counterparty);
  let best: CategoryRule | null = null;
  let bestLen = 0;
  for (const rule of rules) {
    const p = normalizeCounterparty(rule.pattern);
    if (!p || !who.includes(p)) continue;
    const moreSpecific = p.length > bestLen;
    const sameLength = p.length === bestLen;
    const learnedWins = sameLength && rule.origin === 'learned' && best?.origin !== 'learned';
    const moreHits = sameLength && rule.origin === best?.origin && rule.hits > (best?.hits ?? 0);
    if (!best || moreSpecific || learnedWins || moreHits) {
      best = rule;
      bestLen = p.length;
    }
  }
  return { categoryId: best?.categoryId ?? null, matchedRuleId: best?.id ?? null };
}

/**
 * Aprendizaje: cuando el usuario corrige/confirma una categoría se crea o
 * refuerza una regla 'learned' para esa contraparte.
 */
export function learnRule(
  counterparty: string,
  categoryId: string,
  existing: CategoryRule[],
): CategoryRule {
  const pattern = normalizeCounterparty(counterparty);
  const found = existing.find(
    (r) => normalizeCounterparty(r.pattern) === pattern && r.categoryId === categoryId,
  );
  if (found) return { ...found, hits: found.hits + 1 };
  return {
    id: `learned-${Date.now().toString(36)}-${pattern.slice(0, 12)}`,
    pattern,
    categoryId,
    hits: 1,
    origin: 'learned',
  };
}
