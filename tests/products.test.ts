import { describe, expect, it } from "vitest";
import { seedCategories } from "../src/domain/categories";
import { acceptScannedCode, emptyDraft, findByBarcode, validateDraft } from "../src/domain/products";
import type { StoredProduct } from "../src/domain/types";

const categories = seedCategories();

function product(partial: Partial<StoredProduct> = {}): StoredProduct {
  return {
    id: "p1",
    barcode: "7701234567890",
    name: "Arroz",
    categoryId: "cat-abarrotes",
    quantity: 1,
    unit: "und",
    price: null,
    notes: "",
    updatedAt: "2026-11-03T00:00:00.000Z",
    ...partial,
  };
}

describe("productos", () => {
  it("acepta un QR que parece enlace y lo deja como texto, sin navegar", () => {
    const accepted = acceptScannedCode(" https://tienda.example/promo ");
    expect(accepted).toEqual({ barcode: "https://tienda.example/promo" });
    expect(accepted && "url" in accepted).toBe(false);
  });

  it("valida cantidad con coma, precio vacío y categoría asignada", () => {
    const result = validateDraft(
      {
        ...emptyDraft("  7701234567890 ", categories),
        name: "  Arroz Diana ",
        quantity: "1,5",
        price: "",
        notes: "estante 2",
      },
      categories,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toMatchObject({
      barcode: "7701234567890",
      name: "Arroz Diana",
      categoryId: "cat-otros",
      quantity: 1.5,
      unit: "und",
      price: null,
      notes: "estante 2",
    });
  });

  it("rechaza nombre vacío, cantidad negativa y precio ilegible", () => {
    const result = validateDraft(
      {
        barcode: "123",
        name: "  ",
        categoryId: "cat-bebidas",
        quantity: "-1",
        unit: "und",
        price: "gratis",
        notes: "",
      },
      categories,
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.errors.name).toBeTruthy();
    expect(result.errors.quantity).toBeTruthy();
    expect(result.errors.price).toBeTruthy();
  });

  it("encuentra un código ya guardado ignorando espacios de los extremos", () => {
    expect(findByBarcode([product()], " 7701234567890 ")?.id).toBe("p1");
  });
});
