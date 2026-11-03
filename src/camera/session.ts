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
import { classifyCameraFailure, type CameraFailure } from "./errors";
import type { SupportedFormatLabel } from "./formats";
import {
  decoderAttempts,
  decoderPixelSize,
  hasContrast,
  inspectFrame,
  sliceBand,
  type PixelImage,
} from "./pixels";
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
      // Si el teléfono no deja acercar, la lectura sigue con el fotograma completo.
    }
  }
  return stream;
}

function labelFor(result: Result): SupportedFormatLabel | null {
  return FORMAT_LABELS.get(result.getBarcodeFormat()) ?? null;
}

/**
 * Copia el video como lo hacía la lectura que sí veía píxeles en este iPhone:
 * lienzo al tamaño real y `drawImage(video, 0, 0)`, sin recortar el video.
 */
function paintNativeFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): boolean {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (width < 2 || height < 2) {
    return false;
  }
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.drawImage(video, 0, 0);
  return true;
}

function blitForDecoder(
  pixels: PixelImage,
  scratch: HTMLCanvasElement,
  scratchContext: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
): boolean {
  if (pixels.width < 2 || pixels.height < 2) {
    return false;
  }
  scratch.width = pixels.width;
  scratch.height = pixels.height;
  const source = scratchContext.createImageData(pixels.width, pixels.height);
  source.data.set(pixels.data);
  scratchContext.putImageData(source, 0, 0);
  const size = decoderPixelSize(pixels.width, pixels.height);
  canvas.width = size.width;
  canvas.height = size.height;
  context.imageSmoothingEnabled = false;
  context.drawImage(scratch, 0, 0, canvas.width, canvas.height);
  let image: ImageData;
  try {
    image = context.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    return false;
  }
  if (!hasContrast(image.data)) {
    return false;
  }
  sharpenRGBA(image.data, canvas.width, canvas.height);
  context.putImageData(image, 0, 0);
  return true;
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
  let detectVideo = Boolean(detector);
  let detectCanvas = Boolean(detector);
  const full = document.createElement("canvas");
  const fullContext = full.getContext("2d", { willReadFrequently: true });
  const scratch = document.createElement("canvas");
  const scratchContext = scratch.getContext("2d", { willReadFrequently: true });
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

  const detectNative = async (source: CanvasImageSource, sourceWidth: number, kind: "video" | "canvas") => {
    if (!detector || (kind === "video" ? !detectVideo : !detectCanvas)) {
      return null;
    }
    try {
      const found = await detector.detect(source);
      const ranked = [...found].sort((left, right) => (right.boundingBox?.width ?? 0) - (left.boundingBox?.width ?? 0));
      for (const hit of ranked) {
        if (!hit.rawValue || !hit.format) {
          continue;
        }
        const formatLabel = NATIVE_LABELS[hit.format];
        const barcode = formatLabel ? acceptRetail(hit.rawValue, formatLabel) : null;
        if (!barcode || !formatLabel) {
          continue;
        }
        const boxWidth = hit.boundingBox?.width ?? 0;
        const origin = hit.boundingBox?.x ?? 0;
        const broadEnough =
          formatLabel === "QR" || boxWidth <= 0 || sourceWidth <= 0 || wideEnough([origin, origin + boxWidth], sourceWidth, 0.08);
        if (broadEnough) {
          return { barcode, formatLabel };
        }
      }
      return null;
    } catch {
      if (kind === "video") {
        detectVideo = false;
      } else {
        detectCanvas = false;
      }
      return null;
    }
  };

  const readFrame = async () => {
    if (stopped || latched || !fullContext || !scratchContext || !context || video.readyState < 2) {
      return;
    }

    let prepared = false;
    if (paintNativeFrame(video, full, fullContext)) {
      try {
        const image = fullContext.getImageData(0, 0, full.width, full.height);
        if (hasContrast(image.data)) {
          const look = inspectFrame(image.data, full.width, full.height);
          if (look.code) {
            consider(look.code, "EAN-13");
            return;
          }
          for (const attempt of decoderAttempts(full.width, full.height, look.best)) {
            const slice = sliceBand(image.data, full.width, full.height, attempt.band, attempt.axis);
            if (slice && blitForDecoder(slice, scratch, scratchContext, canvas, context)) {
              prepared = true;
              break;
            }
          }
        }
      } catch {
        prepared = false;
      }
    }

    const fromVideo = await detectNative(video, video.videoWidth || full.width, "video");
    if (fromVideo) {
      consider(fromVideo.barcode, fromVideo.formatLabel);
      return;
    }
    if (!prepared) {
      if (full.width > 2) {
        const fromFull = await detectNative(full, full.width, "canvas");
        if (fromFull) {
          consider(fromFull.barcode, fromFull.formatLabel);
        }
      }
      return;
    }

    const fromCanvas = await detectNative(canvas, canvas.width, "canvas");
    if (fromCanvas) {
      consider(fromCanvas.barcode, fromCanvas.formatLabel);
      return;
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
    if (formatLabel !== "QR" && points.length >= 2 && !wideEnough(points.map((point) => point.getX()), canvas.width, 0.08)) {
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
