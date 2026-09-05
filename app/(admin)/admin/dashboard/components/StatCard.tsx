import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Minus,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/context/I18nContext";

interface StatData {
  total_orders: number;
  total_revenue: number;
  total_products_sold: number;
  unshipped_orders: number;
  growth?: {
    total_orders?: number | null;
    total_revenue?: number | null;
    total_products_sold?: number | null;
  };
  month?: string;
}

export default function StatCard() {
  const { t } = useI18n();
  const [statCard, setStatCard] = useState<StatData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStatCard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/dashboard/stat-card`);
      if (!res.ok) throw new Error("Failed to fetch stat card");
      const data = await res.json();

      if (data.success && data.data) {
        setStatCard(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatCard();
  }, [fetchStatCard]);

  // Helper render phần trăm tăng trưởng
  const renderGrowthBadge = (growthValue?: number | null) => {
    const noDataText = t("admin.dashboardPage.statCard.compare.noData");
    const previousMonthText = t(
      "admin.dashboardPage.statCard.compare.vsPreviousMonth",
    );

    if (growthValue === undefined || growthValue === null) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
          <Minus className="h-3.5 w-3.5" /> {noDataText}
        </span>
      );
    }

    const isPositive = growthValue > 0;
    const isZero = growthValue === 0;

    if (isZero) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500">
          <Minus className="h-3.5 w-3.5" />{" "}
          {t("admin.dashboardPage.statCard.compare.zero")}
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold ${
          isPositive
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-rose-600 dark:text-rose-400"
        }`}
      >
        {isPositive ? (
          <ArrowUpRight className="h-3.5 w-3.5" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5" />
        )}
        {Math.abs(growthValue)}%
        <span className="font-normal text-muted-foreground">
          {previousMonthText}
        </span>
      </span>
    );
  };

  const STATS = [
    {
      label: t("admin.dashboardPage.statCard.monthlyOrders.label"),
      value: (statCard?.total_orders ?? 0).toLocaleString("vi-VN"),
      growth: statCard?.growth?.total_orders,
      icon: ShoppingCart,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/50",
      accent: "bg-blue-600 dark:bg-blue-500",
    },
    {
      label: t("admin.dashboardPage.statCard.monthlyRevenue.label"),
      value: `${(statCard?.total_revenue ?? 0).toLocaleString("vi-VN")} ₫`,
      growth: statCard?.growth?.total_revenue,
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
      accent: "bg-emerald-600 dark:bg-emerald-500",
    },
    {
      label: t("admin.dashboardPage.statCard.productsSold.label"),
      value: (statCard?.total_products_sold ?? 0).toLocaleString("vi-VN"),
      growth: statCard?.growth?.total_products_sold,
      icon: Package,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/50",
      accent: "bg-violet-600 dark:bg-violet-500",
    },
    {
      label: t("admin.dashboardPage.statCard.unshippedOrders.label"),
      value: (statCard?.unshipped_orders ?? 0).toLocaleString("vi-VN"),
      growth: undefined,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/50",
      accent: "bg-amber-500 dark:bg-amber-400",
      subtext: t("admin.dashboardPage.statCard.unshippedOrders.subtext"),
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 shadow-sm border border-border">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-3 w-36" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STATS.map((stat) => (
        <Card
          key={stat.label}
          className="relative overflow-hidden border border-zinc-200/80 shadow-md transition-all duration-200"
        >
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <div className={`rounded-xl p-2.5 ${stat.bg} transition-colors`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1.5">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {stat.value}
            </div>
            <div className="flex items-center">
              {stat.subtext ? (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  • {stat.subtext}
                </span>
              ) : (
                renderGrowthBadge(stat.growth)
              )}
            </div>
          </CardContent>
          <div className={`${stat.accent} h-2`} />
        </Card>
      ))}
    </div>
  );
}
