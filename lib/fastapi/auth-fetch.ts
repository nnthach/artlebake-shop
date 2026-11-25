"use client";

const REFRESH_LOCK_NAME = "artlebake-fastapi-auth-refresh";
const REFRESH_STATE_KEY = "artlebake-fastapi-auth-refresh-state";
const AUTHENTICATED_PATHS = new Set([
  "/api/auth/me",
  "/api/auth/signout",
  "/api/auth/change-password",
]);

function requestUrl(input: RequestInfo | URL) {
  const href = input instanceof Request ? input.url : input.toString();
  return new URL(href, window.location.origin);
}

function isAuthenticatedAuthRequest(input: RequestInfo | URL) {
  const url = requestUrl(input);
  return (
    url.origin === window.location.origin &&
    (AUTHENTICATED_PATHS.has(url.pathname) ||
      url.pathname.startsWith("/api/admin/") ||
      url.pathname === "/api/upload")
  );
}

function csrfToken() {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("csrf_token="));
  return cookie?.slice("csrf_token=".length) ?? null;
}

function isWriteRequest(method: string | undefined) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(
    (method ?? "GET").toUpperCase(),
  );
}

function withCsrfToken(headers: Headers, method: string | undefined) {
  const token = isWriteRequest(method) ? csrfToken() : null;
  if (token) headers.set("X-CSRF-Token", token);
  return headers;
}

function readRefreshState() {
  try {
    return window.localStorage.getItem(REFRESH_STATE_KEY) ?? "";
  } catch {
    return null;
  }
}

function writeRefreshState(state: "pending" | "success" | "failed") {
  try {
    const marker = `${Date.now()}-${Math.random()}:${state}`;
    window.localStorage.setItem(REFRESH_STATE_KEY, marker);
    return marker;
  } catch {
    return null;
  }
}

export function markAuthSessionChanged(authenticated: boolean) {
  if (typeof window === "undefined") return;
  writeRefreshState(authenticated ? "success" : "failed");
}

function responseForChangedState(
  initialState: string | null,
  originalResponse: Response,
  retry: () => Promise<Response>,
) {
  const currentState = readRefreshState();
  if (!currentState || currentState === initialState) {
    return Promise.resolve(originalResponse);
  }
  if (currentState.endsWith(":success")) return retry();
  return Promise.resolve(originalResponse);
}

async function refreshAfterUnauthorized(
  initialState: string | null,
  originalResponse: Response,
  retry: () => Promise<Response>,
) {
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    !navigator.locks ||
    initialState === null
  ) {
    return originalResponse;
  }

  try {
    return await navigator.locks.request(REFRESH_LOCK_NAME, async () => {
      const currentState = readRefreshState();
      if (currentState !== initialState) {
        return responseForChangedState(initialState, originalResponse, retry);
      }

      if (!writeRefreshState("pending")) return originalResponse;

      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "same-origin",
          headers: withCsrfToken(new Headers(), "POST"),
        });
        writeRefreshState(response.ok ? "success" : "failed");
        return response.ok ? retry() : originalResponse;
      } catch {
        writeRefreshState("failed");
        return originalResponse;
      }
    });
  } catch {
    return originalResponse;
  }
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const initialRefreshState = readRefreshState();
  const performRequest = () => {
    const baseRequest = input instanceof Request ? input.clone() : input;
    const headers = new Headers(
      baseRequest instanceof Request ? baseRequest.headers : undefined,
    );
    new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
    withCsrfToken(
      headers,
      init?.method ??
        (baseRequest instanceof Request ? baseRequest.method : undefined),
    );

    return fetch(baseRequest, {
      ...init,
      headers,
      credentials: init?.credentials ?? "same-origin",
    });
  };

  const response = await performRequest();
  if (response.status !== 401 || !isAuthenticatedAuthRequest(input)) {
    return response;
  }

  return refreshAfterUnauthorized(
    initialRefreshState,
    response,
    performRequest,
  );
}
