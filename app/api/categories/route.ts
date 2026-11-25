import { getCategories } from "@/lib/fastapi/categories";
import { httpClient } from "@/lib/fastapi/http-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSearchParams } from "@/utils/logic-get";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { is_active, sort_by, order, locale } = getSearchParams(req);

    const validSortBy = ["name", "created_at"].includes(sort_by)
      ? sort_by
      : "created_at";
    const normalizedOrder = order === "asc" ? "asc" : "desc";
    const normalizedLocale = locale.trim().toLowerCase() === "en" ? "en" : "vi";

    if (is_active === "true" && httpClient.isConfigured()) {
      try {
        const data = await getCategories(
          validSortBy,
          normalizedOrder,
          normalizedLocale,
        );
        return NextResponse.json({ success: true, data }, { status: 200 });
      } catch {
        console.warn("FastAPI category request failed");
        return NextResponse.json(
          { success: false, error: "Failed to fetch categories" },
          { status: 502 },
        );
      }
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    const { supabase } = await import("@/lib/supabase");

    // 1. GET PARAMETERS
    const ascending = normalizedOrder === "asc";

    // 4. Create query database
    let query = supabase
      .from("categories")
      .select("*")
      .order(validSortBy, { ascending });

    if (is_active !== null && is_active !== "") {
      query = query.eq("is_active", is_active === "true");
    }

    // 5. RUN QUERY
    const { data, error } = await query;
    if (error) throw error;

    // 6. SET CACHE REDIS
    const responseData = {
      data: data,
    };

    return NextResponse.json(
      { success: true, ...responseData },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fetch categories error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
