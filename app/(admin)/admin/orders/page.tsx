"use client";

import AdminPagination from "@/components/custom/AdminPagination";
import { useI18n } from "@/context/I18nContext";
import { useDebounce } from "@/hooks/useDebounce";
import { usePagination } from "@/hooks/usePagination";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Filter, LayoutGrid, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { OrderItem } from "@/types";
import { OrderEnum } from "@/enums/order-status.enum";
import {
  formatOrderPaymentStatus,
  formatOrderPaymentStatusColor,
  formatOrderStatus,
  formatOrderStatusColor,
  formatOrderType,
  formatOrderTypeColor,
} from "@/utils/format-status";
import OrderDetailSheet from "@/components/sections/admin/orders/OrderDetailSheet";
import { formatDateTime } from "@/utils/format-date";

const DEFAULT_LIMIT = 8;

const LIMIT_OPTIONS = [
  { label: `${DEFAULT_LIMIT}`, value: String(DEFAULT_LIMIT) },
  { label: "10", value: "10" },
  { label: "15", value: "15" },
  { label: "20", value: "20" },
  { label: "50", value: "50" },
];

interface FilterState {
  status: OrderEnum | undefined;
  sort_by: "created_at";
  order: "asc" | "desc";
  limit: number;
}

const DEFAULT_FILTER: FilterState = {
  status: undefined,
  sort_by: "created_at",
  order: "desc",
  limit: DEFAULT_LIMIT,
};

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

  const STATUS_OPTIONS = [
    { label: t("admin.orderPage.filter.statusOptions.all"), value: "" },
    {
      label: t("admin.orderPage.status.order.pending"),
      value: OrderEnum.Pending,
    },
    {
      label: t("admin.orderPage.status.order.confirmed"),
      value: OrderEnum.Confirmed,
    },
    {
      label: t("admin.orderPage.status.order.delivered"),
      value: OrderEnum.Delivered,
    },
    {
      label: t("admin.orderPage.status.order.cancelled"),
      value: OrderEnum.Cancelled,
    },
  ];

  const SORT_BY_OPTIONS = [
    {
      label: t("admin.staffsPage.filter.sortByOptions.createdAt"),
      value: "created_at",
    },
    {
      label: t("admin.staffsPage.filter.sortByOptions.fullname"),
      value: "full_name",
    },
  ];

  const ORDER_OPTIONS = [
    { label: t("admin.staffsPage.filter.orderOptions.desc"), value: "desc" },
    { label: t("admin.staffsPage.filter.orderOptions.asc"), value: "asc" },
  ];

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

  const isFilterActive =
    appliedFilter.status !== undefined ||
    appliedFilter.sort_by !== DEFAULT_FILTER.sort_by ||
    appliedFilter.order !== DEFAULT_FILTER.order ||
    appliedFilter.limit !== DEFAULT_FILTER.limit;

  const activeFilterCount =
    (appliedFilter.status !== undefined ? 1 : 0) +
    (appliedFilter.sort_by !== DEFAULT_FILTER.sort_by ||
    appliedFilter.order !== DEFAULT_FILTER.order
      ? 1
      : 0) +
    (appliedFilter.limit !== DEFAULT_FILTER.limit ? 1 : 0);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {t("admin.orderPage.headerTitle.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.orderPage.headerTitle.subtitle")}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        {/* Card header */}
        <div className="flex items-center justify-between border-b px-4 py-4">
          <div className="flex items-center gap-3">
            <Popover
              onOpenChange={(open) => open && setTempFilter(appliedFilter)}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-card hover:bg-primary/10 hover:text-primary hover:border-primary"
                >
                  <Filter className="h-4 w-4" />
                  {t("button.filter")}
                  {activeFilterCount > 0 && (
                    <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <p className="text-sm font-medium leading-none">
                      {t("admin.orderPage.filter.statusLabel")}
                    </p>
                    <select
                      className="border rounded-md h-9 px-2 w-full text-sm"
                      value={
                        tempFilter.status === undefined ? "" : tempFilter.status
                      }
                      onChange={(e) => {
                        setTempFilter((prev) => ({
                          ...prev,
                          status: e.target.value
                            ? (e.target.value as OrderEnum)
                            : undefined,
                        }));
                      }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <p className="text-sm font-medium leading-none">
                      {t("admin.staffsPage.filter.sortByLabel")}
                    </p>
                    <select
                      className="border rounded-md h-9 px-2 w-full text-sm"
                      value={tempFilter.sort_by}
                      onChange={(e) =>
                        setTempFilter((prev) => ({
                          ...prev,
                          sort_by: e.target.value as FilterState["sort_by"],
                        }))
                      }
                    >
                      {SORT_BY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <p className="text-sm font-medium leading-none">
                      {t("admin.staffsPage.filter.orderLabel")}
                    </p>
                    <select
                      className="border rounded-md h-9 px-2 w-full text-sm"
                      value={tempFilter.order}
                      onChange={(e) =>
                        setTempFilter((prev) => ({
                          ...prev,
                          order: e.target.value as FilterState["order"],
                        }))
                      }
                    >
                      {ORDER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Limit per page */}
                  <div className="grid gap-2">
                    <p className="text-sm font-medium leading-none">
                      {t("admin.orderPage.filter.limitPerPage")}
                    </p>
                    <select
                      className="border rounded-md h-9 px-2 w-full text-sm"
                      value={String(tempFilter.limit)}
                      onChange={(e) =>
                        setTempFilter((prev) => ({
                          ...prev,
                          limit: parseInt(e.target.value, 10),
                        }))
                      }
                    >
                      {LIMIT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <PopoverClose asChild>
                    <Button variant="default" size="sm" onClick={handleApply}>
                      {t("button.apply")}
                    </Button>
                  </PopoverClose>
                </div>
              </PopoverContent>
            </Popover>

            <div className="group relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.orderPage.searchPlaceholder")}
                className="h-9 w-64 border-primary/30 hover:border-primary/50 focus:border-primary focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 bg-white pl-8 pr-8 text-sm transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label={t("admin.orderPage.clearSearch")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {isFilterActive && (
              <button
                onClick={handleClearFilter}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {t("button.clearFilter")}
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader className="bg-sand">
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
