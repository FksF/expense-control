/**
 * Esquema lógico de la base local SQLite.
 * La implementación con Drizzle + expo-sqlite llega en la Fase 1;
 * aquí quedan los tipos de dominio que ya usan los módulos puros.
 */

export type TransactionStatus = 'pending' | 'needs_amount' | 'confirmed' | 'dismissed';
export type TransactionSource = 'notification' | 'sms' | 'email' | 'manual';

export interface Transaction {
  id: string;
  amount?: number;
  currency: string;
  direction: 'in' | 'out';
  occurredAt: number;
  counterparty: string;
  paymentMethod?: string;
  channel?: string;
  categoryId?: string;
  status: TransactionStatus;
  /** Huella de dedup multi-fuente. */
  fingerprint: string;
  /** Huella sin monto para cruzar eventos de wallet sin monto. */
  looseFingerprint: string;
  source: TransactionSource;
  sourceApp?: string;
  rawExcerpt?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SourceApp {
  packageName: string;
  displayName: string;
  parserVersion: number;
  enabled: boolean;
}

export interface EmailLog {
  id: string;
  transactionId: string;
  type: 'operation' | 'daily_summary' | 'monthly_summary';
  sentAt: number;
  status: 'queued' | 'sent' | 'failed';
}

export interface OutboxEvent {
  id: string;
  /** 'transaction_confirmed' | 'rules_pull' | ... */
  kind: string;
  payload: string;
  attempts: number;
  nextRetryAt: number;
  createdAt: number;
}

export interface Budget {
  month: string; // 'YYYY-MM'
  categoryId: string;
  limitAmount: number;
}
