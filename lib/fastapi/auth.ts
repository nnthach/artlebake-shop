import { get, patch, post } from "./api";
import { FastApiHttpError } from "./http-client";
import type { UserItem, UserRoleEnum } from "@/types";

export interface FastApiAuthUser extends UserItem {
  email: string;
  is_active: boolean;
  must_change_password: boolean;
  auth_provider: "fastapi";
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUserRole(value: unknown): value is UserRoleEnum {
  return value === "admin" || value === "staff" || value === "customer";
}

function authHeaders(request: Request) {
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const csrfToken = request.headers.get("x-csrf-token");

  if (cookie) headers.set("Cookie", cookie);
  if (csrfToken) headers.set("X-CSRF-Token", csrfToken);

  return headers;
}

export function isFastApiAuthEnabled() {
  return process.env.FASTAPI_AUTH_ENABLED === "true";
}

export function hasFastApiAuthCookie(request: Request) {
  return (request.headers.get("cookie") ?? "")
    .split(";")
    .some((cookie) => /^(access_token|refresh_token)=/.test(cookie.trim()));
}

export function shouldUseFastApiAuth(request: Request) {
  return isFastApiAuthEnabled() && hasFastApiAuthCookie(request);
}

function mapFastApiUser(value: unknown): FastApiAuthUser {
  if (!isRecord(value) || !isRecord(value.role)) {
    throw new Error("Invalid FastAPI auth user");
  }

  const role = value.role.name;
  if (
    typeof value.id !== "string" ||
    typeof value.email !== "string" ||
    typeof value.is_active !== "boolean" ||
    typeof value.must_change_password !== "boolean" ||
    !isUserRole(role)
  ) {
    throw new Error("Invalid FastAPI auth user");
  }

  return {
    id: value.id,
    email: value.email,
    full_name:
      typeof value.full_name === "string" ? value.full_name : value.email,
    role,
    status: value.is_active ? "active" : "inactive",
    is_active: value.is_active,
    must_change_password: value.must_change_password,
    auth_provider: "fastapi",
  };
}

async function userFromResponse(response: Response) {
  const body: unknown = await response.json();
  if (!isRecord(body) || body.success !== true || !isRecord(body.data)) {
    throw new Error("Invalid FastAPI auth response");
  }

  return mapFastApiUser(body.data);
}

export async function fastApiLogin(
  request: Request,
  email: string,
  password: string,
) {
  const response = await post("/auth/login", {
    headers: authHeaders(request),
    json: { email, password },
  });
  return { response, user: await userFromResponse(response) };
}

export async function fastApiCurrentUser(request: Request) {
  const response = await get("/auth/me", { headers: authHeaders(request) });
  return { response, user: await userFromResponse(response) };
}

export async function fastApiRefresh(request: Request) {
  const response = await post("/auth/refresh", {
    headers: authHeaders(request),
  });
  return { response, user: await userFromResponse(response) };
}

export function fastApiLogout(request: Request) {
  return post("/auth/logout", { headers: authHeaders(request) });
}

export function fastApiChangePassword(
  request: Request,
  currentPassword: string,
  newPassword: string,
) {
  return patch("/auth/change-password", {
    headers: authHeaders(request),
    json: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });
}

export function appendFastApiAuthCookies(
  upstream: Response,
  headers: Headers,
) {
  for (const cookie of upstream.headers.getSetCookie()) {
    const cookieName = cookie.slice(0, cookie.indexOf("=")).trim();
    const forwardedCookie =
      cookieName === "refresh_token"
        ? cookie.replace(/;\s*Path=\/auth(?=\s*;|$)/i, "; Path=/api/auth")
        : cookie;
    headers.append("Set-Cookie", forwardedCookie);
  }
}

export function fastApiAuthErrorStatus(error: unknown) {
  if (!(error instanceof FastApiHttpError)) return 502;
  if (error.status === 422) return 400;
  return error.status >= 500 ? 502 : error.status;
}
