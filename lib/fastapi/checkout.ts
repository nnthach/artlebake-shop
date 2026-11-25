import { get, post } from "./api";
import { FastApiHttpError, httpClient } from "./http-client";

type OrderType = "available" | "preorder";
type FulfillmentMethod = "delivery" | "pickup";
type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

export interface CheckoutCreateInput {
  name: string;
  phone: string;
  email: string;
  address: string;
  note: string;
  city: string;
  district: string;
  ward: string;
  preorder_date_id: string | null;
  order_type: OrderType;
  fulfillment_method: FulfillmentMethod;
  payment_method: "payos";
  locale: "vi" | "en";
  items: {
    product_id: string;
    quantity: number;
  }[];
}

export interface CheckoutCreatedOrder {
  id: string;
  order_code: string;
  payment_link: string;
}

export interface CheckoutOrderDetail {
  id: string;
  order_code: string;
  name: string;
  phone: string;
  email: string;
  address: null;
  city: null;
  district: null;
  ward: null;
  note: null;
  fulfillment_method: FulfillmentMethod;
  order_type: OrderType;
  subtotal: number;
  shipping_fee: number;
  total: number;
  created_at: string;
  order_items: {
    id: string;
    product_id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
    products?: { image_url: string[] };
  }[];
  preorder_schedules: { date: string } | null;
}

interface CheckoutOrderItemResponse {
  id: string;
  product_id: string;
  product_name: string;
  unit_price: unknown;
  quantity: number;
  subtotal: unknown;
  products?: { image_url: string[] } | null;
}

interface PaidCheckoutOrderResponse {
  id: string;
  order_code: string;
  name: string;
  phone: string;
  email: string;
  fulfillment_method: FulfillmentMethod;
  order_type: OrderType;
  subtotal: unknown;
  shipping_fee: unknown;
  total: unknown;
  created_at: string;
  order_items: CheckoutOrderItemResponse[];
  preorder_schedules: { date: string } | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCheckoutOrderItemResponse(
  value: unknown,
): value is CheckoutOrderItemResponse {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.product_id === "string" &&
    typeof value.product_name === "string" &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    (value.products === null ||
      value.products === undefined ||
      (isRecord(value.products) && isImageList(value.products.image_url)))
  );
}

function isPaidCheckoutOrderResponse(
  value: unknown,
): value is PaidCheckoutOrderResponse {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.order_code === "string" &&
    typeof value.name === "string" &&
    typeof value.phone === "string" &&
    typeof value.email === "string" &&
    (value.fulfillment_method === "delivery" ||
      value.fulfillment_method === "pickup") &&
    (value.order_type === "available" || value.order_type === "preorder") &&
    typeof value.created_at === "string" &&
    Array.isArray(value.order_items) &&
    value.order_items.every(isCheckoutOrderItemResponse) &&
    (value.preorder_schedules === null ||
      (isRecord(value.preorder_schedules) &&
        typeof value.preorder_schedules.date === "string"))
  );
}

export function isFastApiCheckoutEnabled() {
  return (
    process.env.FASTAPI_CHECKOUT_ENABLED === "true" &&
    httpClient.isConfigured()
  );
}

export function getFastApiCheckoutErrorStatus(error: unknown) {
  if (!(error instanceof FastApiHttpError)) return 502;
  if (error.status === 422) return 400;
  if ([400, 404, 409, 503].includes(error.status)) return error.status;
  return 502;
}

function getSuccessData(value: unknown, error: string): unknown {
  if (
    !isRecord(value) ||
    value.success !== true ||
    typeof value.message !== "string" ||
    !("data" in value)
  ) {
    throw new Error(error);
  }
  return value.data;
}

export async function createCheckoutOrder(
  input: CheckoutCreateInput,
): Promise<CheckoutCreatedOrder> {
  const request: CheckoutCreateInput = {
    name: input.name,
    phone: input.phone,
    email: input.email,
    fulfillment_method: input.fulfillment_method,
    address: input.address,
    city: input.city,
    district: input.district,
    ward: input.ward,
    note: input.note,
    order_type: input.order_type,
    preorder_date_id: input.preorder_date_id,
    payment_method: input.payment_method,
    locale: input.locale,
    items: input.items.map(({ product_id, quantity }) => ({
      product_id,
      quantity,
    })),
  };
  const response = await post("/checkout/orders", { json: request });
  const value: unknown = await response.json();
  const data = getSuccessData(value, "Invalid FastAPI checkout response");

  if (
    !isRecord(data) ||
    typeof data.id !== "string" ||
    typeof data.order_code !== "string" ||
    !isAbsoluteHttpsUrl(data.payment_link)
  ) {
    throw new Error("Invalid FastAPI checkout response");
  }

  return {
    id: data.id,
    order_code: data.order_code,
    payment_link: data.payment_link,
  };
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    value === "unpaid" ||
    value === "pending" ||
    value === "paid" ||
    value === "failed" ||
    value === "refunded"
  );
}

function parseCheckoutPaymentResponse(value: unknown) {
  const data = getSuccessData(value, "Invalid FastAPI payment response");

  if (
    !isRecord(data) ||
    typeof data.order_id !== "string" ||
    !isPaymentStatus(data.status)
  ) {
    throw new Error("Invalid FastAPI payment response");
  }

  return { order_id: data.order_id, status: data.status };
}

export async function getCheckoutPaymentStatus(orderCode: string) {
  const response = await get("/checkout/payment-status", {
    query: { order_code: orderCode },
  });
  const value: unknown = await response.json();
  return parseCheckoutPaymentResponse(value);
}

export async function cancelCheckoutPayment(orderCode: string) {
  const response = await post("/checkout/cancel-payment", {
    json: { order_code: orderCode },
  });
  const value: unknown = await response.json();
  return parseCheckoutPaymentResponse(value);
}

function isAbsoluteHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() !== value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.length > 0;
  } catch {
    return false;
  }
}

function parseVndAmount(value: unknown): number {
  if (typeof value !== "string" || !/^\d+(?:\.0+)?$/.test(value)) {
    throw new Error("Invalid FastAPI checkout order response");
  }
  const amount = Number(value);
  if (!Number.isSafeInteger(amount)) {
    throw new Error("Invalid FastAPI checkout order response");
  }
  return amount;
}

function isImageList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((image) => typeof image === "string");
}

export async function getPaidCheckoutOrder(orderId: string): Promise<CheckoutOrderDetail> {
  const response = await get(
    `/checkout/orders/${encodeURIComponent(orderId)}`,
  );
  const value: unknown = await response.json();
  const data = getSuccessData(value, "Invalid FastAPI checkout order response");

  if (!isPaidCheckoutOrderResponse(data)) {
    throw new Error("Invalid FastAPI checkout order response");
  }

  return {
    id: data.id,
    order_code: data.order_code,
    name: data.name,
    phone: data.phone,
    email: data.email,
    address: null,
    city: null,
    district: null,
    ward: null,
    note: null,
    fulfillment_method: data.fulfillment_method,
    order_type: data.order_type,
    subtotal: parseVndAmount(data.subtotal),
    shipping_fee: parseVndAmount(data.shipping_fee),
    total: parseVndAmount(data.total),
    created_at: data.created_at,
    order_items: data.order_items.map((item) => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      unit_price: parseVndAmount(item.unit_price),
      quantity: item.quantity,
      subtotal: parseVndAmount(item.subtotal),
      ...(isRecord(item.products) && isImageList(item.products.image_url)
        ? { products: { image_url: item.products.image_url } }
        : {}),
    })),
    preorder_schedules: data.preorder_schedules,
  };
}
