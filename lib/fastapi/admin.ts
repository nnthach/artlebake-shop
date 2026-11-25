import { get } from "./api";
import { fastApiAuthHeaders, isFastApiAuthEnabled } from "./auth";
import {
  FastApiHttpError,
  httpClient,
  type FastApiOptions,
} from "./http-client";

type JsonRecord = Record<string, unknown>;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type ResponseAdapter =
  | "daily-inventory"
  | "preorder-item"
  | "order-detail"
  | "order-list"
  | "staff"
  | "staff-created"
  | "dashboard-stat"
  | "dashboard-revenue"
  | "legacy-publish"
  | "upload";

interface RequestPlan {
  route: string;
  method: Method;
  query?: URLSearchParams;
  json?: unknown;
  adapter?: ResponseAdapter;
  legacyNoContent?: boolean;
  responseStatus?: number;
}

const QUERY_FIELDS: Record<string, string[]> = {
  categories: [
    "is_active",
    "search",
    "sort_by",
    "order",
    "page",
    "limit",
    "locale",
  ],
  products: [
    "is_active",
    "category_id",
    "search",
    "order",
    "page",
    "limit",
    "locale",
  ],
  ingredients: [
    "is_active",
    "search",
    "sort_by",
    "order",
    "page",
    "limit",
    "locale",
  ],
  "daily-inventories": [
    "business_date",
    "date",
    "product_id",
    "status",
    "is_active",
    "page",
    "limit",
  ],
  "preorder-items": [
    "schedule_id",
    "date",
    "start_date",
    "end_date",
    "is_active",
    "page",
    "limit",
  ],
  orders: [
    "status",
    "payment_status",
    "order_type",
    "start_date",
    "end_date",
    "search",
    "sort_by",
    "order",
    "page",
    "limit",
  ],
  stores: [
    "is_active",
    "city",
    "district",
    "type",
    "search",
    "sort_by",
    "order",
    "page",
    "limit",
  ],
  staffs: [
    "is_active",
    "store_id",
    "search",
    "sort_by",
    "order",
    "page",
    "limit",
  ],
  users: ["is_active", "role_id", "search", "page", "limit"],
  roles: [],
  "preorder-schedules": ["date", "start_date", "end_date", "status"],
};

const RESOURCE_WRITE_FIELDS: Record<string, string[]> = {
  categories: ["name_vi", "name_en", "description_vi", "description_en"],
  products: [
    "name_vi",
    "description_vi",
    "name_en",
    "description_en",
    "image_url",
    "category_id",
    "ingredient_ids",
    "price",
    "is_bestseller",
  ],
  ingredients: ["name_vi", "name_en"],
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pick(value: unknown, fields: string[]) {
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    fields
      .filter((field) => Object.prototype.hasOwnProperty.call(value, field))
      .map((field) => [field, value[field]]),
  );
}

function queryFor(
  request: Request,
  resource: string,
  extraFields: string[] = [],
) {
  const search = new URL(request.url).searchParams;
  const allowed = new Set([...(QUERY_FIELDS[resource] ?? []), ...extraFields]);
  const query = new URLSearchParams();
  search.forEach((value, key) => {
    if (allowed.has(key)) query.append(key, value);
  });
  return query;
}

function pathFor(segments: string[]) {
  if (
    segments.length === 0 ||
    segments.some((segment) => !/^[A-Za-z0-9_-]+$/.test(segment))
  ) {
    throw new Error("Invalid admin path");
  }
  return segments.map(encodeURIComponent).join("/");
}

function recordBody(value: unknown) {
  return isRecord(value) ? value : {};
}

