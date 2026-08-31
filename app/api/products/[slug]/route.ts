import { isSupabaseConfigured, supabase, supabaseAdmin } from "@/lib/supabase";
import { ProductIngredientRow, RawProduct } from "@/types";
import { NextRequest, NextResponse } from "next/server";

interface PreorderItemRow {
  product_id: string;
  planned_quantity: number;
  remaining_quantity: number;
  is_active: boolean;
  preorder_schedules: {
    id: string;
    date: string;
    status: boolean;
  };
}

function getPreorderDateRange(businessDate: string) {
  const date = new Date(`${businessDate}T00:00:00+07:00`);
  const dayOfWeek = date.getDay();

  // Mon - Wed → Friday this week
  // Thu - Sun → Friday next week
  const daysUntilFriday = dayOfWeek <= 3 ? 5 - dayOfWeek : 5 + (7 - dayOfWeek);

  const firstFriday = new Date(date);
  firstFriday.setDate(date.getDate() + daysUntilFriday);

  // Friday → following Sunday
  const lastSunday = new Date(firstFriday);
  lastSunday.setDate(firstFriday.getDate() + 9);

  const formatDate = (value: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(value);

  return {
    startDate: formatDate(firstFriday),
    endDate: formatDate(lastSunday),
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    const { slug } = await params;
    const locale = req.nextUrl.searchParams.get("locale") ?? "vi";

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Slug is required" },
        { status: 400 },
      );
    }

    // ----------------------------------------
    // 1. Find product ID from slug
    // ----------------------------------------
    const { data: translation, error: translationError } = await supabase
      .from("product_translations")
      .select("product_id")
      .eq("slug", slug)
      .eq("locale", locale)
      .single();

    if (translationError || !translation) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    // ----------------------------------------
    // 2. Get product
    // ----------------------------------------
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        categories(id, name),
        product_translations!inner(
          locale,
          name,
          description,
          slug
        ),
        product_ingredients(
          ingredients(id, name)
        )
      `,
      )
      .eq("id", translation.product_id)
      .eq("product_translations.locale", locale)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    const product = data as RawProduct;
    const trans = product.product_translations?.[0] ?? {};

    // ----------------------------------------
    // 3. Business date
    // ----------------------------------------
    const businessDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date());

    // ----------------------------------------
    // 4. Get today's daily inventory
    // ----------------------------------------
    const { data: dailyInventory, error: dailyError } = await supabaseAdmin
      .from("daily_inventories")
      .select(
        `
          planned_quantity,
          remaining_quantity,
          status
        `,
      )
      .eq("product_id", product.id)
      .eq("business_date", businessDate)
      .maybeSingle();

    if (dailyError) {
      throw dailyError;
    }

    // ----------------------------------------
    // 5. Get upcoming preorder
    // ----------------------------------------
    const { startDate, endDate } = getPreorderDateRange(businessDate);

    const { data: preorderItems, error: preorderError } = await supabaseAdmin
      .from("preorder_items")
      .select(
        `
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
      .eq("product_id", product.id)
      .gte("preorder_schedules.date", startDate)
      .lte("preorder_schedules.date", endDate)
      .eq("preorder_schedules.status", true)
      .eq("is_active", true)
      .gt("remaining_quantity", 0)
      .order("date", {
        foreignTable: "preorder_schedules",
        ascending: true,
      })
      .returns<PreorderItemRow[]>();

    if (preorderError) {
      throw preorderError;
    }

    // ----------------------------------------
    // 6. Format response
    // ----------------------------------------

    const formatted = {
      id: product.id,
      price: product.price,
      image_url: product.image_url,
      is_active: product.is_active,
      created_at: product.created_at,
      updated_at: product.updated_at,

      category: product.categories,

      name: trans.name ?? null,
      description: trans.description ?? null,
      slug: trans.slug ?? null,

      ingredients: (product.product_ingredients ?? []).map(
        (pi: ProductIngredientRow) => pi.ingredients,
      ),
      // --------------------------------------
      // Daily
      // --------------------------------------
      daily: {
        planned_quantity: dailyInventory?.planned_quantity ?? 0,
        remaining_quantity: dailyInventory?.remaining_quantity ?? 0,

        available: (dailyInventory?.remaining_quantity ?? 0) > 0,
      },
      // --------------------------------------
      // Preorder
      // --------------------------------------
      preorder: {
        available: (preorderItems ?? []).length > 0,
        schedules: (preorderItems ?? []).map((item) => ({
          schedule_id: item.preorder_schedules.id,
          date: item.preorder_schedules.date,
          planned_quantity: item.planned_quantity,
          remaining_quantity: item.remaining_quantity,
        })),
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: formatted,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get product by slug error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
