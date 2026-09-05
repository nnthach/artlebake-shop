"use client";

import React, { useEffect, useState } from "react";
import {
  Pie,
  PieChart,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useI18n } from "@/context/I18nContext";

interface OrderStatusItem {
  status: "confirmed" | "delivered" | "pending" | "cancelled";
  count: number;
}

const STATUS_COLORS = {
  confirmed: "#3B82F6",
  delivered: "#10B981",
  pending: "#F59E0B",
  cancelled: "#AF2D35",
};

export default function OrderStatusPieChart() {
  const { t } = useI18n();

  const [orderStatusChart, setOrderStatusChart] = useState<OrderStatusItem[]>(
    [],
  );

  useEffect(() => {
    const fetchChart = async () => {
      try {
        const res = await fetch(`/api/admin/dashboard/chart/order-status`);

        if (!res.ok) {
          throw new Error("Failed to fetch order status chart");
        }

        const data = await res.json();

        if (data.success) {
          setOrderStatusChart(Array.isArray(data.data) ? data.data : []);
        }
      } catch (error) {
        console.error("Fetch order status chart error:", error);
        setOrderStatusChart([]);
      }
    };

    fetchChart();
  }, []);

  const totalOrders = orderStatusChart.reduce(
    (acc, curr) => acc + curr.count,
    0,
  );

  const chartData = orderStatusChart.filter((item) => item.count > 0);

  const getStatusLabel = (status: string) => {
    return t(`admin.dashboardPage.orderStatusChart.status.${status}`);
  };

  type PieLabelProps = {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
  };

  const renderLabel = ({
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    percent,
  }: PieLabelProps) => {
    if (!percent || percent === 0) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;

    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#FFFFFF"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontWeight={500}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
            {t("admin.dashboardPage.orderStatusChart.title")}{" "}
            {t(`admin.dashboardPage.orderStatusChart.viewLabel.${"month"}`)}
          </h3>

          <p className="text-2xl font-bold text-gray-900 mt-1">
            {totalOrders.toLocaleString()}
            <span className="text-base ml-1">
              {t("admin.dashboardPage.orderStatusChart.unit")}
            </span>
          </p>
        </div>
      </div>

      {/* CHART */}
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              key={"month"}
              data={chartData}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius="85%"
              labelLine={false}
              label={renderLabel}
              isAnimationActive={true}
            >
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
              formatter={(value, _, props) => [
                `${Number(value ?? 0)} ${t(
                  "admin.dashboardPage.orderStatusChart.unit",
                )}`,
                getStatusLabel(props?.payload?.status),
              ]}
            />

            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              formatter={(value) => getStatusLabel(value)}
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "13px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
