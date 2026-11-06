/** Header và catalog tìm theo cùng quy tắc tiếng Việt không dấu. */
export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();
}

export function priceParam(value: string | null) {
  return value && /^\d{1,15}$/.test(value) ? value : "";
}
