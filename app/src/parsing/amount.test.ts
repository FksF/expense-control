import { describe, expect, it } from 'vitest';
import { parseAmount } from './amount';

describe('parseAmount', () => {
  it('decimales con punto y coma', () => {
    expect(parseAmount('S/ 15.00')).toBe(15);
    expect(parseAmount('15,00')).toBe(15);
    expect(parseAmount('15.5')).toBe(15.5);
    expect(parseAmount('S/.20.50')).toBe(20.5);
  });

  it('separador único + 3 dígitos = miles, no decimales', () => {
    expect(parseAmount('1,234')).toBe(1234);
    expect(parseAmount('1.234')).toBe(1234);
    expect(parseAmount('S/ 1,234')).toBe(1234);
  });

  it('agrupación + decimal en ambos formatos', () => {
    expect(parseAmount('1,234.50')).toBe(1234.5);
    expect(parseAmount('1.234,56')).toBe(1234.56);
    expect(parseAmount('1.234.567')).toBe(1234567);
  });

  it('entradas inválidas → undefined', () => {
    expect(parseAmount('')).toBeUndefined();
    expect(parseAmount(null)).toBeUndefined();
    expect(parseAmount('abc')).toBeUndefined();
    expect(parseAmount('-5.00')).toBeUndefined();
  });
});
