"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Filter, LayoutGrid, Loader2, Eye, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { PreorderItem } from "@/types";
import { useI18n } from "@/context/I18nContext";
import Image from "next/image";
import AdminPagination from "@/components/custom/AdminPagination";
import { usePagination } from "@/hooks/usePagination";
import CreatePreOrderItemModal from "@/components/sections/admin/preorderItem/CreatePreOrderItemModal";

const STATUS_OPTIONS = [
  { label: "Tất cả", value: "" },
  { label: "Còn hàng", value: "available" },
  { label: "Không còn hàng", value: "out_of_stock" },
  { label: "Ít hàng", value: "low_stock" },
  { label: "Chờ bắt đầu", value: "draft" },
  { label: "Đã đóng", value: "closed" },
];

const SORT_BY_OPTIONS = [
  { label: "Ngày tạo", value: "created_at" },
  { label: "Tên", value: "name" },
];

const ORDER_OPTIONS = [
  { label: "Giảm dần", value: "desc" },
  { label: "Tăng dần", value: "asc" },
];

const DEFAULT_LIMIT = 8;

const LIMIT_OPTIONS = [
  { label: `${DEFAULT_LIMIT}`, value: String(DEFAULT_LIMIT) },
  { label: "10", value: "10" },
  { label: "15", value: "15" },
  { label: "20", value: "20" },
  { label: "50", value: "50" },
];

interface FilterState {
  status: string;
  sort_by: "name" | "created_at";
  order: "asc" | "desc";
  limit: number;
}

const DEFAULT_FILTER: FilterState = {
  status: "",
  sort_by: "created_at",
  order: "desc",
  limit: DEFAULT_LIMIT,
};

