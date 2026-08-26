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
      .from("stores")
      .update({ deleted_at: null, is_active: true })
      .eq("id", id)
      .not("deleted_at", "is", null)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Restore store error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to restore" },
      { status: 500 },
    );
  }
}
