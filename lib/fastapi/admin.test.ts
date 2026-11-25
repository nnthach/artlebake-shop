import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { proxyFastApiAdminRequest } from "./admin";

const originalFetch = globalThis.fetch;
const originalBaseUrl = process.env.FASTAPI_BASE_URL;
const originalAdminEnabled = process.env.FASTAPI_ADMIN_ENABLED;
const originalAuthEnabled = process.env.FASTAPI_AUTH_ENABLED;

function configure() {
  process.env.FASTAPI_BASE_URL = "http://fastapi.test";
  process.env.FASTAPI_ADMIN_ENABLED = "true";
  process.env.FASTAPI_AUTH_ENABLED = "true";
}

function apiResponse(data: unknown, status = 200) {
  return Response.json({ success: true, message: "ok", data }, { status });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalBaseUrl === undefined) delete process.env.FASTAPI_BASE_URL;
  else process.env.FASTAPI_BASE_URL = originalBaseUrl;
  if (originalAdminEnabled === undefined)
    delete process.env.FASTAPI_ADMIN_ENABLED;
  else process.env.FASTAPI_ADMIN_ENABLED = originalAdminEnabled;
  if (originalAuthEnabled === undefined)
    delete process.env.FASTAPI_AUTH_ENABLED;
  else process.env.FASTAPI_AUTH_ENABLED = originalAuthEnabled;
});

test("admin catalog list forwards supported filters and paginated response", async () => {
  configure();
  let upstreamUrl = "";
  let upstreamHeaders: Headers | undefined;
  globalThis.fetch = async (input, init) => {
    upstreamUrl = String(input);
    upstreamHeaders = new Headers(init?.headers);
    return Response.json({
      success: true,
      message: "listed",
      data: [{ id: "category-id", name: { vi: "Bánh", en: "Cake" } }],
      pagination: { page: 2, limit: 1, total_items: 2, total_pages: 2 },
    });
  };

  const request = new NextRequest(
    "http://localhost/api/fastapi-admin/categories?is_active=true&sort_by=name&order=asc&page=2&limit=1",
    {
      headers: {
        Cookie: "access_token=access; csrf_token=csrf",
        "X-CSRF-Token": "csrf",
      },
    },
  );
  const response = await proxyFastApiAdminRequest(request, ["categories"]);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.match(upstreamUrl, /\/categories\?/);
  assert.match(upstreamUrl, /is_active=true/);
  assert.match(upstreamUrl, /page=2/);
  assert.equal(
    upstreamHeaders?.get("cookie"),
    "access_token=access; csrf_token=csrf",
  );
  assert.equal(upstreamHeaders?.get("x-csrf-token"), "csrf");
  assert.deepEqual(body.pagination, {
    page: 2,
    limit: 1,
    total_items: 2,
    total_pages: 2,
  });
});

test("users list forwards supported filters and pagination to FastAPI users", async () => {
  configure();
  let upstreamUrl = "";
  globalThis.fetch = async (input) => {
    upstreamUrl = String(input);
    return Response.json({
      success: true,
      message: "listed",
      data: [{ id: "user-id", email: "staff@example.test" }],
      pagination: { page: 2, limit: 1, total_items: 3, total_pages: 3 },
    });
  };

  const request = new NextRequest(
    "http://localhost/api/fastapi-admin/users?is_active=true&role_id=staff-role&search=lee&page=2&limit=1&city=ignored",
  );
  const response = await proxyFastApiAdminRequest(request, ["users"]);
  const body = await response.json();
  const upstream = new URL(upstreamUrl);

  assert.equal(response.status, 200);
  assert.equal(upstream.pathname, "/users");
  assert.deepEqual(Object.fromEntries(upstream.searchParams), {
    is_active: "true",
    role_id: "staff-role",
    search: "lee",
    page: "2",
    limit: "1",
  });
  assert.deepEqual(body.pagination, {
    page: 2,
    limit: 1,
    total_items: 3,
    total_pages: 3,
  });
});

