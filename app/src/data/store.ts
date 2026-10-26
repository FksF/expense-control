import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { CategoryRule } from '../categorization/engine';
import { categorize, learnRule } from '../categorization/engine';
import { SEED_CATEGORY_RULES } from '../categorization/seed';
import { fingerprint, looseFingerprint } from '../dedup/fingerprint';
import type { Transaction, TransactionSource } from './schema';

/**
 * Store local de gastos: JSON en el directorio de documentos de la app.
 * Interino hasta el esquema SQLite (Drizzle) de la Fase 1 — el volumen de
 * datos es chico (cientos de transacciones) y el JSON se migra en un paso.
 * En web no hay persistencia (solo memoria).
 */

const STORE_FILE = 'expenses.json';

interface Persisted {
  transactions: Transaction[];
  learnedRules: CategoryRule[];
}

let transactions: Transaction[] = [];
let learnedRules: CategoryRule[] = [];

/** Promesa compartida: todos los lectores/escritores esperan la misma carga. */
let initPromise: Promise<void> | null = null;
/** Cola de escrituras: cada corrida persiste el snapshot más reciente. */
let writeChain: Promise<void> = Promise.resolve();

const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  for (const listener of listeners) listener();
}

function storeFile(): File | null {
  if (Platform.OS === 'web') return null;
  return new File(Paths.document, STORE_FILE);
}

/**
 * Escribe el snapshot completo en un archivo temporal y lo mueve sobre el
 * destino solo si la escritura terminó: un corte a mitad no deja el ledger
 * borrado ni truncado. Las escrituras van en cadena para que una tardía no
 * pise un estado más nuevo.
 */
function persist(): Promise<void> {
  const file = storeFile();
  if (!file) return Promise.resolve();
  const result = writeChain.then(async () => {
    const tmp = new File(Paths.document, `${STORE_FILE}.tmp`);
    if (tmp.exists) tmp.delete();
    tmp.create();
    await tmp.write(JSON.stringify({ transactions, learnedRules }));
    await tmp.move(file, { overwrite: true });
  });
  // Una escritura fallida no bloquea las siguientes, pero sí le llega al caller.
  writeChain = result.catch(() => {});
  return result;
}

/** Carga inicial; segura de llamar varias veces (comparte la misma promesa). */
export function initStore(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const file = storeFile();
      if (file && file.exists) {
        try {
          const parsed = JSON.parse(await file.text()) as Partial<Persisted>;
          transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
          learnedRules = Array.isArray(parsed.learnedRules) ? parsed.learnedRules : [];
        } catch (e) {
          console.warn('Store de gastos corrupto; se empieza vacío', e);
        }
      }
      notify();
    })();
  }
  return initPromise;
}

export function getTransactions(): Transaction[] {
  return transactions;
}

export function getCategoryRules(): CategoryRule[] {
  return [...learnedRules, ...SEED_CATEGORY_RULES];
}

/** Sugerencia de categoría a partir de la contraparte (reglas seed + aprendidas). */
export function suggestCategory(counterparty: string): string | null {
  const { categoryId } = categorize(
    {
      ruleId: 'manual',
      sourceApp: 'manual',
      currency: 'PEN',
      direction: 'out',
      counterparty,
      channel: 'manual',
      occurredAt: Date.now(),
      rawExcerpt: '',
    },
    getCategoryRules(),
  );
  return categoryId;
}

export interface NewExpenseInput {
  amount?: number;
  currency: string;
  direction: 'in' | 'out';
  occurredAt: number;
  counterparty: string;
  categoryId?: string;
  /**
   * true cuando el usuario eligió la categoría explícitamente (no una
   * autosugerencia): solo entonces se aprende la regla comercio→categoría.
   */
  categoryConfirmed?: boolean;
  source?: TransactionSource;
  channel?: string;
  sourceApp?: string;
}

let seq = 0;

function newId(): string {
  seq += 1;
  return `tx-${Date.now().toString(36)}-${seq}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Registra un gasto/ingreso; aprende la regla de categoría si el usuario la confirmó. */
export async function addExpense(input: NewExpenseInput): Promise<Transaction> {
  await initStore();
  const now = Date.now();
  const shape = {
    amount: input.amount,
    currency: input.currency,
    direction: input.direction,
    counterparty: input.counterparty,
    occurredAt: input.occurredAt,
  };
  const tx: Transaction = {
    id: newId(),
    ...shape,
    categoryId: input.categoryId,
    status: 'confirmed',
    fingerprint: fingerprint(shape),
    looseFingerprint: looseFingerprint(shape),
    source: input.source ?? 'manual',
    channel: input.channel ?? 'manual',
    sourceApp: input.sourceApp,
    createdAt: now,
    updatedAt: now,
  };
  transactions = [tx, ...transactions];
  if (input.categoryConfirmed && input.categoryId && input.counterparty.trim()) {
    const learned = learnRule(input.counterparty, input.categoryId, getCategoryRules());
    learnedRules = [
      learned,
      ...learnedRules.filter((r) => r.id !== learned.id),
    ];
  }
  notify();
  await persist();
  return tx;
}

export async function removeExpense(id: string): Promise<void> {
  await initStore();
  transactions = transactions.filter((t) => t.id !== id);
  notify();
  await persist();
}
