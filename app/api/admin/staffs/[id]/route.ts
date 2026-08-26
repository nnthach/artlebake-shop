import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Id is required" },
        { status: 400 },
      );
    }

    const { data: staff, error } = await supabaseAdmin
      .from("staffs")
      .select(
        `
        *,
        users(id, full_name, role, status),
        stores(id, name, city, district)
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 },
      );
    }

    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(staff.user_id);
    if (authError) throw authError;

    const formatted = {
      ...staff,
      email: authUser.user?.email ?? null,
    };

    return NextResponse.json(
      { success: true, data: formatted },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get staff detail error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Id is required" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { fullname, email, dob, gender, store_id } = body;

    if (!fullname || !email || !dob || !store_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Fullname, email, dob and store are required",
        },
        { status: 400 },
      );
    }

    const { data: staff, error: fetchError } = await supabaseAdmin
      .from("staffs")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 },
      );
    }

    // step 1: update email in supabase auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      staff.user_id,
      { email },
    );
    if (authError) throw authError;

    // step 2: update fullname in users table
    const { error: userError } = await supabaseAdmin
      .from("users")
      .update({ full_name: fullname })
      .eq("id", staff.user_id);
    if (userError) throw userError;

    // step 3: update staffs table
    const { data, error: staffError } = await supabaseAdmin
      .from("staffs")
      .update({ store_id, dob, gender })
      .eq("id", id)
      .select()
      .single();
    if (staffError) throw staffError;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Update staff error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Id is required" },
        { status: 400 },
      );
    }

    const { data: staff, error: fetchError } = await supabaseAdmin
      .from("staffs")
      .select("deleted_at, user_id")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 },
      );
    }

    if (!staff.deleted_at) {
      return NextResponse.json(
        {
          success: false,
          error: "Staff must be disabled before it can be deleted",
        },
        { status: 400 },
      );
    }

    const { error, count } = await supabaseAdmin
      .from("staffs")
      .delete({ count: "exact" })
      .eq("id", id);

    if (error) throw error;

    if (count === 0) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 },
      );
    }

    // cleanup linked user row and auth account
    await supabaseAdmin.from("users").delete().eq("id", staff.user_id);
    await supabaseAdmin.auth.admin.deleteUser(staff.user_id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete staff error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete" },
      { status: 500 },
    );
  }
}
