import type { Category } from "./types";

export const SEED_CATEGORIES: readonly Category[] = [
  { id: "cat-abarrotes", name: "Abarrotes" },
  { id: "cat-bebidas", name: "Bebidas" },
  { id: "cat-limpieza", name: "Limpieza" },
  { id: "cat-otros", name: "Otros" },
];

export const FALLBACK_CATEGORY_ID = "cat-otros";

export function seedCategories(): Category[] {
  return SEED_CATEGORIES.map((category) => ({ ...category }));
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function foldName(name: string): string {
  return normalizeName(name)
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function sameName(left: string, right: string): boolean {
  return foldName(left) === foldName(right);
}

export function categoryName(categories: readonly Category[], categoryId: string): string {
  return categories.find((category) => category.id === categoryId)?.name ?? "Otros";
}

export type CategoryResult =
  | { ok: true; categories: Category[] }
  | { ok: false; error: string };

export function createCategory(
  categories: readonly Category[],
  name: string,
  id: string,
): CategoryResult {
  const clean = normalizeName(name);
  if (!clean) {
    return { ok: false, error: "Escribe un nombre para la categoría." };
  }
  if (clean.length > 40) {
    return { ok: false, error: "El nombre de la categoría admite hasta 40 caracteres." };
  }
  if (categories.some((category) => sameName(category.name, clean))) {
    return { ok: false, error: "Ya existe una categoría con ese nombre." };
  }
  return { ok: true, categories: [...categories, { id, name: clean }] };
}

export function renameCategory(
  categories: readonly Category[],
  id: string,
  name: string,
): CategoryResult {
  const current = categories.find((category) => category.id === id);
  if (!current) {
    return { ok: false, error: "Esa categoría ya no está en la lista." };
  }
  const clean = normalizeName(name);
  if (!clean) {
    return { ok: false, error: "Escribe un nombre para la categoría." };
  }
  if (clean.length > 40) {
    return { ok: false, error: "El nombre de la categoría admite hasta 40 caracteres." };
  }
  if (categories.some((category) => category.id !== id && sameName(category.name, clean))) {
    return { ok: false, error: "Ya existe una categoría con ese nombre." };
  }
  return {
    ok: true,
    categories: categories.map((category) => (category.id === id ? { ...category, name: clean } : category)),
  };
}

export function deleteCategory(
  categories: readonly Category[],
  id: string,
  productCategoryIds: readonly string[],
): CategoryResult {
  if (categories.length <= 1) {
    return { ok: false, error: "Deja al menos una categoría." };
  }
  if (!categories.some((category) => category.id === id)) {
    return { ok: false, error: "Esa categoría ya no está en la lista." };
  }
  if (productCategoryIds.includes(id)) {
    return { ok: false, error: "Hay productos en esta categoría. Reasígnalos antes de borrarla." };
  }
  return { ok: true, categories: categories.filter((category) => category.id !== id) };
}
