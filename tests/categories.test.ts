import { describe, expect, it } from "vitest";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  seedCategories,
  SEED_CATEGORIES,
} from "../src/domain/categories";

describe("categorías", () => {
  it("siembra Abarrotes, Bebidas, Limpieza y Otros", () => {
    expect(seedCategories().map((category) => category.name)).toEqual([
      "Abarrotes",
      "Bebidas",
      "Limpieza",
      "Otros",
    ]);
    expect(SEED_CATEGORIES).toHaveLength(4);
  });

  it("crea, renombra y rechaza duplicados sin distinguir mayúsculas", () => {
    const created = createCategory(seedCategories(), "  Lácteos ", "cat-lacteos");
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    expect(created.categories.at(-1)).toEqual({ id: "cat-lacteos", name: "Lácteos" });

    const duplicate = createCategory(created.categories, "lacteos", "cat-otra");
    expect(duplicate).toEqual({ ok: false, error: "Ya existe una categoría con ese nombre." });

    const renamed = renameCategory(created.categories, "cat-bebidas", "Bebidas frías");
    expect(renamed.ok).toBe(true);
    if (!renamed.ok) {
      return;
    }
    expect(renamed.categories.find((category) => category.id === "cat-bebidas")?.name).toBe("Bebidas frías");
  });

  it("no borra una categoría que todavía tiene productos", () => {
    const categories = seedCategories();
    const blocked = deleteCategory(categories, "cat-abarrotes", ["cat-abarrotes"]);
    expect(blocked.ok).toBe(false);
    const removed = deleteCategory(categories, "cat-limpieza", []);
    expect(removed.ok).toBe(true);
    if (removed.ok) {
      expect(removed.categories.map((category) => category.id)).not.toContain("cat-limpieza");
    }
  });
});
