import { NextRequest } from "next/server";
import { addDays, formatDateChart } from "./format-date";

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
    viewType: params.get("viewType") ?? "",
    year: Number(params.get("year")) ?? 0,
    month: Number(params.get("month")) ?? 0,
  };
}

export function generateOrderCode() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);

  return Number(`${timestamp}${random.toString().padStart(3, "0")}`);
}

interface WeekDateRange {
  startDate: string;
  endDate: string;
  weekDates: Date[];
}

export function getCurrentWeekDateRange(): WeekDateRange {
  const now = new Date();

  const vietnamDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(vietnamDate.find((p) => p.type === "year")?.value);

  const month = Number(vietnamDate.find((p) => p.type === "month")?.value);

  const day = Number(vietnamDate.find((p) => p.type === "day")?.value);

  const today = new Date(year, month - 1, day);

  // Monday = ngày đầu tuần
  // Sunday = 0, Monday = 1
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  const dates: Date[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }

  return {
    startDate: formatDateChart(dates[0]),
    endDate: formatDateChart(addDays(dates[6], 1)),
    weekDates: dates,
  };
}

// get current month range for chart filter
export interface MonthDateRange {
  year: number;
  month: number;

  startDate: string;
  endDate: string;

  previousYear: number;
  previousMonth: number;
  previousStartDate: string;
  previousEndDate: string;

  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
}

export function getMonthDateRange(): MonthDateRange {
  const now = new Date();

  const vietnamDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(now);

  const [year, month] = vietnamDate.split("-").map(Number);

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = new Date(year, month, 1);
  const endDate = `${nextMonth.getFullYear()}-${String(
    nextMonth.getMonth() + 1,
  ).padStart(2, "0")}-01`;

  const previousMonthDate = new Date(year, month - 2, 1);
  const previousYear = previousMonthDate.getFullYear();
  const previousMonth = previousMonthDate.getMonth() + 1;
  const previousStartDate = `${previousYear}-${String(previousMonth).padStart(
    2,
    "0",
  )}-01`;
  const previousEndDate = startDate;

  return {
    year,
    month,
    startDate,
    endDate,
    previousYear,
    previousMonth,
    previousStartDate,
    previousEndDate,
    currentStart: `${startDate}T00:00:00+07:00`,
    currentEnd: `${endDate}T00:00:00+07:00`,
    previousStart: `${previousStartDate}T00:00:00+07:00`,
    previousEnd: `${previousEndDate}T00:00:00+07:00`,
  };
}

