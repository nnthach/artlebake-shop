import {
  appendFastApiAuthCookies,
  fastApiAuthErrorStatus,
  fastApiChangePassword,
  shouldUseFastApiAuth,
} from "@/lib/fastapi/auth";
import { NextRequest, NextResponse } from "next/server";

function isPasswordPayload(
  value: unknown,
): value is { currentPassword: string; newPassword: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof Reflect.get(value, "currentPassword") === "string" &&
    typeof Reflect.get(value, "newPassword") === "string"
  );
}

export async function PATCH(request: NextRequest) {
  if (!shouldUseFastApiAuth(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body: unknown = await request.json();
    if (!isPasswordPayload(body)) {
      return NextResponse.json(
        { success: false, error: "Current and new passwords are required." },
        { status: 400 },
      );
    }

    const response = await fastApiChangePassword(
      request,
      body.currentPassword,
      body.newPassword,
    );
    const result = NextResponse.json(
      {
        success: true,
        data: { auth_provider: "fastapi" },
      },
      { status: response.status },
    );
    appendFastApiAuthCookies(response, result.headers);
    return result;
  } catch (error) {
    const status = fastApiAuthErrorStatus(error);
    if (status === 502) console.warn("FastAPI auth password change failed");
    return NextResponse.json(
      {
        success: false,
        error:
          status === 400
            ? "Current password is incorrect or the new password is unchanged."
            : status === 403
              ? "Invalid CSRF token or disabled account."
              : status === 401
                ? "Unauthorized"
                : "Failed to change password.",
      },
      { status },
    );
  }
}
