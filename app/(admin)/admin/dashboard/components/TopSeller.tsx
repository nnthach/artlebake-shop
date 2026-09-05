import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Award, Package, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/context/I18nContext";

interface TopProduct {
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity_sold: number;
}

export default function TopSeller() {
  const { locale, t } = useI18n();
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTopProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/dashboard/top-seller?locale=${locale}`,
      );

      if (!res.ok) throw new Error("Failed to fetch top products");

      const data = await res.json();

      if (data.success && data.data) {
        setTopProducts(data.data);
      }
    } catch (error) {
      console.error("Fetch top products error:", error);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchTopProducts();
  }, [fetchTopProducts]);

  const maxSold = topProducts.length
    ? Math.max(...topProducts.map((p) => p.quantity_sold))
    : 1;

  // Render Badge thứ hạng
  const renderRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <span className="flex h-6 w-6 items-center justify-between rounded-full bg-amber-500/15 p-1 text-amber-500 dark:bg-amber-500/20">
            <Trophy className="h-4 w-4 mx-auto" />
          </span>
        );
      case 1:
        return (
          <span className="flex h-6 w-6 items-center justify-between rounded-full bg-slate-300/30 p-1 text-slate-500 dark:bg-slate-700/50 dark:text-slate-300">
            <Award className="h-4 w-4 mx-auto" />
          </span>
        );
      case 2:
        return (
          <span className="flex h-6 w-6 items-center justify-between rounded-full bg-amber-700/15 p-1 text-amber-700 dark:bg-amber-700/30 dark:text-amber-500">
            <Award className="h-4 w-4 mx-auto" />
          </span>
        );
      default:
        return (
          <span className="flex h-6 w-6 items-center justify-center text-xs font-semibold text-muted-foreground">
            #{index + 1}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <Card className="border border-zinc-200/80 shadow-md dark:border-zinc-800">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-36 mb-1" />
          <Skeleton className="h-3.5 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-zinc-200/80 shadow-md dark:border-zinc-800">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold tracking-tight">
          {t("admin.dashboardPage.topSeller.title")}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {t("admin.dashboardPage.topSeller.subtitle")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {topProducts.slice(0, 5).map((product, index) => {
          const pct = Math.round((product.quantity_sold / maxSold) * 100);

          return (
            <div
              key={product.product_id}
              className="group relative flex items-center gap-3 rounded-xl transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              {/* Thứ hạng */}
              <div className="flex-shrink-0">{renderRankBadge(index)}</div>

              {/* Ảnh sản phẩm */}
              <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-muted dark:border-zinc-700">
                {product.product_image ? (
                  <Image
                    src={product.product_image}
                    alt={product.product_name}
                    fill
                    sizes="44px"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Package className="h-5 w-5" />
                  </div>
                )}
              </div>

              {/* Thông tin & Thanh Tỷ lệ */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="truncate text-sm font-medium text-foreground">
                    {product.product_name}
                  </h4>
                  <span className="flex-shrink-0 text-xs font-semibold text-primary">
                    {product.quantity_sold}{" "}
                    <span className="font-normal text-muted-foreground">
                      {t("admin.dashboardPage.topSeller.sold") || "đã bán"}
                    </span>
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      index === 0
                        ? "bg-amber-500"
                        : index === 1
                          ? "bg-slate-400"
                          : index === 2
                            ? "bg-amber-700"
                            : "bg-primary/80"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
