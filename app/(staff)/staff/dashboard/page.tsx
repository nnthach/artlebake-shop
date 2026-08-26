"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useI18n } from "@/context/I18nContext";
import { Package, ShoppingCart, Star, TrendingUp, Users } from "lucide-react";

const STATS = [
  {
    label: "Tổng đơn hàng",
    value: "1,284",
    change: "+12% so với tháng trước",
    icon: ShoppingCart,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Doanh thu tháng",
    value: "84.500.000 ₫",
    change: "+8.2% so với tháng trước",
    icon: TrendingUp,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    label: "Sản phẩm",
    value: "48",
    change: "3 sản phẩm mới tháng này",
    icon: Package,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Khách hàng",
    value: "3.621",
    change: "+241 khách hàng mới",
    icon: Users,
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

const RECENT_ORDERS = [
  {
    id: "#ORD-001",
    customer: "Nguyễn Văn A",
    product: "Bánh Croissant",
    status: "Hoàn thành",
    amount: "85.000 ₫",
  },
  {
    id: "#ORD-002",
    customer: "Trần Thị B",
    product: "Bánh Madeleine",
    status: "Đang xử lý",
    amount: "120.000 ₫",
  },
  {
    id: "#ORD-003",
    customer: "Lê Minh C",
    product: "Set bánh ngọt",
    status: "Hoàn thành",
    amount: "250.000 ₫",
  },
  {
    id: "#ORD-004",
    customer: "Phạm Thu D",
    product: "Bánh Éclair",
    status: "Chờ xác nhận",
    amount: "95.000 ₫",
  },
  {
    id: "#ORD-005",
    customer: "Hoàng Kim E",
    product: "Bánh Tart trái cây",
    status: "Hoàn thành",
    amount: "180.000 ₫",
  },
];

const STATUS_STYLES: Record<string, string> = {
  "Hoàn thành": "bg-green-100 text-green-700",
  "Đang xử lý": "bg-amber-100 text-amber-700",
  "Chờ xác nhận": "bg-blue-100 text-blue-700",
};

export default function StaffDashboardPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("staff.dashboardPage.headerTitle.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("staff.dashboardPage.headerTitle.subtitle")}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label} className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent orders + top products */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent orders */}
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Đơn hàng gần đây
            </CardTitle>
            <CardDescription>5 đơn hàng mới nhất hôm nay</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                      Mã đơn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                      Khách hàng
                    </th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">
                      Số tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {RECENT_ORDERS.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                        {order.id}
                      </td>
                      <td className="px-6 py-3 font-medium">
                        {order.customer}
                      </td>
                      <td className="hidden px-6 py-3 text-muted-foreground md:table-cell">
                        {order.product}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-medium">
                        {order.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top products */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Sản phẩm bán chạy
            </CardTitle>
            <CardDescription>Top 4 sản phẩm tháng này</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Croissant bơ", sold: 312, pct: 85 },
              { name: "Bánh Madeleine", sold: 248, pct: 67 },
              { name: "Éclair Chocolate", sold: 195, pct: 53 },
              { name: "Tart trái cây", sold: 156, pct: 42 },
            ].map((product) => (
              <div key={product.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-accent" />
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {product.sold} bán
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${product.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
