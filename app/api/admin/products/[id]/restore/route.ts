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

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .update({ is_active: true })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    await Promise.all([
      deleteCacheByResource("products"),
      deleteCacheByResource("products-menu"),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Product restored successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Restore product error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to restore product",
      },
      { status: 500 },
    );
  }
}
