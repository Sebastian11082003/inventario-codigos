import { categoryName } from "../domain/categories";
import { describeProduct } from "../domain/products";
import { UNITS, type Category, type StoredProduct } from "../domain/types";
import type { DraftInput, FieldErrors } from "../domain/products";
import { CAMERA_FAILURE_COPY, type CameraFailure } from "../camera/errors";
import { el } from "./dom";
import { formatPrice, formatQuantity } from "./format";

const TONES = ["tone-1", "tone-2", "tone-3", "tone-4", "tone-5"] as const;

function toneFor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 33 + name.charCodeAt(index)) >>> 0;
  }
  return TONES[hash % TONES.length] ?? "tone-1";
}

function brand(): HTMLElement {
  return el("p", { class: "brand", text: "En este teléfono" });
}

function cameraIcon(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", "cta-icon");
  svg.setAttribute("aria-hidden", "true");
  const body = document.createElementNS("http://www.w3.org/2000/svg", "path");
  body.setAttribute("fill", "currentColor");
  body.setAttribute(
    "d",
    "M4.5 9.2c0-1.2 1-2.2 2.2-2.2h1.6l.7-1.3c.2-.4.6-.7 1.1-.7h3.8c.5 0 .9.3 1.1.7l.7 1.3h1.6c1.2 0 2.2 1 2.2 2.2v7.1c0 1.2-1 2.2-2.2 2.2H6.7c-1.2 0-2.2-1-2.2-2.2V9.2z",
  );
  const lens = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  lens.setAttribute("cx", "12");
  lens.setAttribute("cy", "12.6");
  lens.setAttribute("r", "3.1");
  lens.setAttribute("fill", "#fff");
  const pupil = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  pupil.setAttribute("cx", "12");
  pupil.setAttribute("cy", "12.6");
  pupil.setAttribute("r", "1.35");
  pupil.setAttribute("fill", "currentColor");
  svg.append(body, lens, pupil);
  return svg;
}

function scanButton(label: string, onClick: () => void): HTMLButtonElement {
  const button = el("button", { class: "scan-cta", attrs: { type: "button" } }, [
    el("span", { class: "cta-icon-wrap", attrs: { "aria-hidden": "true" } }, [cameraIcon()]),
    el("span", { class: "cta-label", text: label }),
  ]);
  button.addEventListener("click", onClick);
  return button;
}

function shelfMark(): HTMLElement {
  const bars = ["w1", "w2", "w3", "hot", "w2", "w1", "w3"].map((kind) => el("span", { class: `bar ${kind}` }));
  return el("div", { class: "mark", attrs: { "aria-hidden": "true" } }, [
    ...bars,
    el("span", { class: "lens" }),
  ]);
}

function colorBand(back: HTMLButtonElement | null, title: string, extra?: HTMLElement): HTMLElement {
  const copyKids: Node[] = [brand(), el("h1", { text: title })];
  if (extra) {
    copyKids.push(extra);
  }
  const kids: Node[] = [];
  if (back) {
    kids.push(back);
  }
  kids.push(el("div", { class: "subhead-copy" }, copyKids));
  return el("header", { class: "subhead" }, kids);
}

