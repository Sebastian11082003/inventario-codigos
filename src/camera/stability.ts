export const REQUIRED_AGREEMENTS = 2;

export type ReadStreak = {
  code: string;
  count: number;
};

export function advanceStreak(
  current: ReadStreak | null,
  code: string,
  required = REQUIRED_AGREEMENTS,
): { streak: ReadStreak; confirmed: boolean } {
  const streak =
    current && current.code === code ? { code, count: current.count + 1 } : { code, count: 1 };
  return { streak, confirmed: streak.count >= required };
}

/** Dígito de control GS1 para EAN-8, UPC-A y EAN-13. */
export function hasValidGs1CheckDigit(code: string): boolean {
  if (!/^\d{8}$|^\d{12}$|^\d{13}$/.test(code)) {
    return false;
  }
  const digits = [...code].map((char) => Number(char));
  const check = digits.pop();
  if (check === undefined) {
    return false;
  }
  const sum = digits.reduce((total, digit, index) => {
    const fromRight = digits.length - index;
    return total + digit * (fromRight % 2 === 1 ? 3 : 1);
  }, 0);
  return (10 - (sum % 10)) % 10 === check;
}

export function wideEnough(xs: readonly number[], width: number, minimum = 0.45): boolean {
  if (width <= 0 || xs.length < 2) {
    return false;
  }
  let min = Infinity;
  let max = -Infinity;
  for (const x of xs) {
    if (x < min) {
      min = x;
    }
    if (x > max) {
      max = x;
    }
  }
  return max - min >= width * minimum;
}
