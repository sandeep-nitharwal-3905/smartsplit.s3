const MONEY_SCALE = 100;

const toScaledInteger = (value: number): number => {
  const absolute = Math.round((Math.abs(value) + Number.EPSILON) * MONEY_SCALE);
  return value < 0 ? -absolute : absolute;
};

export const roundMoney = (value: number): number => toScaledInteger(value) / MONEY_SCALE;

export const toMoneyCents = (value: number): number => toScaledInteger(value);

export const fromMoneyCents = (cents: number): number => cents / MONEY_SCALE;

export const distributeMoney = (total: number, count: number): number[] => {
  if (count <= 0) {
    return [];
  }

  const totalCents = toMoneyCents(total);
  const baseCents = Math.trunc(totalCents / count);
  const remainder = totalCents - baseCents * count;

  return Array.from({ length: count }, (_, index) =>
    fromMoneyCents(baseCents + (index < remainder ? 1 : 0))
  );
};

export const sumMoney = (values: number[]): number =>
  fromMoneyCents(values.reduce((total, value) => total + toMoneyCents(value), 0));