test("catalog create and update share the same resource field allowlists", async () => {
  configure();
  const input = {
    name_vi: "Tên",
    name_en: "Name",
    description_vi: "Mô tả",
    description_en: "Description",
    image_url: ["https://images.test/item.webp"],
    category_id: "category-id",
    ingredient_ids: ["ingredient-id"],
    price: 50000,
    is_bestseller: true,
    generated_slug: "ignored",
  };
  const resources = [
    {
      name: "categories",
      expected: {
        name_vi: input.name_vi,
        name_en: input.name_en,
        description_vi: input.description_vi,
        description_en: input.description_en,
      },
    },
    {
      name: "products",
      expected: {
        name_vi: input.name_vi,
        description_vi: input.description_vi,
        name_en: input.name_en,
        description_en: input.description_en,
        image_url: input.image_url,
        category_id: input.category_id,
        ingredient_ids: input.ingredient_ids,
        price: input.price,
        is_bestseller: input.is_bestseller,
      },
    },
    {
      name: "ingredients",
      expected: { name_vi: input.name_vi, name_en: input.name_en },
    },
  ];

  for (const resource of resources) {
    const forwardedBodies: unknown[] = [];
    globalThis.fetch = async (_url, init) => {
      forwardedBodies.push(JSON.parse(String(init?.body)));
      return apiResponse({ id: `${resource.name}-id` });
    };

    for (const { method, path } of [
      { method: "POST", path: resource.name },
      { method: "PATCH", path: `${resource.name}/${resource.name}-id` },
    ]) {
      const request = new NextRequest(
        `http://localhost/api/fastapi-admin/${path}`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );
      const response = await proxyFastApiAdminRequest(
        request,
        path.split("/"),
      );
      assert.equal(response.status, 200);
    }

    assert.deepEqual(forwardedBodies, [resource.expected, resource.expected]);
  }
});

test("product create removes generated slug fields and maps validation status", async () => {
  configure();
  let upstreamBody: unknown;
  let upstreamHeaders: Headers | undefined;
  globalThis.fetch = async (_input, init) => {
    upstreamBody = JSON.parse(String(init?.body));
    upstreamHeaders = new Headers(init?.headers);
    return apiResponse({ id: "product-id" }, 201);
  };

  const request = new NextRequest("http://localhost/api/fastapi-admin/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: "access_token=access; csrf_token=csrf",
      "X-CSRF-Token": "csrf",
    },
    body: JSON.stringify({
      name_vi: "Bánh",
      name_en: "Cake",
      slug_vi: "ignored",
      slug_en: "ignored",
      image_url: [],
      category_id: "category-id",
      ingredient_ids: [],
      price: 50000,
      is_bestseller: false,
    }),
  });
  const response = await proxyFastApiAdminRequest(request, ["products"]);

  assert.equal(response.status, 201);
  assert.deepEqual(upstreamBody, {
    name_vi: "Bánh",
    name_en: "Cake",
    image_url: [],
    category_id: "category-id",
    ingredient_ids: [],
    price: 50000,
    is_bestseller: false,
  });
  assert.equal(upstreamHeaders?.get("x-csrf-token"), "csrf");

  globalThis.fetch = async () => new Response(null, { status: 422 });
  const invalidRequest = new NextRequest(
    "http://localhost/api/fastapi-admin/products",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name_vi: "Bánh" }),
    },
  );
  const invalid = await proxyFastApiAdminRequest(invalidRequest, ["products"]);
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), {
    success: false,
    error: "Invalid request",
  });
});

test("schedule updates move the legacy id from body to the FastAPI path", async () => {
  configure();
  let upstreamUrl = "";
  let upstreamMethod = "";
  let upstreamBody: unknown;
  globalThis.fetch = async (input, init) => {
    upstreamUrl = String(input);
    upstreamMethod = init?.method ?? "";
    upstreamBody = JSON.parse(String(init?.body));
    return apiResponse({ id: "schedule-id", status: false });
  };

  const request = new NextRequest(
    "http://localhost/api/fastapi-admin/preorder-schedule",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "schedule-id", status: false }),
    },
  );
  const response = await proxyFastApiAdminRequest(request, ["preorder-schedule"]);

  assert.equal(upstreamUrl, "http://fastapi.test/preorder-schedules/schedule-id");
  assert.equal(upstreamMethod, "PATCH");
  assert.deepEqual(upstreamBody, { status: false });
  assert.equal(response.status, 200);
});

