import { supabaseAdmin } from "@/lib/supabase";
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
