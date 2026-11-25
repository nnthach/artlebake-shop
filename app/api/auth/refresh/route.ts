import {
  appendFastApiAuthCookies,
  fastApiAuthErrorStatus,
  fastApiRefresh,
  isFastApiAuthEnabled,
} from "@/lib/fastapi/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!isFastApiAuthEnabled()) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const { response, user } = await fastApiRefresh(request);
    const result = NextResponse.json(
      { success: true, data: { user } },
      { status: response.status },
    );
    appendFastApiAuthCookies(response, result.headers);
    return result;
  } catch (error) {
    const status = fastApiAuthErrorStatus(error);
    if (status === 502) console.warn("FastAPI auth refresh failed");
    return NextResponse.json(
      {
        success: false,
        error: status === 403 ? "Invalid CSRF token." : "Unauthorized",
      },
      { status },
    );
  }
}
