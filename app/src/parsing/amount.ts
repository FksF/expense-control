/**
 * Normaliza montos con formatos peruanos: "S/ 15.00", "15,00", "1,234.50",
 * "S/.20.00", "$ 5.00", "S/ 1,234", "S/ 1.234". Devuelve undefined si no
 * puede parsearse.
 *
 * Un único separador seguido de exactamente 3 dígitos se trata como
 * separador de miles ("1,234" → 1234, no 1.23).
 */
export function parseAmount(raw: string | undefined | null): number | undefined {
  if (raw == null) return undefined;
  let s = raw.trim().replace(/[A-Za-z$€£\s]/g, '').replace(/\//g, '');
  if (!s) return undefined;

  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot !== -1 && lastComma !== -1) {
    // Ambos separadores: el último es decimal, el otro agrupa miles.
    if (lastComma > lastDot) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (lastDot !== -1 || lastComma !== -1) {
    const sep = lastDot !== -1 ? '.' : ',';
    const parts = s.split(sep);
    const last = parts[parts.length - 1];
    if (last.length === 3) {
      // "1,234" / "1.234" / "1.234.567" → separador de miles
      s = parts.join('');
    } else {
      // "15,00" / ".20.50" → el último separador es decimal
      s = parts.slice(0, -1).join('') + '.' + last;
    }
  }

  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100) / 100;
}