function routePlan(
  request: Request,
  segments: string[],
  body: unknown,
  isMultipart: boolean,
): RequestPlan | null {
  const method = request.method.toUpperCase() as Method;
  const [resource, ...rest] = segments;

  if (resource === "uploads" && rest.join("/") === "images" && method === "POST") {
    return { route: "uploads/images", method, adapter: "upload" };
  }

  if (resource === "auth" && rest.join("/") === "reset-password" && method === "PUT") {
    const value = recordBody(body);
    return {
      route: "auth/change-password",
      method: "PATCH",
      json: {
        current_password: value.currentPassword,
        new_password: value.newPassword,
      },
    };
  }

  if (resource === "preorder-schedule") {
    const value = recordBody(body);
    if (method === "GET" || method === "POST") {
      return {
        route: "preorder-schedules",
        method,
        query: queryFor(request, "preorder-schedules"),
        json: method === "POST" ? pick(value, ["date", "status"]) : undefined,
      };
    }
    if (method === "PATCH") {
      if (typeof value.id !== "string") return null;
      return {
        route: `preorder-schedules/${value.id}`,
        method,
        json: pick(value, ["date", "status"]),
      };
    }
    if (method === "DELETE") {
      const id = new URL(request.url).searchParams.get("id");
      if (!id) return null;
      return {
        route: `preorder-schedules/${id}`,
        method,
        legacyNoContent: true,
      };
    }
    return null;
  }

  if (resource === "user-accounts") {
    const route = ["users", ...rest];
    if (route.at(-1) === "reset-password") {
      return {
        route: pathFor(route),
        method,
        adapter: "staff-created",
      };
    }
    return {
      route: pathFor(route),
      method: method === "PUT" ? "PATCH" : method,
      query: rest.length === 0 ? queryFor(request, "users") : undefined,
      json: method === "POST" || method === "PUT" || method === "PATCH" ? body : undefined,
    };
  }

  if (resource === "roles" && rest.length === 0 && method === "GET") {
    return { route: "roles", method };
  }

  if (
    resource === "store-inventories" ||
    resource === "daily-inventories"
  ) {
    const inventoryRest = rest;
    if (inventoryRest.length === 0) {
      if (method === "GET") {
        return {
          route: "daily-inventories",
          method,
          query: queryFor(request, "daily-inventories"),
          adapter: "daily-inventory",
        };
      }
      if (method === "POST") {
        return {
          route: "daily-inventories",
          method,
          json: body,
          responseStatus: 200,
        };
      }
    }
    if (inventoryRest[0] === "publish-available" && method === "PATCH") {
      return {
        route: "daily-inventories/publish-available",
        method,
        adapter: "legacy-publish",
      };
    }
    if (inventoryRest.length === 2 && method === "PATCH") {
      const [id, action] = inventoryRest;
      const upstreamAction =
        action === "active"
          ? "activate"
          : action === "inactive"
            ? "deactivate"
            : null;
      if (!upstreamAction) return null;
      return {
        route: `daily-inventories/${id}/${upstreamAction}`,
        method,
        adapter: "daily-inventory",
      };
    }
    return null;
  }

  if (resource === "preorder-items") {
    if (rest.length === 0 && method === "GET") {
      return {
        route: "preorder-items",
        method,
        query: queryFor(request, "preorder-items"),
        adapter: "preorder-item",
      };
    }
    if (rest.length === 0 && method === "POST") {
      return { route: "preorder-items", method, json: body, adapter: "preorder-item" };
    }
    if (rest.length === 1 && ["PATCH", "DELETE"].includes(method)) {
      return {
        route: `preorder-items/${rest[0]}`,
        method,
        json: method === "PATCH" ? body : undefined,
        adapter: "preorder-item",
      };
    }
    return null;
  }

  if (resource === "orders") {
    if (rest.length === 0 && method === "GET") {
      return {
        route: "orders",
        method,
        query: queryFor(request, "orders"),
        adapter: "order-list",
      };
    }
    if (rest.length === 1 && method === "GET") {
      return {
        route: `orders/${rest[0]}`,
        method,
        query: queryFor(request, "orders", ["locale"]),
        adapter: "order-detail",
      };
    }
    if (
      rest.length === 2 &&
      method === "PATCH" &&
      ["delivered", "cancelled"].includes(rest[1])
    ) {
      return { route: `orders/${rest[0]}/${rest[1]}`, method };
    }
    return null;
  }

  if (resource === "dashboard") {
    const route = pathFor(segments);
    const responseAdapter: ResponseAdapter | undefined =
      rest.join("/") === "stat-card"
        ? "dashboard-stat"
        : rest.join("/") === "chart/total-revenue"
          ? "dashboard-revenue"
          : undefined;
    return {
      route,
      method,
      query: queryFor(request, "dashboard", ["locale", "viewType", "view_type", "year", "month"]),
      adapter: responseAdapter,
    };
  }

  if (
    ["categories", "products", "ingredients", "stores", "staffs", "users"].includes(
      resource,
    )
  ) {
    const queryResource = resource === "users" ? "users" : resource;
    const query = rest.length === 0 && method === "GET"
      ? queryFor(request, queryResource)
      : undefined;
    const value = recordBody(body);

    if (["categories", "products", "ingredients"].includes(resource)) {
    const writeFields = RESOURCE_WRITE_FIELDS[resource];
      if (rest.length === 0 && ["POST", "GET"].includes(method)) {
        return {
          route: resource,
          method,
          query,
        json: method === "POST" ? pick(value, writeFields) : undefined,
        };
      }
      if (rest.length === 1 && ["GET", "PUT", "PATCH"].includes(method)) {
        return {
          route: `${resource}/${rest[0]}`,
          method: method === "PUT" ? "PATCH" : method,
          query: method === "GET" ? queryFor(request, resource, ["locale"]) : undefined,
          json:
            method === "PUT" || method === "PATCH"
              ? pick(value, writeFields)
              : undefined,
        };
      }
      if (rest.length === 2) {
        const [id, action] = rest;
        if (action === "disabled" && method === "PATCH") {
          return { route: `${resource}/${id}/disable`, method };
        }
        if (action === "restore" && method === "PATCH") {
          return { route: `${resource}/${id}/restore`, method };
        }
        if (action === "delete" && method === "DELETE") {
          return { route: `${resource}/${id}/delete`, method };
        }
      }
    }

    if (resource === "stores") {
      if (rest[0] === "slug" && rest.length === 2 && method === "GET") {
        return { route: `stores/slug/${rest[1]}`, method };
      }
      if (rest.length === 0 && ["GET", "POST"].includes(method)) {
        return {
          route: "stores",
          method,
          query,
          json: method === "POST" ? storeWriteBody(body) : undefined,
        };
      }
      if (rest.length === 1 && ["GET", "PUT", "PATCH", "DELETE"].includes(method)) {
        return {
          route: `stores/${rest[0]}`,
          method: method === "PUT" ? "PATCH" : method,
          json:
            method === "PUT" || method === "PATCH"
              ? storeWriteBody(body)
              : undefined,
        };
      }
      if (rest.length === 2 && method === "PATCH") {
        if (rest[1] === "disable" || rest[1] === "restore") {
          return { route: `stores/${rest[0]}/${rest[1]}`, method };
        }
      }
    }

    if (resource === "staffs") {
      if (rest.length === 0 && ["GET", "POST"].includes(method)) {
        return {
          route: "staffs",
          method,
          query,
          json: method === "POST" ? staffWriteBody(body) : undefined,
          adapter: method === "POST" ? "staff-created" : "staff",
        };
      }
      if (rest.length === 1 && ["GET", "PUT", "PATCH", "DELETE"].includes(method)) {
        return {
          route: `staffs/${rest[0]}`,
          method: method === "PUT" ? "PATCH" : method,
          json:
            method === "PUT" || method === "PATCH"
              ? staffWriteBody(body)
              : undefined,
          adapter: "staff",
        };
      }
      if (
        rest.length === 2 &&
        method === "PATCH" &&
        ["disable", "restore"].includes(rest[1])
      ) {
        return { route: `staffs/${rest[0]}/${rest[1]}`, method, adapter: "staff" };
      }
    }

    if (resource === "users" && rest.length === 0 && method === "GET") {
      return { route: "users", method, query };
    }

    if (resource === "users" && rest.length > 0) {
      return {
        route: pathFor(segments),
        method: method === "PUT" ? "PATCH" : method,
        query,
        json: method === "POST" || method === "PUT" || method === "PATCH" ? body : undefined,
      };
    }

  }

  if (isMultipart) return null;
  return null;
}

