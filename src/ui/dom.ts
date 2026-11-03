export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: {
    class?: string;
    text?: string;
    attrs?: Record<string, string>;
  } = {},
  children: Node[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (options.class) {
    node.className = options.class;
  }
  if (options.attrs) {
    for (const [key, value] of Object.entries(options.attrs)) {
      node.setAttribute(key, value);
    }
  }
  if (options.text !== undefined) {
    node.textContent = options.text;
  }
  for (const child of children) {
    node.append(child);
  }
  return node;
}

export function fieldError(id: string, message: string | undefined): HTMLElement {
  return el("p", {
    class: "field-error",
    text: message ?? "",
    attrs: { id, role: "alert" },
  });
}
