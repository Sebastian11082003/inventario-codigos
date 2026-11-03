export const EXCEL_COLUMNS = [
  "codigo_barras",
  "nombre",
  "categoria",
  "cantidad",
  "unidad",
  "precio",
  "notas",
  "alerta",
] as const;

export type ExcelColumn = (typeof EXCEL_COLUMNS)[number];

export const EXCEL_HEADERS = [
  "Código",
  "Nombre",
  "Categoría",
  "Cantidad",
  "Unidad",
  "Precio",
  "Notas",
  "Alerta",
] as const;

export type Category = {
  id: string;
  name: string;
};

export type StoredProduct = {
  id: string;
  barcode: string;
  name: string;
  categoryId: string;
  quantity: number;
  unit: string;
  price: number | null;
  notes: string;
  updatedAt: string;
};

export type ExcelRow = Record<ExcelColumn, string | number>;

export const UNITS = ["cantidad", "kg", "g"] as const;

export type Unit = (typeof UNITS)[number];

export const DEFAULT_UNIT: Unit = "cantidad";

export function normalizeUnit(value: unknown): Unit {
  if (typeof value !== "string") {
    return DEFAULT_UNIT;
  }
  const cleaned = value.trim().toLowerCase();
  if (cleaned === "cantidad" || cleaned === "kg" || cleaned === "g") {
    return cleaned;
  }
  if (cleaned === "gramos" || cleaned === "gramo" || cleaned === "gr" || cleaned === "grs") {
    return "g";
  }
  if (
    cleaned === "kilo" ||
    cleaned === "kilos" ||
    cleaned === "kilogramo" ||
    cleaned === "kilogramos" ||
    cleaned === "kgs"
  ) {
    return "kg";
  }
  return DEFAULT_UNIT;
}

export function unitOptionLabel(unit: Unit): string {
  if (unit === "g") {
    return "Gramos";
  }
  if (unit === "kg") {
    return "kg";
  }
  return "Cantidad";
}

export function unitAmountLabel(unit: unknown): string {
  const normalized = normalizeUnit(unit);
  if (normalized === "g") {
    return "gramos";
  }
  if (normalized === "kg") {
    return "kg";
  }
  return "cantidad";
}

export const BARCODE_MAX_LENGTH = 500;
export const NAME_MAX_LENGTH = 120;
export const NOTES_MAX_LENGTH = 500;
