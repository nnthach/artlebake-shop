import { NextRequest } from "next/server";

export function getPreorderDateRange() {
  const businessDate = getBusinessDate();
  const [year, month, day] = businessDate.split("-").map(Number);

  // Dùng UTC để xử lý calendar date, tránh phụ thuộc timezone của server
  const date = new Date(Date.UTC(year, month - 1, day));

  // Sunday = 0, Monday = 1, ..., Saturday = 6
  const dayOfWeek = date.getUTCDay();

  // Monday - Wednesday
  // → upcoming Friday is this week
  //
  // Thursday - Sunday
  // → upcoming Friday is next week
  const daysUntilFriday = dayOfWeek <= 3 ? 5 - dayOfWeek : 5 + (7 - dayOfWeek);

  const firstFriday = new Date(date);
  firstFriday.setUTCDate(firstFriday.getUTCDate() + daysUntilFriday);

  // Friday → Sunday of next week = 10 days inclusive
  const lastSunday = new Date(firstFriday);
  lastSunday.setUTCDate(lastSunday.getUTCDate() + 9);

  const formatDate = (value: Date) => value.toISOString().slice(0, 10);

  return {
    startDate: formatDate(firstFriday),
    endDate: formatDate(lastSunday),
  };
}

export const getToday = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
};

export const getBusinessDate = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
};

export function getSearchParams(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  return {
    is_active: params.get("is_active"),
    status: params.get("status"),
    is_bestseller: params.get("is_bestseller"),
    category_id: params.get("category_id"),
    store_id: params.get("store_id"),
    city: params.get("city"),
    district: params.get("district"),
    type: params.get("type"),
    sort_by: params.get("sort_by") ?? "created_at",
    order: params.get("order") ?? "desc",
    locale: params.get("locale") ?? "vi",
    page: params.get("page") ?? "1",
    limit: params.get("limit") ?? "10",
    search: params.get("search")?.trim() ?? "",
    date: params.get("date") ?? "",
    schedule_id: params.get("schedule_id") ?? "",
  };
}

export function generateOrderCode() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);

  return Number(`${timestamp}${random.toString().padStart(3, "0")}`);
}
