/**
 * Normaliza montos con formatos peruanos: "S/ 15.00", "15,00", "1,234.50",
 * "S/.20.00", "$ 5.00". Devuelve undefined si no puede parsearse.
 */
export function parseAmount(raw: string | undefined | null): number | undefined {
  if (raw == null) return undefined;
  let s = raw.trim().replace(/[A-Za-z$€£\s]/g, '').replace(/\//g, '');
  if (!s) return undefined;

  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastComma > lastDot) {
    // "1.234,56" (coma decimal) o "15,00"
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    // "1,234.56" (punto decimal) o "15.00"
    s = s.replace(/,/g, '');
  }

  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100) / 100;
}