function storeWriteBody(body: unknown) {
  return pick(body, [
    "name",
    "address_vi",
    "address_en",
    "city",
    "district",
    "image_url",
    "phone",
    "type",
  ]);
}

function staffWriteBody(body: unknown) {
  const value = recordBody(body);
  const fields = ["email", "dob", "gender", "store_id", "fullname"];
  const selected = pick(value, fields) as JsonRecord;
  if (Object.prototype.hasOwnProperty.call(selected, "fullname")) {
    selected.full_name = selected.fullname;
    delete selected.fullname;
  }
  return selected;
}

function errorResponse(error: unknown, adapter?: ResponseAdapter) {
  const upstreamStatus =
    error instanceof FastApiHttpError ? error.status : 502;
  const status =
    upstreamStatus === 422 ? 400 : upstreamStatus >= 500 ? 502 : upstreamStatus;
  const message =
    status === 401
      ? "Unauthorized"
      : status === 403
        ? "Forbidden"
        : status === 404
          ? "Not found"
          : status === 409
            ? "Conflict"
            : status === 413
              ? "File too large"
              : status === 415
                ? "Unsupported file type"
                : status === 400
                  ? "Invalid request"
                  : "FastAPI admin request failed";
  return Response.json(
    adapter === "upload" ? { message } : { success: false, error: message },
    { status },
  );
}

