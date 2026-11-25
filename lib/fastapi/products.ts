import { get } from "./api";
import { isFastApiPagination } from "./pagination";

export interface StoreFrontProduct {
  id: string;
  price: number | null;
  image_url: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  is_bestseller: boolean;
  category: {
    id: string;
    name: {
      vi: string;
      en: string;
    };
  } | null;
  name: string | null;
  description: string | null;
  slug: string | null;
  ingredients: {
    id: string;
    name: {
      vi: string;
      en: string;
    };
  }[];
}

export interface StoreFrontProductResponse {
  id: string;
  price?: number | null;
  image_url: string[];
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
  is_bestseller: boolean;
  category?: StoreFrontProduct["category"];
  name?: string | null;
  description?: string | null;
  slug?: string | null;
  ingredients: StoreFrontProduct["ingredients"];
}

export interface StoreFrontProductListQuery {
  page: number;
  limit: number;
  locale: "vi" | "en";
  sort_by: "created_at" | "name";
  order: "asc" | "desc";
  is_bestseller?: boolean;
  category_id?: string;
  search?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLocalizedName(
  value: unknown,
): value is { vi: string; en: string } {
  return (
    isRecord(value) &&
    typeof value.vi === "string" &&
    typeof value.en === "string"
  );
}

function isNullableString(value: unknown) {
  return value === undefined || value === null || typeof value === "string";
}

export function isStoreFrontProductResponse(
  value: unknown,
): value is StoreFrontProductResponse {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    (value.price !== undefined &&
      value.price !== null &&
      typeof value.price !== "number") ||
    !Array.isArray(value.image_url) ||
    !value.image_url.every((image) => typeof image === "string") ||
    typeof value.is_active !== "boolean" ||
    typeof value.created_at !== "string" ||
    !isNullableString(value.updated_at) ||
    typeof value.is_bestseller !== "boolean" ||
    !isNullableString(value.name) ||
    !isNullableString(value.description) ||
    !isNullableString(value.slug) ||
    !Array.isArray(value.ingredients)
  ) {
    return false;
  }

  const category = value.category;
  if (
    category !== undefined &&
    category !== null &&
    (!isRecord(category) ||
      typeof category.id !== "string" ||
      !isLocalizedName(category.name))
  ) {
    return false;
  }

  return value.ingredients.every(
    (ingredient) =>
      isRecord(ingredient) &&
      typeof ingredient.id === "string" &&
      isLocalizedName(ingredient.name),
  );
}

export function normalizeStoreFrontProduct(
  product: StoreFrontProductResponse,
): StoreFrontProduct {
  return {
    id: product.id,
    price: product.price ?? null,
    image_url: product.image_url,
    is_active: product.is_active,
    created_at: product.created_at,
    updated_at: product.updated_at ?? null,
    is_bestseller: product.is_bestseller,
    category: product.category ?? null,
    name: product.name ?? null,
    description: product.description ?? null,
    slug: product.slug ?? null,
    ingredients: product.ingredients,
  };
}

export async function getProducts(query: StoreFrontProductListQuery) {
  const response = await get("/store-front/products", {
    query: {
      page: query.page,
      limit: query.limit,
      locale: query.locale,
      sort_by: query.sort_by,
      order: query.order,
      ...(query.is_bestseller !== undefined
        ? { is_bestseller: query.is_bestseller }
        : {}),
      ...(query.category_id ? { category_id: query.category_id } : {}),
      ...(query.search ? { search: query.search } : {}),
    },
  });
  const payload: unknown = await response.json();

  if (
    !isRecord(payload) ||
    payload.success !== true ||
    typeof payload.message !== "string" ||
    !Array.isArray(payload.data) ||
    !payload.data.every(isStoreFrontProductResponse) ||
    !isFastApiPagination(payload.pagination, query.page, query.limit)
  ) {
    throw new Error("Invalid FastAPI product list response");
  }

  return {
    data: payload.data.map(normalizeStoreFrontProduct),
    pagination: payload.pagination,
  };
}
