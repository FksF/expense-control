import type { ParserRule } from './types';

/**
 * Reglas semilla de parseo.
 *
 * IMPORTANTE: los formatos son estimados hasta validarlos con el corpus real
 * de la Fase 0 (docs/corpus-formatos.md). Las apps emisoras cambian los textos
 * con cada actualización: estas reglas se versionan y se actualizan remotas.
 */
export const SEED_RULES: ParserRule[] = [
  // ---- Yape (BCP) ----
  {
    id: 'yape-out-v1',
    app: 'com.bcp.innovacxion.yapeapp',
    titleMatch: 'Yape',
    pattern: '(?:Yapeaste|Pagaste)\\s+S\\/?\\.?\\s*(?<amount>[\\d.,]+)\\s+a\\s+(?<counterparty>.+)',
    direction: 'out',
    currency: 'PEN',
    channel: 'yape',
    version: 1,
  },
  {
    id: 'yape-out-qr-v1',
    app: 'com.bcp.innovacxion.yapeapp',
    titleMatch: 'Yape',
    pattern: 'Pagaste\\s+S\\/?\\.?\\s*(?<amount>[\\d.,]+)\\s+en\\s+(?<counterparty>.+)',
    direction: 'out',
    currency: 'PEN',
    channel: 'yape',
    version: 1,
  },
  {
    id: 'yape-in-v1',
    app: 'com.bcp.innovacxion.yapeapp',
    titleMatch: 'Yape',
    pattern: '(?:Te\\s+yapearon|Recibiste)\\s+S\\/?\\.?\\s*(?<amount>[\\d.,]+)\\s+de\\s+(?<counterparty>.+)',
    direction: 'in',
    currency: 'PEN',
    channel: 'yape',
    version: 1,
  },

  // ---- Plin ----
  // TODO(corpus): verificar package name real de Plin (estimado).
  {
    id: 'plin-out-v1',
    app: 'pe.com.plin',
    titleMatch: 'Plin',
    pattern: '(?:Enviaste|Pagaste)\\s+S\\/?\\.?\\s*(?<amount>[\\d.,]+)\\s+a\\s+(?<counterparty>.+)',
    direction: 'out',
    currency: 'PEN',
    channel: 'plin',
    version: 1,
  },
  {
    id: 'plin-in-v1',
    app: 'pe.com.plin',
    titleMatch: 'Plin',
    pattern: '(?:Recibiste|Te\\s+pliniaron)\\s+S\\/?\\.?\\s*(?<amount>[\\d.,]+)\\s+de\\s+(?<counterparty>.+)',
    direction: 'in',
    currency: 'PEN',
    channel: 'plin',
    version: 1,
  },

  // ---- Google Wallet / Google Pay ----
  // Las notificaciones de Wallet traen comercio y tarjeta; el monto puede faltar.
  {
    id: 'wallet-card-v1',
    app: 'com.google.android.apps.walletnfcrel',
    pattern:
      '(?:Pagaste|Paid)(?:\\s+S\\/?\\.?\\s*(?<amount>[\\d.,]+))?.*?(?:con\\s+(?:tu\\s+)?(?:tarjeta\\s+)?\\w+\\s*[•*]{2,4}\\d{2,4})?\\s+(?:en|at)\\s+(?<counterparty>.+)',
    direction: 'out',
    currency: 'PEN',
    channel: 'wallet',
    version: 1,
  },

  // ---- Apps de banca: compra con tarjeta ----
  {
    id: 'bcp-card-v1',
    app: 'com.bcp.bank',
    pattern:
      'Compra\\s+con\\s+[Tt]arjeta\\s+\\w+\\s*[•*]{2,4}\\d{2,4}\\s+en\\s+(?<counterparty>.+?)\\s+por\\s+S\\/?\\.?\\s*(?<amount>[\\d.,]+)',
    direction: 'out',
    currency: 'PEN',
    channel: 'card',
    version: 1,
  },
  {
    id: 'bbva-card-v1',
    app: 'com.bbva.pe',
    pattern:
      '(?:Cargo\\s+por\\s+compra|Compra)\\s+en\\s+(?<counterparty>.+?)\\s+(?:por\\s+)?S\\/?\\.?\\s*(?<amount>[\\d.,]+)',
    direction: 'out',
    currency: 'PEN',
    channel: 'card',
    version: 1,
  },
  {
    id: 'interbank-card-v1',
    app: 'pe.com.interbank.mobilebanking',
    pattern:
      '(?:Compra|Consumo)\\s+en\\s+(?<counterparty>.+?)\\s+(?:por\\s+)?S\\/?\\.?\\s*(?<amount>[\\d.,]+)',
    direction: 'out',
    currency: 'PEN',
    channel: 'card',
    version: 1,
  },

  // ---- Mercado Pago ----
  {
    id: 'mpago-out-v1',
    app: 'com.mercadopago.wallet',
    pattern: 'Pagaste\\s+S\\/?\\.?\\s*(?<amount>[\\d.,]+)\\s+a\\s+(?<counterparty>.+)',
    direction: 'out',
    currency: 'PEN',
    channel: 'wallet',
    version: 1,
  },
];
