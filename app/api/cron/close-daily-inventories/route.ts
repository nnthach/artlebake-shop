import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { getBusinessDate } from "@/utils/logic-get";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
        },
        { status: 500 },
      );
    }

    // ----------------------------------------
    // 1. Get business date
    // ----------------------------------------
    const businessDate = getBusinessDate();

    // ----------------------------------------
    // 2. Close today's inventories
    // ----------------------------------------
    const { data, error } = await supabaseAdmin
      .from("daily_inventories")
      .update({
        status: "closed",
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("business_date", businessDate)
      .neq("status", "closed")
      .select("id, product_id, status, is_active");

    if (error) {
      throw error;
    }

    // ----------------------------------------
    // 3. Response
    // ----------------------------------------
    return NextResponse.json(
      {
        success: true,
        message: "Daily inventories closed successfully",
        business_date: businessDate,
        updated_count: data?.length ?? 0,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Close daily inventories error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
