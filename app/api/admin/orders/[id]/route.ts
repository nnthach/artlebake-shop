import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
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

    const locale = req.nextUrl.searchParams.get("locale") ?? "vi";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Id is required",
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
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
            id,
            image_url,
            is_active,

            product_translations(
              locale,
              name
            )
          )
        ),

        payments(
          id,
          transaction_id,
          amount,
          status,
          created_at,
          updated_at
        ),

        preorder_schedules(
          id,
          date,
          status
        )
      `,
      )
      .eq("id", id)
      .eq("order_items.products.product_translations.locale", locale)
      .single();

    if (error) {
      console.error("Get admin order detail error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 },
      );
    }

    const normalizedData = {
      ...data,

      // payments chỉ lấy payment đầu tiên
      payments: Array.isArray(data.payments)
        ? (data.payments[0] ?? null)
        : (data.payments ?? null),

      // preorder schedule chỉ có khi order_type = preorder
      preorder_schedule: Array.isArray(data.preorder_schedules)
        ? (data.preorder_schedules[0] ?? null)
        : (data.preorder_schedules ?? null),
    };

    delete normalizedData.preorder_schedules;

    return NextResponse.json({
      success: true,
      data: normalizedData,
    });
  } catch (error) {
    console.error("Get admin order detail error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
