import { describe, expect, it } from "vitest";
import { seedCategories } from "../src/domain/categories";
import {
  acceptScannedCode,
  bumpQuantity,
  canDecrease,
  draftFromProduct,
  emptyDraft,
  findByBarcode,
  readQuantity,
  validateDraft,
} from "../src/domain/products";
import { normalizeUnit, unitAmountLabel, type StoredProduct } from "../src/domain/types";

const categories = seedCategories();

function product(partial: Partial<StoredProduct> = {}): StoredProduct {
  return {
    id: "p1",
    barcode: "7701234567890",
    name: "Arroz",
    categoryId: "cat-abarrotes",
    quantity: 1,
    unit: "cantidad",
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
      unit: "cantidad",
      price: null,
      notes: "estante 2",
    });
  });

  it("acepta 0,5 kg y 250 g, y un decimal en cantidad no rompe el guardado", () => {
    const kilos = validateDraft(
      { ...emptyDraft("100", categories), name: "Queso", quantity: "0,5", unit: "kg" },
      categories,
    );
    const gramos = validateDraft(
      { ...emptyDraft("200", categories), name: "Canela", quantity: "250", unit: "g" },
      categories,
    );
    const unidades = validateDraft(
      { ...emptyDraft("300", categories), name: "Huevos", quantity: "1.5", unit: "cantidad" },
      categories,
    );
    expect(kilos.ok && kilos.value).toMatchObject({ quantity: 0.5, unit: "kg" });
    expect(gramos.ok && gramos.value).toMatchObject({ quantity: 250, unit: "g" });
    expect(unidades.ok && unidades.value).toMatchObject({ quantity: 1.5, unit: "cantidad" });
    expect(unitAmountLabel("g")).toBe("gramos");
    expect(unitAmountLabel("kg")).toBe("kg");
    expect(unitAmountLabel("cantidad")).toBe("cantidad");
  });

  it("rechaza una unidad fuera de cantidad, kg y g, y lee und como cantidad", () => {
    const result = validateDraft(
      { ...emptyDraft("400", categories), name: "Leche", quantity: "1", unit: "L" },
      categories,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.unit).toBe("Elige una unidad de la lista.");
    }
    expect(normalizeUnit(undefined)).toBe("cantidad");
    expect(normalizeUnit("und")).toBe("cantidad");
    expect(normalizeUnit("gramos")).toBe("g");
    expect(draftFromProduct(product({ unit: "und" })).unit).toBe("cantidad");
    expect(emptyDraft("1", categories).unit).toBe("cantidad");
  });

  it("rechaza nombre vacío, cantidad negativa y precio ilegible", () => {
    const result = validateDraft(
      {
        barcode: "123",
        name: "  ",
        categoryId: "cat-bebidas",
        quantity: "-1",
        unit: "cantidad",
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

  it("el botón − no deja la cantidad en 0; la ficha sí acepta un conteo de 0", () => {
    const one = product({ quantity: 1 });
    expect(canDecrease(1)).toBe(false);
    expect(canDecrease(0)).toBe(false);
    expect(canDecrease(0.4)).toBe(false);
    expect(bumpQuantity(one, -1, "2026-11-03T01:00:00.000Z")).toBe(one);
    const tiny = product({ quantity: 0.4 });
    expect(bumpQuantity(tiny, -1, "2026-11-03T01:00:00.000Z")).toBe(tiny);
    expect(canDecrease(1.5)).toBe(true);
    expect(bumpQuantity(product({ quantity: 1.5 }), -1, "2026-11-03T01:00:00.000Z").quantity).toBe(0.5);
    expect(bumpQuantity(product({ quantity: 0 }), 1, "2026-11-03T01:00:00.000Z").quantity).toBe(1);
    const counted = validateDraft(
      { ...emptyDraft("500", categories), name: "Sal", quantity: "0" },
      categories,
    );
    expect(counted.ok && counted.value.quantity).toBe(0);
    expect(readQuantity("0,000")).toBe(0);
    expect(readQuantity("")).toBeNull();
  });
});
