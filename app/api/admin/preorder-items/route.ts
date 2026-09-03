import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { getSearchParams } from "@/utils/logic-get";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createPreorderItemsSchema = z.object({
  schedule_id: z.string().uuid(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().min(0),
      }),
    )
    .min(1),
});

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

    const { page, limit, date, schedule_id } = getSearchParams(req);

    const { searchParams } = new URL(req.url);

    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabaseAdmin
      .from("preorder_items")
      .select(
        `
        *,
        products!inner(
          id,
          price,
          image_url,
          is_active,
          product_translations(locale, name, slug),
          categories(id, name)
        ),
        preorder_schedules!inner(
          id,
          date,
          status
        )
      `,
        { count: "exact" },
      )
      .order("date", {
        foreignTable: "preorder_schedules",
        ascending: true,
      })
      .order("created_at", { ascending: false })
      .range(from, to);

    // Specific schedule
    if (schedule_id) {
      query = query.eq("schedule_id", schedule_id);
    }

    // Specific date
    if (date) {
      query = query.eq("preorder_schedules.date", date);
    }

    // Date range
    if (startDate) {
      query = query.gte("preorder_schedules.date", startDate);
    }

    if (endDate) {
      query = query.lte("preorder_schedules.date", endDate);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const totalPages = count ? Math.ceil(count / limitNum) : 0;

    return NextResponse.json(
      {
        success: true,
        data: data ?? [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total_items: count ?? 0,
          total_pages: totalPages,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fetch preorder items error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();

    const parsed = createPreorderItemsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { schedule_id, items } = parsed.data;

    // Check schedule exists
    const { data: schedule, error: scheduleError } = await supabaseAdmin
      .from("preorder_schedules")
      .select("id, date, status")
      .eq("id", schedule_id)
      .single();

    if (scheduleError) {
      if (scheduleError.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error: "Preorder schedule not found",
          },
          { status: 404 },
        );
      }

      throw scheduleError;
    }

    // Don't allow adding items to closed schedule
    if (!schedule.status) {
      return NextResponse.json(
        {
          success: false,
          error: "Preorder schedule is closed",
        },
        { status: 400 },
      );
    }

    const rows = items.map((item) => ({
      schedule_id,
      product_id: item.product_id,
      planned_quantity: item.quantity,
      remaining_quantity: item.quantity,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabaseAdmin
      .from("preorder_items")
      .upsert(rows, {
        onConflict: "schedule_id,product_id",
      })
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        data: data ?? [],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create preorder items error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
