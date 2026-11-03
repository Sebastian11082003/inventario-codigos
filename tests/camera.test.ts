import { describe, expect, it } from "vitest";
import { REAR_CAMERA_CONSTRAINTS } from "../src/camera/constraints";
import { readEan13 } from "../src/camera/ean";
import { CAMERA_FAILURE_COPY, classifyCameraFailure } from "../src/camera/errors";
import { bandAroundLine, centerBandRect, coverSourceRect } from "../src/camera/frame";
import { SUPPORTED_FORMAT_LABELS } from "../src/camera/formats";
import { decoderAttempts, decoderPixelSize, indexAt, inspectFrame, scanFractions, sliceBand, thickenSamples } from "../src/camera/pixels";
import { advanceStreak, hasValidGs1CheckDigit, wideEnough } from "../src/camera/stability";
import { trackSupportsTorch } from "../src/camera/torch";
import { preferredZoom } from "../src/camera/zoom";

describe("cámara trasera", () => {
  it("pide getUserMedia con facingMode environment y sin audio", () => {
    expect(REAR_CAMERA_CONSTRAINTS.audio).toBe(false);
    const video = REAR_CAMERA_CONSTRAINTS.video as MediaTrackConstraints;
    expect(video.facingMode).toBe("environment");
  });

  it("cubre los formatos de mostrador", () => {
    expect(SUPPORTED_FORMAT_LABELS).toEqual(["EAN-13", "EAN-8", "UPC-A", "Code 128", "Code 39", "QR"]);
  });

  it("distingue contexto inseguro, permiso negado y ausencia de cámara", () => {
    expect(classifyCameraFailure(new Error("x"), false)).toBe("insecure-context");
    expect(classifyCameraFailure({ name: "NotAllowedError" }, true)).toBe("permission-denied");
    expect(classifyCameraFailure({ name: "NotFoundError" }, true)).toBe("no-camera");
    expect(classifyCameraFailure({ name: "SecurityError" }, true)).toBe("insecure-context");
    expect(CAMERA_FAILURE_COPY["insecure-context"].body).toContain("HTTPS");
    expect(CAMERA_FAILURE_COPY["permission-denied"].body).toContain("cámara");
    expect(CAMERA_FAILURE_COPY["no-camera"].title.length).toBeGreaterThan(0);
  });

  it("confirma al segundo acuerdo y descarta un fotograma suelto", () => {
    const blurry = advanceStreak(null, "5707135011080");
    const first = advanceStreak(blurry.streak, "7702535011089");
    const second = advanceStreak(first.streak, "7702535011089");
    expect(blurry.confirmed).toBe(false);
    expect(first.confirmed).toBe(false);
    expect(first.streak.count).toBe(1);
    expect(second.confirmed).toBe(true);
    expect(second.streak.count).toBe(2);
  });

  it("valida el dígito de control del EAN-13 de la botella", () => {
    expect(hasValidGs1CheckDigit("7702535011089")).toBe(true);
    expect(hasValidGs1CheckDigit("7702535011088")).toBe(false);
    expect(wideEnough([10, 500], 1000)).toBe(true);
    expect(wideEnough([100, 400], 1000)).toBe(true);
    expect(wideEnough([10, 80], 1000)).toBe(false);
  });

  it("muestra Flash solo si las capacidades de la pista incluyen torch", () => {
    expect(trackSupportsTorch(undefined)).toBe(false);
    expect(trackSupportsTorch(null)).toBe(false);
    expect(trackSupportsTorch({})).toBe(false);
    expect(trackSupportsTorch({ torch: false })).toBe(false);
    expect(trackSupportsTorch({ torch: [false] })).toBe(false);
    expect(trackSupportsTorch({ torch: true })).toBe(true);
    expect(trackSupportsTorch({ torch: [true] })).toBe(true);
    expect(trackSupportsTorch({ torch: [false, true] })).toBe(true);
  });

  it("recorta el centro visible y deja fuera el borde del sensor", () => {
    const rect = coverSourceRect(1920, 1080, 390, 700);
    expect(rect).not.toBeNull();
    expect(rect!.sx).toBeGreaterThan(0);
    expect(rect!.sw).toBeLessThan(1920);
    const band = centerBandRect(1920, 1080, 390, 700);
    expect(band).not.toBeNull();
    expect(band!.sw).toBeLessThan(rect!.sw);
    expect(band!.sh).toBeLessThan(rect!.sh);
  });

  it("acerca la cámara solo cuando el teléfono lo permite", () => {
    expect(preferredZoom(undefined)).toBeNull();
    expect(preferredZoom({ min: 1, max: 1.1 })).toBeNull();
    expect(preferredZoom({ min: 1, max: 4 })).toBe(1.5);
    expect(preferredZoom({ min: 2, max: 3 })).toBe(2);
    expect(preferredZoom({ min: 1, max: 1.3 })).toBe(1.3);
  });

  it("lee el EAN-13 de la botella aunque la fila esté un poco borrosa o al revés", () => {
    const sharp = renderEan("7702535011089");
    const soft = renderEan("7702535011089", 5, 2);
    expect(readEan13(sharp)?.code).toBe("7702535011089");
    expect(readEan13(soft)?.code).toBe("7702535011089");
    expect(readEan13([...sharp].reverse())?.code).toBe("7702535011089");
    expect(readEan13(thickenSamples(sharp))?.code).toBe("7702535011089");
    expect(readEan13(renderEan("4006381333931"))?.code).toBe("4006381333931");
    expect(readEan13(new Array(400).fill(200))).toBeNull();
  });

  it("acepta la etiqueta roja con margen blanco corto y rechaza ruido o un dígito mal", () => {
    expect(readEan13(renderEan("7702535011089", 4, 0, 2, 42))?.code).toBe("7702535011089");
    expect(readEan13(renderEan("7702535011089", 4, 0, 1, 42))?.code).toBe("7702535011089");
    expect(readEan13(renderEan("7702535011088", 4, 0, 2, 42))).toBeNull();
    for (const seed of [1, 2, 3, 9, 42]) {
      expect(readEan13(noiseRow(seed, 720))).toBeNull();
    }
  });

  it("busca el código arriba, abajo y de lado, no solo en una franja central", () => {
    const fractions = scanFractions();
    expect(fractions.some((value) => value < 0.2)).toBe(true);
    expect(fractions.some((value) => value > 0.8)).toBe(true);
    const bar = renderEan("7702535011089", 3, 0, 4);
    const height = 240;
    const width = Math.max(bar.length + 80, 640);
    const upper = indexAt(height, fractions[0]);
    const lower = indexAt(height, fractions[fractions.length - 1]);
    expect(inspectFrame(frameWithRow(width, height, upper, bar), width, height).code).toBe("7702535011089");
    expect(inspectFrame(frameWithRow(width, height, lower, bar), width, height).code).toBe("7702535011089");

    const sideways = renderEan("7702535011089", 3, 0, 4);
    const tall = sideways.length + 60;
    const narrow = 160;
    const column = indexAt(narrow, fractions[Math.floor(fractions.length / 2)]);
    const turned = frameWithColumn(narrow, tall, column, sideways);
    expect(inspectFrame(turned, narrow, tall).code).toBe("7702535011089");
    const strip = sliceBand(turned, narrow, tall, { sx: column, sy: 0, sw: 1, sh: tall }, "column");
    expect(strip).not.toBeNull();
    const flat = rowFrom(strip!.data, strip!.width, 0);
    expect(readEan13(thickenSamples(flat))?.code).toBe("7702535011089");

    const upperBand = bandAroundLine(800, 1000, "row", 20);
    const lowerBand = bandAroundLine(800, 1000, "row", 980);
    expect(upperBand!.sy).toBe(0);
    expect(lowerBand!.sy + lowerBand!.sh).toBe(1000);
    expect(lowerBand!.sy).toBeGreaterThan(upperBand!.sy + upperBand!.sh);
    const attempts = decoderAttempts(800, 1000, { axis: "row", at: 980, score: 40 });
    expect(attempts[0]?.axis).toBe("row");
    expect(attempts[0]?.band.sy).toBeGreaterThan(500);
    expect(attempts.some((attempt) => attempt.band.sh === 1000)).toBe(true);
    expect(decoderAttempts(800, 1000, { axis: "column", at: 100, score: 30 })[0]?.axis).toBe("column");
  });

  it("no confirma un código válido si ocupa una astilla del fotograma", () => {
    const bar = renderEan("7702535011089", 2, 0, 6);
    const width = bar.length * 20;
    const y = indexAt(48, scanFractions()[4]);
    expect(inspectFrame(frameWithRow(width, 48, y, bar), width, 48).code).toBeNull();
    const sized = decoderPixelSize(480, 160);
    expect(sized.width).toBeGreaterThan(480);
    expect(Math.max(sized.width, sized.height)).toBeLessThanOrEqual(1800);
    expect(Math.max(...Object.values(decoderPixelSize(2400, 400)))).toBeLessThanOrEqual(1800);
  });
});

