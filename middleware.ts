import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (process.env.FASTAPI_ADMIN_ENABLED !== "true") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const destination = request.nextUrl.clone();
  const adminPrefix = "/api/admin/";

  if (pathname.startsWith(adminPrefix)) {
    destination.pathname = `/api/fastapi-admin/${pathname.slice(adminPrefix.length)}`;
  } else if (pathname === "/api/upload") {
    destination.pathname = "/api/fastapi-admin/uploads/images";
  } else {
    return NextResponse.next();
  }

  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: ["/api/admin/:path*", "/api/upload"],
};
