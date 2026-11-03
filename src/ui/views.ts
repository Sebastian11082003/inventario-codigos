import { categoryName } from "../domain/categories";
import { describeProduct } from "../domain/products";
import { UNITS, type Category, type StoredProduct } from "../domain/types";
import type { DraftInput, FieldErrors } from "../domain/products";
import { CAMERA_FAILURE_COPY, type CameraFailure } from "../camera/errors";
import { el } from "./dom";
import { formatPrice, formatQuantity } from "./format";

function brand(): HTMLElement {
  return el("p", { class: "brand", text: "En este teléfono" });
}

export function loadingView(): HTMLElement {
  const screen = el("section", { class: "screen paper", attrs: { "aria-busy": "true" } }, [
    brand(),
    el("h1", { text: "Inventario" }),
    el("p", { class: "lede", text: "Abriendo los productos guardados en este teléfono…" }),
  ]);
  return screen;
}

export function listView(input: {
  products: readonly StoredProduct[];
  categories: readonly Category[];
  notice: string | null;
  onScan: () => void;
  onManual: () => void;
  onExport: () => void;
  onCategories: () => void;
  onEdit: (id: string) => void;
  onBump: (id: string, delta: number) => void;
}): HTMLElement {
  const count = input.products.length;
  const summary =
    count === 0
      ? "Todavía no hay productos."
      : count === 1
        ? "1 producto listo para exportar."
        : `${count} productos listos para exportar.`;

  const header = el("header", { class: "mast" }, [
    brand(),
    el("h1", { text: "Inventario" }),
    el("p", { class: "lede", text: summary }),
  ]);

  const notice = input.notice
    ? el("p", { class: "banner", text: input.notice, attrs: { role: "status" } })
    : el("p", { class: "banner is-hidden", text: "", attrs: { role: "status" } });

  const list = el("div", { class: "tickets" });
  if (count === 0) {
    list.append(
      el("article", { class: "empty-shelf" }, [
        el("p", { class: "empty-kicker", text: "Sin productos" }),
        el("h2", { text: "Escanea el primer código" }),
        el("p", {
          text: "Apunta con la cámara de atrás. Si no se lee, escríbelo. Todo queda en este teléfono.",
        }),
      ]),
    );
  } else {
    const ordered = [...input.products].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    for (const product of ordered) {
      list.append(ticket(product, input.categories, input.onEdit, input.onBump));
    }
  }

  const scan = el("button", {
    class: "scan-cta",
    text: "Escanear con la cámara",
    attrs: { type: "button" },
  });
  scan.addEventListener("click", input.onScan);

  const manual = el("button", {
    class: "dock-link",
    text: "Escribir código",
    attrs: { type: "button" },
  });
  manual.addEventListener("click", input.onManual);

  const exportButton = el("button", {
    class: "dock-link",
    text: "Exportar Excel",
    attrs: { type: "button" },
  });
  if (count === 0) {
    exportButton.disabled = true;
    exportButton.title = "Agrega al menos un producto para exportar.";
  }
  exportButton.addEventListener("click", input.onExport);

  const categories = el("button", {
    class: "dock-link",
    text: "Categorías",
    attrs: { type: "button" },
  });
  categories.addEventListener("click", input.onCategories);

  const dock = el("footer", { class: "dock" }, [
    el("p", { class: "dock-note", text: "La cámara de atrás lee el código" }),
    scan,
    el("div", { class: "dock-links" }, [manual, exportButton, categories]),
  ]);

  return el("section", { class: "screen" }, [header, notice, list, dock]);
}