function numberValue(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : value;
}

function mapStaff(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(mapStaff);
  if (!isRecord(value)) return value;
  const account = isRecord(value.account) ? value.account : null;
  const store = isRecord(value.store) ? value.store : null;
  if (!account) return value;
  const staff = { ...value };
  delete staff.account;
  delete staff.store;
  return {
    ...staff,
    fullname: account.full_name,
    email: account.email,
    users: {
      id: account.id,
      full_name: account.full_name,
      role: account.role,
      status: account.is_active ? "active" : "inactive",
    },
    stores: store,
  };
}

function adaptPayload(
  payload: unknown,
  adapter: ResponseAdapter | undefined,
): unknown {
  if (!adapter || !isRecord(payload) || payload.success !== true) return payload;
  const data = payload.data;

  if (adapter === "upload" && isRecord(data)) {
    const publicId = data.public_id ?? data.publicId;
    return {
      url: data.url,
      ...(typeof publicId === "string" ? { publicId } : {}),
    };
  }

  if (adapter === "staff-created" && isRecord(data)) {
    if (isRecord(data.staff)) {
      return {
        ...payload,
        data: {
          ...data,
          staff: mapStaff(data.staff),
        },
      };
    }
    return { ...payload, data: mapStaff(data) };
  }

  if (adapter === "staff") {
    return {
      ...payload,
      data: Array.isArray(data) ? mapStaff(data) : mapStaff(data),
    };
  }

  if (adapter === "order-detail" && isRecord(data)) {
    const items = Array.isArray(data.items)
      ? data.items.map((item) => {
          if (!isRecord(item)) return item;
          const { product, ...orderItem } = item;
          return {
            ...orderItem,
            unit_price: numberValue(orderItem.unit_price),
            subtotal: numberValue(orderItem.subtotal),
            products: product ?? null,
          };
        })
      : [];
    return {
      ...payload,
      data: {
        ...data,
        subtotal: numberValue(data.subtotal),
        shipping_fee: numberValue(data.shipping_fee),
        total: numberValue(data.total),
        order_items: items,
        payments:
          isRecord(data.payment)
            ? {
                ...data.payment,
                amount: numberValue(data.payment.amount),
              }
            : null,
      },
    };
  }

  if (adapter === "order-list" && Array.isArray(data)) {
    return {
      ...payload,
      data: data.map((order) =>
        isRecord(order)
          ? {
              ...order,
              subtotal: numberValue(order.subtotal),
              shipping_fee: numberValue(order.shipping_fee),
              total: numberValue(order.total),
            }
          : order,
      ),
    };
  }

  if (adapter === "dashboard-stat" && isRecord(data)) {
    const growth = isRecord(data.growth) ? data.growth : {};
    return {
      ...payload,
      data: {
        ...data,
        total_revenue: numberValue(data.total_revenue),
        growth: {
          ...growth,
          total_orders: growth.total_orders === null ? null : numberValue(growth.total_orders),
          total_revenue: growth.total_revenue === null ? null : numberValue(growth.total_revenue),
          total_products_sold:
            growth.total_products_sold === null
              ? null
              : numberValue(growth.total_products_sold),
        },
      },
    };
  }

  if (adapter === "dashboard-revenue" && Array.isArray(data)) {
    return {
      ...payload,
      data: data.map((point) =>
        isRecord(point)
          ? { ...point, totalRevenue: numberValue(point.totalRevenue) }
          : point,
      ),
    };
  }

  if (adapter === "legacy-publish" && isRecord(data)) {
    return {
      ...payload,
      business_date: data.business_date,
      updated_count: data.updated_count,
      data: [],
    };
  }

  if (adapter === "daily-inventory" || adapter === "preorder-item") {
    const mapRow = (row: unknown) => {
      if (!isRecord(row)) return row;
      const { product, schedule, ...rest } = row;
      const { translations, category, ...productFields } = isRecord(product)
        ? product
        : {};
      const legacyProduct = isRecord(product)
        ? {
            ...productFields,
            product_translations: Array.isArray(translations)
              ? translations
              : [],
            categories: category ?? null,
          }
        : product;
      return adapter === "preorder-item"
        ? {
            ...rest,
            products: legacyProduct,
            preorder_schedules: schedule ?? null,
          }
        : { ...rest, products: legacyProduct };
    };
    return {
      ...payload,
      data: Array.isArray(data) ? data.map(mapRow) : mapRow(data),
    };
  }

  return payload;
}

