import { parseAmount } from './amount';
import type { ParsedTransaction, ParserRule, RawFinancialEvent } from './types';

const compiled = new Map<string, RegExp>();

function regexFor(rule: ParserRule): RegExp {
  let re = compiled.get(rule.id + '@' + rule.version);
  if (!re) {
    re = new RegExp(rule.pattern, 'i');
    compiled.set(rule.id + '@' + rule.version, re);
  }
  return re;
}

function cleanCounterparty(raw: string | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/\s+/g, ' ')
    .replace(/[.\-_*]+$/g, '')
    .trim()
    .slice(0, 80);
}

/**
 * Intenta parsear un evento crudo contra las reglas de su app emisora.
 * Devuelve null cuando ninguna regla casa → el evento va a la bandeja "sin parsear".
 */
export function parseEvent(
  event: RawFinancialEvent,
  rules: ParserRule[],
): ParsedTransaction | null {
  const candidates = rules
    .filter((r) => r.app === event.packageName)
    .sort((a, b) => b.version - a.version);

  const haystacks = [event.text, event.bigText].filter(
    (s): s is string => typeof s === 'string' && s.length > 0,
  );

  for (const rule of candidates) {
    if (rule.titleMatch && !event.title.toLowerCase().includes(rule.titleMatch.toLowerCase())) {
      continue;
    }
    for (const hay of haystacks) {
      const m = regexFor(rule).exec(hay);
      if (!m) continue;
      const groups = m.groups ?? {};
      const counterparty = cleanCounterparty(groups.counterparty);
      if (!counterparty) continue;
      return {
        ruleId: rule.id,
        sourceApp: rule.app,
        amount: parseAmount(groups.amount),
        currency: rule.currency,
        direction: rule.direction,
        counterparty,
        channel: rule.channel,
        occurredAt: event.postedAt,
        rawExcerpt: hay.slice(0, 300),
      };
    }
  }
  return null;
}

/** Sello usado por el listener nativo al persistir eventos que no parsean. */
export interface UnparsedEvent {
  event: RawFinancialEvent;
  reason: 'no_rule_matched' | 'missing_counterparty';
}
