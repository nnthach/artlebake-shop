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
    // 2. Close today's schedule
    // ----------------------------------------
    const { data: schedules, error } = await supabaseAdmin
      .from("preorder_schedules")
      .update({
        status: false,
        updated_at: new Date().toISOString(),
      })
      .eq("date", businessDate)
      .eq("status", true)
      .select("id, date, status");

    if (error) {
      throw error;
    }

    const scheduleIds = (schedules ?? []).map((s) => s.id);

    // 3. Disable preorder_item in today
    let updatedItemsCount = 0;

    if (scheduleIds.length > 0) {
      const { data: items, error: itemError } = await supabaseAdmin
        .from("preorder_items")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .in("schedule_id", scheduleIds)
        .eq("is_active", true)
        .select("id, schedule_id, is_active");

      if (itemError) {
        throw itemError;
      }

      updatedItemsCount = items?.length ?? 0;
    }

    // ----------------------------------------
    // 4. Response
    // ----------------------------------------
    return NextResponse.json(
      {
        success: true,
        message: "Daily inventories closed successfully",
        business_date: businessDate,
        updated_schedules_count: schedules?.length ?? 0,
        updated_items_count: updatedItemsCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Close preorder error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
