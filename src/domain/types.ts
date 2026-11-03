export const EXCEL_COLUMNS = [
  "codigo_barras",
  "nombre",
  "categoria",
  "cantidad",
  "unidad",
  "precio",
  "notas",
] as const;

export type ExcelColumn = (typeof EXCEL_COLUMNS)[number];

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

export const UNITS = ["und", "kg", "g", "L", "ml", "caja", "paquete"] as const;

export type Unit = (typeof UNITS)[number];

export const DEFAULT_UNIT: Unit = "und";

export const BARCODE_MAX_LENGTH = 500;
export const NAME_MAX_LENGTH = 120;
export const NOTES_MAX_LENGTH = 500;
