export type FastApiOptions = Omit<RequestInit, "method" | "redirect"> & {
  query?: URLSearchParams | Record<string, string | number | boolean>;
  json?: unknown;
};

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const DEFAULT_TIMEOUT_MS = 10_000;

function isConfigured() {
  return Boolean(process.env.FASTAPI_BASE_URL);
}

function createTimeoutSignal() {
  return AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
}

async function request(
  method: Method,
  route: string,
  options: FastApiOptions = {},
): Promise<Response> {
  const baseUrl = process.env.FASTAPI_BASE_URL;
  if (!baseUrl) {
    throw new Error("FastAPI is not configured");
  }

  const base = new URL(baseUrl);
  if (base.protocol !== "http:" && base.protocol !== "https:") {
    throw new Error("Invalid FastAPI URL");
  }

  base.pathname = `${base.pathname.replace(/\/+$/, "")}/`;
  base.search = "";
  base.hash = "";

  const url = new URL(route.replace(/^\//, ""), base);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
    throw new Error("Invalid FastAPI route");
  }

  const { query, json, headers: requestHeaders, body, ...init } = options;
  const params =
    query instanceof URLSearchParams
      ? Array.from(query)
      : Object.entries(query ?? {});
  for (const [key, value] of params) {
    url.searchParams.append(key, String(value));
  }

  const headers = new Headers(requestHeaders);
  if (json !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    cache: "no-store",
    ...init,
    method,
    headers,
    body: json === undefined ? body : JSON.stringify(json),
    redirect: "manual",
    signal: init.signal ?? createTimeoutSignal(),
  });

  if (!response.ok) {
    throw new Error(`FastAPI request failed with status ${response.status}`);
  }

  return response;
}

export const httpClient = {
  isConfigured,
  createTimeoutSignal,
  request,
};