export default function AdminPreOrderItemPage() {
  const [preOrderItems, setPreOrderItems] = useState<PreorderItem[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [appliedFilter, setAppliedFilter] =
    useState<FilterState>(DEFAULT_FILTER);
  const [tempFilter, setTempFilter] = useState<FilterState>(DEFAULT_FILTER);
  const { page, setPage, pagination, setPagination, resetPage } =
    usePagination();

  const { t, locale } = useI18n();

  const fetchPreOrderItem = useCallback(
    async (filter: FilterState = appliedFilter, pageNum: number = page) => {
      try {
        setIsLoading(true);

        const params = new URLSearchParams();

        params.set("date", selectedDate);

        if (filter.status) {
          params.set("status", filter.status);
        }

        params.set("page", String(pageNum));
        params.set("limit", String(filter.limit));

        const res = await fetch(
          `/api/admin/preorder-items?${params.toString()}`,
        );

        if (!res.ok) {
          throw new Error("Failed to fetch daily inventories");
        }

        const data = await res.json();

        if (data.success && data.data) {
          setPreOrderItems(data.data);
          setPagination(data.pagination ?? null);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [appliedFilter, page, setPagination, selectedDate],
  );

  // only fetch inventory once a store_id is available; refetch when it changes
  useEffect(() => {
    fetchPreOrderItem();
  }, [selectedDate, fetchPreOrderItem]);

  // reset to page 1 whenever the selected store changes
  useEffect(() => {
    resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // apply filter
  const handleApply = () => {
    setAppliedFilter(tempFilter);
    resetPage();
    fetchPreOrderItem(tempFilter, 1);
  };

  // clear filter
  const handleClearFilter = () => {
    setAppliedFilter(DEFAULT_FILTER);
    setTempFilter(DEFAULT_FILTER);
    setSelectedDate("");
    resetPage();
    fetchPreOrderItem(DEFAULT_FILTER, 1);
  };

  //check filter
  const isFilterActive =
    appliedFilter.status !== "" ||
    selectedDate !== "" ||
    appliedFilter.sort_by !== DEFAULT_FILTER.sort_by ||
    appliedFilter.order !== DEFAULT_FILTER.order ||
    appliedFilter.limit !== DEFAULT_FILTER.limit;

  const activeFilterCount =
    (appliedFilter.status !== "" ? 1 : 0) +
    (appliedFilter.sort_by !== DEFAULT_FILTER.sort_by ||
    appliedFilter.order !== DEFAULT_FILTER.order
      ? 1
      : 0) +
    (appliedFilter.limit !== DEFAULT_FILTER.limit ? 1 : 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("admin.preorderItemPage.headerTitle.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.preorderItemPage.headerTitle.subtitle")}
        </p>
      </div>

      {/* Main card */}
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
                  className="gap-2 bg-card hover:bg-sand-100"
                >
                  <Filter className="h-4 w-4" />
                  {t("button.filter")}
                  {activeFilterCount > 0 && (
                    <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64">
                <div className="grid gap-4">
                  {/* Status filter */}
                  <div className="grid gap-2">
                    <p className="text-sm font-medium leading-none">
                      Trạng thái
                    </p>

                    <select
                      className="border rounded-md h-9 px-2 w-full text-sm"
                      value={tempFilter.status}
                      onChange={(e) =>
                        setTempFilter((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort by */}
                  <div className="grid gap-2">
                    <p className="text-sm font-medium leading-none">
                      Sắp xếp theo
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

                  {/* Order */}
                  <div className="grid gap-2">
                    <p className="text-sm font-medium leading-none">Thứ tự</p>
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
                      Số dòng mỗi trang
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
                    <Button variant={"default"} size="sm" onClick={handleApply}>
                      {t("button.apply")}
                    </Button>
                  </PopoverClose>
                </div>
              </PopoverContent>
            </Popover>

            {/* Date filter */}
            <input
              type="date"
              className="border rounded-md h-9 px-2 w-40 text-sm bg-card"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                resetPage();
              }}
            />

            {isFilterActive && (
              <button
                onClick={handleClearFilter}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {t("button.clearFilter")}
              </button>
            )}
          </div>

          <CreatePreOrderItemModal
            onCreated={() => fetchPreOrderItem(DEFAULT_FILTER, 1)}
          />
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center">
                {t("admin.table.columns.no")}
              </TableHead>

              <TableHead>
                {t("admin.preorderItemPage.table.columns.image")}
              </TableHead>

              <TableHead>
                {t("admin.preorderItemPage.table.columns.name")}
              </TableHead>

              <TableHead>
                {t("admin.preorderItemPage.table.columns.plannedQuantity")}
              </TableHead>

              <TableHead>
                {t("admin.preorderItemPage.table.columns.remainQuantity")}
              </TableHead>

              <TableHead>
                {t("admin.preorderItemPage.table.columns.scheduleDate")}
              </TableHead>

              <TableHead className="text-right">
                {t("admin.table.columns.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-20 text-center text-muted-foreground"
                >
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : preOrderItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-20 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-3">
                    <LayoutGrid className="h-10 w-10 opacity-30" />

                    <p className="text-sm">
                      {t("admin.preorderItemPage.empty")}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              preOrderItems.map((preOrderItem: PreorderItem, index: number) => {
                const translation =
                  preOrderItem.products.product_translations.find(
                    (tr) => tr.locale === locale,
                  ) ?? preOrderItem.products.product_translations[0];

                const scheduleDate =
                  preOrderItem.preorder_schedules?.date ?? "-";

                return (
                  <TableRow key={preOrderItem.id}>
                    {/* No */}
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {(page - 1) * appliedFilter.limit + index + 1}
                    </TableCell>

                    {/* Image */}
                    <TableCell>
                      <div className="relative h-12 w-12 overflow-hidden rounded-md bg-slate-100">
                        {preOrderItem.products.image_url?.[0] ? (
                          <Image
                            src={preOrderItem.products.image_url[0]}
                            alt={translation?.name ?? ""}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageOff className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Product name */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {translation?.name ?? "-"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Planned quantity */}
                    <TableCell className="font-medium">
                      {preOrderItem.planned_quantity}
                    </TableCell>

                    {/* Remaining quantity */}
                    <TableCell>
                      <span
                        className={
                          preOrderItem.remaining_quantity === 0
                            ? "font-medium text-red-600"
                            : "font-medium"
                        }
                      >
                        {preOrderItem.remaining_quantity}
                      </span>
                    </TableCell>

                    {/* Schedule date */}
                    <TableCell className="font-medium">
                      {scheduleDate}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Footer count */}
        <div className="flex items-center justify-between border-t px-6 py-3">
          <p className="text-xs text-muted-foreground">
            {t("admin.preorderItemPage.showing")}{" "}
            <span className="font-medium text-foreground">
              {preOrderItems.length}
            </span>{" "}
            {t("admin.table.pagination.of")}{" "}
            <span className="font-medium text-foreground">
              {pagination?.total_items ?? preOrderItems.length}
            </span>
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
