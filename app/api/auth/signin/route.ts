import { NextRequest, NextResponse } from "next/server";
import {
  appendFastApiAuthCookies,
  fastApiAuthErrorStatus,
  fastApiLogin,
  isFastApiAuthEnabled,
} from "@/lib/fastapi/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 },
      );
    }

    if (isFastApiAuthEnabled()) {
      try {
        const { response, user } = await fastApiLogin(req, email, password);
        const result = NextResponse.json(
          { success: true, data: { user } },
          { status: response.status },
        );
        appendFastApiAuthCookies(response, result.headers);
        return result;
      } catch (error) {
        const status = fastApiAuthErrorStatus(error);
        if (status === 502) console.warn("FastAPI auth sign-in failed");
        return NextResponse.json(
          {
            success: false,
            error:
              status === 401
                ? "Invalid email or password."
                : status === 403
                  ? "Account is disabled."
                  : "Sign-in failed.",
          },
          { status },
        );
      }
    }

    const {
      createSupabaseServerClient,
      isSupabaseConfigured,
      supabaseAdmin,
    } = await import("@/lib/supabase");

    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    const res = new NextResponse(null);
    const supabase = createSupabaseServerClient(req, res);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
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
      .eq("id", data.user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: "User profile not found." },
        { status: 404 },
      );
    }

    if (userProfile?.status === "banned") {
      return NextResponse.json(
        { success: false, error: "Account is banned." },
        { status: 403 },
      );
    }
    if (userProfile?.status === "inactive") {
      return NextResponse.json(
        { success: false, error: "Account is not activated yet." },
        { status: 403 },
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
      {
        status: 200,
        headers: res.headers,
      },
    );
  } catch (error) {
    console.error("Error signing in:", error);
    return NextResponse.json(
      { success: false, error: "Failed to sign in." },
      { status: 500 },
    );
  }
}
