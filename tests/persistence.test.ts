import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { seedCategories } from "../src/domain/categories";
import type { StoredProduct } from "../src/domain/types";
import { MemoryInventoryRepository } from "../src/persistence/memory";
import { deleteInventoryDatabase, IdbInventoryRepository } from "../src/persistence/idb";
import { DB_NAME, DB_VERSION, STORE_CATEGORIES, STORE_PRODUCTS, STORED_PRODUCT_KEYS, toStoredProduct } from "../src/persistence/shape";

const product: StoredProduct = {
  id: "p-1",
  barcode: "7701234567890",
  name: "Jabón",
  categoryId: "cat-limpieza",
  quantity: 2,
  unit: "und",
  price: null,
  notes: "barra",
  updatedAt: "2026-11-03T05:00:00.000Z",
};

describe("forma de persistencia", () => {
  it("declara IndexedDB inventario-codigos con productos y categorías", () => {
    expect(DB_NAME).toBe("inventario-codigos");
    expect(DB_VERSION).toBe(1);
    expect(STORE_PRODUCTS).toBe("products");
    expect(STORE_CATEGORIES).toBe("categories");
    expect(Object.keys(toStoredProduct(product))).toEqual([...STORED_PRODUCT_KEYS]);
    expect(toStoredProduct(product).price).toBeNull();
  });

  it("guarda en memoria sin convertir el precio vacío en cero", async () => {
    const repo = new MemoryInventoryRepository({ products: [], categories: seedCategories() });
    await repo.saveProduct(product);
    const loaded = await repo.load();
    expect(loaded.products).toEqual([product]);
    await expect(
      repo.saveProduct({ ...product, id: "p-2" }),
    ).rejects.toThrow("Ya hay un producto con ese código.");
  });
});

describe("IndexedDB", () => {
  let repo: IdbInventoryRepository;

  beforeEach(async () => {
    await deleteInventoryDatabase();
    repo = new IdbInventoryRepository();
  });

  afterEach(async () => {
    await repo.close();
    await deleteInventoryDatabase();
  });

  it("siembra categorías y conserva un producto con precio nulo", async () => {
    const first = await repo.load();
    expect(first.categories.map((category) => category.name)).toEqual([
      "Abarrotes",
      "Bebidas",
      "Limpieza",
      "Otros",
    ]);
    await repo.saveProduct(product);
    const again = await repo.load();
    expect(again.products).toEqual([product]);
    expect(again.categories).toHaveLength(4);
  });
});
