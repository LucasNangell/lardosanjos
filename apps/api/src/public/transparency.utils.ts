export function decimalToNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    return parseFloat((value as { toString(): string }).toString());
  }
  return 0;
}

export function getMonthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

export function getCurrentMonthRange(reference = new Date()) {
  return getMonthRange(reference.getFullYear(), reference.getMonth() + 1);
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
