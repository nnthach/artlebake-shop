import { OrderEnum } from "@/enums/order-status.enum";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Order id is required",
        },
        { status: 400 },
      );
    }

    // Check order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, status, cancelled_at")
      .eq("id", id)
      .single();

    if (orderError) {
      console.error("Get order before cancel error:", orderError);

      return NextResponse.json(
        {
          success: false,
          error: orderError.message,
        },
        { status: 500 },
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 },
      );
    }

    // Không cho cancelled lại
    if (order.status === OrderEnum.Cancelled) {
      return NextResponse.json(
        {
          success: false,
          error: "Order has already been cancelled",
        },
        { status: 400 },
      );
    }

    const cancelledAt = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({
        status: OrderEnum.Cancelled,
        cancelled_at: cancelledAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Update order cancelled error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order marked as cancelled",
      data,
    });
  } catch (error) {
    console.error("Update order cancelled error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
