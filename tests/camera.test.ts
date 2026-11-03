import { describe, expect, it } from "vitest";
import { REAR_CAMERA_CONSTRAINTS } from "../src/camera/constraints";
import { CAMERA_FAILURE_COPY, classifyCameraFailure } from "../src/camera/errors";
import { SUPPORTED_FORMAT_LABELS } from "../src/camera/formats";

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
});
