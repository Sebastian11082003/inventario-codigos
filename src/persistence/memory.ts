import { seedCategories } from "../domain/categories";
import { findByBarcode } from "../domain/products";
import type { Category, StoredProduct } from "../domain/types";
import { toStoredProduct } from "./shape";
import type { InventoryRepository, InventorySnapshot } from "./repository";

export class MemoryInventoryRepository implements InventoryRepository {
  private products: StoredProduct[];

  private categories: Category[];

  constructor(snapshot?: InventorySnapshot) {
    this.products = (snapshot?.products ?? []).map(toStoredProduct);
    this.categories = snapshot?.categories ? snapshot.categories.map((category) => ({ ...category })) : seedCategories();
  }

  async load(): Promise<InventorySnapshot> {
    return {
      products: this.products.map(toStoredProduct),
      categories: this.categories.map((category) => ({ ...category })),
    };
  }

  async saveProduct(product: StoredProduct): Promise<void> {
    const stored = toStoredProduct(product);
    const duplicate = findByBarcode(this.products, stored.barcode);
    if (duplicate && duplicate.id !== stored.id) {
      throw new Error("Ya hay un producto con ese código.");
    }
    const index = this.products.findIndex((item) => item.id === stored.id);
    if (index === -1) {
      this.products.push(stored);
    } else {
      this.products[index] = stored;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    this.products = this.products.filter((product) => product.id !== id);
  }

  async saveCategories(categories: Category[]): Promise<void> {
    this.categories = categories.map((category) => ({ ...category }));
  }
}
