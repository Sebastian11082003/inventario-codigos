import { hasValidGs1CheckDigit } from "./stability";

/** Anchos de barra/espacio (suman 7) para los dígitos de la izquierda con paridad L. */
const L = [
  [3, 2, 1, 1],
  [2, 2, 2, 1],
  [2, 1, 2, 2],
  [1, 4, 1, 1],
  [1, 1, 3, 2],
  [1, 2, 3, 1],
  [1, 1, 1, 4],
  [1, 3, 1, 2],
  [1, 2, 1, 3],
  [3, 1, 1, 2],
];

/** Paridad G. La R de la derecha usa los mismos anchos que L, empezando en negro. */
const G = [
  [1, 1, 2, 3],
  [1, 2, 2, 2],
  [2, 2, 1, 2],
  [1, 1, 4, 1],
  [2, 3, 1, 1],
  [1, 3, 2, 1],
  [4, 1, 1, 1],
  [2, 1, 3, 1],
  [3, 1, 2, 1],
  [2, 1, 1, 3],
];

const FIRST_DIGIT = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

export type EanHit = {
  code: string;
  start: number;
  end: number;
  error: number;
};

type Run = {
  black: boolean;
  width: number;
  start: number;
};

function binarize(samples: ArrayLike<number>, window: number, bias: number): boolean[] {
  const count = samples.length;
  const prefix = new Float64Array(count + 1);
  for (let index = 0; index < count; index += 1) {
    prefix[index + 1] = prefix[index] + samples[index];
  }
  const bits = new Array<boolean>(count);
  for (let index = 0; index < count; index += 1) {
    const from = Math.max(0, index - window);
    const to = Math.min(count - 1, index + window);
    const mean = (prefix[to + 1] - prefix[from]) / (to - from + 1);
    bits[index] = samples[index] < mean - bias;
  }
  return bits;
}

function runsFrom(bits: readonly boolean[]): Run[] {
  const runs: Run[] = [];
  let index = 0;
  while (index < bits.length) {
    const black = bits[index];
    const start = index;
    while (index < bits.length && bits[index] === black) {
      index += 1;
    }
    runs.push({ black, width: index - start, start });
  }
  return runs;
}

function matchWidths(widths: readonly number[], table: readonly (readonly number[])[]): { digit: number; error: number } | null {
  const sum = widths[0] + widths[1] + widths[2] + widths[3];
  if (sum <= 0) {
    return null;
  }
  let bestDigit = -1;
  let bestError = 99;
  for (let digit = 0; digit < table.length; digit += 1) {
    const pattern = table[digit];
    let error = 0;
    for (let index = 0; index < 4; index += 1) {
      error += Math.abs((widths[index] * 7) / sum - pattern[index]);
    }
    if (error < bestError) {
      bestError = error;
      bestDigit = digit;
    }
  }
  if (bestDigit < 0 || bestError > 2.1) {
    return null;
  }
  return { digit: bestDigit, error: bestError };
}

function chooseParity(
  odd: { digit: number; error: number } | null,
  even: { digit: number; error: number } | null,
): { digit: number; kind: "L" | "G"; error: number } | null {
  if (odd && (!even || odd.error <= even.error)) {
    return { digit: odd.digit, kind: "L", error: odd.error };
  }
  if (even) {
    return { digit: even.digit, kind: "G", error: even.error };
  }
  return null;
}

function guardWidthsMatch(runs: readonly Run[], index: number, module: number): boolean {
  const slice = runs.slice(index, index + 3);
  if (slice.length < 3 || !slice[0].black || slice[1].black || !slice[2].black) {
    return false;
  }
  return slice.every((run) => run.width > module * 0.35 && run.width < module * 2.2);
}

function decodeAt(runs: readonly Run[], start: number): EanHit | null {
  const guard = runs.slice(start, start + 3);
  if (guard.length < 3 || !guard[0].black || guard[1].black || !guard[2].black) {
    return null;
  }
  const module = (guard[0].width + guard[1].width + guard[2].width) / 3;
  if (module < 1 || !guardWidthsMatch(runs, start, module)) {
    return null;
  }

  let cursor = start + 3;
  let error = 0;
  const left: number[] = [];
  const parity: string[] = [];
  for (let digit = 0; digit < 6; digit += 1) {
    const slice = runs.slice(cursor, cursor + 4);
    if (slice.length < 4 || slice[0].black) {
      return null;
    }
    const widths = slice.map((run) => run.width);
    const odd = matchWidths(widths, L);
    const even = matchWidths(widths, G);
    const chosen = chooseParity(odd, even);
    if (!chosen) {
      return null;
    }
    left.push(chosen.digit);
    parity.push(chosen.kind);
    error += chosen.error;
    cursor += 4;
  }

  const center = runs.slice(cursor, cursor + 5);
  const centerBlack = [false, true, false, true, false];
  if (center.length < 5) {
    return null;
  }
  for (let index = 0; index < 5; index += 1) {
    const run = center[index];
    if (run.black !== centerBlack[index] || run.width < module * 0.3 || run.width > module * 3) {
      return null;
    }
  }
  cursor += 5;

  const right: number[] = [];
  for (let digit = 0; digit < 6; digit += 1) {
    const slice = runs.slice(cursor, cursor + 4);
    if (slice.length < 4 || !slice[0].black) {
      return null;
    }
    const hit = matchWidths(
      slice.map((run) => run.width),
      L,
    );
    if (!hit) {
      return null;
    }
    right.push(hit.digit);
    error += hit.error;
    cursor += 4;
  }

  if (!guardWidthsMatch(runs, cursor, module)) {
    return null;
  }
  const end = runs[cursor + 2];
  const first = FIRST_DIGIT.indexOf(parity.join(""));
  if (first < 0 || !end) {
    return null;
  }
  const before = start > 0 ? runs[start - 1] : undefined;
  if (before && (before.black || before.width < module * 2.5)) {
    return null;
  }
  const after = runs[cursor + 3];
  if (after && (after.black || after.width < module * 2.5)) {
    return null;
  }
  if (error > 12) {
    return null;
  }
  const code = `${first}${left.join("")}${right.join("")}`;
  if (!hasValidGs1CheckDigit(code)) {
    return null;
  }
  return { code, start: guard[0].start, end: end.start + end.width, error };
}

function readBits(samples: ArrayLike<number>, window: number, bias: number): EanHit | null {
  if (samples.length < 59) {
    return null;
  }
  const runs = runsFrom(binarize(samples, window, bias));
  for (let index = 0; index + 59 <= runs.length; index += 1) {
    const hit = decodeAt(runs, index);
    if (hit) {
      return hit;
    }
  }
  return null;
}

/** Lee un EAN-13 en una fila de luminancia, también si la botella está al revés. */
export function readEan13(samples: ArrayLike<number>): EanHit | null {
  const count = samples.length;
  if (count < 80) {
    return null;
  }
  const window = Math.max(8, Math.floor(count / 24));
  const forward = readBits(samples, window, 6) ?? readBits(samples, window, 2);
  if (forward) {
    return forward;
  }
  const reversed = new Array<number>(count);
  for (let index = 0; index < count; index += 1) {
    reversed[index] = samples[count - 1 - index];
  }
  const backward = readBits(reversed, window, 6) ?? readBits(reversed, window, 2);
  if (!backward) {
    return null;
  }
  return {
    code: backward.code,
    start: count - backward.end,
    end: count - backward.start,
    error: backward.error,
  };
}
