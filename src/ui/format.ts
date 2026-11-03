export function formatQuantity(value: number): string {
  return new Intl.NumberFormat("es", { maximumFractionDigits: 3 }).format(value);
}

export function formatPrice(value: number): string {
  return `$${new Intl.NumberFormat("es", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)}`;
}
