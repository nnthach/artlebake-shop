import { NextRequest, NextResponse } from "next/server";
import {
  appendFastApiAuthCookies,
  fastApiAuthErrorStatus,
  fastApiLogout,
  shouldUseFastApiAuth,
} from "@/lib/fastapi/auth";

export async function POST(req: NextRequest) {
  try {
    if (shouldUseFastApiAuth(req)) {
      try {
        const response = await fastApiLogout(req);
        const result = NextResponse.json({ success: true }, { status: 200 });
        appendFastApiAuthCookies(response, result.headers);
        return result;
      } catch (error) {
        const status = fastApiAuthErrorStatus(error);
        if (status === 502) console.warn("FastAPI auth sign-out failed");
        return NextResponse.json(
          { success: false, error: "Logout failed." },
          { status },
        );
      }
    }

    const { createSupabaseServerClient } = await import("@/lib/supabase");
    const res = NextResponse.json(
      { success: true, message: "Logout successful!" },
      { status: 200 },
    );

    // session lưu ở cookie => xóa bằng server
    const supabase = createSupabaseServerClient(req, res);
    await supabase.auth.signOut();

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: res.headers, // copy headers để xóa cookie
      },
    );
  } catch (error) {
    console.error("fail to logout err", error);
    return NextResponse.json(
      { success: false, error: "Logout failed" },
      { status: 500 },
    );
  }
}