function ticket(
  product: StoredProduct,
  categories: readonly Category[],
  onEdit: (id: string) => void,
  onBump: (id: string, delta: number) => void,
): HTMLElement {
  const open = el("button", {
    class: "ticket-open",
    attrs: { type: "button", "aria-label": `Editar ${describeProduct(product, categories)}` },
  }, [
    el("span", { class: "barcode", text: product.barcode }),
    el("span", { class: "stamp", text: categoryName(categories, product.categoryId) }),
    el("strong", { class: "ticket-name", text: product.name }),
    el("span", {
      class: "ticket-meta",
      text: product.price === null ? product.unit : `${product.unit} · ${formatPrice(product.price)}`,
    }),
  ]);
  open.addEventListener("click", () => onEdit(product.id));

  const minus = el("button", { class: "step", text: "−", attrs: { type: "button", "aria-label": `Disminuir cantidad de ${product.name}` } });
  const plus = el("button", { class: "step", text: "+", attrs: { type: "button", "aria-label": `Aumentar cantidad de ${product.name}` } });
  minus.addEventListener("click", () => onBump(product.id, -1));
  plus.addEventListener("click", () => onBump(product.id, 1));

  const qty = el("div", { class: "qty" }, [
    minus,
    el("span", { class: "qty-value", text: formatQuantity(product.quantity) }),
    plus,
  ]);

  return el("article", { class: "ticket" }, [open, qty]);
}

export function scanView(input: {
  phase: "opening" | "live" | "failed";
  failure: CameraFailure | null;
  onClose: () => void;
  onManual: () => void;
  onRetry: () => void;
}): HTMLElement {
  const close = el("button", { class: "ghost", text: "Cerrar", attrs: { type: "button" } });
  close.addEventListener("click", input.onClose);
  const manual = el("button", { class: "ghost", text: "Escribir código", attrs: { type: "button" } });
  manual.addEventListener("click", input.onManual);

  const statusText =
    input.phase === "failed"
      ? "La cámara no está disponible."
      : input.phase === "live"
        ? "Centra el código y mantenlo quieto un momento."
        : "Pidiendo permiso para la cámara trasera…";

  const video = el("video", {
    attrs: { id: "scan-video", playsinline: "true", autoplay: "true", muted: "true" },
  });
  video.muted = true;
  video.playsInline = true;

  const reticle = el("div", { class: "reticle", attrs: { "aria-hidden": "true" } }, [
    el("span", { class: "corner c1" }),
    el("span", { class: "corner c2" }),
    el("span", { class: "corner c3" }),
    el("span", { class: "corner c4" }),
  ]);

  const finder = el("div", { class: "viewfinder" }, [
    video,
    reticle,
    el("p", { class: "scan-status", text: statusText, attrs: { id: "scan-status", role: "status" } }),
  ]);

  const panel = el("div", { attrs: { id: "scan-panel" } });
  if (input.phase === "failed" && input.failure) {
    const copy = CAMERA_FAILURE_COPY[input.failure];
    const retry = el("button", { class: "ink-btn", text: "Reintentar cámara", attrs: { type: "button" } });
    retry.addEventListener("click", input.onRetry);
    panel.append(
      el("article", { class: "failure" }, [
        el("h2", { text: copy.title }),
        el("p", { text: copy.body }),
        retry,
      ]),
    );
    finder.classList.add("is-hidden");
  }

  return el("section", { class: "scan" }, [
    el("header", { class: "scan-bar" }, [
      close,
      el("p", { text: "Cámara trasera" }),
      manual,
    ]),
    finder,
    panel,
  ]);
}

export function detectedCard(barcode: string, formatLabel: string, onUse: () => void, onResume: () => void): HTMLElement {
  const use = el("button", { class: "ink-btn", text: "Usar este código", attrs: { type: "button" } });
  const resume = el("button", { class: "ghost", text: "Seguir escaneando", attrs: { type: "button" } });
  use.addEventListener("click", onUse);
  resume.addEventListener("click", onResume);
  return el("article", { class: "hit" }, [
    el("p", { class: "empty-kicker", text: formatLabel }),
    el("h2", { class: "barcode hit-code", text: barcode }),
    el("p", { text: "Comprueba que sea el mismo número del empaque. Queda en el teléfono y, si es un QR, no abre ninguna página." }),
    use,
    resume,
  ]);
}

