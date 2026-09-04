import { deleteCacheByResource } from "@/lib/redis-cache";
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

    const { data: category, error } = await supabaseAdmin
      .from("categories")
      .update({ is_active: false })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    await deleteCacheByResource("categories");

    return NextResponse.json(
      { success: true, message: "Category disabled successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Disable category error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to disable category" },
      { status: 500 },
    );
  }
}
