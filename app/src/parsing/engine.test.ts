import { describe, expect, it } from 'vitest';
import { parseEvent } from './engine';
import { SEED_RULES } from './rules';
import type { RawFinancialEvent } from './types';

const at = 1_700_000_000_000;

function ev(partial: Partial<RawFinancialEvent>): RawFinancialEvent {
  return { packageName: '', title: '', text: '', postedAt: at, ...partial };
}

describe('parseEvent — formatos estimados (validar con corpus Fase 0)', () => {
  it('parsea un Yape enviado', () => {
    const tx = parseEvent(
      ev({
        packageName: 'com.bcp.innovacxion.yapeapp',
        title: 'Yape',
        text: 'Yapeaste S/ 15.00 a Juan Perez Garcia',
      }),
      SEED_RULES,
    );
    expect(tx).not.toBeNull();
    expect(tx!.amount).toBe(15);
    expect(tx!.direction).toBe('out');
    expect(tx!.counterparty).toBe('Juan Perez Garcia');
    expect(tx!.currency).toBe('PEN');
    expect(tx!.channel).toBe('yape');
  });

  it('parsea un Yape recibido', () => {
    const tx = parseEvent(
      ev({
        packageName: 'com.bcp.innovacxion.yapeapp',
        title: 'Yape',
        text: 'Te yapearon S/ 20.50 de Maria Lopez',
      }),
      SEED_RULES,
    );
    expect(tx!.direction).toBe('in');
    expect(tx!.amount).toBe(20.5);
    expect(tx!.counterparty).toBe('Maria Lopez');
  });

  it('parsea un pago QR de Yape a comercio', () => {
    const tx = parseEvent(
      ev({
        packageName: 'com.bcp.innovacxion.yapeapp',
        title: 'Yape',
        text: 'Pagaste S/ 42.30 en BODEGA DON PEPE',
      }),
      SEED_RULES,
    );
    expect(tx!.direction).toBe('out');
    expect(tx!.amount).toBe(42.3);
    expect(tx!.counterparty).toBe('BODEGA DON PEPE');
  });

  it('parsea un Plin enviado', () => {
    const tx = parseEvent(
      ev({
        packageName: 'pe.com.plin',
        title: 'Plin',
        text: 'Enviaste S/ 30.00 a Carlos Ruiz',
      }),
      SEED_RULES,
    );
    expect(tx!.channel).toBe('plin');
    expect(tx!.amount).toBe(30);
  });

  it('detecta compra con tarjeta de banca', () => {
    const tx = parseEvent(
      ev({
        packageName: 'com.bcp.bank',
        title: 'Banca Móvil',
        text: 'Compra con Tarjeta Visa ••4532 en PLAZA VEA por S/ 87.90',
      }),
      SEED_RULES,
    );
    expect(tx!.channel).toBe('card');
    expect(tx!.amount).toBe(87.9);
    expect(tx!.counterparty).toBe('PLAZA VEA');
  });

  it('wallet sin monto → parsea con amount undefined', () => {
    const tx = parseEvent(
      ev({
        packageName: 'com.google.android.apps.walletnfcrel',
        title: 'Google Wallet',
        text: 'Pagaste con Visa ••1234 en STARBUCKS MIRAFLORES',
      }),
      SEED_RULES,
    );
    expect(tx).not.toBeNull();
    expect(tx!.amount).toBeUndefined();
    expect(tx!.counterparty).toContain('STARBUCKS');
  });

  it('devuelve null cuando ninguna regla casa', () => {
    const tx = parseEvent(
      ev({
        packageName: 'com.whatsapp',
        title: 'Mamá',
        text: 'ya almorzaste?',
      }),
      SEED_RULES,
    );
    expect(tx).toBeNull();
  });

  it('ignora notificaciones de Yape que no son operaciones', () => {
    const tx = parseEvent(
      ev({
        packageName: 'com.bcp.innovacxion.yapeapp',
        title: 'Yape',
        text: 'Tu sesión está por expirar',
      }),
      SEED_RULES,
    );
    expect(tx).toBeNull();
  });
});
