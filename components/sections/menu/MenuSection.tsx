"use client";

import ProductCard from "@/components/custom/ProductCard";
import { cn } from "@/lib/utils";
import { CategoryItem, FetchedProductMenu } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { useIsMobile } from "@/hooks/useMobile";
import MenuSectionFilter from "@/components/sections/menu/MenuSectionFilter";
import ProductCardMobile from "@/components/custom/ProductCardMobile";

const PRODUCTS_PER_PAGE = 12;

export default function MenuSection() {
  const { t, locale } = useI18n();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { page, setPage, pagination, setPagination, resetPage } =
    usePagination();
  const [products, setProducts] = useState<FetchedProductMenu[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const isMobile = useIsMobile();

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories?is_active=true");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.data) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  const fetchProducts = useCallback(
    async (categoryId: string, pageNum: number) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          is_active: "true",
          sort_by: "created_at",
          order: "asc",
          limit: String(PRODUCTS_PER_PAGE),
          page: String(pageNum),
          locale,
          search: search.trim(),
        });
        if (categoryId !== "all") {
          params.set("category_id", categoryId);
        }
        const res = await fetch(`/api/products/menu?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.data) {
          setProducts(data.data);
          setPagination(data.pagination ?? null);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [locale, search, setPagination],
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts(activeCategory, page);
  }, [fetchProducts, activeCategory, page]);

  const handleSelectCategory = (id: string) => {
    setActiveCategory(id);
    resetPage();
    setIsFilterOpen(false);
  };

  // pagination
  const handlePageChange = (nextPage: number) => {
    if (
      nextPage < 1 ||
      nextPage === page ||
      (pagination && nextPage > pagination.total_pages)
    ) {
      return;
    }
    setPage(nextPage);
  };

  const getPageNumbers = (current: number, total: number) => {
    const pages: (number | "ellipsis")[] = [];
    const neighbors = 1;

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - neighbors && i <= current + neighbors)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "ellipsis") {
        pages.push("ellipsis");
      }
    }

    return pages;
  };
  // end pagination

  return (
    <section className="relative z-10 bg-sand sm:px-6 sm:py-16 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <MenuSectionFilter
          isMobile={isMobile}
          categories={categories}
          activeCategory={activeCategory}
          search={search}
          isFilterOpen={isFilterOpen}
          onSelectCategory={handleSelectCategory}
          onSearchChange={(value) => {
            setSearch(value);
            resetPage();
          }}
          onFilterOpenChange={setIsFilterOpen}
        />

        {/* Product grid */}
        {isLoading ? (
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl bg-white/60"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="mt-8 sm:mt-16">
              {/* Desktop */}
              <div className="hidden gap-8 text-left sm:grid sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      image:
                        product.image_url?.[0] ?? "/images/placeholder.webp",
                      name: product.name,
                      description: product.description,
                      slug: product.slug,
                      price: product.price,
                      daily: product.daily,
                      preorder: product.preorder,
                    }}
                    animation={false}
                  />
                ))}
              </div>

              {/* Mobile */}
              <div className="grid gap-3 text-left sm:hidden">
                {products.map((product) => (
                  <ProductCardMobile
                    key={product.id}
                    product={{
                      id: product.id,
                      image:
                        product.image_url?.[0] ?? "/images/placeholder.webp",
                      name: product.name,
                      description: product.description,
                      slug: product.slug,
                      price: product.price,
                      daily: product.daily,
                      preorder: product.preorder,
                    }}
                  />
                ))}
              </div>
            </div>

            {products.length === 0 && (
              <p className="mt-12 text-center text-charcoal/50">
                {t("menuPage.menuFilter.empty")}
              </p>
            )}

            {/*pagination */}
            {pagination && pagination.total_pages > 1 && (
              <nav
                aria-label="pagination"
                className="mt-14 flex items-center justify-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  aria-label={t("menuPage.pagination.previous")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-charcoal/15 bg-white text-charcoal/60 transition hover:border-primary/50 hover:text-charcoal disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {getPageNumbers(page, pagination.total_pages).map((item, i) =>
                  item === "ellipsis" ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-1 text-sm text-charcoal/40"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handlePageChange(item)}
                      aria-current={item === page ? "page" : undefined}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition",
                        item === page
                          ? "border-primary bg-primary text-white shadow-sm"
                          : "border-charcoal/15 bg-white text-charcoal/60 hover:border-primary/50 hover:text-charcoal",
                      )}
                    >
                      {item}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.total_pages}
                  aria-label={t("menuPage.pagination.next")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-charcoal/15 bg-white text-charcoal/60 transition hover:border-primary/50 hover:text-charcoal disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}
