import { payosConfig } from "@/lib/payos";
import { supabaseAdmin } from "@/lib/supabase";
import { generateOrderCode } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

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

    // 2. Check order availability product
    const productIds = items.map((item) => item.product_id);

    if (order_type === "available") {
      // ================================
      // 2.1 AVAILABLE ORDER
      // ================================

      const businessDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(new Date());

      const { data: inventories, error: inventoryError } = await supabaseAdmin
        .from("daily_inventories")
        .select(
          `
      product_id,
      remaining_quantity,
      status
    `,
        )
        .eq("business_date", businessDate)
        .in("product_id", productIds);

      if (inventoryError) {
        throw inventoryError;
      }

      for (const item of items) {
        const inventory = inventories?.find(
          (inv) => inv.product_id === item.product_id,
        );
        if (!inventory) {
          return NextResponse.json(
            {
              success: false,
              error: "Product is not available today",
              product_id: item.product_id,
            },
            {
              status: 400,
              headers: res.headers,
            },
          );
        }
        if (inventory.remaining_quantity < item.quantity) {
          return NextResponse.json(
            {
              success: false,
              error: "Insufficient stock",
              product_id: item.product_id,
              available_quantity: inventory.remaining_quantity,
              requested_quantity: item.quantity,
            },
            {
              status: 400,
              headers: res.headers,
            },
          );
        }
      }
    } else {
      // ================================
      // 2.2 PREORDER
      // ================================

      // 2.2.1 Check preorder schedule
      const { data: schedule, error: scheduleError } = await supabaseAdmin
        .from("preorder_schedules")
        .select("id, date, status")
        .eq("id", preorder_date_id)
        .single();

      if (scheduleError || !schedule) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid preorder date",
          },
          {
            status: 400,
            headers: res.headers,
          },
        );
      }

      // 2.2.2 Schedule phải đang active
      if (schedule.status !== true) {
        return NextResponse.json(
          {
            success: false,
            error: "Preorder date is not available",
          },
          {
            status: 400,
            headers: res.headers,
          },
        );
      }

      // 2.2.3 Check preorder items
      const { data: preorderItems, error: preorderItemsError } =
        await supabaseAdmin
          .from("preorder_items")
          .select(
            `
        product_id,
        schedule_id,
        remaining_quantity
      `,
          )
          .eq("schedule_id", preorder_date_id)
          .in("product_id", productIds);

      if (preorderItemsError) {
        throw preorderItemsError;
      }

      // 2.2.4 Every product in cart must exist in the selected preorder schedule
      for (const item of items) {
        const preorderItem = preorderItems?.find(
          (preorderItem) => preorderItem.product_id === item.product_id,
        );

        if (!preorderItem) {
          return NextResponse.json(
            {
              success: false,
              error: "Product is not available for this preorder date",
              product_id: item.product_id,
              preorder_date_id,
            },
            {
              status: 400,
              headers: res.headers,
            },
          );
        }

        // Không đủ quantity
        if (preorderItem.remaining_quantity < item.quantity) {
          return NextResponse.json(
            {
              success: false,
              error: "Insufficient preorder quantity",
              product_id: item.product_id,
              available_quantity: preorderItem.remaining_quantity,
              requested_quantity: item.quantity,
              preorder_date_id,
            },
            {
              status: 400,
              headers: res.headers,
            },
          );
        }
      }
    }

    // 3. INSERT DB ORDER
    const orderCode = generateOrderCode();

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_code: orderCode,
        status: "pending",
        payment_status: "unpaid",
        order_type,
        fulfillment_method,
        preorder_date_id: order_type === "preorder" ? preorder_date_id : null,

        name,
        phone,
        email,

        address: fulfillment_method === "delivery" ? address : null,
        city: fulfillment_method === "delivery" ? city : null,
        district: fulfillment_method === "delivery" ? district : null,
        ward: fulfillment_method === "delivery" ? ward : null,

        note: note || null,

        subtotal,
        shipping_fee,
        total,

        payment_method,
      })
      .select("id, order_code")
      .single();

    if (orderError) throw orderError;

    // 4. Create order items
    const { error: orderItemsError } = await supabaseAdmin
      .from("order_items")
      .insert(
        items.map(
          (item: {
            product_id: string;
            product_name: string;
            unit_price: number;
            quantity: number;
            subtotal: number;
          }) => ({
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.product_name,
            unit_price: item.unit_price,
            quantity: item.quantity,
            subtotal: item.subtotal,
          }),
        ),
      );

    if (orderItemsError) throw orderItemsError;

    // 5. INSERT payment table
    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        order_id: order.id,
        method: payment_method,
        amount: total,
      });
    if (paymentError) throw paymentError;

    // 6. CREATE DB Payment PAYLOAD
    const paymentData = {
      orderCode: Number(orderCode),
      amount: total,
      description: "#" + orderCode,
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

    // 7. Create payos link
    const paymentLink = await payosConfig.paymentRequests.create(paymentData);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: order.id,
          payment_link: paymentLink.checkoutUrl,
        },
      },
      { status: 201, headers: res.headers },
    );
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers: res.headers },
    );
  }
}
