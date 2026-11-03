import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { seedCategories } from "../src/domain/categories";
import { exportFileName, stockAlert, toExcelMatrix, toExcelRow, ZERO_STOCK_ALERT } from "../src/domain/excel";
import { EXCEL_COLUMNS, EXCEL_HEADERS, type StoredProduct } from "../src/domain/types";
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
  {
    id: "c",
    barcode: "7700000000001",
    name: "Canela",
    categoryId: "cat-abarrotes",
    quantity: 250,
    unit: "g",
    price: 800,
    notes: "molida",
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
      alerta: "",
    });
    expect(toExcelRow(products[0], categories).unidad).toBe("cantidad");
    expect(toExcelRow(products[0], categories).precio).toBe("");
    expect(toExcelRow(products[2], categories).unidad).toBe("g");
    const legacy = { ...products[0], unit: undefined } as unknown as StoredProduct;
    expect(toExcelRow(legacy, categories).unidad).toBe("cantidad");
  });

  it("ordena el archivo por nombre y deja el código como texto", () => {
    const matrix = toExcelMatrix(products, categories);
    expect(matrix).toHaveLength(products.length + 1);
    expect(matrix[0]).toEqual([...EXCEL_HEADERS]);
    expect(EXCEL_HEADERS).toHaveLength(EXCEL_COLUMNS.length);
    expect(matrix.map((row) => row[1])).toEqual(["Nombre", "Agua", "Arroz", "Canela"]);
    expect(matrix[1][0]).toBe("012345678905");
    expect(matrix[1][2]).toBe("Bebidas");
    expect(matrix[1][3]).toBe(6);
    expect(matrix[1][4]).toBe("cantidad");
    expect(matrix[1][5]).toBe("");
    expect(matrix[2][0]).toBe("7701234567890");
    expect(matrix[2][4]).toBe("kg");
    expect(matrix[3][4]).toBe("g");
    expect(matrix[3][5]).toBe(800);

    const bytes = buildXlsx(matrix);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    const files = unzipSync(bytes);
    const xml = strFromU8(files["xl/worksheets/sheet1.xml"]);
    const workbook = strFromU8(files["xl/workbook.xml"]);
    const header = xml.match(/<row r="1">([\s\S]*?)<\/row>/)?.[1] ?? "";
    const headerCells = [...header.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((match) => match[1]);
    expect(headerCells).toEqual([...EXCEL_HEADERS]);
    expect(xml).toContain(">cantidad<");
    expect(xml).toContain(">kg<");
    expect(xml).toContain(">g<");
    expect(xml).not.toContain(">gramos<");
    expect(xml).not.toContain(">und<");
    expect(xml).toContain(">012345678905<");
    expect(xml).not.toContain("<v>012345678905</v>");
    expect(workbook).toContain('name="inventario"');
    expect(xml).toContain("<v>3200</v>");
    expect(exportFileName(new Date("2026-11-03T12:00:00"))).toBe("inventario-codigos-2026-11-03.xlsx");
  });

  it("avisa Sin existencias solo cuando el conteo guardado es 0", () => {
    expect(stockAlert(0)).toBe(ZERO_STOCK_ALERT);
    expect(stockAlert(0.5)).toBe("");
    const empty = toExcelRow({ ...products[1], quantity: 0 }, categories);
    expect(empty.alerta).toBe("Sin existencias");
    expect(empty.cantidad).toBe(0);
    const matrix = toExcelMatrix([{ ...products[1], quantity: 0 }], categories);
    expect(matrix[0].at(-1)).toBe("Alerta");
    expect(matrix[1].at(-1)).toBe("Sin existencias");
    const bytes = buildXlsx(matrix);
    const xml = strFromU8(unzipSync(bytes)["xl/worksheets/sheet1.xml"]);
    expect(xml).toContain(">Sin existencias<");
  });
});
