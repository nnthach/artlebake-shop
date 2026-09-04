"use client";

import React, { useCallback, useEffect, useState } from "react";
import { LayoutGrid, Loader2, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StoreInventoryRaw } from "@/types";
import { useI18n } from "@/context/I18nContext";
import Image from "next/image";
import AdminPagination from "@/components/custom/AdminPagination";
import { usePagination } from "@/hooks/usePagination";
import InventoryFilter, {
  DEFAULT_FILTER,
  FilterState,
} from "@/app/(admin)/admin/store-inventories/components/Filter";
import {
  formatDailyProductStatus,
  formatDailyProductStatusColor,
  formatStatusBooleanColor,
} from "@/utils/format-status";
import { formatDateReverse } from "@/utils/format-date";
import toast from "react-hot-toast";

export default function AdminStoreInventoryPage() {
  const [stores, setStoreInventories] = useState<StoreInventoryRaw[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [appliedFilter, setAppliedFilter] =
    useState<FilterState>(DEFAULT_FILTER);
  const [tempFilter, setTempFilter] = useState<FilterState>(DEFAULT_FILTER);
  const { page, setPage, pagination, setPagination, resetPage } =
    usePagination();

  const { t, locale } = useI18n();

  const fetchStoreInventory = useCallback(
    async (filter: FilterState = appliedFilter, pageNum: number = page) => {
      try {
        setIsLoading(true);

        const params = new URLSearchParams();

        params.set("date", selectedDate);

        if (filter.status) {
          params.set("status", filter.status);
        }

        params.set("sort_by", filter.sort_by);
        params.set("order", filter.order);
        params.set("page", String(pageNum));
        params.set("limit", String(filter.limit));

        const res = await fetch(
          `/api/admin/store-inventories?${params.toString()}`,
        );

        if (!res.ok) {
          throw new Error("Failed to fetch daily inventories");
        }

        const data = await res.json();

        if (data.success && data.data) {
          setStoreInventories(data.data);
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
    fetchStoreInventory();
  }, [selectedDate, fetchStoreInventory]);

  // reset to page 1 whenever the selected store changes
  useEffect(() => {
    resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // apply filter
  const handleApply = () => {
    setAppliedFilter(tempFilter);
    resetPage();
    fetchStoreInventory(tempFilter, 1);
  };

  // clear filter
  const handleClearFilter = () => {
    setAppliedFilter(DEFAULT_FILTER);
    setTempFilter(DEFAULT_FILTER);
    setSelectedDate("");
    resetPage();
    fetchStoreInventory(DEFAULT_FILTER, 1);
  };

  const handleActive = async (inventoryId: string) => {
    try {
      setIsUpdating(true);

      const response = await fetch(
        `/api/admin/store-inventories/${inventoryId}/active`,
        { method: "PATCH" },
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update inventory status");
      }

      setStoreInventories((prev) =>
        prev.map((inventory) =>
          inventory.id === inventoryId
            ? { ...inventory, is_active: true }
            : inventory,
        ),
      );

      toast.success(
        locale === "vi" ? "Mở bán hàng thành công" : "Inventory activated",
      );
    } catch (error) {
      console.error("Activate inventory error:", error);
      toast.error(
        locale === "vi"
          ? "Không thể cập nhật trạng thái hàng"
          : "Unable to activate inventory",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInactive = async (inventoryId: string) => {
    try {
      setIsUpdating(true);

      const response = await fetch(
        `/api/admin/store-inventories/${inventoryId}/inactive`,
        { method: "PATCH" },
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update inventory status");
      }

      setStoreInventories((prev) =>
        prev.map((inventory) =>
          inventory.id === inventoryId
            ? { ...inventory, is_active: false }
            : inventory,
        ),
      );

      toast.success(
        locale === "vi" ? "Đóng hàng bán thành công" : "Inventory deactivated",
      );
    } catch (error) {
      console.error("Deactivate inventory error:", error);
      toast.error(
        locale === "vi"
          ? "Không thể cập nhật trạng thái hàng"
          : "Unable to deactivate inventory",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {t("admin.storeInventoriesPage.headerTitle.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.storeInventoriesPage.headerTitle.subtitle")}
        </p>
      </div>

      {/* Main card */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-md">
        {/* Card header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4">
          <InventoryFilter
            appliedFilter={appliedFilter}
            tempFilter={tempFilter}
            setTempFilter={setTempFilter}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}

            onApply={handleApply}
            onClearFilter={handleClearFilter}
            onCreated={() => fetchStoreInventory(DEFAULT_FILTER, 1)}
          />
        </div>

        {/* Table */}
        <Table>
          <TableHeader className="bg-gradient-to-br from-white to-[#FAF6F0]">
            <TableRow className="hover:bg-sand">
              <TableHead className="w-12 text-center">
                {t("admin.table.columns.no")}
              </TableHead>
              <TableHead>
                {t("admin.storeInventoriesPage.table.columns.image")}
              </TableHead>
              <TableHead>
                {t("admin.storeInventoriesPage.table.columns.name")}
              </TableHead>
              <TableHead>
                {t("admin.storeInventoriesPage.table.columns.plannedQuantity")}
              </TableHead>
              <TableHead>
                {t("admin.storeInventoriesPage.table.columns.remainQuantity")}
              </TableHead>
              <TableHead>
                {t("admin.storeInventoriesPage.table.columns.status")}
              </TableHead>
              <TableHead>
                {t("admin.storeInventoriesPage.table.columns.isActive")}
              </TableHead>
              <TableHead>
                {t("admin.storeInventoriesPage.table.columns.businessDate")}
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
                  colSpan={9}
                  className="py-20 text-center text-muted-foreground"
                >
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : stores.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-20 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-3">
                    <LayoutGrid className="h-10 w-10 opacity-30" />
                    <p className="text-sm">
                      {t("admin.storeInventoriesPage.empty")}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              stores.map((storeInventory, index) => {
                const translation =
                  storeInventory.products.product_translations.find(
                    (tr) => tr.locale === locale,
                  ) ?? storeInventory.products.product_translations[0];

                return (
                  <TableRow key={storeInventory.id}>
                    <TableCell className="text-center text-muted-foreground text-xs">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="relative w-12 h-12 overflow-hidden rounded-md">
                        <Image
                          src={storeInventory.products.image_url[0]}
                          alt={translation?.name ?? ""}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {translation?.name}
                    </TableCell>
                    <TableCell className="font-medium">
                      {storeInventory.planned_quantity}
                    </TableCell>
                    <TableCell className="font-medium">
                      {storeInventory.remaining_quantity}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${formatDailyProductStatusColor(
                          storeInventory?.status,
                        )}`}
                      >
                        {t(
                          `admin.storeInventoriesPage.status.${formatDailyProductStatus(
                            storeInventory?.status,
                          )}`,
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${formatStatusBooleanColor(
                          storeInventory.is_active,
                        )}`}
                      >
                        {t(
                          `admin.storeInventoriesPage.status.${storeInventory.is_active ? "active" : "inactive"}`,
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatDateReverse(storeInventory.business_date) ?? "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          disabled={isUpdating || !storeInventory.is_active}
                          onClick={() => handleInactive(storeInventory.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-primary/10"
                        >
                          <Lock className="h-5 w-5" strokeWidth={2.5} />
                        </Button>
                        <Button
                          disabled={isUpdating || storeInventory.is_active}
                          onClick={() => handleActive(storeInventory.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-400 hover:text-green-600 hover:bg-green-600/10"
                        >
                          <Unlock className="h-5 w-5" strokeWidth={2.5} />
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
            {t("admin.storeInventoriesPage.showing")}{" "}
            <span className="font-medium text-foreground">{stores.length}</span>{" "}
            {t("admin.table.pagination.of")}{" "}
            <span className="font-medium text-foreground">
              {pagination?.total_items ?? stores.length}
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
