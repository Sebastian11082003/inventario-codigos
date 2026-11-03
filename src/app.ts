import { startRearCameraScan, type ScanSession } from "./camera/session";
import type { CameraFailure } from "./camera/errors";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  categoryName,
  seedCategories,
} from "./domain/categories";
import { exportFileName, toExcelMatrix } from "./domain/excel";
import {
  draftFromProduct,
  emptyDraft,
  findByBarcode,
  bumpQuantity,
  validateDraft,
  type DraftInput,
  type FieldErrors,
} from "./domain/products";
import { acceptScannedCode } from "./domain/products";
import { unitAmountLabel, type Category, type StoredProduct } from "./domain/types";
import { formatQuantity } from "./ui/format";
import { buildXlsx, downloadXlsx } from "./export/xlsx";
import { IdbInventoryRepository } from "./persistence/idb";
import { MemoryInventoryRepository } from "./persistence/memory";
import type { InventoryRepository } from "./persistence/repository";
import { categoriesView, detectedCard, flashToggle, formView, listView, loadingView, manualView, scanView } from "./ui/views";

type FormModel = {
  id: string | null;
  draft: DraftInput;
  errors: FieldErrors;
  confirmDelete: boolean;
};

type View =
  | { name: "loading" }
  | { name: "list" }
  | { name: "scan"; phase: "opening" | "live" | "failed"; failure: CameraFailure | null }
  | { name: "manual"; barcode: string; error: string }
  | { name: "form"; form: FormModel }
  | { name: "categories"; drafts: Record<string, string>; newName: string; error: string };

type Model = {
  products: StoredProduct[];
  categories: Category[];
  notice: string | null;
  view: View;
};

