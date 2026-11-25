import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { NextRequest } from "next/server";
import { POST as signIn } from "@/app/api/auth/signin/route";
import { POST as refresh } from "@/app/api/auth/refresh/route";
import { PATCH as changePassword } from "@/app/api/auth/change-password/route";

const originalFetch = globalThis.fetch;
const originalBaseUrl = process.env.FASTAPI_BASE_URL;
const originalAuthEnabled = process.env.FASTAPI_AUTH_ENABLED;

const user = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "admin@example.test",
  full_name: "Test Admin",
  role: { id: "admin-role", name: "admin" },
  is_active: true,
  must_change_password: true,
  last_login_at: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: null,
};

function response(data: unknown, cookies: string[] = []) {
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(
    JSON.stringify({ success: true, message: "ok", data }),
    { status: 200, headers },
  );
}

function setAuthConfiguration() {
  process.env.FASTAPI_BASE_URL = "http://fastapi.test";
  process.env.FASTAPI_AUTH_ENABLED = "true";
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalBaseUrl === undefined) delete process.env.FASTAPI_BASE_URL;
  else process.env.FASTAPI_BASE_URL = originalBaseUrl;
  if (originalAuthEnabled === undefined)
    delete process.env.FASTAPI_AUTH_ENABLED;
  else process.env.FASTAPI_AUTH_ENABLED = originalAuthEnabled;
});

test("signin maps FastAPI user data and forwards every cookie safely", async () => {
  setAuthConfiguration();
  let upstreamBody = "";
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "http://fastapi.test/auth/login");
    upstreamBody = String(init?.body);
    return response(user, [
      "access_token=access; Path=/; HttpOnly; Secure; SameSite=Lax",
      "refresh_token=refresh; Path=/auth; HttpOnly; Secure; Domain=example.test; SameSite=Lax",
      "csrf_token=csrf; Path=/; Secure; SameSite=Lax",
    ]);
  };

  const request = new NextRequest("http://localhost/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: "temporary-pass" }),
  });
  const result = await signIn(request);
  const body = await result.json();
  const cookies = result.headers.getSetCookie();

  assert.equal(result.status, 200);
  assert.deepEqual(JSON.parse(upstreamBody), {
    email: user.email,
    password: "temporary-pass",
  });
  assert.deepEqual(body.data.user, {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: "admin",
    status: "active",
    is_active: true,
    must_change_password: true,
    auth_provider: "fastapi",
  });
  assert.equal(cookies.length, 3);
  assert.match(cookies[0], /Path=\/; HttpOnly; Secure; SameSite=Lax/);
  assert.match(
    cookies[1],
    /Path=\/api\/auth; HttpOnly; Secure; Domain=example\.test; SameSite=Lax/,
  );
  assert.match(cookies[2], /csrf_token=csrf; Path=\/;/);
});

test("refresh forwards cookies and CSRF and rewrites refresh-cookie path", async () => {
  setAuthConfiguration();
  let upstreamHeaders: Headers | undefined;
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "http://fastapi.test/auth/refresh");
    upstreamHeaders = new Headers(init?.headers);
    return response(user, [
      "access_token=new-access; Path=/; HttpOnly",
      "refresh_token=new-refresh; Path=/auth; HttpOnly; SameSite=Lax",
      "csrf_token=new-csrf; Path=/",
    ]);
  };

  const request = new NextRequest("http://localhost/api/auth/refresh", {
    method: "POST",
    headers: {
      Cookie: "access_token=old-access; refresh_token=old-refresh; csrf_token=old-csrf",
      "X-CSRF-Token": "old-csrf",
    },
  });
  const result = await refresh(request);
  const cookies = result.headers.getSetCookie();

  assert.equal(result.status, 200);
  assert.equal(
    upstreamHeaders?.get("cookie"),
    "access_token=old-access; refresh_token=old-refresh; csrf_token=old-csrf",
  );
  assert.equal(upstreamHeaders?.get("x-csrf-token"), "old-csrf");
  assert.equal(cookies.length, 3);
  assert.match(cookies[1], /refresh_token=new-refresh; Path=\/api\/auth; HttpOnly/);
});

test("password change sends snake-case body, CSRF, and clears all cookies", async () => {
  setAuthConfiguration();
  let upstreamBody = "";
  let upstreamHeaders: Headers | undefined;
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "http://fastapi.test/auth/change-password");
    upstreamBody = String(init?.body);
    upstreamHeaders = new Headers(init?.headers);
    return response(null, [
      "access_token=; Path=/; Max-Age=0; HttpOnly",
      "refresh_token=; Path=/auth; Max-Age=0; HttpOnly",
      "csrf_token=; Path=/; Max-Age=0",
    ]);
  };

  const request = new NextRequest(
    "http://localhost/api/auth/change-password",
    {
      method: "PATCH",
      headers: {
        Cookie: "access_token=access; csrf_token=csrf",
        "X-CSRF-Token": "csrf",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword: "temporary-pass",
        newPassword: "new-password",
      }),
    },
  );
  const result = await changePassword(request);
  const cookies = result.headers.getSetCookie();

  assert.equal(result.status, 200);
  assert.deepEqual(JSON.parse(upstreamBody), {
    current_password: "temporary-pass",
    new_password: "new-password",
  });
  assert.equal(upstreamHeaders?.get("x-csrf-token"), "csrf");
  assert.equal(cookies.length, 3);
  assert.match(cookies[1], /refresh_token=; Path=\/api\/auth; Max-Age=0; HttpOnly/);
});
