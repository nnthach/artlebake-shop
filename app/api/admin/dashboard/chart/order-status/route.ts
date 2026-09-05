import { supabaseAdmin } from "@/lib/supabase";
import { getMonthDateRange } from "@/utils/logic-get";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { currentStart, currentEnd } = getMonthDateRange();

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("status")
      .gte("created_at", currentStart)
      .lt("created_at", currentEnd);

    if (error) {
      throw error;
    }

    const statusCount = {
      confirmed: 0,
      delivered: 0,
      pending: 0,
      cancelled: 0,
    };

    for (const order of orders ?? []) {
      if (order.status in statusCount) {
        statusCount[order.status as keyof typeof statusCount]++;
      }
    }

    return NextResponse.json({
      success: true,
      data: [
        {
          status: "confirmed",
          count: statusCount.confirmed,
        },
        {
          status: "delivered",
          count: statusCount.delivered,
        },
        {
          status: "pending",
          count: statusCount.pending,
        },
        {
          status: "cancelled",
          count: statusCount.cancelled,
        },
      ],
    });
  } catch (error) {
    console.error("Get order status chart error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch order status statistics",
      },
      { status: 500 },
    );
  }
}
