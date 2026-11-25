import { get } from "./api";
import {
  isFastApiPagination,
  type FastApiPagination,
} from "./pagination";
import {
  isStoreFrontProductResponse,
  normalizeStoreFrontProduct,
  type StoreFrontProduct,
  type StoreFrontProductResponse,
} from "./products";

export interface StoreFrontMenuProduct extends StoreFrontProduct {
  name: string;
  description: string;
  slug: string;
  daily: {
    planned_quantity: number;
    remaining_quantity: number;
    status: string;
    available: boolean;
  };
  preorder: {
    available: boolean;
    schedules: {
      schedule_id: string;
      date: string;
      planned_quantity: number;
      remaining_quantity: number;
    }[];
  };
}

interface StoreFrontMenuProductResponse extends StoreFrontProductResponse {
  daily: StoreFrontMenuProduct["daily"];
  preorder: StoreFrontMenuProduct["preorder"];
}

export interface StoreFrontProductDetail extends StoreFrontProduct {
  daily: StoreFrontMenuProduct["daily"];
  preorder: StoreFrontMenuProduct["preorder"];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStoreFrontMenuProductResponse(
  value: unknown,
): value is StoreFrontMenuProductResponse {
  if (!isStoreFrontProductResponse(value) || !isRecord(value)) return false;

  const daily = value.daily;
  const preorder = value.preorder;
  return (
    isRecord(daily) &&
    typeof daily.planned_quantity === "number" &&
    typeof daily.remaining_quantity === "number" &&
    typeof daily.status === "string" &&
    typeof daily.available === "boolean" &&
    isRecord(preorder) &&
    typeof preorder.available === "boolean" &&
    Array.isArray(preorder.schedules) &&
    preorder.schedules.every(
      (schedule) =>
        isRecord(schedule) &&
        typeof schedule.schedule_id === "string" &&
        typeof schedule.date === "string" &&
        typeof schedule.planned_quantity === "number" &&
        typeof schedule.remaining_quantity === "number",
    )
  );
}

interface MenuQuery {
  page: number;
  limit: number;
  locale: "vi" | "en";
  order: "asc" | "desc";
  category_id?: string;
  search?: string;
}

function isMenuResponse(
  value: unknown,
  query: MenuQuery,
): value is {
  success: true;
  message: string;
  data: StoreFrontMenuProductResponse[];
  pagination: FastApiPagination;
  preorder_range: { start_date: string; end_date: string };
} {
  return (
    isRecord(value) &&
    value.success === true &&
    typeof value.message === "string" &&
    Array.isArray(value.data) &&
    value.data.every(isStoreFrontMenuProductResponse) &&
    isFastApiPagination(value.pagination, query.page, query.limit) &&
    isRecord(value.preorder_range) &&
    typeof value.preorder_range.start_date === "string" &&
    typeof value.preorder_range.end_date === "string"
  );
}

export async function getMenu(query: MenuQuery) {
  const response = await get("/store-front/menu", {
    query: {
      page: query.page,
      limit: query.limit,
      locale: query.locale,
      order: query.order,
      ...(query.category_id ? { category_id: query.category_id } : {}),
      ...(query.search ? { search: query.search } : {}),
    },
  });
  const payload: unknown = await response.json();

  if (!isMenuResponse(payload, query)) {
    throw new Error("Invalid FastAPI menu response");
  }

  return {
    data: payload.data.map((product) => {
      const normalized = normalizeStoreFrontMenuProduct(product);
      return {
        ...normalized,
        name: normalized.name ?? "",
        description: normalized.description ?? "",
        slug: normalized.slug ?? "",
      };
    }),
    pagination: payload.pagination,
    preorder_range: payload.preorder_range,
  };
}

function normalizeStoreFrontMenuProduct(
  product: StoreFrontMenuProductResponse,
): StoreFrontProductDetail {
  return {
    ...normalizeStoreFrontProduct(product),
    daily: product.daily,
    preorder: product.preorder,
  };
}

export async function getProductBySlug(slug: string, locale: "vi" | "en") {
  const response = await get(
    `/store-front/products/${encodeURIComponent(slug)}`,
    { query: { locale } },
  );
  const payload: unknown = await response.json();

  if (
    !isRecord(payload) ||
    payload.success !== true ||
    typeof payload.message !== "string" ||
    !isStoreFrontMenuProductResponse(payload.data)
  ) {
    throw new Error("Invalid FastAPI product detail response");
  }

  return normalizeStoreFrontMenuProduct(payload.data);
}