export function loadingView(): HTMLElement {
  return el("section", { class: "screen home is-loading", attrs: { "aria-busy": "true" } }, [
    el("header", { class: "hero" }, [
      brand(),
      el("h1", { text: "Inventario" }),
      el("p", { class: "lede", text: "Abriendo los productos guardados en este teléfono…" }),
    ]),
    el("div", { class: "sheet" }, [
      el("div", { class: "tickets" }, [
        el("article", { class: "empty-shelf" }, [
          shelfMark(),
          el("p", { class: "empty-kicker", text: "Un momento" }),
        ]),
      ]),
    ]),
  ]);
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

  const scan = scanButton("Escanear con la cámara", input.onScan);
  const heroKids: Node[] = [
    brand(),
    el("h1", { text: "Inventario" }),
    el("p", { class: "lede", text: summary }),
  ];
  if (count === 0) {
    heroKids.push(scan);
    heroKids.push(el("p", { class: "hero-note", text: "La cámara de atrás lee el código" }));
  }

  const notice = input.notice
    ? el("p", { class: "banner", text: input.notice, attrs: { role: "status" } })
    : el("p", { class: "banner is-hidden", text: "", attrs: { role: "status" } });

  const list = el("div", { class: "tickets" });
  if (count === 0) {
    list.append(
      el("article", { class: "empty-shelf" }, [
        shelfMark(),
        el("p", { class: "empty-kicker", text: "Sin productos" }),
        el("h2", { text: "Escanea el primer código" }),
        el("p", {
          class: "empty-copy",
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

  const dockKids: Node[] = [];
  if (count > 0) {
    dockKids.push(el("p", { class: "dock-note", text: "La cámara de atrás lee el código" }));
    dockKids.push(scan);
  }
  dockKids.push(el("div", { class: "dock-links" }, [manual, exportButton, categories]));

  return el("section", { class: count === 0 ? "screen home is-empty" : "screen home has-items" }, [
    el("header", { class: "hero" }, heroKids),
    el("div", { class: "sheet" }, [notice, list, el("footer", { class: "dock" }, dockKids)]),
  ]);
}

function ticket(
  product: StoredProduct,
  categories: readonly Category[],
  onEdit: (id: string) => void,
  onBump: (id: string, delta: number) => void,
): HTMLElement {
  const category = categoryName(categories, product.categoryId);
  const open = el("button", {
    class: "ticket-open",
    attrs: { type: "button", "aria-label": `Editar ${describeProduct(product, categories)}` },
  }, [
    el("span", { class: "ticket-top" }, [
      el("strong", { class: "ticket-name", text: product.name }),
      el("span", { class: `stamp ${toneFor(category)}`, text: category }),
    ]),
    el("span", { class: "barcode", text: product.barcode }),
    el("span", {
      class: "ticket-meta",
      text: product.price === null ? product.unit : `${product.unit} · ${formatPrice(product.price)}`,
    }),
  ]);
  open.addEventListener("click", () => onEdit(product.id));

  const minus = el("button", {
    class: "step",
    text: "−",
    attrs: { type: "button", "aria-label": `Disminuir cantidad de ${product.name}` },
  });
  const plus = el("button", {
    class: "step",
    text: "+",
    attrs: { type: "button", "aria-label": `Aumentar cantidad de ${product.name}` },
  });
  minus.addEventListener("click", () => onBump(product.id, -1));
  plus.addEventListener("click", () => onBump(product.id, 1));

  const qty = el("div", { class: "qty" }, [
    minus,
    el("span", { class: "qty-value", text: formatQuantity(product.quantity) }),
    plus,
  ]);

  return el("article", { class: "ticket" }, [open, qty]);
}

export function flashToggle(setTorch: (on: boolean) => Promise<boolean>): HTMLButtonElement {
  let on = false;
  const button = el(
    "button",
    { class: "flash-toggle", attrs: { type: "button", "aria-pressed": "false" } },
    [el("span", { class: "flash-lamp", attrs: { "aria-hidden": "true" } }), el("span", { text: "Flash" })],
  );

  const paint = () => {
    button.classList.toggle("is-on", on);
    button.setAttribute("aria-pressed", on ? "true" : "false");
  };

  button.addEventListener("click", () => {
    const next = !on;
    button.disabled = true;
    void setTorch(next).then((applied) => {
      if (applied) {
        on = next;
      }
      button.disabled = false;
      paint();
    });
  });

  return button;
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
        ? "Mantén el código quieto."
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
    el("span", { class: "beam" }),
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
  const use = el("button", { class: "ink-btn use-code", text: "Usar este código", attrs: { type: "button" } });
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
  if (input.error) {
    field.setAttribute("aria-invalid", "true");
    queueMicrotask(() => field.focus());
  }
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

  return el("section", { class: "screen form-screen" }, [
    colorBand(back, "Escribir código"),
    el("p", {
      class: "intro",
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
  if (input.errors.notes) {
    notes.setAttribute("aria-invalid", "true");
  }

  const unit = el("select", { attrs: { id: "unit", name: "unit", "aria-describedby": "err-unit" } });
  for (const optionUnit of UNITS) {
    const option = el("option", { text: optionUnit, attrs: { value: optionUnit } });
    if (optionUnit === input.draft.unit) {
      option.selected = true;
    }
    unit.append(option);
  }
  if (input.errors.unit) {
    unit.setAttribute("aria-invalid", "true");
  }

  const category = el("select", { attrs: { id: "categoryId", name: "categoryId", "aria-describedby": "err-category" } });
  for (const item of input.categories) {
    const option = el("option", { text: item.name, attrs: { value: item.id } });
    if (item.id === input.draft.categoryId) {
      option.selected = true;
    }
    category.append(option);
  }
  if (input.errors.categoryId) {
    category.setAttribute("aria-invalid", "true");
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

  if (input.errors.name || input.errors.barcode || input.errors.quantity || input.errors.price) {
    queueMicrotask(() => {
      form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
    });
  }

  const back = el("button", { class: "ghost", text: "Volver", attrs: { type: "button" } });
  back.addEventListener("click", input.onClose);

  const screen = el("section", { class: "screen form-screen" }, [
    colorBand(back, input.title, el("p", { class: "code-chip", text: input.draft.barcode || "Sin código" })),
    form,
  ]);

  if (input.showDelete) {
    if (input.confirmDelete) {
      const confirm = el("button", { class: "danger-btn", text: "Confirmar eliminación", attrs: { type: "button" } });
      confirm.addEventListener("click", input.onDelete);
      screen.append(confirm);
    } else {
      const ask = el("button", { class: "ghost dark danger-quiet", text: "Eliminar producto", attrs: { type: "button" } });
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
  if (error) {
    input.setAttribute("aria-invalid", "true");
  }
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
    const save = el("button", { class: "save-btn", text: "Guardar", attrs: { type: "button" } });
    save.addEventListener("click", () => input.onRename(category.id, field.value));
    const remove = el("button", { class: "delete-btn", text: "Borrar", attrs: { type: "button" } });
    remove.addEventListener("click", () => input.onDelete(category.id));
    list.append(el("div", { class: "category-row" }, [
      field,
      el("div", { class: "row-actions" }, [save, remove]),
    ]));
  }

  const createField = el("input", {
    attrs: { id: "new-category", placeholder: "Nueva categoría", value: input.newName },
  });
  createField.value = input.newName;
  const create = el("button", { class: "ink-btn", text: "Agregar categoría", attrs: { type: "button" } });
  create.addEventListener("click", () => input.onCreate(createField.value));

  return el("section", { class: "screen form-screen" }, [
    colorBand(back, "Categorías"),
    el("p", {
      class: "intro",
      text: "Abarrotes, Bebidas, Limpieza y Otros vienen de inicio. Puedes renombrarlas o crear otras.",
    }),
    el("p", { class: "field-error", text: input.error, attrs: { role: "alert" } }),
    list,
    el("div", { class: "category-create" }, [
      el("label", { attrs: { for: "new-category" }, text: "Nueva" }),
      createField,
      create,
    ]),
  ]);
}
