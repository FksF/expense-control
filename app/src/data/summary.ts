import type { Transaction } from './schema';
import type { Category } from '../categorization/engine';

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/** Clave de mes 'YYYY-MM' para agrupar transacciones. */
export function monthKey(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}`;
}

/** 'Octubre 2026' a partir de '2026-10'. */
export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS_ES[m - 1]} ${y}`;
}

/** Desplaza una clave de mes (delta en meses, negativo = atrás). */
export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const total = y * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${`${(total % 12) + 1}`.padStart(2, '0')}`;
}

/** Totales de ingresos y gastos (confirmados o pendientes) del mes. */
export function monthTotals(
  txs: Transaction[],
  key: string,
): { income: number; expenses: number } {
  let income = 0;
  let expenses = 0;
  for (const tx of txs) {
    if (tx.status === 'dismissed') continue;
    if (monthKey(new Date(tx.occurredAt)) !== key) continue;
    const amount = tx.amount ?? 0;
    if (tx.direction === 'in') income += amount;
    else expenses += amount;
  }
  return { income, expenses };
}

export interface CategoryTotal {
  categoryId: string;
  name: string;
  total: number;
  count: number;
}

/** Total de gastos por categoría en el mes, ordenado de mayor a menor. */
export function totalsByCategory(
  txs: Transaction[],
  key: string,
  categories: Category[],
): CategoryTotal[] {
  const names = new Map(categories.map((c) => [c.id, c.name]));
  const acc = new Map<string, CategoryTotal>();
  for (const tx of txs) {
    if (tx.status === 'dismissed' || tx.direction !== 'out') continue;
    if (monthKey(new Date(tx.occurredAt)) !== key) continue;
    const id = tx.categoryId ?? 'otros';
    const row = acc.get(id) ?? {
      categoryId: id,
      name: names.get(id) ?? 'Otros',
      total: 0,
      count: 0,
    };
    row.total += tx.amount ?? 0;
    row.count += 1;
    acc.set(id, row);
  }
  return [...acc.values()].sort((a, b) => b.total - a.total);
}
