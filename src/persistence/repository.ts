import type { Category } from "../domain/types";
import type { StoredProduct } from "../domain/types";

export type InventorySnapshot = {
  products: StoredProduct[];
  categories: Category[];
};

export interface InventoryRepository {
  load(): Promise<InventorySnapshot>;
  saveProduct(product: StoredProduct): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  saveCategories(categories: Category[]): Promise<void>;
}