const LEFT_BITS = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const EVEN_BITS = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

function renderEan(code: string, module = 4, blur = 0, quietModules = 12, surround = 70): number[] {
  const parity = PARITY[Number(code[0])] ?? "LLLLLL";
  let bits = "101";
  for (let index = 0; index < 6; index += 1) {
    const digit = Number(code[index + 1]);
    bits += parity[index] === "L" ? LEFT_BITS[digit] : EVEN_BITS[digit];
  }
  bits += "01010";
  for (let index = 0; index < 6; index += 1) {
    const pattern = LEFT_BITS[Number(code[index + 7])] ?? "0001101";
    bits += [...pattern].map((bit) => (bit === "0" ? "1" : "0")).join("");
  }
  bits += "101";
  const row: number[] = [];
  const paint = (value: number, count: number) => {
    for (let index = 0; index < count; index += 1) {
      row.push(value);
    }
  };
  paint(236, Math.max(0, quietModules) * module);
  for (const bit of bits) {
    paint(bit === "1" ? 16 : 244, module);
  }
  paint(236, Math.max(0, quietModules) * module);
  const edge = Math.max(4, module);
  const framed = [...new Array<number>(edge).fill(surround), ...row, ...new Array<number>(edge).fill(surround)];
  if (blur <= 0) {
    return framed;
  }
  return framed.map((_, index) => {
    let sum = 0;
    let count = 0;
    for (let offset = -blur; offset <= blur; offset += 1) {
      const sample = framed[index + offset];
      if (sample !== undefined) {
        sum += sample;
        count += 1;
      }
    }
    return sum / count;
  });
}

