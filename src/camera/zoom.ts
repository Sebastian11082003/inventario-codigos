export type ZoomRange = {
  min?: number;
  max?: number;
};

/** Acerca un poco la cámara para que las barras ocupen más pixeles, sin salirse del recuadro. */
export function preferredZoom(range: ZoomRange | null | undefined): number | null {
  if (!range || typeof range.min !== "number" || typeof range.max !== "number") {
    return null;
  }
  if (!(range.max >= 1.25) || !(range.min <= range.max)) {
    return null;
  }
  return Math.min(range.max, Math.max(range.min, 1.5));
}
