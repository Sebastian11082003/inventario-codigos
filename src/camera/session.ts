import { HTMLCanvasElementLuminanceSource } from "@zxing/browser";
import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  GlobalHistogramBinarizer,
  HybridBinarizer,
  MultiFormatReader,
  type Result,
} from "@zxing/library";
import { acceptScannedCode } from "../domain/products";
import { REAR_CAMERA_CONSTRAINTS } from "./constraints";
import { readEan13 } from "./ean";
import { classifyCameraFailure, type CameraFailure } from "./errors";
import { centerBandRect, coverSourceRect, type SourceRect } from "./frame";
import type { SupportedFormatLabel } from "./formats";
import { sharpenRGBA } from "./sharpen";
import { advanceStreak, hasValidGs1CheckDigit, wideEnough, type ReadStreak } from "./stability";
import { applyTorch, trackSupportsTorch, type TorchCapabilities } from "./torch";
import { preferredZoom, type ZoomRange } from "./zoom";

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
const SCAN_POLL_MS = 90;

export type ScanHit = {
  barcode: string;
  formatLabel: string;
};

export type ScanSession = {
  stop: () => void;
  whenReleased: Promise<void>;
  resume: () => void;
  torchSupported: boolean;
  setTorch: (on: boolean) => Promise<boolean>;
};

type NativeBarcode = {
  rawValue?: string;
  format?: string;
  boundingBox?: { x: number; width: number };
};

type NativeDetector = {
  detect: (source: CanvasImageSource) => Promise<NativeBarcode[]>;
};

function createReader(): MultiFormatReader {
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.QR_CODE,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  const reader = new MultiFormatReader();
  reader.setHints(hints);
  return reader;
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
  const capabilities = track?.getCapabilities?.() as { focusMode?: string[]; zoom?: ZoomRange } | undefined;
  if (track && capabilities?.focusMode?.includes("continuous")) {
    try {
      await track.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] });
    } catch {
      // El enfoque continuo no es obligatorio para abrir la cámara.
    }
  }
  const zoom = preferredZoom(capabilities?.zoom);
  if (track && zoom) {
    try {
      await track.applyConstraints({ advanced: [{ zoom } as MediaTrackConstraintSet] });
    } catch {
      // Si el teléfono no deja acercar, la lectura sigue con el recorte ampliado.
    }
  }
  return stream;
}

const ROW_FRACTIONS = [0.32, 0.42, 0.5, 0.58, 0.68];

function labelFor(result: Result): SupportedFormatLabel | null {
  return FORMAT_LABELS.get(result.getBarcodeFormat()) ?? null;
}

function clampRect(rect: SourceRect, width: number, height: number): SourceRect {
  const sx = Math.max(0, Math.min(width - 2, Math.round(rect.sx)));
  const sy = Math.max(0, Math.min(height - 2, Math.round(rect.sy)));
  const sw = Math.max(2, Math.min(width - sx, Math.round(rect.sw)));
  const sh = Math.max(2, Math.min(height - sy, Math.round(rect.sh)));
  return { sx, sy, sw, sh };
}

function hasContrast(data: Uint8ClampedArray): boolean {
  let min = 255;
  let max = 0;
  for (let index = 0; index < data.length; index += 64) {
    const luminance = data[index];
    if (luminance < min) {
      min = luminance;
    }
    if (luminance > max) {
      max = luminance;
    }
  }
  return max - min >= 18;
}

function paintVideo(video: HTMLVideoElement, full: HTMLCanvasElement, fullContext: CanvasRenderingContext2D): boolean {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  if (videoWidth < 2 || videoHeight < 2) {
    return false;
  }
  const scale = Math.min(1, 1920 / Math.max(videoWidth, videoHeight));
  const width = Math.max(2, Math.round(videoWidth * scale));
  const height = Math.max(2, Math.round(videoHeight * scale));
  if (full.width !== width) {
    full.width = width;
  }
  if (full.height !== height) {
    full.height = height;
  }
  fullContext.imageSmoothingEnabled = true;
  fullContext.drawImage(video, 0, 0, width, height);
  return true;
}

function readRetailRow(image: ImageData): string | null {
  const { data, width, height } = image;
  for (const fraction of ROW_FRACTIONS) {
    const y = Math.min(height - 1, Math.max(0, Math.round(height * fraction)));
    const row = new Array<number>(width);
    const offset = y * width * 4;
    for (let x = 0; x < width; x += 1) {
      const index = offset + x * 4;
      row[x] = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    }
    const hit = readEan13(row);
    if (hit && wideEnough([hit.start, hit.end], width)) {
      return hit.code;
    }
  }
  return null;
}

