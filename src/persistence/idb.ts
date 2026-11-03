import { seedCategories } from "../domain/categories";
import { findByBarcode } from "../domain/products";
import type { Category, StoredProduct } from "../domain/types";
import type { InventoryRepository, InventorySnapshot } from "./repository";
import {
  DB_NAME,
  DB_VERSION,
  STORE_CATEGORIES,
  STORE_PRODUCTS,
  isCategory,
  isStoredProduct,
  toStoredProduct,
} from "./shape";

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB rechazó la operación."));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
        const products = db.createObjectStore(STORE_PRODUCTS, { keyPath: "id" });
        products.createIndex("barcode", "barcode", { unique: true });
      }
      if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
        db.createObjectStore(STORE_CATEGORIES, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("No se pudo abrir IndexedDB."));
  });
}

export class IdbInventoryRepository implements InventoryRepository {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private database(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDatabase();
    }
    return this.dbPromise;
  }

  async close(): Promise<void> {
    if (!this.dbPromise) {
      return;
    }
    const db = await this.dbPromise;
    db.close();
    this.dbPromise = null;
  }

  async load(): Promise<InventorySnapshot> {
    const db = await this.database();
    const products = await this.readAll(db, STORE_PRODUCTS);
    const categories = await this.readAll(db, STORE_CATEGORIES);
    const safeProducts = products.filter(isStoredProduct).map(toStoredProduct);
    const safeCategories = categories.filter(isCategory);
    if (safeCategories.length === 0) {
      const seeded = seedCategories();
      await this.saveCategories(seeded);
      return { products: safeProducts, categories: seeded };
    }
    return { products: safeProducts, categories: safeCategories };
  }

  async saveProduct(product: StoredProduct): Promise<void> {
    const stored = toStoredProduct(product);
    const snapshot = await this.load();
    const duplicate = findByBarcode(snapshot.products, stored.barcode);
    if (duplicate && duplicate.id !== stored.id) {
      throw new Error("Ya hay un producto con ese código.");
    }
    const db = await this.database();
    await this.transact(db, STORE_PRODUCTS, "readwrite", (store) => store.put(stored));
  }

  async deleteProduct(id: string): Promise<void> {
    const db = await this.database();
    await this.transact(db, STORE_PRODUCTS, "readwrite", (store) => store.delete(id));
  }

  async saveCategories(categories: Category[]): Promise<void> {
    const db = await this.database();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_CATEGORIES, "readwrite");
      const store = tx.objectStore(STORE_CATEGORIES);
      store.clear();
      for (const category of categories) {
        store.put({ id: category.id, name: category.name });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("No se pudieron guardar las categorías."));
      tx.onabort = () => reject(tx.error ?? new Error("Se abortó el guardado de categorías."));
    });
  }

  private readAll(db: IDBDatabase, storeName: string): Promise<unknown[]> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const request = tx.objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result as unknown[]);
      request.onerror = () => reject(request.error ?? new Error("No se pudo leer el almacén local."));
    });
  }

  private transact(
    db: IDBDatabase,
    storeName: string,
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const request = run(tx.objectStore(storeName));
      request.onerror = () => reject(request.error ?? new Error("IndexedDB rechazó la operación."));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB rechazó la transacción."));
      tx.onabort = () => reject(tx.error ?? new Error("IndexedDB abortó la transacción."));
    });
  }
}

export async function deleteInventoryDatabase(): Promise<void> {
  await requestToPromise(indexedDB.deleteDatabase(DB_NAME));
}
