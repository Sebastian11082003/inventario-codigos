export type CameraFailure =
  | "insecure-context"
  | "permission-denied"
  | "no-camera"
  | "in-use"
  | "unsupported"
  | "unknown";

export function classifyCameraFailure(error: unknown, isSecureContext: boolean): CameraFailure {
  if (!isSecureContext) {
    return "insecure-context";
  }
  const name = errorName(error);
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "permission-denied";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") {
    return "no-camera";
  }
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") {
    return "in-use";
  }
  if (name === "SecurityError") {
    return "insecure-context";
  }
  if (name === "NotSupportedError" || name === "TypeError") {
    return "unsupported";
  }
  return "unknown";
}

export function isOverconstrained(error: unknown): boolean {
  return errorName(error) === "OverconstrainedError";
}

function errorName(error: unknown): string {
  if (!error || typeof error !== "object" || !("name" in error)) {
    return "";
  }
  return String((error as { name: unknown }).name);
}

export const CAMERA_FAILURE_COPY: Record<CameraFailure, { title: string; body: string }> = {
  "insecure-context": {
    title: "Se necesita una página segura",
    body: "La cámara del teléfono solo funciona con HTTPS o en localhost. Una dirección http:// con IP de la red no puede abrir la cámara. Ábrela desde el enlace publicado o escribe el código a mano.",
  },
  "permission-denied": {
    title: "Permiso de cámara bloqueado",
    body: "El navegador no dejó usar la cámara. En Chrome, toca el candado de la barra, entra a Permisos y permite la cámara. En Safari, revisa el icono de cámara en la barra o Ajustes → Safari → Cámara. Luego pulsa Reintentar.",
  },
  "no-camera": {
    title: "No hay cámara trasera disponible",
    body: "Este navegador no encontró una cámara para escanear. Prueba con Chrome o Safari en el teléfono, o escribe el código a mano.",
  },
  "in-use": {
    title: "La cámara está ocupada",
    body: "Otra aplicación está usando la cámara. Ciérrala y pulsa Reintentar, o escribe el código a mano.",
  },
  unsupported: {
    title: "Este navegador no puede abrir la cámara",
    body: "getUserMedia no está disponible. Usa Chrome o Safari actualizados en el teléfono, en una página HTTPS, o escribe el código a mano.",
  },
  unknown: {
    title: "No se pudo abrir la cámara",
    body: "Ocurrió un error al pedir la cámara trasera. Reintenta o escribe el código a mano.",
  },
};
