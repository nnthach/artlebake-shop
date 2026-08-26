import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
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

    const { data, error } = await supabaseAdmin
      .from("staffs")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Disable staff error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to disable" },
      { status: 500 },
    );
  }
}
