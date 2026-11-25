import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  proxyFastApiCron,
  proxyFastApiPayosWebhook,
  type FastApiCronEndpoint,
} from "./operations";

const originalFetch = globalThis.fetch;
const originalBaseUrl = process.env.FASTAPI_BASE_URL;
const originalCheckoutEnabled = process.env.FASTAPI_CHECKOUT_ENABLED;
const originalCronEnabled = process.env.FASTAPI_CRON_ENABLED;
const originalCronSecret = process.env.CRON_SECRET;

function configureFastApiOperations() {
  process.env.FASTAPI_BASE_URL = "http://fastapi.test";
  process.env.FASTAPI_CHECKOUT_ENABLED = "true";
  process.env.FASTAPI_CRON_ENABLED = "true";
  process.env.CRON_SECRET = "test-cron-secret";
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalBaseUrl === undefined) delete process.env.FASTAPI_BASE_URL;
  else process.env.FASTAPI_BASE_URL = originalBaseUrl;
  if (originalCheckoutEnabled === undefined)
    delete process.env.FASTAPI_CHECKOUT_ENABLED;
  else process.env.FASTAPI_CHECKOUT_ENABLED = originalCheckoutEnabled;
  if (originalCronEnabled === undefined)
    delete process.env.FASTAPI_CRON_ENABLED;
  else process.env.FASTAPI_CRON_ENABLED = originalCronEnabled;
  if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalCronSecret;
});

test("PayOS webhook forwards the original signed JSON and returns its acknowledgement", async () => {
  configureFastApiOperations();
  const rawBody =
    '{ "data": {"orderCode":"000123","providerField":"kept"}, "signature":"signed-value" }';
  let upstreamUrl = "";
  let upstreamBody: BodyInit | null | undefined;
  let upstreamHeaders: Headers | undefined;
  globalThis.fetch = async (input, init) => {
    upstreamUrl = String(input);
    upstreamBody = init?.body;
    upstreamHeaders = new Headers(init?.headers);
    return Response.json({ error: 0, message: "success" });
  };

  const request = new Request("http://localhost/api/webhooks/payos", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: rawBody,
  });
  const response = await proxyFastApiPayosWebhook(request);

  assert.ok(response);
  assert.equal(upstreamUrl, "http://fastapi.test/webhooks/payos");
  assert.equal(upstreamBody, rawBody);
  assert.equal(
    upstreamHeaders?.get("content-type"),
    "application/json; charset=utf-8",
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { error: 0, message: "success" });
});

test("PayOS webhook maps invalid payload and backend errors to safe acknowledgements", async () => {
  configureFastApiOperations();
  for (const [upstreamStatus, expectedStatus] of [
    [400, 400],
    [422, 400],
    [503, 503],
    [500, 502],
  ] as const) {
    globalThis.fetch = async () => new Response("upstream detail", { status: upstreamStatus });
    const request = new Request("http://localhost/api/webhooks/payos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"signature":"test"}',
    });

    const response = await proxyFastApiPayosWebhook(request);
    assert.ok(response);
    assert.equal(response.status, expectedStatus);
    assert.deepEqual(await response.json(), {
      error: -1,
      message: "Webhook processing failed",
    });
  }
});

test("enabled PayOS webhook forwarding fails closed without FastAPI configuration", async () => {
  configureFastApiOperations();
  delete process.env.FASTAPI_BASE_URL;
  let upstreamCalls = 0;
  globalThis.fetch = async () => {
    upstreamCalls += 1;
    return Response.json({ error: 0, message: "success" });
  };

  const response = await proxyFastApiPayosWebhook(
    new Request("http://localhost/api/webhooks/payos", {
      method: "POST",
      body: '{"signature":"test"}',
    }),
  );

  assert.ok(response);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: -1,
    message: "Webhook processing failed",
  });
  assert.equal(upstreamCalls, 0);
});

test("FastAPI cron forwarding uses the server bearer secret for all migrated jobs", async () => {
  configureFastApiOperations();
  const endpoints: FastApiCronEndpoint[] = [
    "close-daily-inventories",
    "close-preorder",
    "publish-menu",
  ];

  for (const endpoint of endpoints) {
    let upstreamUrl = "";
    let upstreamHeaders: Headers | undefined;
    globalThis.fetch = async (input, init) => {
      upstreamUrl = String(input);
      upstreamHeaders = new Headers(init?.headers);
      return Response.json({ success: true, message: "completed", data: {} });
    };

    const response = await proxyFastApiCron(endpoint);
    assert.ok(response);
    assert.equal(upstreamUrl, `http://fastapi.test/cron/${endpoint}`);
    assert.equal(
      upstreamHeaders?.get("authorization"),
      "Bearer test-cron-secret",
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      success: true,
      message: "completed",
      data: {},
    });
  }
});

test("enabled FastAPI cron forwarding fails closed without URL or secret", async () => {
  configureFastApiOperations();
  let upstreamCalls = 0;
  globalThis.fetch = async () => {
    upstreamCalls += 1;
    return Response.json({ success: true });
  };

  const missingConfig: Array<"baseUrl" | "secret"> = ["baseUrl", "secret"];
  for (const missing of missingConfig) {
    process.env.FASTAPI_BASE_URL = "http://fastapi.test";
    process.env.CRON_SECRET = "test-cron-secret";
    if (missing === "baseUrl") delete process.env.FASTAPI_BASE_URL;
    else delete process.env.CRON_SECRET;

    const response = await proxyFastApiCron("close-preorder");
    assert.ok(response);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "Cron forwarding is not configured",
    });
  }
  assert.equal(upstreamCalls, 0);
});

test("disabled operations return control to the unchanged legacy handlers", async () => {
  process.env.FASTAPI_BASE_URL = "http://fastapi.test";
  process.env.FASTAPI_CHECKOUT_ENABLED = "false";
  process.env.FASTAPI_CRON_ENABLED = "false";
  let upstreamCalls = 0;
  globalThis.fetch = async () => {
    upstreamCalls += 1;
    return Response.json({});
  };

  const webhook = await proxyFastApiPayosWebhook(
    new Request("http://localhost/api/webhooks/payos", { method: "POST" }),
  );
  const cron = await proxyFastApiCron("publish-menu");

  assert.equal(webhook, null);
  assert.equal(cron, null);
  assert.equal(upstreamCalls, 0);
});

test("cron upstream errors keep their status and return sanitized errors", async () => {
  configureFastApiOperations();
  globalThis.fetch = async () =>
    Response.json(
      { detail: "secret or provider detail" },
      { status: 401 },
    );

  const response = await proxyFastApiCron("close-daily-inventories");
  assert.ok(response);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    success: false,
    error: "FastAPI cron request failed",
  });
});
