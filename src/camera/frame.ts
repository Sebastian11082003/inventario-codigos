export type SourceRect = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

/**
 * Recorte del video que coincide con el recuadro visible.
 * `object-fit: cover` deja fuera los bordes del sensor; el lector solo debe ver el centro.
 */
export function coverSourceRect(
  videoWidth: number,
  videoHeight: number,
  viewWidth: number,
  viewHeight: number,
  insetX = 0.12,
  insetY = 0.16,
): SourceRect | null {
  if (videoWidth < 2 || videoHeight < 2 || viewWidth < 2 || viewHeight < 2) {
    return null;
  }
  const scale = Math.max(viewWidth / videoWidth, viewHeight / videoHeight);
  const visibleWidth = viewWidth / scale;
  const visibleHeight = viewHeight / scale;
  const offsetX = (videoWidth - visibleWidth) / 2;
  const offsetY = (videoHeight - visibleHeight) / 2;
  const sx = offsetX + visibleWidth * insetX;
  const sy = offsetY + visibleHeight * insetY;
  const sw = visibleWidth * (1 - insetX * 2);
  const sh = visibleHeight * (1 - insetY * 2);
  if (sw < 20 || sh < 20) {
    return null;
  }
  return { sx, sy, sw, sh };
}

/** Franja central del recuadro: ahí está el código cuando se apoya sobre la línea. */
export function centerBandRect(
  videoWidth: number,
  videoHeight: number,
  viewWidth: number,
  viewHeight: number,
): SourceRect | null {
  return coverSourceRect(videoWidth, videoHeight, viewWidth, viewHeight, 0.16, 0.34);
}
