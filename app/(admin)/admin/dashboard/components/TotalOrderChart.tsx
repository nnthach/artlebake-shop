import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { useDebounce } from "@/hooks/useDebounce";
import { useI18n } from "@/context/I18nContext";
import { ChartItem, ViewType } from "@/types/sub-type";
import React, { useEffect, useState } from "react";
import ChartFilter from "./ChartFilter";

export default function TotalOrderChart() {
  const { t } = useI18n();
  const [orderChart, setOrderChart] = useState<ChartItem[]>([]);
  const [filters, setFilters] = useState({
    viewType: "month" as ViewType,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const debouncedFilters = useDebounce(filters, 1000);

  useEffect(() => {
    const fetchChart = async () => {
      const params = new URLSearchParams({
        viewType: debouncedFilters.viewType,
        year: String(debouncedFilters.year),
      });

      if (debouncedFilters.viewType === "month") {
        params.set("month", String(debouncedFilters.month));
      }

      try {
        const res = await fetch(
          `/api/admin/dashboard/chart/total-order?${params.toString()}`,
        );

        if (!res.ok) {
          throw new Error("Failed to fetch total order chart");
        }

        const data = await res.json();

        if (data.success) {
          setOrderChart(Array.isArray(data.data) ? data.data : []);
        }
      } catch (error) {
        console.error("Fetch total order chart error:", error);
        setOrderChart([]);
      }
    };

    fetchChart();
  }, [debouncedFilters]);

  const totalOrders = orderChart.reduce(
    (acc: number, curr: ChartItem) => acc + curr.totalOrders,
    0,
  );

  return (
    <div className="flex flex-col h-full w-full bg-white">
      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
            {t("admin.dashboardPage.totalOrderChart.title")}{" "}
            {t(
              `admin.dashboardPage.totalOrderChart.viewLabel.${filters.viewType}`,
            )}
          </h3>

          <p className="text-2xl font-bold text-gray-900 mt-1">
            {totalOrders.toLocaleString()}
            <span className="text-base ml-1">
              {t("admin.dashboardPage.totalOrderChart.unit")}
            </span>
          </p>
        </div>

        <ChartFilter value={filters} onChange={setFilters} />
      </div>

      {/* CHART */}
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={orderChart}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#AF2D35" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#AF2D35" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />

            <XAxis
              dataKey="dateLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              dy={10}
              ticks={
                filters.viewType === "month"
                  ? orderChart
                      .filter((_: ChartItem, i: number) =>
                        [0, 2, 5, 8, 11, 14, 17, 20, 23, 26, 29].includes(i),
                      )
                      .map((d: ChartItem) => d.dateLabel)
                  : undefined
              }
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
            />

            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
              formatter={(value) => [
                `${Number(value ?? 0)} ${t("admin.dashboardPage.totalOrderChart.unit")}`,
                t("admin.dashboardPage.totalOrderChart.tooltip"),
              ]}
            />

            <Area
              key={filters.viewType}
              type="monotone"
              dataKey="totalOrders"
              stroke="#AF2D35"
              strokeWidth={2.5}
              fill="url(#colorOrders)"
              isAnimationActive={true}
              dot={{ fill: "#AF2D35", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#AF2D35", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
