import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { orderCode } = await req.json();

    if (!orderCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Order code is required",
        },
        { status: 400 },
      );
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, order_code, status, payment_status")
      .eq("order_code", String(orderCode))
      .maybeSingle();

    if (orderError) throw orderError;

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 },
      );
    }

    // Đã thanh toán thì không được cancel
    if (order.payment_status === "paid") {
      return NextResponse.json({
        success: true,
        message: "Order has already been paid",
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "cancelled",
        payment_status: "failed",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("payment_status", "unpaid");

    if (updateError) throw updateError;

    await supabaseAdmin
      .from("payments")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", order.id)
      .neq("status", "paid");

    return NextResponse.json({
      success: true,
      message: "Order cancelled",
    });
  } catch (error) {
    console.error("Cancel payment error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
