import { readEan13 } from "./ean";
import { bandAroundLine, type SourceRect } from "./frame";
import { wideEnough } from "./stability";

export type LineAxis = "row" | "column";

export type LineHit = {
  axis: LineAxis;
  at: number;
  score: number;
};

export type FrameLook = {
  code: string | null;
  best: LineHit | null;
};

export type PixelImage = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

const MIN_SPAN = 0.08;
const MIN_BAR_SCORE = 8;

/** Filas y columnas repartidas por todo el fotograma, no solo por el centro. */
export function scanFractions(): number[] {
  const values: number[] = [];
  for (let step = 5; step <= 95; step += 2) {
    values.push(step / 100);
  }
  return values;
}

export function indexAt(length: number, fraction: number): number {
  if (length <= 1) {
    return 0;
  }
  return Math.min(length - 1, Math.max(0, Math.round((length - 1) * fraction)));
}

/** Repite cada muestra para que una barra de uno o dos píxeles quede gruesa. */
export function thickenSamples(samples: ArrayLike<number>): number[] {
  const factor = Math.min(4, Math.max(2, Math.ceil(1400 / Math.max(1, samples.length))));
  const out = new Array<number>(samples.length * factor);
  for (let index = 0; index < samples.length; index += 1) {
    const value = samples[index] ?? 0;
    const base = index * factor;
    for (let step = 0; step < factor; step += 1) {
      out[base + step] = value;
    }
  }
  return out;
}

export function barLikeContrast(samples: ArrayLike<number>): number {
  let transitions = 0;
  let last = samples.length > 0 ? Number(samples[0]) : 0;
  for (let index = 1; index < samples.length; index += 1) {
    const value = Number(samples[index]);
    if (Math.abs(value - last) >= 28) {
      transitions += 1;
      last = value;
    }
  }
  return transitions;
}

export function hasContrast(data: Uint8ClampedArray, minimum = 18): boolean {
  let min = 255;
  let max = 0;
  for (let index = 0; index < data.length; index += 64) {
    const luminance = data[index] ?? 0;
    if (luminance < min) {
      min = luminance;
    }
    if (luminance > max) {
      max = luminance;
    }
  }
  return max - min >= minimum;
}

export function decoderPixelSize(width: number, height: number): { width: number; height: number } {
  let scale = width < 1200 ? Math.min(3, 1600 / Math.max(1, width)) : 1;
  const longSide = Math.max(width, height);
  if (longSide * scale > 1800) {
    scale = 1800 / longSide;
  }
  return {
    width: Math.max(2, Math.round(width * scale)),
    height: Math.max(2, Math.round(height * scale)),
  };
}

function luminance(data: Uint8ClampedArray, offset: number): number {
  return data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
}

function rowSamples(data: Uint8ClampedArray, width: number, y: number): number[] {
  const samples = new Array<number>(width);
  let offset = y * width * 4;
  for (let x = 0; x < width; x += 1) {
    samples[x] = luminance(data, offset);
    offset += 4;
  }
  return samples;
}

function columnSamples(data: Uint8ClampedArray, width: number, height: number, x: number): number[] {
  const samples = new Array<number>(height);
  for (let y = 0; y < height; y += 1) {
    samples[y] = luminance(data, (y * width + x) * 4);
  }
  return samples;
}

function decodeLine(samples: number[]): { code: string; error: number } | null {
  const thick = thickenSamples(samples);
  const hit = readEan13(thick);
  if (!hit || !wideEnough([hit.start, hit.end], thick.length, MIN_SPAN)) {
    return null;
  }
  return { code: hit.code, error: hit.error };
}

