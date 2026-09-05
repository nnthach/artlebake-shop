"use client";

import AdminPagination from "@/components/custom/AdminPagination";
import { useI18n } from "@/context/I18nContext";
import { useDebounce } from "@/hooks/useDebounce";
import { usePagination } from "@/hooks/usePagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { LayoutGrid, Loader2 } from "lucide-react";
import { OrderItem } from "@/types";
import {
  formatOrderPaymentStatus,
  formatOrderPaymentStatusColor,
  formatOrderStatus,
  formatOrderStatusColor,
  formatOrderType,
  formatOrderTypeColor,
} from "@/utils/format-status";
import OrderDetailSheet from "@/components/sections/admin/orders/OrderDetailSheet";
import OrderFilter, {
  DEFAULT_FILTER,
  FilterState,
} from "@/app/(admin)/admin/orders/components/Filter";
import { formatDateTime } from "@/utils/format-date";

export default function AdminOrderPage() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appliedFilter, setAppliedFilter] =
    useState<FilterState>(DEFAULT_FILTER);
  const [tempFilter, setTempFilter] = useState<FilterState>(DEFAULT_FILTER);
  const { page, setPage, pagination, setPagination, resetPage } =
    usePagination();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const isFirstSearch = useRef(true);

  // fetch orders from API
  const fetchOrders = useCallback(
    async (filter: FilterState = appliedFilter, pageNum: number = page) => {
      try {
        setIsLoading(true);

        // get param
        const params = new URLSearchParams();
        if (filter.status !== undefined) {
          params.set("status", filter.status);
        }
        params.set("sort_by", filter.sort_by);
        params.set("order", filter.order);
        params.set("page", String(pageNum));
        params.set("limit", String(filter.limit));
        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }

        // call api
        const res = await fetch(`/api/admin/orders?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();

        // check
        if (data.success && data.data) {
          setOrders(data.data);
          setPagination(data.pagination ?? null);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [appliedFilter, page, debouncedSearch, setPagination],
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // reset to page 1 whenever the (debounced) search term changes
  useEffect(() => {
    if (isFirstSearch.current) {
      isFirstSearch.current = false;
      return;
    }
    resetPage();
    fetchOrders(appliedFilter, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleApply = () => {
    setAppliedFilter(tempFilter);
    resetPage();
    fetchOrders(tempFilter, 1);
  };

  const handleClearFilter = () => {
    setAppliedFilter(DEFAULT_FILTER);
    setTempFilter(DEFAULT_FILTER);
    resetPage();
    fetchOrders(DEFAULT_FILTER, 1);
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {t("admin.orderPage.headerTitle.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.orderPage.headerTitle.subtitle")}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-100 bg-white shadow-md">
        {/* Card header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4">
          <OrderFilter
            appliedFilter={appliedFilter}
            tempFilter={tempFilter}
            setTempFilter={setTempFilter}
            search={search}
            setSearch={setSearch}
            onApply={handleApply}
            onClearFilter={handleClearFilter}
          />
        </div>

        {/* Table */}
        <Table>
          <TableHeader className="bg-gradient-to-br from-white to-[#FAF6F0] border-zinc-50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="">
                {t("admin.orderPage.table.columns.orderCode")}
              </TableHead>
              <TableHead className="">
                {t("admin.orderPage.table.columns.customer")}
              </TableHead>
              <TableHead className="">
                {t("admin.orderPage.table.columns.total")} (VND)
              </TableHead>
              <TableHead className="">
                {t("admin.orderPage.table.columns.orderType")}
              </TableHead>

              <TableHead className="">
                {t("admin.orderPage.table.columns.orderStatus")}
              </TableHead>
              <TableHead className="">
                {t("admin.orderPage.table.columns.paymentStatus")}
              </TableHead>
              <TableHead className="">
                {t("admin.orderPage.table.columns.createdAt")}
              </TableHead>
              <TableHead className="text-right ">
                {t("admin.table.columns.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-20 text-center text-muted-foreground"
                >
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-20 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-3">
                    <LayoutGrid className="h-10 w-10 opacity-30" />
                    <p className="text-sm">{t("admin.orderPage.empty")}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="text-sm font-semibold">
                    {order?.order_code}
                  </TableCell>
                  <TableCell className="font-medium flex flex-col">
                    <span className="font-semibold">{order?.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {order?.phone}
                    </span>
                  </TableCell>

                  <TableCell className="text-sm ">
                    {order?.total?.toLocaleString("vi-VN") ?? "-"}
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${formatOrderTypeColor(
                        order?.order_type,
                      )}`}
                    >
                      {t(
                        `admin.orderPage.status.orderType.${formatOrderType(
                          order.order_type,
                        )}`,
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${formatOrderStatusColor(
                        order?.status,
                      )}`}
                    >
                      {t(
                        `admin.orderPage.status.order.${formatOrderStatus(
                          order?.status,
                        )}`,
                      )}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${formatOrderPaymentStatusColor(
                        order?.payment_status,
                      )}`}
                    >
                      {t(
                        `admin.orderPage.status.payment.${formatOrderPaymentStatus(
                          order?.payment_status,
                        )}`,
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(order?.created_at || "").full}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <OrderDetailSheet
                        orderId={order.id}
                        onUpdated={() => fetchOrders()}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t px-6 py-3">
          <p className="text-xs text-muted-foreground">
            {t("admin.orderPage.showing")}{" "}
            <span className="font-medium text-foreground">{orders.length}</span>{" "}
            {t("admin.table.pagination.of")}{" "}
            <span className="font-medium text-foreground">
              {pagination?.total_items ?? orders.length}
            </span>{" "}
            {t("admin.orderPage.order")}
          </p>

          <AdminPagination
            page={page}
            totalPages={pagination?.total_pages ?? 0}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
