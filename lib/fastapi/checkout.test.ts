import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { POST as createOrder } from "../../app/api/order/route";

test("checkout proxy sends only server-owned checkout fields and preserves order_code", async () => {
  const previousBaseUrl = process.env.FASTAPI_BASE_URL;
  const previousCheckoutEnabled = process.env.FASTAPI_CHECKOUT_ENABLED;
  const originalFetch = globalThis.fetch;
  let upstreamBody: Record<string, unknown> | undefined;

  process.env.FASTAPI_BASE_URL = "http://127.0.0.1:8000";
  process.env.FASTAPI_CHECKOUT_ENABLED = "true";
  globalThis.fetch = async (_input, init) => {
    upstreamBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return Response.json({
      success: true,
      message: "Order created",
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        order_code: "1763370000000123",
        payment_link: "https://pay.example.test/checkout",
      },
    });
  };

  try {
    const request = new NextRequest("http://localhost/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Synthetic Customer",
        phone: "0901234567",
        email: "customer@example.test",
        address: "",
        note: "",
        city: "",
        district: "",
        ward: "",
        subtotal: 130000,
        shipping_fee: 0,
        total: 130000,
        preorder_date_id: null,
        order_type: "available",
        fulfillment_method: "pickup",
        payment_method: "payos",
        locale: "en",
        items: [
          {
            product_id: "22222222-2222-4222-8222-222222222222",
            product_name: "Browser supplied name",
            unit_price: 1,
            quantity: 2,
            subtotal: 2,
          },
        ],
      }),
    });

    const response = await createOrder(request);
    assert.equal(response.status, 201);
    assert.deepEqual(upstreamBody, {
      name: "Synthetic Customer",
      phone: "0901234567",
      email: "customer@example.test",
      address: "",
      note: "",
      city: "",
      district: "",
      ward: "",
      preorder_date_id: null,
      order_type: "available",
      fulfillment_method: "pickup",
      payment_method: "payos",
      locale: "en",
      items: [
        {
          product_id: "22222222-2222-4222-8222-222222222222",
          quantity: 2,
        },
      ],
    });
    assert.deepEqual(await response.json(), {
      success: true,
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        order_code: "1763370000000123",
        payment_link: "https://pay.example.test/checkout",
      },
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (previousBaseUrl === undefined) {
      delete process.env.FASTAPI_BASE_URL;
    } else {
      process.env.FASTAPI_BASE_URL = previousBaseUrl;
    }
    if (previousCheckoutEnabled === undefined) {
      delete process.env.FASTAPI_CHECKOUT_ENABLED;
    } else {
      process.env.FASTAPI_CHECKOUT_ENABLED = previousCheckoutEnabled;
    }
  }
});
