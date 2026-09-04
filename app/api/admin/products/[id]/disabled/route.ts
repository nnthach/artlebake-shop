import { deleteCacheByResource } from "@/lib/redis-cache";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check database configuration
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
        },
        { status: 500 },
      );
    }

    // Get product id
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Id is required",
        },
        { status: 400 },
      );
    }

    // Disable product
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .update({
        is_active: false,
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    // Product not found
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 },
      );
    }

    // Invalidate product-related caches
    await Promise.all([
      deleteCacheByResource("products"),
      deleteCacheByResource("products-menu"),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Product disabled successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Disable product error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to disable product",
      },
      { status: 500 },
    );
  }
}
