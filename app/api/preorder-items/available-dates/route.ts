import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

interface PreorderItemRow {
  product_id: string;
  planned_quantity: number;
  remaining_quantity: number;
  is_active: boolean;
  preorder_schedules: PreorderSchedule;
}

interface PreorderSchedule {
  id: string;
  date: string;
  status: boolean;
}
interface AvailableDate {
  schedule_id: string;
  date: string;
}

export async function GET(request: NextRequest) {
  try {
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
      await supabaseAdmin
        .from("preorder_items")
        .select(
          `
          product_id,
          planned_quantity,
          remaining_quantity,
          is_active,

          preorder_schedules!inner(
            id,
            date,
            status
          )
        `,
        )
        .in("product_id", productIds)
        .eq("is_active", true)
        .gt("remaining_quantity", 0)
        .eq("preorder_schedules.status", true)
        .order("date", {
          foreignTable: "preorder_schedules",
          ascending: true,
        })
        .returns<PreorderItemRow[]>();

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

    const preorderItems = preorderItemsData ?? [];

    if (preorderItems.length === 0) {
      return NextResponse.json({
        data: [],
      });
    }

    // ----------------------------------------
    // product_id -> available dates
    // ----------------------------------------
    const datesByProduct = new Map<string, Map<string, string>>();

    for (const productId of productIds) {
      datesByProduct.set(productId, new Map());
    }

    for (const item of preorderItems) {
      const schedule = item.preorder_schedules;

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