export function manualView(input: {
  barcode: string;
  error: string;
  onClose: () => void;
  onScan: () => void;
  onSubmit: (barcode: string) => void;
}): HTMLElement {
  const field = el("input", {
    attrs: {
      id: "manual-barcode",
      name: "barcode",
      autocomplete: "off",
      enterkeyhint: "done",
      inputmode: "text",
      "aria-describedby": "manual-error",
    },
  });
  field.value = input.barcode;
  const form = el("form", { class: "ficha" });
  form.append(
    el("label", { attrs: { for: "manual-barcode" }, text: "Código de barras" }),
    field,
    el("p", { class: "field-error", text: input.error, attrs: { id: "manual-error", role: "alert" } }),
    el("button", { class: "ink-btn", text: "Continuar con este código", attrs: { type: "submit" } }),
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    input.onSubmit(field.value);
  });

  const back = el("button", { class: "ghost", text: "Volver", attrs: { type: "button" } });
  back.addEventListener("click", input.onClose);
  const scan = el("button", { class: "ghost dark", text: "Usar la cámara", attrs: { type: "button" } });
  scan.addEventListener("click", input.onScan);

  return el("section", { class: "screen paper" }, [
    el("header", { class: "subhead" }, [back, brand()]),
    el("h1", { text: "Escribir código" }),
    el("p", {
      class: "lede",
      text: "Respaldo si la cámara no lee. El flujo principal sigue siendo la cámara trasera.",
    }),
    form,
    scan,
  ]);
}

export function formView(input: {
  title: string;
  draft: DraftInput;
  errors: FieldErrors;
  categories: readonly Category[];
  confirmDelete: boolean;
  showDelete: boolean;
  onClose: () => void;
  onSubmit: (draft: DraftInput) => void;
  onDelete: () => void;
  onAskDelete: () => void;
}): HTMLElement {
  const barcode = textInput("barcode", "Código", input.draft.barcode, input.errors.barcode, "text");
  const name = textInput("name", "Nombre", input.draft.name, input.errors.name, "text");
  const quantity = textInput("quantity", "Cantidad", input.draft.quantity, input.errors.quantity, "decimal");
  const price = textInput("price", "Precio unitario (opcional)", input.draft.price, input.errors.price, "decimal");
  const notes = el("textarea", { attrs: { id: "notes", name: "notes", rows: "3", "aria-describedby": "err-notes" } });
  notes.value = input.draft.notes;

  const unit = el("select", { attrs: { id: "unit", name: "unit" } });
  for (const optionUnit of UNITS) {
    const option = el("option", { text: optionUnit, attrs: { value: optionUnit } });
    if (optionUnit === input.draft.unit) {
      option.selected = true;
    }
    unit.append(option);
  }

  const category = el("select", { attrs: { id: "categoryId", name: "categoryId" } });
  for (const item of input.categories) {
    const option = el("option", { text: item.name, attrs: { value: item.id } });
    if (item.id === input.draft.categoryId) {
      option.selected = true;
    }
    category.append(option);
  }

  const form = el("form", { class: "ficha" });
  form.append(
    barcode.label,
    barcode.input,
    barcode.error,
    name.label,
    name.input,
    name.error,
    el("label", { attrs: { for: "categoryId" }, text: "Categoría" }),
    category,
    el("p", { class: "field-error", text: input.errors.categoryId ?? "", attrs: { id: "err-category", role: "alert" } }),
    el("div", { class: "split" }, [
      el("div", {}, [quantity.label, quantity.input, quantity.error]),
      el("div", {}, [
        el("label", { attrs: { for: "unit" }, text: "Unidad" }),
        unit,
        el("p", { class: "field-error", text: input.errors.unit ?? "", attrs: { id: "err-unit", role: "alert" } }),
      ]),
    ]),
    price.label,
    price.input,
    price.error,
    el("label", { attrs: { for: "notes" }, text: "Notas" }),
    notes,
    el("p", { class: "field-error", text: input.errors.notes ?? "", attrs: { id: "err-notes", role: "alert" } }),
    el("button", { class: "ink-btn", text: "Guardar producto", attrs: { type: "submit" } }),
  );

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    input.onSubmit({
      barcode: String(data.get("barcode") ?? ""),
      name: String(data.get("name") ?? ""),
      categoryId: String(data.get("categoryId") ?? ""),
      quantity: String(data.get("quantity") ?? ""),
      unit: String(data.get("unit") ?? ""),
      price: String(data.get("price") ?? ""),
      notes: String(data.get("notes") ?? ""),
    });
  });

  const back = el("button", { class: "ghost", text: "Volver", attrs: { type: "button" } });
  back.addEventListener("click", input.onClose);

  const screen = el("section", { class: "screen paper" }, [
    el("header", { class: "subhead" }, [back, brand()]),
    el("h1", { text: input.title }),
    el("p", { class: "lede barcode", text: input.draft.barcode || "Sin código" }),
    form,
  ]);

  if (input.showDelete) {
    if (input.confirmDelete) {
      const confirm = el("button", { class: "danger-btn", text: "Confirmar eliminación", attrs: { type: "button" } });
      confirm.addEventListener("click", input.onDelete);
      screen.append(confirm);
    } else {
      const ask = el("button", { class: "ghost dark", text: "Eliminar producto", attrs: { type: "button" } });
      ask.addEventListener("click", input.onAskDelete);
      screen.append(ask);
    }
  }

  return screen;
}

