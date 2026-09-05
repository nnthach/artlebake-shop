"use client";

import { useI18n } from "@/context/I18nContext";
import StatCard from "./components/StatCard";
import RecentOrder from "./components/RecentOrder";
import TopSeller from "./components/TopSeller";
import TotalOrderChart from "./components/TotalOrderChart";
import TotalRevenueChart from "./components/TotalRevenueChart";
import OrderStatusPieChart from "./components/OrderStatusPieChart";

export default function AdminDashboardPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {t("admin.dashboardPage.headerTitle.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.dashboardPage.headerTitle.subtitle")}
        </p>
      </div>

      <StatCard />

      {/* Sử dụng hệ 4 cột làm chuẩn */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
        {/* HÀNG 1: Tổng = 4 */}
        <div className="col-span-1 md:col-span-2 2xl:col-span-3 h-[500px] ">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* 3/4 */}
            <div className="lg:col-span-2 p-4 min-w-0 bg-white border border-zinc-200/80 shadow-md rounded-lg ">
              <TotalOrderChart />
            </div>

            {/* 1/4 */}
            <div className="lg:col-span-1 p-4 min-w-0 bg-white border border-zinc-200/80 shadow-md rounded-lg ">
              <OrderStatusPieChart />
            </div>
          </div>
        </div>

        {/* HÀNG 2: Tổng 3 + 1 = 4 */}
        <div className="bg-white p-4 rounded-lg col-span-1 md:col-span-2 2xl:col-span-3 h-[500px] border border-zinc-200/80 shadow-md">
          <TotalRevenueChart />
        </div>
      </div>

      {/* Recent orders + top products */}
      <div className="grid gap-4 lg:grid-cols-3">
        <RecentOrder />

        <TopSeller />
      </div>
    </div>
  );
}
