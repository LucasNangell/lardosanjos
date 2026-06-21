import {
  decimalToNumber,
  getMonthRange,
  roundMoney,
} from './transparency.utils';

describe('transparency.utils', () => {
  it('converts prisma decimal-like values without precision loss', () => {
    expect(decimalToNumber({ toString: () => '123.45' })).toBe(123.45);
    expect(decimalToNumber('99.99')).toBe(99.99);
  });

  it('builds month range for mysql-compatible filtering', () => {
    const { start, end } = getMonthRange(2026, 6);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(5);
    expect(end.getDate()).toBe(30);
  });

  it('rounds money to two decimals', () => {
    expect(roundMoney(10.556)).toBe(10.56);
  });
});