test("order detail adapts nested legacy relations and numeric VND values", async () => {
  configure();
  globalThis.fetch = async () =>
    apiResponse({
      id: "order-id",
      order_code: "0000123",
      subtotal: "120000",
      shipping_fee: "0",
      total: "120000",
      items: [
        {
          id: "item-id",
          product_name: "Snapshot",
          unit_price: "60000",
          subtotal: "120000",
          quantity: 2,
          product: { id: "product-id", image_url: [], is_active: true },
        },
      ],
      payment: { amount: "120000", transaction_id: "pay-ref" },
    });

  const request = new NextRequest(
    "http://localhost/api/fastapi-admin/orders/order-id?locale=vi",
  );
  const response = await proxyFastApiAdminRequest(request, ["orders", "order-id"]);
  const body = await response.json();

  assert.equal(body.data.order_code, "0000123");
  assert.equal(body.data.total, 120000);
  assert.equal(body.data.order_items[0].unit_price, 60000);
  assert.equal(body.data.order_items[0].products.id, "product-id");
  assert.equal(body.data.payments.transaction_id, "pay-ref");
});

test("upload forwards multipart and auth headers without setting content type", async () => {
  configure();
  let upstreamBody: BodyInit | null | undefined;
  let upstreamHeaders: Headers | undefined;
  globalThis.fetch = async (_input, init) => {
    upstreamBody = init?.body;
    upstreamHeaders = new Headers(init?.headers);
    return apiResponse(
      { url: "https://images.test/file.webp", public_id: "products/file" },
      201,
    );
  };

  const form = new FormData();
  form.append("file", new Blob(["image-data"], { type: "image/webp" }), "cake.webp");
  const request = new NextRequest("http://localhost/api/fastapi-admin/uploads/images", {
    method: "POST",
    headers: {
      Cookie: "access_token=access; csrf_token=csrf",
      "X-CSRF-Token": "csrf",
    },
    body: form,
  });
  const response = await proxyFastApiAdminRequest(request, ["uploads", "images"]);
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.ok(upstreamBody instanceof FormData);
  assert.equal((upstreamBody as FormData).get("file") instanceof File, true);
  assert.equal(upstreamHeaders?.has("content-type"), false);
  assert.equal(upstreamHeaders?.get("cookie"), "access_token=access; csrf_token=csrf");
  assert.equal(upstreamHeaders?.get("x-csrf-token"), "csrf");
  assert.equal(body.url, "https://images.test/file.webp");
  assert.equal(body.publicId, "products/file");
  assert.equal("data" in body, false);
});

test("upload errors retain status mapping and the legacy message response shape", async () => {
  configure();
  for (const [status, message] of [
    [413, "File too large"],
    [415, "Unsupported file type"],
  ] as const) {
    globalThis.fetch = async () => new Response(null, { status });
    const form = new FormData();
    form.append("file", new Blob(["image-data"], { type: "image/webp" }), "cake.webp");
    const request = new NextRequest(
      "http://localhost/api/fastapi-admin/uploads/images",
      { method: "POST", body: form },
    );

    const response = await proxyFastApiAdminRequest(request, [
      "uploads",
      "images",
    ]);

    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), { message });
  }
});

test("the server-only gate rewrites admin and upload calls but leaves legacy routes intact", () => {
  const request = new NextRequest("http://localhost/api/admin/orders?page=2");
  process.env.FASTAPI_ADMIN_ENABLED = "false";
  assert.equal(middleware(request).headers.get("x-middleware-next"), "1");

  process.env.FASTAPI_ADMIN_ENABLED = "true";
  const adminRewrite = middleware(request);
  assert.equal(
    adminRewrite.headers.get("x-middleware-rewrite"),
    "http://localhost/api/fastapi-admin/orders?page=2",
  );

  const uploadRewrite = middleware(
    new NextRequest("http://localhost/api/upload"),
  );
  assert.equal(
    uploadRewrite.headers.get("x-middleware-rewrite"),
    "http://localhost/api/fastapi-admin/uploads/images",
  );
});
