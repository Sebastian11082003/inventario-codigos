import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType, type Result } from "@zxing/library";
import { acceptScannedCode } from "../domain/products";
import { REAR_CAMERA_CONSTRAINTS } from "./constraints";
import { classifyCameraFailure, type CameraFailure } from "./errors";
import type { SupportedFormatLabel } from "./formats";

const FORMAT_LABELS = new Map<BarcodeFormat, SupportedFormatLabel>([
  [BarcodeFormat.EAN_13, "EAN-13"],
  [BarcodeFormat.EAN_8, "EAN-8"],
  [BarcodeFormat.UPC_A, "UPC-A"],
  [BarcodeFormat.CODE_128, "Code 128"],
  [BarcodeFormat.CODE_39, "Code 39"],
  [BarcodeFormat.QR_CODE, "QR"],
]);

export type ScanHit = {
  barcode: string;
  formatLabel: string;
};

export type ScanSession = {
  stop: () => void;
  resume: () => void;
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

export async function openRearCamera(): Promise<MediaStream> {
  if (!window.isSecureContext) {
    throw Object.assign(new Error("Se necesita HTTPS o localhost."), { name: "SecurityError" });
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error("getUserMedia no está disponible."), { name: "NotSupportedError" });
  }
  return navigator.mediaDevices.getUserMedia(REAR_CAMERA_CONSTRAINTS);
}

function labelFor(result: Result): string {
  return FORMAT_LABELS.get(result.getBarcodeFormat()) ?? "Código";
}

export async function startRearCameraScan(
  video: HTMLVideoElement,
  onCode: (hit: ScanHit) => void,
  onFailure: (failure: CameraFailure) => void,
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

  const reader = createReader();
  let latched = false;
  let stopped = false;

  try {
    const controls = await reader.decodeFromStream(stream, video, (result) => {
      if (stopped || latched || !result) {
        return;
      }
      const accepted = acceptScannedCode(result.getText());
      if (!accepted) {
        return;
      }
      latched = true;
      onCode({ barcode: accepted.barcode, formatLabel: labelFor(result) });
    });

    return {
      stop() {
        if (stopped) {
          return;
        }
        stopped = true;
        controls.stop();
      },
      resume() {
        latched = false;
      },
    };
  } catch (error) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
    onFailure(classifyCameraFailure(error, window.isSecureContext));
    throw error;
  }
}
