// import { generateCacheKey, getCache, setCache } from "@/lib/redis-cache";
import { getProducts } from "@/lib/fastapi/products";
import { httpClient } from "@/lib/fastapi/http-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSearchParams } from "@/utils/logic-get";
import { IngredientItem, ProductIngredientRow, RawProduct } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export interface FormattedProduct {
  id: string;
  price: number | null;
  image_url: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string | null;

  category: {
    id: string;
    name: string | { vi: string; en: string };
  } | null;

  name: string | null;
  description: string | null;
  slug: string | null;

  ingredients: Pick<IngredientItem, "id" | "name">[];
}

interface ProductListResponse {
  data: FormattedProduct[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
}

export async function GET(req: NextRequest) {
  try {
    // 1. GET PARAMETERS
    const {
      is_active,
      category_id,
      sort_by,
      order,
      locale,
      page,
      limit,
      is_bestseller,
      search,
    } = getSearchParams(req);

    const validSortBy = sort_by === "name" ? "name" : "created_at";
    const normalizedOrder = order === "asc" ? "asc" : "desc";
    const normalizedLocale = locale.trim().toLowerCase() === "en" ? "en" : "vi";

    // 2. Parse page/limit & pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    if (is_active === "true" && httpClient.isConfigured()) {
      try {
        const products = await getProducts({
          page: pageNum,
          limit: limitNum,
          locale: normalizedLocale,
          sort_by: validSortBy,
          order: normalizedOrder,
          ...(is_bestseller !== null && is_bestseller !== ""
            ? { is_bestseller: is_bestseller === "true" }
            : {}),
          ...(category_id ? { category_id } : {}),
          ...(search ? { search } : {}),
        });
        const formatted: FormattedProduct[] = products.data.map((product) => ({
          id: product.id,
          price: product.price,
          image_url: product.image_url,
          is_active: product.is_active,
          created_at: product.created_at,
          updated_at: product.updated_at,
          category: product.category,
          name: product.name,
          description: product.description,
          slug: product.slug,
          ingredients: product.ingredients,
        }));

        return NextResponse.json(
          { success: true, data: formatted, pagination: products.pagination },
          { status: 200 },
        );
      } catch {
        console.warn("FastAPI product list request failed");
        return NextResponse.json(
          { success: false, error: "Failed to fetch products" },
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
    const ascending = normalizedOrder === "asc";
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    // 3. Generate redis cache key
    // const cacheKey = generateCacheKey(
    //   "products",
    //   search,
    //   limitNum,
    //   pageNum,
    //   validSortBy,
    //   ascending ? "asc" : "desc",
    //   locale,
    //   is_active === "true" ? true : is_active === "false" ? false : null,
    //   is_bestseller === "true"
    //     ? true
    //     : is_bestseller === "false"
    //       ? false
    //       : null,
    //   category_id || null,
    //   null,
    //   null,
    // );

    // 4. GET redis cache
    // const cached = await getCache<ProductListResponse>(cacheKey);

    // if (cached) {
    //   return NextResponse.json(
    //     {
    //       success: true,
    //       ...cached,
    //     },
    //     { status: 200 },
    //   );
    // }

    // 5. CREATE Query database
    let query = supabase
      .from("products")
      .select(
        `
        *,
        categories(id, name),
        product_translations!inner(locale, name, description, slug),
        product_ingredients(
          ingredients(id, name)
        )
      `,
        { count: "exact" }, // tổng số dòng theo params, ko tính pagination
      )
      .eq("product_translations.locale", locale)
      .order(validSortBy, { ascending })
      .range(from, to); // add pagination

    if (is_active !== null && is_active !== "") {
      query = query.eq("is_active", is_active === "true");
    }

    if (is_bestseller !== null && is_bestseller !== "") {
      query = query.eq("is_bestseller", is_bestseller === "true");
    }

    if (category_id !== null && category_id !== "") {
      query = query.eq("category_id", category_id);
    }

    // 6. RUN QUERY
    const { data, error, count } = await query;
    if (error) throw error;

    // 7. Product format
    const formatted = data.map((product: RawProduct) => {
      const translation = product.product_translations?.[0] ?? {};

      return {
        id: product.id,
        price: product.price,
        image_url: product.image_url,
        is_active: product.is_active,
        created_at: product.created_at,
        updated_at: product.updated_at,
        category: product.categories,
        name: translation.name ?? null,
        description: translation.description ?? null,
        slug: translation.slug ?? null,
        ingredients: (product.product_ingredients ?? []).map(
          (pi: ProductIngredientRow) => pi.ingredients,
        ),
      };
    });

    // 8. Total page
    const totalPages = count ? Math.ceil(count / limitNum) : 0;

    const responseData: ProductListResponse = {
      data: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total_items: count ?? 0,
        total_pages: totalPages,
      },
    };

    // 9. SET CACHE REDIS
    // void setCache(cacheKey, responseData, 5 * 60 * 60);

    // 10. RESPONSE
    return NextResponse.json(
      {
        success: true,
        ...responseData,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fetch products error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
