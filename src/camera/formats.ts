export const SUPPORTED_FORMAT_LABELS = ["EAN-13", "EAN-8", "UPC-A", "Code 128", "Code 39", "QR"] as const;

export type SupportedFormatLabel = (typeof SUPPORTED_FORMAT_LABELS)[number];
