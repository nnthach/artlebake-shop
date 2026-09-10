import { createSupabaseServerClient, supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const { currentPassword, newPassword } = await req.json();

    // 1. Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Current password and new password are required.",
        },
        { status: 400 },
      );
    }

    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid password format.",
        },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "New password must be at least 6 characters.",
        },
        { status: 400 },
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "New password must be different from current password.",
        },
        { status: 400 },
      );
    }

    // 2. Get current user from session
    const res = new NextResponse(null);
    const supabase = createSupabaseServerClient(req, res);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    // 3. Check admin role
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (
      adminError ||
      !adminUser ||
      adminUser.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden.",
        },
        { status: 403 },
      );
    }

    // 4. Verify current password
    if (!user.email) {
      return NextResponse.json(
        {
          success: false,
          error: "User email not found.",
        },
        { status: 400 },
      );
    }

    const { error: passwordError } =
      await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

    if (passwordError) {
      return NextResponse.json(
        {
          success: false,
          error: "Current password is incorrect.",
        },
        { status: 400 },
      );
    }

    // 5. Update password
    const { error: updateError } =
      await supabase.auth.updateUser({
        password: newPassword,
      });

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Password changed successfully.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error changing admin password:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to change password.",
      },
      { status: 500 },
    );
  }
}