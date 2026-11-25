import { get } from "./api";
import { httpClient } from "./http-client";
import {
  isFastApiPagination,
  type FastApiPagination,
} from "./pagination";

const CATEGORY_PAGE_SIZE = 100;

interface CategoryPageResponse {
  success: true;
  message: string;
  data: unknown[];
  pagination: FastApiPagination;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCategoryPageResponse(
  value: unknown,
  requestedPage: number,
): value is CategoryPageResponse {
  if (
    !isRecord(value) ||
    value.success !== true ||
    typeof value.message !== "string" ||
    !Array.isArray(value.data)
  ) {
    return false;
  }

  return isFastApiPagination(
    value.pagination,
    requestedPage,
    CATEGORY_PAGE_SIZE,
  );
}

export async function getCategories(
  sortBy: string,
  order: "asc" | "desc",
  locale: string,
) {
  const categories: unknown[] = [];
  const timeoutSignal = httpClient.createTimeoutSignal();
  let totalPages: number | undefined;

  for (let page = 1; totalPages === undefined || page <= totalPages; page++) {
    const response = await get("/store-front/categories", {
      query: {
        page,
        limit: CATEGORY_PAGE_SIZE,
        sort_by: sortBy,
        order,
        locale,
      },
      signal: timeoutSignal,
    });

    const payload: unknown = await response.json();
    if (!isCategoryPageResponse(payload, page)) {
      throw new Error("Invalid FastAPI category response");
    }

    if (totalPages === undefined) {
      totalPages = payload.pagination.total_pages;
    } else if (payload.pagination.total_pages !== totalPages) {
      throw new Error("Inconsistent FastAPI category pagination");
    }

    categories.push(...payload.data);
  }

  return categories;
}
