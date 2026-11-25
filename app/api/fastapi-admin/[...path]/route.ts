import { proxyFastApiAdminRequest } from "@/lib/fastapi/admin";

type RouteContext = {
  params: { path: string[] };
};

function proxy(request: Request, { params }: RouteContext) {
  return proxyFastApiAdminRequest(request, params.path);
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