async function enrichInventoryProducts(
  payload: unknown,
  adapter: ResponseAdapter | undefined,
  headers: Headers,
) {
  if (
    (adapter !== "daily-inventory" && adapter !== "preorder-item") ||
    !isRecord(payload) ||
    !Array.isArray(payload.data)
  ) {
    return payload;
  }

  const ids = Array.from(
    new Set(
      payload.data.flatMap((row) =>
        isRecord(row) && typeof row.product_id === "string"
          ? [row.product_id]
          : [],
      ),
    ),
  );
  if (ids.length === 0) return payload;

  const signal = httpClient.createTimeoutSignal();
  const products = await Promise.all(
    ids.map(async (id) => {
      const response = await get(`products/${id}`, { headers, signal });
      const result: unknown = await response.json();
      if (
        !isRecord(result) ||
        result.success !== true ||
        !isRecord(result.data)
      ) {
        throw new Error("Invalid product response");
      }
      return [id, result.data] as const;
    }),
  );
  const byId = new Map(products);
  return {
    ...payload,
    data: payload.data.map((row) => {
      if (!isRecord(row) || typeof row.product_id !== "string") return row;
      const detail = byId.get(row.product_id);
      if (!isRecord(detail)) return row;
      const { product, ...rest } = row;
      return {
        ...rest,
        product: {
          ...(isRecord(product) ? product : {}),
          ...detail,
        },
      };
    }),
  };
}

export async function proxyFastApiAdminRequest(
  request: Request,
  pathSegments: string[],
) {
  if (
    process.env.FASTAPI_ADMIN_ENABLED !== "true" ||
    !process.env.FASTAPI_BASE_URL ||
    !isFastApiAuthEnabled()
  ) {
    return Response.json(
      { success: false, error: "FastAPI admin proxy is not configured" },
      { status: 503 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  const isMultipart = contentType.toLowerCase().startsWith("multipart/form-data");
  let body: unknown;
  if (
    !isMultipart &&
    contentType.toLowerCase().includes("application/json") &&
    !["GET", "HEAD"].includes(request.method.toUpperCase())
  ) {
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      );
    }
  }

  let plan: RequestPlan | null;
  try {
    pathFor(pathSegments);
    plan = routePlan(request, pathSegments, body, isMultipart);
  } catch {
    return Response.json(
      { success: false, error: "Invalid admin path" },
      { status: 400 },
    );
  }
  if (!plan) {
    return Response.json(
      { success: false, error: "Admin endpoint not found" },
      { status: 404 },
    );
  }

  const headers = fastApiAuthHeaders(request);
  const options: FastApiOptions = {
    headers,
    ...(plan.query ? { query: plan.query } : {}),
    ...(plan.json !== undefined ? { json: plan.json } : {}),
  };
  if (isMultipart) {
    try {
      options.body = await request.formData();
    } catch {
      return Response.json(
        { success: false, error: "Invalid multipart upload" },
        { status: 400 },
      );
    }
  }

  try {
    const upstream = await httpClient.request(
      plan.method,
      plan.route,
      options,
    );
    if (upstream.status === 204) {
      return plan.legacyNoContent
        ? Response.json({ success: true }, { status: 200 })
        : new Response(null, { status: 204 });
    }

    const payload: unknown = await upstream.json();
    const enriched = await enrichInventoryProducts(payload, plan.adapter, headers);
    const adapted = adaptPayload(enriched, plan.adapter);
    return Response.json(adapted, {
      status: plan.responseStatus ?? upstream.status,
    });
  } catch (error) {
    if (!(error instanceof FastApiHttpError)) {
      console.error("FastAPI admin proxy request failed");
    }
    return errorResponse(error, plan.adapter);
  }
}