function textInput(
  name: string,
  label: string,
  value: string,
  error: string | undefined,
  inputMode: "text" | "decimal",
): { label: HTMLLabelElement; input: HTMLInputElement; error: HTMLElement } {
  const input = el("input", {
    attrs: {
      id: name,
      name,
      autocomplete: "off",
      inputmode: inputMode,
      "aria-describedby": `err-${name}`,
    },
  });
  input.value = value;
  return {
    label: el("label", { attrs: { for: name }, text: label }),
    input,
    error: el("p", { class: "field-error", text: error ?? "", attrs: { id: `err-${name}`, role: "alert" } }),
  };
}

export function categoriesView(input: {
  categories: readonly Category[];
  drafts: Record<string, string>;
  newName: string;
  error: string;
  onClose: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onCreate: (name: string) => void;
}): HTMLElement {
  const back = el("button", { class: "ghost", text: "Volver", attrs: { type: "button" } });
  back.addEventListener("click", input.onClose);

  const list = el("div", { class: "category-list" });
  for (const category of input.categories) {
    const field = el("input", {
      attrs: { "aria-label": `Nombre de ${category.name}`, value: input.drafts[category.id] ?? category.name },
    });
    field.value = input.drafts[category.id] ?? category.name;
    const save = el("button", { class: "step", text: "Guardar", attrs: { type: "button" } });
    save.addEventListener("click", () => input.onRename(category.id, field.value));
    const remove = el("button", { class: "step danger", text: "Borrar", attrs: { type: "button" } });
    remove.addEventListener("click", () => input.onDelete(category.id));
    list.append(el("div", { class: "category-row" }, [field, save, remove]));
  }

  const createField = el("input", {
    attrs: { id: "new-category", placeholder: "Nueva categoría", value: input.newName },
  });
  createField.value = input.newName;
  const create = el("button", { class: "ink-btn", text: "Agregar categoría", attrs: { type: "button" } });
  create.addEventListener("click", () => input.onCreate(createField.value));

  return el("section", { class: "screen paper" }, [
    el("header", { class: "subhead" }, [back, brand()]),
    el("h1", { text: "Categorías" }),
    el("p", { class: "lede", text: "Abarrotes, Bebidas, Limpieza y Otros vienen de inicio. Puedes renombrarlas o crear otras." }),
    el("p", { class: "field-error", text: input.error, attrs: { role: "alert" } }),
    list,
    el("div", { class: "category-create" }, [
      el("label", { attrs: { for: "new-category" }, text: "Nueva" }),
      createField,
      create,
    ]),
  ]);
}