/** Lee EAN-13 en varias filas y, girando el recorrido, en varias columnas. */
export function inspectFrame(data: Uint8ClampedArray, width: number, height: number): FrameLook {
  if (width < 2 || height < 2 || data.length < width * height * 4) {
    return { code: null, best: null };
  }
  let best: LineHit | null = null;
  let code: string | null = null;
  let bestError = Infinity;
  const seenRows = new Set<number>();
  const seenColumns = new Set<number>();
  const candidates: Array<{ axis: LineAxis; at: number; samples: number[]; score: number }> = [];
  const pushLine = (axis: LineAxis, at: number, samples: number[]) => {
    candidates.push({ axis, at, samples, score: barLikeContrast(samples) });
  };

  for (const fraction of scanFractions()) {
    const y = indexAt(height, fraction);
    if (!seenRows.has(y)) {
      seenRows.add(y);
      pushLine("row", y, rowSamples(data, width, y));
    }
    const x = indexAt(width, fraction);
    if (!seenColumns.has(x)) {
      seenColumns.add(x);
      pushLine("column", x, columnSamples(data, width, height, x));
    }
  }

  candidates.sort((left, right) => right.score - left.score);
  const strongest = candidates[0];
  best = strongest ? { axis: strongest.axis, at: strongest.at, score: strongest.score } : null;
  const limit = Math.min(8, candidates.length);
  for (let index = 0; index < limit; index += 1) {
    const candidate = candidates[index];
    if (!candidate || (candidate.score < MIN_BAR_SCORE && index > 0)) {
      break;
    }
    const hit = decodeLine(candidate.samples);
    if (hit && hit.error < bestError) {
      code = hit.code;
      bestError = hit.error;
      best = { axis: candidate.axis, at: candidate.at, score: candidate.score };
      break;
    }
  }

  return { code, best };
}

export function sliceBand(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  band: SourceRect,
  axis: LineAxis,
): PixelImage | null {
  const sx = Math.max(0, Math.min(width - 1, Math.round(band.sx)));
  const sy = Math.max(0, Math.min(height - 1, Math.round(band.sy)));
  const sw = Math.max(1, Math.min(width - sx, Math.round(band.sw)));
  const sh = Math.max(1, Math.min(height - sy, Math.round(band.sh)));
  if (axis === "column") {
    const outWidth = sh;
    const outHeight = sw;
    const out = new Uint8ClampedArray(outWidth * outHeight * 4);
    for (let dy = 0; dy < sh; dy += 1) {
      for (let dx = 0; dx < sw; dx += 1) {
        const src = ((sy + dy) * width + (sx + dx)) * 4;
        const dst = (dx * outWidth + dy) * 4;
        out[dst] = data[src];
        out[dst + 1] = data[src + 1];
        out[dst + 2] = data[src + 2];
        out[dst + 3] = data[src + 3];
      }
    }
    return { data: out, width: outWidth, height: outHeight };
  }
  const out = new Uint8ClampedArray(sw * sh * 4);
  for (let dy = 0; dy < sh; dy += 1) {
    const src = ((sy + dy) * width + sx) * 4;
    out.set(data.subarray(src, src + sw * 4), dy * sw * 4);
  }
  return { data: out, width: sw, height: sh };
}

/** Primero la franja con más barras; si sale en blanco, el fotograma entero y el giro de 90°. */
export function decoderAttempts(
  width: number,
  height: number,
  best: LineHit | null,
): Array<{ band: SourceRect; axis: LineAxis }> {
  if (width < 2 || height < 2) {
    return [];
  }
  const full: SourceRect = { sx: 0, sy: 0, sw: width, sh: height };
  const attempts: Array<{ band: SourceRect; axis: LineAxis }> = [];
  if (best && best.score >= MIN_BAR_SCORE) {
    const band = bandAroundLine(width, height, best.axis, best.at);
    if (band) {
      attempts.push({ band, axis: best.axis });
    }
  }
  const fallbackAxis: LineAxis = best?.axis === "column" ? "column" : "row";
  attempts.push({ band: full, axis: fallbackAxis });
  if (fallbackAxis === "column") {
    attempts.push({ band: full, axis: "row" });
  }
  return attempts;
}
