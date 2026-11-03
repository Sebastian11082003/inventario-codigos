import type { Category, StoredProduct } from "../domain/types";

export const DB_NAME = "inventario-codigos";
export const DB_VERSION = 1;
export const STORE_PRODUCTS = "products";
export const STORE_CATEGORIES = "categories";

export const STORED_PRODUCT_KEYS = [
  "id",
  "barcode",
  "name",
  "categoryId",
  "quantity",
  "unit",
  "price",
  "notes",
  "updatedAt",
] as const;

export function toStoredProduct(product: StoredProduct): StoredProduct {
  return {
    id: product.id,
    barcode: product.barcode,
    name: product.name,
    categoryId: product.categoryId,
    quantity: product.quantity,
    unit: product.unit,
    price: product.price,
    notes: product.notes,
    updatedAt: product.updatedAt,
  };
}

export function isStoredProduct(value: unknown): value is StoredProduct {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    STORED_PRODUCT_KEYS.every((key) => key in record) &&
    typeof record.id === "string" &&
    typeof record.barcode === "string" &&
    typeof record.name === "string" &&
    typeof record.categoryId === "string" &&
    typeof record.quantity === "number" &&
    typeof record.unit === "string" &&
    (record.price === null || typeof record.price === "number") &&
    typeof record.notes === "string" &&
    typeof record.updatedAt === "string"
  );
}

export function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.name === "string";
}
