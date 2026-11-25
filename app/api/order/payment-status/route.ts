import { NextRequest, NextResponse } from "next/server";
import {
  getFastApiCheckoutErrorStatus,
  getCheckoutPaymentStatus,
  isFastApiCheckoutEnabled,
} from "@/lib/fastapi/checkout";
import { FastApiHttpError } from "@/lib/fastapi/http-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(req: NextRequest) {
  try {
    const orderCode = req.nextUrl.searchParams.get("orderCode");

    if (isFastApiCheckoutEnabled()) {
      if (!orderCode) {
        return NextResponse.json(
          { success: false, error: "orderCode is required" },
          { status: 400 },
        );
      }

      try {
        const data = await getCheckoutPaymentStatus(orderCode);
        return NextResponse.json({ success: true, data }, { status: 200 });
      } catch (error) {
        if (!(error instanceof FastApiHttpError)) {
          console.warn("FastAPI payment status request failed");
        }
        const status = getFastApiCheckoutErrorStatus(error);
        return NextResponse.json(
          { success: false, error: status === 404 ? "Order not found" : "Failed to get payment status" },
          { status },
        );
      }
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
        },
        {
          status: 500,
        },
      );
    }

    if (!orderCode) {
      return NextResponse.json(
        {
          success: false,
          error: "orderCode is required",
        },
        {
          status: 400,
        },
      );
    }

    const { supabaseAdmin } = await import("@/lib/supabase");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, payment_status")
      .eq("order_code", orderCode)
      .single();

    if (error || !order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          order_id: order.id,
          status: order.payment_status,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Check payment status error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}
