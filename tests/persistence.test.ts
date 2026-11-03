import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { seedCategories } from "../src/domain/categories";
import type { StoredProduct } from "../src/domain/types";
import { MemoryInventoryRepository } from "../src/persistence/memory";
import { deleteInventoryDatabase, IdbInventoryRepository } from "../src/persistence/idb";
import {
  DB_NAME,
  DB_VERSION,
  STORE_CATEGORIES,
  STORE_PRODUCTS,
  STORED_PRODUCT_KEYS,
  isStoredProduct,
  toStoredProduct,
} from "../src/persistence/shape";

const product: StoredProduct = {
  id: "p-1",
  barcode: "7701234567890",
  name: "Jabón",
  categoryId: "cat-limpieza",
  quantity: 2,
  unit: "cantidad",
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
    expect(toStoredProduct(product).unit).toBe("cantidad");
  });

  it("lee un producto sin unidad, y und, como cantidad, y conserva kg y g", () => {
    const legacy = {
      id: "old",
      barcode: "111",
      name: "Panela",
      categoryId: "cat-abarrotes",
      quantity: 2,
      price: null,
      notes: "",
      updatedAt: "2026-11-01T00:00:00.000Z",
    };
    expect(isStoredProduct(legacy)).toBe(true);
    expect(toStoredProduct(legacy).unit).toBe("cantidad");
    expect(toStoredProduct({ ...product, unit: "und" }).unit).toBe("cantidad");
    expect(toStoredProduct({ ...product, unit: "gramos", quantity: 250 }).unit).toBe("g");
    expect(toStoredProduct({ ...product, unit: "kg", quantity: 0.5 })).toMatchObject({
      unit: "kg",
      quantity: 0.5,
    });
  });

  it("guarda en memoria sin convertir el precio vacío en cero", async () => {
    const repo = new MemoryInventoryRepository({ products: [], categories: seedCategories() });
    await repo.saveProduct(product);
    const loaded = await repo.load();
    expect(loaded.products).toEqual([product]);
    const legacyRepo = new MemoryInventoryRepository({
      products: [
        {
          id: "old",
          barcode: "111",
          name: "Panela",
          categoryId: "cat-abarrotes",
          quantity: 0.5,
          price: null,
          notes: "",
          updatedAt: "2026-11-01T00:00:00.000Z",
        } as StoredProduct,
      ],
      categories: seedCategories(),
    });
    expect((await legacyRepo.load()).products[0]?.unit).toBe("cantidad");
    await repo.saveProduct({ ...product, unit: "g", quantity: 250 });
    expect((await repo.load()).products[0]).toMatchObject({ unit: "g", quantity: 250 });
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

    await putRawProduct({
      id: "old-1",
      barcode: "111",
      name: "Panela",
      categoryId: "cat-abarrotes",
      quantity: 1.5,
      price: null,
      notes: "",
      updatedAt: "2026-11-01T00:00:00.000Z",
    });
    await putRawProduct({
      id: "old-2",
      barcode: "222",
      name: "Arroz viejo",
      categoryId: "cat-abarrotes",
      quantity: 1,
      unit: "und",
      price: 1000,
      notes: "",
      updatedAt: "2026-11-01T00:00:00.000Z",
    });
    const migrated = await repo.load();
    expect(migrated.products.find((item) => item.id === "old-1")).toMatchObject({
      name: "Panela",
      quantity: 1.5,
      unit: "cantidad",
    });
    expect(migrated.products.find((item) => item.id === "old-2")?.unit).toBe("cantidad");
    expect(migrated.products).toHaveLength(3);
  });
});

function putRawProduct(record: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("No se pudo abrir IndexedDB."));
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_PRODUCTS, "readwrite");
      tx.objectStore(STORE_PRODUCTS).put(record);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error("No se pudo guardar el registro viejo."));
      };
    };
  });
}
