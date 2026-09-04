"use client";

import React, { useCallback, useEffect, useState } from "react";
import { LayoutGrid, Loader2, ImageOff, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import PreOrderItemFilter, {
  DEFAULT_FILTER,
  FilterState,
} from "@/app/(admin)/admin/preorder-items/components/Filter";
import {
  formatStatusBoolean,
  formatStatusBooleanColor,
} from "@/utils/format-status";

export default function AdminPreOrderItemPage() {
  const { t, locale } = useI18n();

  const [preOrderItems, setPreOrderItems] = useState<PreorderItem[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [appliedFilter, setAppliedFilter] =
    useState<FilterState>(DEFAULT_FILTER);
  const [tempFilter, setTempFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { page, setPage, pagination, setPagination, resetPage } =
    usePagination();

  const fetchPreOrderItem = useCallback(
    async (filter: FilterState = appliedFilter, pageNum: number = page) => {
      try {
        setIsLoading(true);

        const params = new URLSearchParams();

        params.set("date", selectedDate);

        if (filter.status !== "") {
          params.set("is_active", filter.status);
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

  const handleToggleActive = async (item: PreorderItem) => {
    try {
      setUpdatingId(item.id);

      const response = await fetch(`/api/admin/preorder-items/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !item.is_active,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update preorder item");
      }

      // Cách đơn giản nhất: reload lại list
      await fetchPreOrderItem();
    } catch (error) {
      console.error("Toggle preorder item error:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {t("admin.preorderItemPage.headerTitle.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.preorderItemPage.headerTitle.subtitle")}
        </p>
      </div>

      {/* Main card */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-md">
        {/* Card header */}
        <PreOrderItemFilter
          appliedFilter={appliedFilter}
          tempFilter={tempFilter}
          setTempFilter={setTempFilter}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onApply={handleApply}
          onClearFilter={handleClearFilter}
          onCreated={() => fetchPreOrderItem(DEFAULT_FILTER, 1)}
        />

        {/* Table */}
        <Table>
          <TableHeader className="bg-gradient-to-br from-white to-[#FAF6F0]">
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

              <TableHead>
                {t("admin.preorderItemPage.table.columns.status")}
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
                  colSpan={8}
                  className="py-20 text-center text-muted-foreground"
                >
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : preOrderItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
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

                    {/* Status */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${formatStatusBooleanColor(
                          preOrderItem?.is_active,
                        )}`}
                      >
                        {t(
                          `admin.preorderItemPage.status.${formatStatusBoolean(
                            preOrderItem?.is_active,
                          )}`,
                        )}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {/* Toggle active */}
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={updatingId === preOrderItem.id}
                          onClick={() => handleToggleActive(preOrderItem)}
                          className={`h-8 w-8 

                            ${
                              preOrderItem.is_active
                                ? "text-red-400 hover:text-red-600 hover:bg-primary/10"
                                : "text-green-400 hover:text-green-600 hover:bg-green-600/10"
                            }
                          `}
                        >
                          {updatingId === preOrderItem.id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : preOrderItem.is_active ? (
                            <Lock className="h-5 w-5" strokeWidth={2.5} />
                          ) : (
                            <Unlock className="h-5 w-5" strokeWidth={2.5} />
                          )}
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
