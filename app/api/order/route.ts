import {
  createCheckoutOrder,
  getFastApiCheckoutErrorStatus,
  isFastApiCheckoutEnabled,
  type CheckoutCreateInput,
} from "@/lib/fastapi/checkout";
import { FastApiHttpError } from "@/lib/fastapi/http-client";
import { NextRequest, NextResponse } from "next/server";

const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getFastApiCheckoutItems(
  value: unknown,
): CheckoutCreateInput["items"] | null {
  if (!Array.isArray(value)) return null;

  const items: CheckoutCreateInput["items"] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.product_id !== "string" ||
      typeof item.quantity !== "number"
    ) {
      return null;
    }
    items.push({ product_id: item.product_id, quantity: item.quantity });
  }
  return items;
}

// create order
export async function POST(req: NextRequest) {
  const res = new NextResponse();

  try {
    // 1. Check body req
    const body = await req.json();
    const {
      name,
      phone,
      email,
      address,
      note,
      city,
      district,
      ward,
      subtotal,
      shipping_fee,
      total,
      preorder_date_id,
      order_type,
      fulfillment_method,
      items,
      payment_method,
    } = body;

    // 1.1 check user info
    if (!name || !phone || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required customer information",
        },
        { status: 400, headers: res.headers },
      );
    }

    // 1.2 check delivery info
    if (
      fulfillment_method === "delivery" &&
      (!address || !city || !district || !ward)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required delivery information",
        },
        { status: 400, headers: res.headers },
      );
    }

    // 1.3. Check payment method
    if (payment_method !== "payos") {
      return NextResponse.json(
        { success: false, error: "Invalid payment method" },
        { status: 400, headers: res.headers },
      );
    }

    // 1.4 check order items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order must have at least one item" },
        { status: 400, headers: res.headers },
      );
    }

    // 1.5 check fulfillment method
    if (fulfillment_method !== "delivery" && fulfillment_method !== "pickup") {
      return NextResponse.json(
        { success: false, error: "Invalid fulfillment method" },
        { status: 400, headers: res.headers },
      );
    }

    // 1.6 check order type
    if (order_type !== "available" && order_type !== "preorder") {
      return NextResponse.json(
        { success: false, error: "Invalid order type" },
        { status: 400, headers: res.headers },
      );
    }

    if (order_type === "preorder" && !preorder_date_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Preorder date is required",
        },
        { status: 400, headers: res.headers },
      );
    }

    if (order_type === "available" && preorder_date_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Available order cannot have preorder date",
        },
        { status: 400, headers: res.headers },
      );
    }
    // end 1.6 check order type

    if (isFastApiCheckoutEnabled()) {
      const checkoutItems = getFastApiCheckoutItems(items);
      if (!checkoutItems) {
        return NextResponse.json(
          { success: false, error: "Invalid order items" },
          { status: 400, headers: res.headers },
        );
      }

      try {
        const order = await createCheckoutOrder({
          name,
          phone,
          email,
          address,
          note,
          city,
          district,
          ward,
          preorder_date_id,
          order_type,
          fulfillment_method,
          payment_method,
          locale: body.locale === "en" ? "en" : "vi",
          items: checkoutItems,
        });

        return NextResponse.json(
          {
            success: true,
            data: {
              id: order.id,
              order_code: order.order_code,
              payment_link: order.payment_link,
            },
          },
          { status: 201, headers: res.headers },
        );
      } catch (error) {
        if (!(error instanceof FastApiHttpError)) {
          console.warn("FastAPI checkout creation failed");
        }
        const status = getFastApiCheckoutErrorStatus(error);
        return NextResponse.json(
          { success: false, error: "Failed to create order" },
          { status, headers: res.headers },
        );
      }
    }

    // 2. Create order + lock stock atomically
    const [
      { OrderQueueEnum },
      { payosConfig },
      { orderQueue },
      { supabaseAdmin },
      { generateOrderCode, getBusinessDate },
    ] = await Promise.all([
      import("@/enums/order-queue.enum"),
      import("@/lib/payos"),
      import("@/lib/queues/order.queue"),
      import("@/lib/supabase"),
      import("@/utils/logic-get"),
    ]);
    const orderCode = generateOrderCode();

    const businessDate = getBusinessDate();

    const { data: result, error: orderError } = await supabaseAdmin.rpc(
      "create_order_with_stock_lock",
      {
        p_order_code: String(orderCode),
        p_order_type: order_type,
        p_preorder_date_id: order_type === "preorder" ? preorder_date_id : null,
        p_fulfillment_method: fulfillment_method,
        p_name: name,
        p_phone: phone,
        p_email: email,
        p_address: fulfillment_method === "delivery" ? address : null,
        p_city: fulfillment_method === "delivery" ? city : null,
        p_district: fulfillment_method === "delivery" ? district : null,
        p_ward: fulfillment_method === "delivery" ? ward : null,
        p_note: note || null,
        p_subtotal: subtotal,
        p_shipping_fee: shipping_fee,
        p_total: total,
        p_payment_method: payment_method,
        p_items: items,
        p_business_date: order_type === "available" ? businessDate : null,
      },
    );

    if (orderError) {
      console.error("Create order error:", orderError);
      return NextResponse.json(
        {
          success: false,
          error: orderError.message,
        },
        {
          status: 400,
          headers: res.headers,
        },
      );
    }

    const order = result.order;

    // 3. CREATE PAYOS PAYMENT PAYLOAD
    const paymentData = {
      orderCode: Number(order.order_code),
      amount: total,
      description: "#" + order.order_code,
      items: items.map(
        (item: {
          product_name: string;
          quantity: number;
          unit_price: number;
        }) => ({
          name: item.product_name,
          quantity: item.quantity,
          price: item.unit_price,
        }),
      ),
      cancelUrl: `${appUrl}/payment`,
      returnUrl: `${appUrl}/payment`,
      expiredAt: Math.floor(Date.now() / 1000) + 5 * 60,
    };

    // 4. CREATE PAYOS LINK
    const paymentLink = await payosConfig.paymentRequests.create(paymentData);

    // 5. CANCEL ORDER AFTER 5 MINUTE
    await orderQueue.add(
      OrderQueueEnum.CancelExpirePaymentOrder,
      {
        orderId: order.id,
      },
      {
        delay: 5 * 60 * 1000, // 5 phút
        jobId: `cancel-order-${order.id}`,
      },
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: order.id,
          payment_link: paymentLink.checkoutUrl,
        },
      },
      {
        status: 201,
        headers: res.headers,
      },
    );
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers: res.headers },
    );
  }
}
