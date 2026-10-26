const SYMBOLS: Record<string, string> = {
  PEN: 'S/',
  USD: '$',
  EUR: '€',
};

/** 'S/ 87.90' — símbolo por moneda, dos decimales. */
export function formatMoney(amount: number | undefined, currency: string): string {
  if (amount == null) return '—';
  const symbol = SYMBOLS[currency.toUpperCase()] ?? `${currency.toUpperCase()} `;
  return `${symbol} ${amount.toFixed(2)}`;
}
