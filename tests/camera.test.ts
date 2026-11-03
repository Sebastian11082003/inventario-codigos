import { describe, expect, it } from "vitest";
import { REAR_CAMERA_CONSTRAINTS } from "../src/camera/constraints";
import { readEan13 } from "../src/camera/ean";
import { CAMERA_FAILURE_COPY, classifyCameraFailure } from "../src/camera/errors";
import { centerBandRect, coverSourceRect } from "../src/camera/frame";
import { SUPPORTED_FORMAT_LABELS } from "../src/camera/formats";
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
    expect(readEan13(renderEan("4006381333931"))?.code).toBe("4006381333931");
    expect(readEan13(new Array(400).fill(200))).toBeNull();
  });
});

const LEFT_BITS = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const EVEN_BITS = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

function renderEan(code: string, module = 4, blur = 0): number[] {
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
  paint(230, 12 * module);
  for (const bit of bits) {
    paint(bit === "1" ? 16 : 244, module);
  }
  paint(230, 12 * module);
  const framed = [70, 70, 70, 70, ...row, 60, 60, 60, 60];
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
