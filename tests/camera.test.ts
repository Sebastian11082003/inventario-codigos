import { describe, expect, it } from "vitest";
import { REAR_CAMERA_CONSTRAINTS } from "../src/camera/constraints";
import { CAMERA_FAILURE_COPY, classifyCameraFailure } from "../src/camera/errors";
import { coverSourceRect } from "../src/camera/frame";
import { SUPPORTED_FORMAT_LABELS } from "../src/camera/formats";
import { advanceStreak, hasValidGs1CheckDigit, wideEnough } from "../src/camera/stability";

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

  it("no confirma un código hasta leerlo tres veces seguidas", () => {
    const first = advanceStreak(null, "5707135011080");
    const changed = advanceStreak(first.streak, "7702535011089");
    const second = advanceStreak(changed.streak, "7702535011089");
    const third = advanceStreak(second.streak, "7702535011089");
    expect(first.confirmed).toBe(false);
    expect(changed.confirmed).toBe(false);
    expect(changed.streak.count).toBe(1);
    expect(third.confirmed).toBe(true);
  });

  it("valida el dígito de control del EAN-13 de la botella", () => {
    expect(hasValidGs1CheckDigit("7702535011089")).toBe(true);
    expect(hasValidGs1CheckDigit("7702535011088")).toBe(false);
    expect(wideEnough([10, 500], 1000)).toBe(true);
    expect(wideEnough([10, 80], 1000)).toBe(false);
  });

  it("recorta el centro visible y deja fuera el borde del sensor", () => {
    const rect = coverSourceRect(1920, 1080, 390, 700);
    expect(rect).not.toBeNull();
    expect(rect!.sx).toBeGreaterThan(0);
    expect(rect!.sw).toBeLessThan(1920);
  });
});
