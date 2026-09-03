import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import {
  getBusinessDate,
  getPreorderDateRange,
  getSearchParams,
} from "@/utils/logic-get";
import { NextRequest, NextResponse } from "next/server";

interface DailyInventoryRow {
  product_id: string;
  planned_quantity: number;
  remaining_quantity: number;
  status: string;
}

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

export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    // 1. GET PARAMETERS
    const { is_active, category_id, order, locale, page, limit, search } =
      getSearchParams(req);

    const ascending = order === "asc";

    // 2. parse page/limit & pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    // 3. business date (today)
    const businessDate = getBusinessDate();

    // 4. PREORDER DATE RANGE
    const { startDate: preorderStartDate, endDate: preorderEndDate } =
      getPreorderDateRange();

    // 5. query product
    let productQuery = supabaseAdmin
      .from("products")
      .select(
        `
        id,
        price,
        image_url,
        is_active,
        created_at,
        updated_at,
        categories(id,name),
        product_translations!inner(
          locale,
          name,
          description,
          slug
        ),
        product_ingredients(
          ingredients(id,name)
        )
      `,
        {
          count: "exact",
        },
      )
      .eq("product_translations.locale", locale)
      .order("created_at", {
        ascending,
      })
      .range(from, to);

    if (is_active !== null && is_active !== "") {
      productQuery = productQuery.eq("is_active", is_active === "true");
    }

    if (category_id !== null && category_id !== "") {
      productQuery = productQuery.eq("category_id", category_id);
    }
    if (search !== "") {
      productQuery = productQuery.ilike(
        "product_translations.name",
        `%${search}%`,
      );
    }
    const { data: products, error: productError, count } = await productQuery;

    if (productError) throw productError;

    // 6. query today inventory
    const { data: inventories, error: inventoryError } = await supabaseAdmin
      .from("daily_inventories")
      .select(
        `
          product_id,
          planned_quantity,
          remaining_quantity,
          status
        `,
      )
      .eq("business_date", businessDate);

    if (inventoryError) throw inventoryError;

    // 7. QUERY UPCOMING PREORDER ITEMS
    const { data: preorderItems, error: preorderError } = await supabaseAdmin
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
      .gte("preorder_schedules.date", preorderStartDate)
      .lte("preorder_schedules.date", preorderEndDate)
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

    // 8. map daily inventory to product
    const inventoryMap = new Map<string, DailyInventoryRow>(
      (inventories ?? []).map((item) => [item.product_id, item]),
    );

    // 9. map preorder item
    const preorderMap = new Map<string, PreorderItemRow[]>();
    for (const item of preorderItems ?? []) {
      const existing = preorderMap.get(item.product_id) ?? [];
      existing.push(item);
      preorderMap.set(item.product_id, existing);
    }

    // 10. product format
    const formatted = (products ?? []).map((product) => {
      const translation = product.product_translations[0];
      const inventory = inventoryMap.get(product.id);
      const productPreorders = preorderMap.get(product.id) ?? [];

      return {
        id: product.id,
        price: product.price,
        image_url: product.image_url,
        is_active: product.is_active,
        created_at: product.created_at,
        updated_at: product.updated_at,

        category: product.categories?.[0] ?? null,
        name: translation?.name ?? "",
        description: translation?.description ?? "",
        slug: translation?.slug ?? "",
        ingredients: product.product_ingredients.map(
          (item) => item.ingredients,
        ),
        // ------------------------------
        // Daily availability
        // ------------------------------
        daily: {
          planned_quantity: inventory?.planned_quantity ?? 0,
          remaining_quantity: inventory?.remaining_quantity ?? 0,
          status:
            inventory?.remaining_quantity && inventory.remaining_quantity > 0
              ? inventory.status
              : "out_of_stock",
          available: (inventory?.remaining_quantity ?? 0) > 0,
        },
        // ------------------------------
        // Preorder availability
        // ------------------------------
        preorder: {
          available: productPreorders.length > 0,
          schedules: productPreorders.flatMap((item) => {
            const schedule = item.preorder_schedules;

            if (!schedule) {
              return [];
            }

            return [
              {
                schedule_id: schedule.id,
                date: schedule.date,
                planned_quantity: item.planned_quantity,
                remaining_quantity: item.remaining_quantity,
              },
            ];
          }),
        },
      };
    });

    // 10. total page
    const totalPages = count ? Math.ceil(count / limitNum) : 0;

    const responseData = {
      data: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total_items: count ?? 0,
        total_pages: totalPages,
      },
      preorder_range: {
        start_date: preorderStartDate,
        end_date: preorderEndDate,
      },
    };

    // 12. RESPONSE
    return NextResponse.json(
      {
        success: true,
        ...responseData,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fetch menu daily inventories error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
