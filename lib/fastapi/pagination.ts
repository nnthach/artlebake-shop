export interface FastApiPagination {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isFastApiPagination(
  value: unknown,
  expectedPage: number,
  expectedLimit: number,
): value is FastApiPagination {
  if (!isRecord(value)) return false;

  const { page, limit, total_items, total_pages } = value;
  return (
    typeof page === "number" &&
    Number.isInteger(page) &&
    page === expectedPage &&
    typeof limit === "number" &&
    Number.isInteger(limit) &&
    limit === expectedLimit &&
    typeof total_items === "number" &&
    Number.isInteger(total_items) &&
    total_items >= 0 &&
    typeof total_pages === "number" &&
    Number.isInteger(total_pages) &&
    total_pages >= 0 &&
    total_pages === Math.ceil(total_items / limit)
  );
}
