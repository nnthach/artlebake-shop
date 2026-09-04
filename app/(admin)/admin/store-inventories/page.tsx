"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Filter, LayoutGrid, Loader2, Lock, Unlock } from "lucide-react";
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
import { StoreInventoryRaw } from "@/types";
import { useI18n } from "@/context/I18nContext";
import Image from "next/image";
import AdminPagination from "@/components/custom/AdminPagination";
import { usePagination } from "@/hooks/usePagination";
import CreateStoreInventoryModal from "@/components/sections/staff/store-inventory/CreateStoreInventoryModal";
import {
  formatDailyProductStatus,
  formatDailyProductStatusColor,
  formatStatusBooleanColor,
} from "@/utils/format-status";
import { formatDateReverse } from "@/utils/format-date";
import toast from "react-hot-toast";

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

export default function AdminStoreInventoryPage() {
  const [stores, setStoreInventories] = useState<StoreInventoryRaw[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  // const [isPublishing, setIsPublishing] = useState(false);
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
        locale === "vi"
          ? "Mở bán hàng thành công"
          : "Inventory activated",
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
        locale === "vi"
          ? "Đóng hàng bán thành công"
          : "Inventory deactivated",
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

  // const handlePublishAvailable = async () => {
  //   try {
  //     setIsPublishing(true);

  //     const response = await fetch(
  //       "/api/admin/store-inventories/publish-available",
  //       { method: "PATCH" },
  //     );
  //     const data = await response.json();

  //     if (!response.ok || !data.success) {
  //       throw new Error(data.error || "Failed to publish inventories");
  //     }

  //     toast.success(
  //       locale === "vi"
  //         ? `Đã mở bán ${data.updated_count ?? 0} sản phẩm hôm nay`
  //         : `${data.updated_count ?? 0} products published for today`,
  //     );

  //     if (selectedDate) {
  //       setSelectedDate("");
  //       resetPage();
  //     } else {
  //       fetchStoreInventory(appliedFilter, page);
  //     }
  //   } catch (error) {
  //     console.error("Publish inventories error:", error);
  //     toast.error(
  //       locale === "vi"
  //         ? "Không thể mở bán tồn kho hôm nay"
  //         : "Unable to publish today's inventories",
  //     );
  //   } finally {
  //     setIsPublishing(false);
  //   }
  // };

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
        <h1 className="text-2xl font-bold text-primary">
          {t("admin.storeInventoriesPage.headerTitle.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.storeInventoriesPage.headerTitle.subtitle")}
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
                <Button variant="outline" size="sm" className="gap-2 bg-card">
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
              className="border rounded-md h-9 px-2 w-40 text-sm bg-card border-primary/30 hover:border-primary/50 focus:border-primary focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
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

          <div className="flex items-center gap-3">
            {/* <Button
              size="sm"
              disabled={isPublishing}
              onClick={handlePublishAvailable}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Unlock className="h-4 w-4" />
              Publish Available
            </Button> */}

            <CreateStoreInventoryModal
              onCreated={() => fetchStoreInventory(DEFAULT_FILTER, 1)}
            />
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader className="bg-sand">
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
