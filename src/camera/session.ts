import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType, type Result } from "@zxing/library";
import { acceptScannedCode } from "../domain/products";
import { REAR_CAMERA_CONSTRAINTS } from "./constraints";
import { classifyCameraFailure, type CameraFailure } from "./errors";
import { coverSourceRect } from "./frame";
import type { SupportedFormatLabel } from "./formats";
import { advanceStreak, hasValidGs1CheckDigit, wideEnough, type ReadStreak } from "./stability";

const FORMAT_LABELS = new Map<BarcodeFormat, SupportedFormatLabel>([
  [BarcodeFormat.EAN_13, "EAN-13"],
  [BarcodeFormat.EAN_8, "EAN-8"],
  [BarcodeFormat.UPC_A, "UPC-A"],
  [BarcodeFormat.CODE_128, "Code 128"],
  [BarcodeFormat.CODE_39, "Code 39"],
  [BarcodeFormat.QR_CODE, "QR"],
]);

const NATIVE_LABELS: Record<string, SupportedFormatLabel> = {
  ean_13: "EAN-13",
  ean_8: "EAN-8",
  upc_a: "UPC-A",
  code_128: "Code 128",
  code_39: "Code 39",
  qr_code: "QR",
};

const RETAIL_FORMATS = new Set<SupportedFormatLabel>(["EAN-13", "EAN-8", "UPC-A"]);

export type ScanHit = {
  barcode: string;
  formatLabel: string;
};

export type ScanSession = {
  stop: () => void;
  resume: () => void;
};

type NativeBarcode = {
  rawValue?: string;
  format?: string;
  boundingBox?: { x: number; width: number };
};

type NativeDetector = {
  detect: (source: CanvasImageSource) => Promise<NativeBarcode[]>;
};

function createReader(): BrowserMultiFormatReader {
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.QR_CODE,
  ]);
  return new BrowserMultiFormatReader(hints, {
    delayBetweenScanAttempts: 280,
    delayBetweenScanSuccess: 700,
  });
}

function createNativeDetector(): NativeDetector | null {
  const Detector = (
    window as unknown as {
      BarcodeDetector?: new (options: { formats: string[] }) => NativeDetector;
    }
  ).BarcodeDetector;
  if (!Detector) {
    return null;
  }
  try {
    return new Detector({
      formats: ["ean_13", "ean_8", "upc_a", "code_128", "code_39", "qr_code"],
    });
  } catch {
    return null;
  }
}

export async function openRearCamera(): Promise<MediaStream> {
  if (!window.isSecureContext) {
    throw Object.assign(new Error("Se necesita HTTPS o localhost."), { name: "SecurityError" });
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error("getUserMedia no está disponible."), { name: "NotSupportedError" });
  }
  const stream = await navigator.mediaDevices.getUserMedia(REAR_CAMERA_CONSTRAINTS);
  const track = stream.getVideoTracks()[0];
  const capabilities = track?.getCapabilities?.() as { focusMode?: string[] } | undefined;
  if (track && capabilities?.focusMode?.includes("continuous")) {
    try {
      await track.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] });
    } catch {
      // El enfoque continuo no es obligatorio para abrir la cámara.
    }
  }
  return stream;
}

function labelFor(result: Result): SupportedFormatLabel | null {
  return FORMAT_LABELS.get(result.getBarcodeFormat()) ?? null;
}

function acceptRetail(code: string, formatLabel: SupportedFormatLabel): string | null {
  const accepted = acceptScannedCode(code);
  if (!accepted) {
    return null;
  }
  if (RETAIL_FORMATS.has(formatLabel) && !hasValidGs1CheckDigit(accepted.barcode)) {
    return null;
  }
  return accepted.barcode;
}

export async function startRearCameraScan(
  video: HTMLVideoElement,
  onCode: (hit: ScanHit) => void,
  onFailure: (failure: CameraFailure) => void,
  onGlance?: () => void,
): Promise<ScanSession> {
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "true");

  let stream: MediaStream;
  try {
    stream = await openRearCamera();
  } catch (error) {
    onFailure(classifyCameraFailure(error, window.isSecureContext));
    throw error;
  }

  video.srcObject = stream;
  try {
    await video.play();
  } catch (error) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
    onFailure(classifyCameraFailure(error, window.isSecureContext));
    throw error;
  }

  const reader = createReader();
  let detector = createNativeDetector();
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  let latched = false;
  let stopped = false;
  let streak: ReadStreak | null = null;

  const consider = (barcode: string, formatLabel: string) => {
    if (stopped || latched) {
      return;
    }
    const next = advanceStreak(streak, barcode);
    streak = next.streak;
    if (!next.confirmed) {
      onGlance?.();
      return;
    }
    latched = true;
    onCode({ barcode, formatLabel });
  };

  const readFrame = async () => {
    if (stopped || latched || !context || video.readyState < 2) {
      return;
    }
    const rect = coverSourceRect(
      video.videoWidth,
      video.videoHeight,
      video.clientWidth || video.videoWidth,
      video.clientHeight || video.videoHeight,
    );
    if (!rect) {
      return;
    }
    canvas.width = Math.min(960, Math.round(rect.sw));
    canvas.height = Math.max(1, Math.round(canvas.width * (rect.sh / rect.sw)));
    context.drawImage(video, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, canvas.width, canvas.height);

    if (detector) {
      try {
        const found = await detector.detect(canvas);
        const best = [...found].sort((left, right) => (right.boundingBox?.width ?? 0) - (left.boundingBox?.width ?? 0))[0];
        if (best?.rawValue && best.format) {
          const formatLabel = NATIVE_LABELS[best.format];
          const barcode = formatLabel ? acceptRetail(best.rawValue, formatLabel) : null;
          const broadEnough =
            formatLabel === "QR" || wideEnough([best.boundingBox?.x ?? 0, (best.boundingBox?.x ?? 0) + (best.boundingBox?.width ?? 0)], canvas.width);
          if (barcode && formatLabel && broadEnough) {
            consider(barcode, formatLabel);
            return;
          }
        }
      } catch {
        detector = null;
      }
    }

    let result: Result;
    try {
      result = reader.decodeFromCanvas(canvas);
    } catch {
      return;
    }
    const formatLabel = labelFor(result);
    if (!formatLabel) {
      return;
    }
    const barcode = acceptRetail(result.getText(), formatLabel);
    if (!barcode) {
      return;
    }
    const points = result.getResultPoints() ?? [];
    if (formatLabel !== "QR" && !wideEnough(points.map((point) => point.getX()), canvas.width)) {
      return;
    }
    consider(barcode, formatLabel);
  };

  const timer = window.setInterval(() => {
    void readFrame();
  }, 180);

  return {
    stop() {
      if (stopped) {
        return;
      }
      stopped = true;
      window.clearInterval(timer);
      for (const track of stream.getTracks()) {
        track.stop();
      }
      video.srcObject = null;
    },
    resume() {
      latched = false;
      streak = null;
    },
  };
}
