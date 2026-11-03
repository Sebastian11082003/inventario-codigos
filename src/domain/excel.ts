import { categoryName } from "./categories";
import { EXCEL_COLUMNS, type Category, type ExcelRow, type StoredProduct } from "./types";

export function toExcelRow(product: StoredProduct, categories: readonly Category[]): ExcelRow {
  return {
    codigo_barras: product.barcode,
    nombre: product.name,
    categoria: categoryName(categories, product.categoryId),
    cantidad: product.quantity,
    unidad: product.unit,
    precio: product.price === null ? "" : product.price,
    notas: product.notes,
  };
}

export function toExcelMatrix(
  products: readonly StoredProduct[],
  categories: readonly Category[],
): (string | number)[][] {
  const rows = [...products].sort((left, right) => left.name.localeCompare(right.name, "es"));
  return [
    [...EXCEL_COLUMNS],
    ...rows.map((product) => {
      const row = toExcelRow(product, categories);
      return EXCEL_COLUMNS.map((column) => row[column]);
    }),
  ];
}

export function exportFileName(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `inventario-codigos-${year}-${month}-${day}.xlsx`;
}
