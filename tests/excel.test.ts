import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { seedCategories } from "../src/domain/categories";
import { exportFileName, toExcelMatrix, toExcelRow } from "../src/domain/excel";
import { EXCEL_COLUMNS, type StoredProduct } from "../src/domain/types";
import { buildXlsx } from "../src/export/xlsx";

const categories = seedCategories();

const products: StoredProduct[] = [
  {
    id: "b",
    barcode: "012345678905",
    name: "Agua",
    categoryId: "cat-bebidas",
    quantity: 6,
    unit: "und",
    price: null,
    notes: "fría",
    updatedAt: "2026-11-03T00:00:00.000Z",
  },
  {
    id: "a",
    barcode: "7701234567890",
    name: "Arroz",
    categoryId: "cat-abarrotes",
    quantity: 1.5,
    unit: "kg",
    price: 3200,
    notes: "",
    updatedAt: "2026-11-03T00:00:00.000Z",
  },
];

describe("excel para el POS", () => {
  it("usa las columnas del contrato y el nombre de la categoría", () => {
    const row = toExcelRow(products[1], categories);
    expect(Object.keys(row)).toEqual([...EXCEL_COLUMNS]);
    expect(row).toEqual({
      codigo_barras: "7701234567890",
      nombre: "Arroz",
      categoria: "Abarrotes",
      cantidad: 1.5,
      unidad: "kg",
      precio: 3200,
      notas: "",
    });
    expect(toExcelRow(products[0], categories).precio).toBe("");
  });

  it("ordena el archivo por nombre y deja el código como texto", () => {
    const matrix = toExcelMatrix(products, categories);
    expect(matrix[0]).toEqual([...EXCEL_COLUMNS]);
    expect(matrix.map((row) => row[1])).toEqual(["nombre", "Agua", "Arroz"]);
    expect(matrix[1][0]).toBe("012345678905");
    expect(matrix[1][2]).toBe("Bebidas");
    expect(matrix[1][5]).toBe("");
    expect(matrix[2][0]).toBe("7701234567890");

    const bytes = buildXlsx(matrix);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    const files = unzipSync(bytes);
    const xml = strFromU8(files["xl/worksheets/sheet1.xml"]);
    const workbook = strFromU8(files["xl/workbook.xml"]);
    const header = xml.match(/<row r="1">([\s\S]*?)<\/row>/)?.[1] ?? "";
    const headerCells = [...header.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((match) => match[1]);
    expect(headerCells).toEqual([...EXCEL_COLUMNS]);
    expect(xml).toContain(">012345678905<");
    expect(xml).not.toContain("<v>012345678905</v>");
    expect(workbook).toContain('name="inventario"');
    expect(xml).toContain("<v>3200</v>");
    expect(exportFileName(new Date("2026-11-03T12:00:00"))).toBe("inventario-codigos-2026-11-03.xlsx");
  });
});
