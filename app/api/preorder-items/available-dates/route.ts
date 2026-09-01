import { createSupabaseServerClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

interface PreorderItem {
  product_id: string;
  schedule_id: string;
}

interface PreorderSchedule {
  id: string;
  date: string;
  status: string;
}
interface AvailableDate {
  schedule_id: string;
  date: string;
}

export async function GET(request: NextRequest) {
  const res = new NextResponse();
  try {
    const supabase = await createSupabaseServerClient(request, res);

    const { searchParams } = new URL(request.url);

    const productIds = searchParams
      .getAll("product_ids")
      .filter(
        (value, index, values) => value && values.indexOf(value) === index,
      );

    if (productIds.length === 0) {
      return NextResponse.json(
        { error: "product_ids is required" },
        { status: 400 },
      );
    }

    // Get preorder items
    const { data: preorderItemsData, error: preorderItemsError } =
      await supabase
        .from("preorder_items")
        .select("product_id, schedule_id")
        .in("product_id", productIds);

    if (preorderItemsError) {
      console.error("Failed to fetch preorder items:", preorderItemsError);

      return NextResponse.json(
        {
          error: "Failed to fetch preorder items",
          details: preorderItemsError.message,
        },
        { status: 500 },
      );
    }

    const preorderItems: PreorderItem[] = preorderItemsData ?? [];

    if (preorderItems.length === 0) {
      return NextResponse.json({
        data: [],
      });
    }

    // Get unique schedule IDs
    const scheduleIds = preorderItems
      .map((item) => item.schedule_id)
      .filter(
        (value, index, values) => value && values.indexOf(value) === index,
      );

    // Get schedules
    const { data: schedulesData, error: schedulesError } = await supabase
      .from("preorder_schedules")
      .select("id, date, status")
      .in("id", scheduleIds)
      .eq("status", true);

    if (schedulesError) {
      console.error("Failed to fetch preorder schedules:", schedulesError);

      return NextResponse.json(
        {
          error: "Failed to fetch preorder schedules",
          details: schedulesError.message,
        },
        { status: 500 },
      );
    }

    const schedules: PreorderSchedule[] = schedulesData ?? [];

    // Map schedule_id -> schedule
    const scheduleMap = new Map<string, PreorderSchedule>();

    for (const schedule of schedules) {
      scheduleMap.set(schedule.id, schedule);
    }

    // product_id -> available dates
    const datesByProduct = new Map<string, Map<string, string>>();

    for (const productId of productIds) {
      datesByProduct.set(productId, new Map());
    }

    for (const item of preorderItems) {
      const schedule = scheduleMap.get(item.schedule_id);

      if (!schedule) {
        continue;
      }

      datesByProduct.get(item.product_id)?.set(schedule.date, schedule.id);
    }

    /*
     * Find intersection between all products.
     *
     * Example:
     *
     * Tiramisu: 04/09, 05/09
     * Cookie:   04/09
     *
     * Result:
     * 04/09
     */
    const firstProductDates = datesByProduct.get(productIds[0]);

    if (!firstProductDates) {
      return NextResponse.json({
        data: [],
      });
    }

    const availableDates: AvailableDate[] = [];

    firstProductDates.forEach((scheduleId, date) => {
      const isAvailableForAllProducts = productIds.every((productId) =>
        datesByProduct.get(productId)?.has(date),
      );

      if (isAvailableForAllProducts) {
        availableDates.push({
          schedule_id: scheduleId,
          date,
        });
      }
    });

    availableDates.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      data: availableDates,
    });
  } catch (error) {
    console.error("Unexpected error fetching preorder dates:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
