import { OrderEnum } from "@/enums/order-status.enum";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { getMonthDateRange } from "@/utils/logic-get";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    // 1. get previous month range and current month range
    const {
      year,
      month,
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
    } = getMonthDateRange();

    // 2. Helper function calculate % growth
    const calculateGrowth = (
      current: number,
      previous: number,
    ): number | null => {
      if (previous === 0) return null;

      return Number((((current - previous) / previous) * 100).toFixed(2));
    };

    // =========================================================
    // 3. CURRENT MONTH
    // =========================================================

    // 3.1 Total orders current month
    const { count: totalOrders, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("payment_status", "paid")
      .gte("created_at", currentStart)
      .lt("created_at", currentEnd);

    if (orderError) throw orderError;

    // 3.2 Revenue current month
    const { data: revenueOrders, error: revenueError } = await supabaseAdmin
      .from("orders")
      .select("id, created_at, total, payment_status")
      .eq("payment_status", "paid")
      .gte("created_at", currentStart)
      .lt("created_at", currentEnd);

    console.log("STAT CARD RANGE", {
      currentStart,
      currentEnd,
    });

    console.log("STAT CARD ORDERS", revenueOrders);
    if (revenueError) throw revenueError;

    const totalRevenue = (revenueOrders ?? []).reduce(
      (sum, order) => sum + Number(order.total || 0),
      0,
    );

    // 3.2 Products sold current month
    const { data: orderItems, error: orderItemsError } = await supabaseAdmin
      .from("order_items")
      .select(
        `
            quantity,
            order:orders!inner (
              payment_status,
              created_at
            )
          `,
      )
      .eq("order.payment_status", "paid")
      .gte("order.created_at", currentStart)
      .lt("order.created_at", currentEnd);

    if (orderItemsError) throw orderItemsError;

    const totalProductsSold = (orderItems ?? []).reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );

    // =========================================================
    // 4. PREVIOUS MONTH
    // =========================================================

    // 4.1 Previous month orders
    const { count: previousTotalOrders, error: previousOrderError } =
      await supabaseAdmin
        .from("orders")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("payment_status", "paid")
        .gte("created_at", previousStart)
        .lt("created_at", previousEnd);

    if (previousOrderError) throw previousOrderError;

    // 4.2 Previous month revenue
    const { data: previousRevenueOrders, error: previousRevenueError } =
      await supabaseAdmin
        .from("orders")
        .select("total")
        .eq("payment_status", "paid")
        .gte("created_at", previousStart)
        .lt("created_at", previousEnd);

    if (previousRevenueError) throw previousRevenueError;

    const previousTotalRevenue = (previousRevenueOrders ?? []).reduce(
      (sum, order) => sum + Number(order.total || 0),
      0,
    );

    // 4.3 Previous month products sold
    const { data: previousOrderItems, error: previousOrderItemsError } =
      await supabaseAdmin
        .from("order_items")
        .select(
          `
          quantity,
          order:orders!inner (
            payment_status,
            created_at
          )
        `,
        )
        .eq("order.payment_status", "paid")
        .gte("order.created_at", previousStart)
        .lt("order.created_at", previousEnd);

    if (previousOrderItemsError) throw previousOrderItemsError;

    const previousTotalProductsSold = (previousOrderItems ?? []).reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );

    // =========================================================
    // 5. GROWTH
    // =========================================================

    const ordersGrowth = calculateGrowth(
      totalOrders ?? 0,
      previousTotalOrders ?? 0,
    );

    const revenueGrowth = calculateGrowth(totalRevenue, previousTotalRevenue);

    const productsSoldGrowth = calculateGrowth(
      totalProductsSold,
      previousTotalProductsSold,
    );

    const { count: unshippedOrder, error: unshippedOrderError } =
      await supabaseAdmin
        .from("orders")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("status", OrderEnum.Confirmed);

    if (unshippedOrderError) throw unshippedOrderError;

    return NextResponse.json(
      {
        success: true,
        data: {
          total_orders: totalOrders ?? 0,
          total_revenue: totalRevenue,
          total_products_sold: totalProductsSold,
          unshipped_orders: unshippedOrder ?? 0,

          growth: {
            total_orders: ordersGrowth,
            total_revenue: revenueGrowth,
            total_products_sold: productsSoldGrowth,
          },

          month: `${year}-${String(month).padStart(2, "0")}`,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fetch dashboard stats error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
