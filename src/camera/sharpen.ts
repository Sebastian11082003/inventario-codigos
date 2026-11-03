/** Refuerza el borde de las barras finas antes de leer. */
export function sharpenRGBA(data: Uint8ClampedArray, width: number, height: number, amount = 1.2): void {
  if (width < 3 || height < 3) {
    return;
  }
  const source = new Uint8ClampedArray(data);
  const stride = width * 4;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * stride + x * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const center = source[index + channel];
        const neighbors =
          source[index - 4 + channel] +
          source[index + 4 + channel] +
          source[index - stride + channel] +
          source[index + stride + channel];
        const blur = (neighbors + center * 4) / 8;
        let value = center + amount * (center - blur);
        if (value < 0) {
          value = 0;
        } else if (value > 255) {
          value = 255;
        }
        data[index + channel] = value;
      }
    }
  }
}
