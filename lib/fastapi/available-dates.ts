import { get } from "./api";

interface AvailableDate {
  schedule_id: string;
  date: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function getAvailableDates(productIds: string[]) {
  const query = new URLSearchParams();
  for (const productId of Array.from(new Set(productIds.filter(Boolean)))) {
    query.append("product_ids", productId);
  }

  const response = await get("/store-front/available-dates", { query });
  const payload: unknown = await response.json();

  if (
    !isRecord(payload) ||
    payload.success !== true ||
    typeof payload.message !== "string" ||
    !Array.isArray(payload.data) ||
    !payload.data.every(
      (date): date is AvailableDate =>
        isRecord(date) &&
        typeof date.schedule_id === "string" &&
        typeof date.date === "string",
    )
  ) {
    throw new Error("Invalid FastAPI available dates response");
  }

  return payload.data;
}
