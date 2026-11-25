import { NextRequest, NextResponse } from "next/server";
import {
  appendFastApiAuthCookies,
  fastApiAuthErrorStatus,
  fastApiCurrentUser,
  shouldUseFastApiAuth,
} from "@/lib/fastapi/auth";

export async function GET(req: NextRequest) {
  const res = new NextResponse();

  try {
    if (shouldUseFastApiAuth(req)) {
      try {
        const { response, user } = await fastApiCurrentUser(req);
        const result = NextResponse.json(
          { success: true, data: { user } },
          { status: response.status },
        );
        appendFastApiAuthCookies(response, result.headers);
        return result;
      } catch (error) {
        const status = fastApiAuthErrorStatus(error);
        if (status === 502) console.warn("FastAPI auth current-user request failed");
        return NextResponse.json(
          {
            success: false,
            error: status === 401 ? "Unauthorized" : "Failed to fetch user.",
          },
          { status },
        );
      }
    }

    const {
      createSupabaseServerClient,
      supabaseAdmin,
    } = await import("@/lib/supabase");
    const supabaseServerClient = createSupabaseServerClient(req, res);

    const {
      data: { user: authUser },
      error,
    } = await supabaseServerClient.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("users")
      .select(
        `
          id,
          role,
          status
        `,
      )
      .eq("id", authUser.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: "User profile not found." },
        { status: 404, headers: res.headers },
      );
    }

    if (userProfile.status === "banned" || userProfile.status === "inactive") {
      return NextResponse.json(
        { success: false, error: "Account is not active." },
        { status: 403, headers: res.headers },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: userProfile.id,
            role: userProfile.role,
            status: userProfile.status,
          },
        },
      },
      { headers: res.headers },
    );
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user." },
      { status: 500, headers: res.headers },
    );
  }
}