function decodeCanvas(reader: MultiFormatReader, canvas: HTMLCanvasElement): Result | null {
  for (const Binarizer of [HybridBinarizer, GlobalHistogramBinarizer]) {
    try {
      const source = new HTMLCanvasElementLuminanceSource(canvas);
      return reader.decodeWithState(new BinaryBitmap(new Binarizer(source)));
    } catch {
      reader.reset();
    }
  }
  return null;
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
  const full = document.createElement("canvas");
  const fullContext = full.getContext("2d", { willReadFrequently: true });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  let latched = false;
  let stopped = false;
  let streak: ReadStreak | null = null;
  let pass = 0;

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
    if (stopped || latched || !context || !fullContext || video.readyState < 2) {
      return;
    }
    if (!paintVideo(video, full, fullContext)) {
      return;
    }
    const viewWidth = video.clientWidth || full.width;
    const viewHeight = video.clientHeight || full.height;
    pass += 1;
    const region = (pass % 2 === 0 ? centerBandRect : coverSourceRect)(full.width, full.height, viewWidth, viewHeight);
    if (!region) {
      return;
    }
    const source = clampRect(region, full.width, full.height);
    canvas.width = Math.min(1700, Math.max(1200, Math.round(source.sw * 2)));
    canvas.height = Math.max(1, Math.round(canvas.width * (source.sh / source.sw)));
    context.imageSmoothingEnabled = true;
    context.drawImage(full, source.sx, source.sy, source.sw, source.sh, 0, 0, canvas.width, canvas.height);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    if (!hasContrast(image.data)) {
      return;
    }
    sharpenRGBA(image.data, canvas.width, canvas.height);
    context.putImageData(image, 0, 0);

    const retail = readRetailRow(image);
    if (retail) {
      consider(retail, "EAN-13");
      return;
    }

    if (detector) {
      try {
        const found = await detector.detect(canvas);
        const best = [...found].sort((left, right) => (right.boundingBox?.width ?? 0) - (left.boundingBox?.width ?? 0))[0];
        if (best?.rawValue && best.format) {
          const formatLabel = NATIVE_LABELS[best.format];
          const barcode = formatLabel ? acceptRetail(best.rawValue, formatLabel) : null;
          const boxWidth = best.boundingBox?.width ?? 0;
          const broadEnough =
            formatLabel === "QR" || boxWidth <= 0 || wideEnough([best.boundingBox?.x ?? 0, (best.boundingBox?.x ?? 0) + boxWidth], canvas.width);
          if (barcode && formatLabel && broadEnough) {
            consider(barcode, formatLabel);
            return;
          }
        }
      } catch {
        detector = null;
      }
    }

    const result = decodeCanvas(reader, canvas);
    if (!result) {
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
    if (formatLabel !== "QR" && points.length >= 2 && !wideEnough(points.map((point) => point.getX()), canvas.width)) {
      return;
    }
    consider(barcode, formatLabel);
  };

  let decoding = false;
  const timer = window.setInterval(() => {
    if (decoding || stopped || latched) {
      return;
    }
    decoding = true;
    void readFrame().finally(() => {
      decoding = false;
    });
  }, SCAN_POLL_MS);

  const videoTrack = stream.getVideoTracks()[0];
  const torchSupported = trackSupportsTorch(readTorchCapabilities(videoTrack));
  let torchTouched = false;
  let torchTask: Promise<void> = Promise.resolve();
  let released = false;
  let resolveReleased: () => void = () => undefined;
  const whenReleased = new Promise<void>((resolve) => {
    resolveReleased = resolve;
  });

  const releaseTracks = () => {
    if (released) {
      return;
    }
    released = true;
    for (const track of stream.getTracks()) {
      track.stop();
    }
    if (video.srcObject === stream) {
      video.srcObject = null;
    }
    resolveReleased();
  };

  const setTorch = (on: boolean): Promise<boolean> => {
    if (stopped || !torchSupported || !videoTrack) {
      return Promise.resolve(false);
    }
    torchTouched = true;
    const task = torchTask.then(async () => {
      if (stopped || !videoTrack) {
        return false;
      }
      try {
        await applyTorch(videoTrack, on);
      } catch {
        return false;
      }
      if (stopped) {
        if (on) {
          try {
            await applyTorch(videoTrack, false);
          } catch {
            // stop() vuelve a pedir torch false antes de soltar la pista.
          }
        }
        return false;
      }
      return true;
    });
    torchTask = task.then(
      () => undefined,
      () => undefined,
    );
    return task;
  };

  return {
    torchSupported,
    whenReleased,
    setTorch,
    stop() {
      if (stopped) {
        return;
      }
      stopped = true;
      window.clearInterval(timer);
      if (!torchTouched || !videoTrack) {
        releaseTracks();
        return;
      }
      let finished = false;
      const finish = () => {
        if (finished) {
          return;
        }
        finished = true;
        releaseTracks();
      };
      // Apaga la luz antes de soltar la pista: en algunos teléfonos track.stop() deja el LED encendido.
      const shutdown = torchTask.then(async () => {
        if (!videoTrack) {
          return;
        }
        try {
          await applyTorch(videoTrack, false);
        } catch {
          // Igual se cierra la pista para no dejar la cámara tomada.
        }
      });
      void shutdown.finally(finish);
      window.setTimeout(finish, 800);
    },
    resume() {
      latched = false;
      streak = null;
    },
  };
}

function readTorchCapabilities(track: MediaStreamTrack | undefined): TorchCapabilities | undefined {
  if (!track || typeof track.getCapabilities !== "function") {
    return undefined;
  }
  try {
    return track.getCapabilities() as TorchCapabilities;
  } catch {
    return undefined;
  }
}
