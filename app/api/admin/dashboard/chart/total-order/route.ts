import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { formatDateChart } from "@/utils/format-date";
import { getCurrentWeekDateRange, getSearchParams } from "@/utils/logic-get";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
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

    const { viewType, month, year } = getSearchParams(req);

    if (!["week", "month", "year"].includes(viewType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid viewType",
        },
        { status: 400 },
      );
    }

    if (!year) {
      return NextResponse.json(
        {
          success: false,
          error: "Year is required",
        },
        { status: 400 },
      );
    }

    if (viewType === "month" && (!month || month < 1 || month > 12)) {
      return NextResponse.json(
        {
          success: false,
          error: "Month is required for month view",
        },
        { status: 400 },
      );
    }

    // =========================================================
    // WEEK
    // 7 ngày của tuần hiện tại
    // =========================================================
    if (viewType === "week") {
      const { startDate, endDate, weekDates } = getCurrentWeekDateRange();

      const { data: orders, error } = await supabaseAdmin
        .from("orders")
        .select("created_at")
        .gte("created_at", `${startDate}T00:00:00+07:00`)
        .lt("created_at", `${endDate}T00:00:00+07:00`);

      if (error) throw error;

      const result = weekDates.map((date) => {
        const dateString = formatDateChart(date);

        const totalOrders =
          orders?.filter((order) => {
            return (
              formatDateChart(
                new Date(
                  new Date(order.created_at).toLocaleString("en-US", {
                    timeZone: "Asia/Ho_Chi_Minh",
                  }),
                ),
              ) === dateString
            );
          }).length ?? 0;

        return {
          dateLabel: formatLabel(date, "day"),
          totalOrders,
        };
      });

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // =========================================================
    // MONTH
    // Các ngày 1, 3, 5, 7...
    // =========================================================
    if (viewType === "month") {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      const start = formatDateChart(startDate);
      const end = formatDateChart(endDate);

      const { data: orders, error } = await supabaseAdmin
        .from("orders")
        .select("created_at")
        .gte("created_at", `${start}T00:00:00+07:00`)
        .lt("created_at", `${end}T00:00:00+07:00`);

      if (error) throw error;

      const daysInMonth = new Date(year, month, 0).getDate();

      const result = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);

        const currentDateString = formatDateChart(currentDate);

        const totalOrders =
          orders?.filter((order) => {
            const orderDate = new Date(
              new Date(order.created_at).toLocaleString("en-US", {
                timeZone: "Asia/Ho_Chi_Minh",
              }),
            );

            return formatDateChart(orderDate) === currentDateString;
          }).length ?? 0;

        result.push({
          dateLabel:
            String(day).padStart(2, "0") + "/" + String(month).padStart(2, "0"),
          totalOrders,
        });
      }

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // =========================================================
    // YEAR
    // 12 tháng
    // =========================================================
    if (viewType === "year") {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year + 1, 0, 1);

      const start = formatDateChart(startDate);
      const end = formatDateChart(endDate);

      const { data: orders, error } = await supabaseAdmin
        .from("orders")
        .select("created_at")
        .gte("created_at", `${start}T00:00:00+07:00`)
        .lt("created_at", `${end}T00:00:00+07:00`);

      if (error) throw error;

      const result = [];

      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const totalOrders =
          orders?.filter((order) => {
            const orderDate = new Date(
              new Date(order.created_at).toLocaleString("en-US", {
                timeZone: "Asia/Ho_Chi_Minh",
              }),
            );

            return (
              orderDate.getFullYear() === year &&
              orderDate.getMonth() === monthIndex
            );
          }).length ?? 0;

        result.push({
          dateLabel: `T${monthIndex + 1}`,
          totalOrders,
        });
      }

      return NextResponse.json({
        success: true,
        data: result,
      });
    }
  } catch (error) {
    console.error("Get order chart error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

// =========================================================
// Helpers
// =========================================================

function formatLabel(date: Date, type: "day") {
  if (type === "day") {
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}`;
  }

  return "";
}
