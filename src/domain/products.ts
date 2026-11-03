import { categoryName } from "./categories";
import {
  BARCODE_MAX_LENGTH,
  DEFAULT_UNIT,
  NAME_MAX_LENGTH,
  NOTES_MAX_LENGTH,
  UNITS,
  normalizeUnit,
  type Category,
  type StoredProduct,
  type Unit,
} from "./types";

export type DraftInput = {
  barcode: string;
  name: string;
  categoryId: string;
  quantity: string;
  unit: string;
  price: string;
  notes: string;
};

export type FieldErrors = Partial<Record<keyof DraftInput, string>>;

export type ValidProduct = Omit<StoredProduct, "id" | "updatedAt">;

export function normalizeBarcode(value: string): string {
  return value.trim();
}

export function acceptScannedCode(text: string): { barcode: string } | null {
  const barcode = normalizeBarcode(text);
  if (!barcode || barcode.length > BARCODE_MAX_LENGTH) {
    return null;
  }
  return { barcode };
}

export function findByBarcode(
  products: readonly StoredProduct[],
  barcode: string,
): StoredProduct | undefined {
  const key = normalizeBarcode(barcode);
  return products.find((product) => normalizeBarcode(product.barcode) === key);
}

export function readQuantity(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!cleaned) {
    return null;
  }
  if (!/^\d+(\.\d{1,3})?$/.test(cleaned)) {
    return null;
  }
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

function parsePrice(raw: string): number | null | "invalid" {
  const cleaned = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!cleaned) {
    return null;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return "invalid";
  }
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) {
    return "invalid";
  }
  return value;
}

export function validateDraft(
  input: DraftInput,
  categories: readonly Category[],
): { ok: true; value: ValidProduct } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const barcode = normalizeBarcode(input.barcode);
  const name = input.name.trim().replace(/\s+/g, " ");
  const notes = input.notes.trim();
  const quantity = readQuantity(input.quantity);
  const price = parsePrice(input.price);

  if (!barcode) {
    errors.barcode = "El código es obligatorio.";
  } else if (barcode.length > BARCODE_MAX_LENGTH) {
    errors.barcode = "El código es demasiado largo.";
  } else if (/[\u0000-\u001F]/.test(barcode)) {
    errors.barcode = "El código tiene caracteres no válidos.";
  }

  if (!name) {
    errors.name = "El nombre es obligatorio.";
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `El nombre admite hasta ${NAME_MAX_LENGTH} caracteres.`;
  }

  if (quantity === null) {
    errors.quantity = "Indica una cantidad mayor o igual a 0 (hasta 3 decimales).";
  }

  if (price === "invalid") {
    errors.price = "El precio es opcional. Si lo escribes, usa un número mayor o igual a 0.";
  }

  if (!UNITS.includes(input.unit as Unit)) {
    errors.unit = "Elige una unidad de la lista.";
  }

  if (!categories.some((category) => category.id === input.categoryId)) {
    errors.categoryId = "Elige una categoría.";
  }

  if (notes.length > NOTES_MAX_LENGTH) {
    errors.notes = `Las notas admiten hasta ${NOTES_MAX_LENGTH} caracteres.`;
  }

  if (Object.keys(errors).length > 0 || quantity === null || price === "invalid") {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      barcode,
      name,
      categoryId: input.categoryId,
      quantity,
      unit: input.unit,
      price,
      notes,
    },
  };
}

export function draftFromProduct(product: StoredProduct): DraftInput {
  return {
    barcode: product.barcode,
    name: product.name,
    categoryId: product.categoryId,
    quantity: String(product.quantity),
    unit: normalizeUnit(product.unit),
    price: product.price === null ? "" : String(product.price),
    notes: product.notes,
  };
}

export function emptyDraft(barcode: string, categories: readonly Category[]): DraftInput {
  const categoryId = categories.some((category) => category.id === "cat-otros")
    ? "cat-otros"
    : (categories[0]?.id ?? "");
  return {
    barcode,
    name: "",
    categoryId,
    quantity: "1",
    unit: DEFAULT_UNIT,
    price: "",
    notes: "",
  };
}

function nextSteppedQuantity(quantity: number, delta: number): number | null {
  const next = Math.round((quantity + delta) * 1000) / 1000;
  if (!Number.isFinite(next) || next <= 0) {
    return null;
  }
  return next;
}

export function canDecrease(quantity: number): boolean {
  return nextSteppedQuantity(quantity, -1) !== null;
}

export function bumpQuantity(product: StoredProduct, delta: number, updatedAt: string): StoredProduct {
  const next = nextSteppedQuantity(product.quantity, delta);
  if (next === null) {
    return product;
  }
  return {
    ...product,
    quantity: next,
    updatedAt,
  };
}

export function describeProduct(product: StoredProduct, categories: readonly Category[]): string {
  return `${product.name} · ${categoryName(categories, product.categoryId)}`;
}
