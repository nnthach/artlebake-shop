import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { authenticatedFetch } from "./auth-fetch";

const originalFetch = globalThis.fetch;
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalNavigator = Object.getOwnPropertyDescriptor(
  globalThis,
  "navigator",
);
const originalDocument = Object.getOwnPropertyDescriptor(
  globalThis,
  "document",
);

function installBrowserGlobals() {
  const values = new Map<string, string>();
  const lockQueue: Promise<unknown>[] = [];
  const locks = {
    request: async (_name: string, callback: () => Promise<Response>) => {
      const previous = lockQueue.at(-1) ?? Promise.resolve();
      let release: () => void = () => {};
      const current = new Promise<void>((resolve) => {
        release = resolve;
      });
      lockQueue.push(current);
      await previous;
      try {
        return await callback();
      } finally {
        release();
      }
    },
  };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location: { origin: "http://localhost" },
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    },
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { locks },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { cookie: "csrf_token=csrf-value" },
  });
}

function restoreGlobal(name: string, descriptor: PropertyDescriptor | undefined) {
  if (descriptor) Object.defineProperty(globalThis, name, descriptor);
  else Reflect.deleteProperty(globalThis, name);
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  restoreGlobal("window", originalWindow);
  restoreGlobal("navigator", originalNavigator);
  restoreGlobal("document", originalDocument);
});

test("concurrent auth 401s share one refresh and each retry once", async () => {
  installBrowserGlobals();
  let authRequests = 0;
  let refreshRequests = 0;
  const csrfHeaders: string[] = [];

  globalThis.fetch = async (input, init) => {
    if (String(input) === "/api/auth/refresh") {
      refreshRequests += 1;
      csrfHeaders.push(new Headers(init?.headers).get("x-csrf-token") ?? "");
      return new Response(null, { status: 200 });
    }

    authRequests += 1;
    return new Response(null, { status: authRequests <= 2 ? 401 : 200 });
  };

  const [first, second] = await Promise.all([
    authenticatedFetch("/api/auth/me"),
    authenticatedFetch("/api/auth/me"),
  ]);

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(refreshRequests, 1);
  assert.equal(authRequests, 4);
  assert.deepEqual(csrfHeaders, ["csrf-value"]);
});

test("403s and public 401s do not trigger auth refresh", async () => {
  installBrowserGlobals();
  const refreshRequests: string[] = [];
  globalThis.fetch = async (input) => {
    if (String(input) === "/api/auth/refresh") {
      refreshRequests.push(String(input));
      return new Response(null, { status: 401 });
    }
    return new Response(null, {
      status: String(input) === "/api/auth/me" ? 403 : 401,
    });
  };

  const forbidden = await authenticatedFetch("/api/auth/me");
  const publicResponse = await authenticatedFetch("/api/products");
  const refreshResponse = await authenticatedFetch("/api/auth/refresh", {
    method: "POST",
  });

  assert.equal(forbidden.status, 403);
  assert.equal(publicResponse.status, 401);
  assert.equal(refreshResponse.status, 401);
  assert.deepEqual(refreshRequests, ["/api/auth/refresh"]);
});

test("a retried 401 does not trigger a second refresh", async () => {
  installBrowserGlobals();
  let authRequests = 0;
  let refreshRequests = 0;
  globalThis.fetch = async (input) => {
    if (String(input) === "/api/auth/refresh") {
      refreshRequests += 1;
      return new Response(null, { status: 200 });
    }

    authRequests += 1;
    return new Response(null, { status: 401 });
  };

  const response = await authenticatedFetch("/api/auth/me");

  assert.equal(response.status, 401);
  assert.equal(authRequests, 2);
  assert.equal(refreshRequests, 1);
});

test("admin 401s refresh through the auth proxy and retry only once", async () => {
  installBrowserGlobals();
  let adminRequests = 0;
  let refreshRequests = 0;
  globalThis.fetch = async (input, init) => {
    if (String(input) === "/api/auth/refresh") {
      refreshRequests += 1;
      assert.equal(new Headers(init?.headers).get("x-csrf-token"), "csrf-value");
      return new Response(null, { status: 200 });
    }

    adminRequests += 1;
    return new Response(null, { status: adminRequests === 1 ? 401 : 200 });
  };

  const response = await authenticatedFetch("/api/admin/orders?page=1");

  assert.equal(response.status, 200);
  assert.equal(adminRequests, 2);
  assert.equal(refreshRequests, 1);
});