export function startApp(root: HTMLElement, repository: InventoryRepository = createRepository()): void {
  const model: Model = {
    products: [],
    categories: seedCategories(),
    notice: null,
    view: { name: "loading" },
  };
  let repo = repository;
  let session: ScanSession | null = null;
  let quantityWrites = Promise.resolve();
  let releaseScan: Promise<void> = Promise.resolve();
  let scanGate: Promise<void> = Promise.resolve();
  let scanToken = 0;

  const paint = () => {
    root.replaceChildren(screenFor(model));
  };

  const persistError = () => {
    model.notice = "No se pudo guardar en este navegador. La lista sigue en memoria, pero un refresco puede perderla.";
  };

  async function boot() {
    paint();
    try {
      const snapshot = await repo.load();
      model.products = snapshot.products;
      model.categories = snapshot.categories;
    } catch {
      repo = new MemoryInventoryRepository();
      const snapshot = await repo.load();
      model.products = snapshot.products;
      model.categories = snapshot.categories;
      model.notice = "Este navegador no guardó el inventario. Puedes trabajar ahora, pero al refrescar se pierde.";
    }
    model.view = { name: "list" };
    paint();
  }

  function showList() {
    stopScan();
    model.view = { name: "list" };
    paint();
  }

  function stopScan() {
    scanToken += 1;
    const current = session;
    session = null;
    if (!current) {
      return;
    }
    current.stop();
    releaseScan = current.whenReleased;
  }

  window.addEventListener("pagehide", () => {
    stopScan();
  });

  function openForm(form: FormModel) {
    stopScan();
    model.view = { name: "form", form };
    paint();
    const name = root.querySelector<HTMLInputElement>("#name");
    name?.focus();
  }

  function openBarcode(barcode: string) {
    const existing = findByBarcode(model.products, barcode);
    if (existing) {
      openForm({ id: existing.id, draft: draftFromProduct(existing), errors: {}, confirmDelete: false });
      return;
    }
    openForm({
      id: null,
      draft: emptyDraft(barcode, model.categories),
      errors: {},
      confirmDelete: false,
    });
  }

  function holdScan(next: ScanSession) {
    next.stop();
    releaseScan = next.whenReleased;
  }

  async function openScanner() {
    const previous = scanGate;
    let releaseGate: () => void = () => undefined;
    scanGate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    await previous;
    try {
      await runScanner();
    } finally {
      releaseGate();
    }
  }

  async function runScanner() {
    stopScan();
    const token = scanToken;
    model.view = { name: "scan", phase: "opening", failure: null };
    paint();
    await releaseScan;
    if (token !== scanToken || model.view.name !== "scan") {
      return;
    }
    const video = root.querySelector<HTMLVideoElement>("#scan-video");
    if (!video) {
      return;
    }
    try {
      const next = await startRearCameraScan(
        video,
        (hit) => {
          if (token !== scanToken) {
            return;
          }
          const status = root.querySelector("#scan-status");
          const existing = findByBarcode(model.products, hit.barcode);
          if (status) {
            status.textContent = existing
              ? `${existing.name}. Anota el conteo de ahora.`
              : `${hit.formatLabel} confirmado. Este código es nuevo.`;
          }
          const panel = root.querySelector("#scan-panel");
          panel?.replaceChildren(
            detectedCard({
              barcode: hit.barcode,
              formatLabel: hit.formatLabel,
              known: existing
                ? {
                    name: existing.name,
                    category: categoryName(model.categories, existing.categoryId),
                    had: `En este teléfono había ${formatQuantity(existing.quantity)} ${unitAmountLabel(existing.unit)}.`,
                  }
                : null,
              onSaveCount: (quantity) => saveCount(existing, quantity, token),
              onOpen: () => openBarcode(hit.barcode),
              onResume: () => {
                next.resume();
                panel?.replaceChildren();
                if (status) {
                  status.textContent = "Mantén el código quieto.";
                }
              },
            }),
          );
        },
        (failure) => {
          if (token !== scanToken) {
            return;
          }
          model.view = { name: "scan", phase: "failed", failure };
          paint();
        },
        () => {
          const status = root.querySelector("#scan-status");
          if (status && !root.querySelector(".hit")) {
            status.textContent = "Ya lo veo, no lo muevas.";
          }
        },
      );
      if (token !== scanToken || model.view.name !== "scan") {
        holdScan(next);
        return;
      }
      session = next;
      model.view = { name: "scan", phase: "live", failure: null };
      const status = root.querySelector("#scan-status");
      if (status) {
        status.textContent = "Mantén el código quieto.";
      }
      if (next.torchSupported) {
        const bar = root.querySelector(".scan-bar");
        if (bar && !bar.querySelector(".flash-toggle")) {
          bar.append(flashToggle((on) => next.setTorch(on)));
        }
      }
    } catch {
      if (token !== scanToken) {
        return;
      }
      if (model.view.name === "scan" && model.view.phase !== "failed") {
        model.view = { name: "scan", phase: "failed", failure: "unknown" };
        paint();
      }
    }
  }

  async function saveProduct(id: string | null, draft: DraftInput) {
    const validated = validateDraft(draft, model.categories);
    if (!validated.ok) {
      if (model.view.name === "form") {
        model.view.form.draft = draft;
        model.view.form.errors = validated.errors;
        paint();
      }
      return;
    }
    const duplicate = findByBarcode(model.products, validated.value.barcode);
    if (duplicate && duplicate.id !== id) {
      if (model.view.name === "form") {
        model.view.form.draft = draft;
        model.view.form.errors = { barcode: "Ese código ya está en la lista. Ábrelo desde el inicio." };
        paint();
      }
      return;
    }
    const stored: StoredProduct = {
      id: id ?? crypto.randomUUID(),
      ...validated.value,
      updatedAt: new Date().toISOString(),
    };
    try {
      await repo.saveProduct(stored);
    } catch {
      persistError();
    }
    const index = model.products.findIndex((product) => product.id === stored.id);
    if (index === -1) {
      model.products.push(stored);
    } else {
      model.products[index] = stored;
    }
    showList();
  }

  async function saveCount(product: StoredProduct | undefined, quantity: number, token: number) {
    if (!product || token !== scanToken || model.view.name !== "scan") {
      return;
    }
    const stored: StoredProduct = {
      ...product,
      quantity,
      updatedAt: new Date().toISOString(),
    };
    try {
      await repo.saveProduct(stored);
    } catch {
      persistError();
    }
    if (token !== scanToken || model.view.name !== "scan") {
      const index = model.products.findIndex((item) => item.id === stored.id);
      if (index === -1) {
        model.products.push(stored);
      } else {
        model.products[index] = stored;
      }
      return;
    }
    model.products = model.products.map((item) => (item.id === stored.id ? stored : item));
    const panel = root.querySelector("#scan-panel");
    panel?.replaceChildren();
    session?.resume();
    const status = root.querySelector("#scan-status");
    if (status) {
      status.textContent =
        quantity === 0
          ? "Guardado. El Excel avisará sin existencias. Apunta al siguiente."
          : "Conteo guardado. Apunta al siguiente.";
    }
  }

  async function changeQuantity(id: string, delta: number) {
    const current = model.products.find((product) => product.id === id);
    if (!current) {
      return;
    }
    const next = bumpQuantity(current, delta, new Date().toISOString());
    if (next === current) {
      return;
    }
    model.products = model.products.map((product) => (product.id === id ? next : product));
    paint();
    const pending = next;
    quantityWrites = quantityWrites.then(async () => {
      try {
        await repo.saveProduct(pending);
      } catch {
        persistError();
        paint();
      }
    });
  }

  function exportExcel() {
    if (model.products.length === 0) {
      return;
    }
    const matrix = toExcelMatrix(model.products, model.categories);
    downloadXlsx(buildXlsx(matrix), exportFileName(new Date()));
  }

  function screenFor(current: Model): HTMLElement {
    if (current.view.name === "loading") {
      return loadingView();
    }
    if (current.view.name === "list") {
      return listView({
        products: current.products,
        categories: current.categories,
        notice: current.notice,
        onScan: () => {
          void openScanner();
        },
        onManual: () => {
          stopScan();
          model.view = { name: "manual", barcode: "", error: "" };
          paint();
          root.querySelector<HTMLInputElement>("#manual-barcode")?.focus();
        },
        onExport: exportExcel,
        onCategories: () => {
          model.view = { name: "categories", drafts: {}, newName: "", error: "" };
          paint();
        },
        onEdit: (id) => {
          const product = model.products.find((item) => item.id === id);
          if (!product) {
            return;
          }
          openForm({ id: product.id, draft: draftFromProduct(product), errors: {}, confirmDelete: false });
        },
        onBump: (id, delta) => {
          void changeQuantity(id, delta);
        },
      });
    }
    if (current.view.name === "scan") {
      return scanView({
        phase: current.view.phase,
        failure: current.view.failure,
        onClose: showList,
        onManual: () => {
          stopScan();
          model.view = { name: "manual", barcode: "", error: "" };
          paint();
        },
        onRetry: () => {
          void openScanner();
        },
      });
    }
    if (current.view.name === "manual") {
      return manualView({
        barcode: current.view.barcode,
        error: current.view.error,
        onClose: showList,
        onScan: () => {
          void openScanner();
        },
        onSubmit: (barcode) => {
          const accepted = acceptScannedCode(barcode);
          if (!accepted) {
            model.view = { name: "manual", barcode, error: "Escribe el código que aparece en el producto." };
            paint();
            return;
          }
          openBarcode(accepted.barcode);
        },
      });
    }
    if (current.view.name === "form") {
      const form = current.view.form;
      return formView({
        title: form.id ? "Editar producto" : "Nuevo producto",
        draft: form.draft,
        errors: form.errors,
        categories: current.categories,
        confirmDelete: form.confirmDelete,
        showDelete: form.id !== null,
        previousNote: form.id
          ? previousNoteFor(model.products.find((item) => item.id === form.id))
          : null,
        onClose: showList,
        onSubmit: (draft) => {
          void saveProduct(form.id, draft);
        },
        onAskDelete: () => {
          form.confirmDelete = true;
          paint();
        },
        onDelete: () => {
          if (!form.id) {
            return;
          }
          const id = form.id;
          void (async () => {
            try {
              await repo.deleteProduct(id);
            } catch {
              persistError();
              paint();
              return;
            }
            model.products = model.products.filter((product) => product.id !== id);
            showList();
          })();
        },
      });
    }
    return categoriesView({
      categories: current.categories,
      drafts: current.view.drafts,
      newName: current.view.newName,
      error: current.view.error,
      onClose: showList,
      onRename: (id, name) => {
        const result = renameCategory(current.categories, id, name);
        if (!result.ok) {
          current.view = { name: "categories", drafts: { [id]: name }, newName: "", error: result.error };
          paint();
          return;
        }
        current.categories = result.categories;
        void repo.saveCategories(result.categories).catch(persistError);
        current.view = { name: "categories", drafts: {}, newName: "", error: "" };
        paint();
      },
      onDelete: (id) => {
        const result = deleteCategory(
          current.categories,
          id,
          current.products.map((product) => product.categoryId),
        );
        if (!result.ok) {
          current.view = { name: "categories", drafts: {}, newName: "", error: result.error };
          paint();
          return;
        }
        current.categories = result.categories;
        void repo.saveCategories(result.categories).catch(persistError);
        current.view = { name: "categories", drafts: {}, newName: "", error: "" };
        paint();
      },
      onCreate: (name) => {
        const result = createCategory(current.categories, name, `cat-${crypto.randomUUID()}`);
        if (!result.ok) {
          current.view = { name: "categories", drafts: {}, newName: name, error: result.error };
          paint();
          return;
        }
        current.categories = result.categories;
        void repo.saveCategories(result.categories).catch(persistError);
        current.view = { name: "categories", drafts: {}, newName: "", error: "" };
        paint();
      },
    });
  }

  void boot();
}

function previousNoteFor(product: StoredProduct | undefined): string | null {
  if (!product) {
    return null;
  }
  return `En este teléfono había ${formatQuantity(product.quantity)} ${unitAmountLabel(product.unit)}. Si ahora hay 0, escríbelo: el Excel avisará Sin existencias. El botón − de la lista no baja a cero.`;
}

function createRepository(): InventoryRepository {
  if (typeof indexedDB === "undefined") {
    return new MemoryInventoryRepository();
  }
  return new IdbInventoryRepository();
}
