import {
  createSupabaseServerClient,
  isSupabaseConfigured,
  supabaseAdmin,
} from "@/lib/supabase";
import { getSearchParams } from "@/lib/utils";
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

    // 1. lấy user hiện tại từ session
    const res = new NextResponse(null);
    const supabase = createSupabaseServerClient(req, res);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. lấy staff từ session
    const { data: staff, error: staffError } = await supabaseAdmin
      .from("staffs")
      .select("store_id")
      .eq("user_id", user.id)
      .single();

    if (staffError || !staff) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 403 },
      );
    }

    // 3. lấy đúng store của staff
    const store_id = staff.store_id;

    // 4. Tạo query
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
        ),
        staffs(
          id,
          users(id, full_name)
        )
      `,
        { count: "exact" },
      )
      .eq("store_id", store_id)
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

    // 5. Total page
    const totalPages = count ? Math.ceil(count / limitNum) : 0;

    return NextResponse.json(
      {
        success: true,
        data: data,
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
