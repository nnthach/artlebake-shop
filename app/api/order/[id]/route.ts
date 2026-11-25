import {
  getFastApiCheckoutErrorStatus,
  getPaidCheckoutOrder,
  isFastApiCheckoutEnabled,
} from "@/lib/fastapi/checkout";
import { FastApiHttpError } from "@/lib/fastapi/http-client";
import { NextRequest, NextResponse } from "next/server";

// get order detail by id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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

    if (isFastApiCheckoutEnabled()) {
      try {
        const order = await getPaidCheckoutOrder(id);
        return NextResponse.json(
          { success: true, data: order },
          { status: 200 },
        );
      } catch (error) {
        if (!(error instanceof FastApiHttpError)) {
          console.warn("FastAPI paid order request failed");
        }
        const status = getFastApiCheckoutErrorStatus(error);
        return NextResponse.json(
          {
            success: false,
            error: status === 404 ? "Order not found" : "Failed to fetch order",
          },
          { status },
        );
      }
    }

    const { supabaseAdmin } = await import("@/lib/supabase");
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(
        `
          *,
          order_items(
            id,
            product_id,
            product_name,
            unit_price,
            quantity,
            subtotal,
            created_at,
            products(
              image_url
            )
          ),
          preorder_schedules(
            id,
            date,
            status
          )
        `,
      )
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order detail error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
