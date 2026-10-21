export type TransactionDirection = 'in' | 'out';

/** Notificación capturada por el listener nativo (o un correo normalizado). */
export interface RawFinancialEvent {
  /** Package name de la app emisora (Android) o 'email:<dominio>' para correos. */
  packageName: string;
  title: string;
  text: string;
  bigText?: string;
  /** Epoch ms en que se publicó. */
  postedAt: number;
}

/** Regla de parseo versionada; se distribuye desde el backend con caché local. */
export interface ParserRule {
  id: string;
  /** Package name de la app emisora o 'email:<dominio>'. */
  app: string;
  /** Substring requerido en el título (case-insensitive). Opcional. */
  titleMatch?: string;
  /** Regex con grupos nombrados: amount (opcional si la fuente no trae monto), counterparty. */
  pattern: string;
  direction: TransactionDirection;
  currency: string;
  /** yape | plin | card | transfer | wallet | bank_generic */
  channel: string;
  version: number;
}

export interface ParsedTransaction {
  ruleId: string;
  sourceApp: string;
  /** undefined cuando la fuente no incluye monto (p. ej. Google Wallet) → queda "por confirmar". */
  amount?: number;
  currency: string;
  direction: TransactionDirection;
  counterparty: string;
  channel: string;
  occurredAt: number;
  rawExcerpt: string;
}