function noiseRow(seed: number, length: number): number[] {
  let state = seed >>> 0;
  const row = new Array<number>(length);
  for (let index = 0; index < length; index += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    row[index] = state % 256;
  }
  return row;
}

function blankFrame(width: number, height: number, gray = 150): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < data.length; index += 4) {
    data[index] = gray;
    data[index + 1] = gray;
    data[index + 2] = gray;
    data[index + 3] = 255;
  }
  return data;
}

function frameWithRow(width: number, height: number, y: number, samples: number[]): Uint8ClampedArray {
  const data = blankFrame(width, height);
  const x0 = Math.max(0, Math.floor((width - samples.length) / 2));
  for (let x = 0; x < samples.length && x0 + x < width; x += 1) {
    const value = Math.max(0, Math.min(255, Math.round(samples[x] ?? 150)));
    const offset = (y * width + x0 + x) * 4;
    data[offset] = value;
    data[offset + 1] = value;
    data[offset + 2] = value;
  }
  return data;
}

function frameWithColumn(width: number, height: number, x: number, samples: number[]): Uint8ClampedArray {
  const data = blankFrame(width, height);
  const y0 = Math.max(0, Math.floor((height - samples.length) / 2));
  for (let y = 0; y < samples.length && y0 + y < height; y += 1) {
    const value = Math.max(0, Math.min(255, Math.round(samples[y] ?? 150)));
    const offset = ((y0 + y) * width + x) * 4;
    data[offset] = value;
    data[offset + 1] = value;
    data[offset + 2] = value;
  }
  return data;
}

function rowFrom(data: Uint8ClampedArray, width: number, y: number): number[] {
  const row = new Array<number>(width);
  for (let x = 0; x < width; x += 1) {
    const offset = (y * width + x) * 4;
    row[x] = data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
  }
  return row;
}
