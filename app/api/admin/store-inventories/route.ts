import { DailyInventoryStatusEnum } from "@/enums/daily-inventory-status.enum";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { getBusinessDate, getSearchParams } from "@/utils/logic-get";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    const { status, page, limit, date } = getSearchParams(req);

    // parse page/limit & pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabaseAdmin
      .from("daily_inventories")
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
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (date) {
      query = query.eq("business_date", date);
    }

    if (status !== null && status !== "") {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // total page
    const totalPages = count ? Math.ceil(count / limitNum) : 0;

    return NextResponse.json(
      {
        success: true,
        data,
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
    console.error("Fetch daily inventory error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { items } = body;

    if (!items?.length) {
      return NextResponse.json(
        { success: false, error: "Items is required" },
        { status: 400 },
      );
    }

    const businessDate = getBusinessDate();

    for (const item of items) {
      const { product_id, quantity } = item;

      if (!product_id || !quantity || quantity <= 0) {
        continue;
      }

      // Kiểm tra sản phẩm đã có inventory hôm nay chưa
      const { data: existingInventory, error: findError } = await supabaseAdmin
        .from("daily_inventories")
        .select("id, planned_quantity, remaining_quantity, status")
        .eq("product_id", product_id)
        .eq("business_date", businessDate)
        .maybeSingle();

      if (findError) throw findError;

      if (existingInventory) {
        // Đã có -> cộng thêm số lượng
        const { error: updateError } = await supabaseAdmin
          .from("daily_inventories")
          .update({
            planned_quantity: existingInventory.planned_quantity + quantity,
            remaining_quantity: existingInventory.remaining_quantity + quantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingInventory.id);

        if (updateError) throw updateError;
      } else {
        // Chưa có -> tạo mới
        const { error: insertError } = await supabaseAdmin
          .from("daily_inventories")
          .insert({
            product_id,
            planned_quantity: quantity,
            remaining_quantity: quantity,
            business_date: businessDate,
            status: DailyInventoryStatusEnum.Available,
            updated_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Update inventory error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
