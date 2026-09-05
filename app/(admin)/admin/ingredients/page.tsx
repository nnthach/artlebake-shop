"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Ban, Trash2, LayoutGrid, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IngredientItem } from "@/types";
import { useI18n } from "@/context/I18nContext";
import UpdateIngredientModal from "@/components/sections/admin/ingredients/UpdateIngredientModal";
import AdminPagination from "@/components/custom/AdminPagination";
import { usePagination } from "@/hooks/usePagination";
import IngredientFilter, {
  DEFAULT_FILTER,
  FilterState,
} from "@/app/(admin)/admin/ingredients/components/Filter";
import { formatStatusBooleanColor } from "@/utils/format-status";
import toast from "react-hot-toast";

export default function AdminIngredientPage() {
  const { t, locale } = useI18n();

  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appliedFilter, setAppliedFilter] =
    useState<FilterState>(DEFAULT_FILTER);
  const [tempFilter, setTempFilter] = useState<FilterState>(DEFAULT_FILTER);

  const { page, setPage, pagination, setPagination, resetPage } =
    usePagination();

  const fetchIngredients = useCallback(
    async (filter: FilterState = appliedFilter, pageNum: number = page) => {
      try {
        setIsLoading(true);

        // get param
        const params = new URLSearchParams();
        if (filter.is_active !== undefined) {
          params.set("is_active", String(filter.is_active));
        }
        params.set("sort_by", filter.sort_by);
        params.set("order", filter.order);
        params.set("page", String(pageNum));
        params.set("limit", String(filter.limit));

        // call api
        const res = await fetch(`/api/admin/ingredients?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch ingredients");
        const data = await res.json();

        // check
        if (data.success && data.data) {
          setIngredients(data.data);
          setPagination(data.pagination ?? null);
        }
      } catch (error) {
        console.error(error);
        alert("Không thể tải danh sách nguyên liệu.");
      } finally {
        setIsLoading(false);
      }
    },
    [appliedFilter, page, setPagination],
  );

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  // delete
  const deleteIngredient = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ingredients/${id}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to delete ingredient");
      await fetchIngredients(appliedFilter, page);
      toast.success(
        locale === "vi"
          ? "Đã xóa nguyên liệu thành công"
          : "Ingredient deleted successfully",
      );
    } catch (error) {
      console.error(error);
      toast.error(
        locale === "vi"
          ? "Không thể xóa nguyên liệu"
          : "Failed to delete ingredient",
      );
    }
  };

  const handleDisabled = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ingredients/${id}/disabled`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to disable ingredient");
      await fetchIngredients(appliedFilter, page);
      toast.success(
        locale === "vi"
          ? "Đã vô hiệu hóa nguyên liệu thành công"
          : "Ingredient disabled successfully",
      );
    } catch (error) {
      console.error(error);
      toast.error(
        locale === "vi"
          ? "Không thể vô hiệu hóa nguyên liệu"
          : "Failed to disable ingredient",
      );
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ingredients/${id}/restore`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to restore ingredient");
      await fetchIngredients(appliedFilter, page);
      toast.success(
        locale === "vi"
          ? "Đã khôi phục nguyên liệu thành công"
          : "Ingredient restored successfully",
      );
    } catch (error) {
      console.error(error);
      toast.error(
        locale === "vi"
          ? "Không thể khôi phục nguyên liệu"
          : "Failed to restore ingredient",
      );
    }
  };

  // apply filter
  const handleApply = () => {
    setAppliedFilter(tempFilter);
    resetPage();
    fetchIngredients(tempFilter, 1);
  };

  // clear filter
  const handleClearFilter = () => {
    setAppliedFilter(DEFAULT_FILTER);
    setTempFilter(DEFAULT_FILTER);
    resetPage();
    fetchIngredients(DEFAULT_FILTER, 1);
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {t("admin.ingredientsPage.headerTitle.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.ingredientsPage.headerTitle.subtitle")}
        </p>
      </div>

      {/* Main card */}
      <div className="rounded-xl border border-zinc-100 bg-white shadow-md">
        {/* Card header */}
        <IngredientFilter
          appliedFilter={appliedFilter}
          tempFilter={tempFilter}
          setTempFilter={setTempFilter}
          onApply={handleApply}
          onClearFilter={handleClearFilter}
          onCreated={() => fetchIngredients(appliedFilter)}
        />

        {/* Table */}
        <Table>
          <TableHeader className="bg-gradient-to-br from-white to-[#FAF6F0]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center">
                {t("admin.table.columns.no")}
              </TableHead>
              <TableHead>
                {t("admin.ingredientsPage.table.columns.name")}
              </TableHead>
              <TableHead>{t("admin.table.columns.status")}</TableHead>
              <TableHead>{t("admin.table.columns.createdAt")}</TableHead>
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
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : ingredients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-20 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-3">
                    <LayoutGrid className="h-10 w-10 opacity-30" />
                    <p className="text-sm">
                      {locale == "vi"
                        ? "Không tìm thấy nguyên liệu nào"
                        : "No ingredients found"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              ingredients.map((ingredient, index) => (
                <TableRow key={ingredient.id}>
                  <TableCell className="text-center text-muted-foreground text-xs">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {ingredient.name[locale]}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${formatStatusBooleanColor(
                        ingredient.is_active,
                      )}`}
                    >
                      {t(
                        `admin.storeInventoriesPage.status.${ingredient.is_active ? "active" : "inactive"}`,
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(ingredient.created_at).toLocaleDateString(
                      "vi-VN",
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <UpdateIngredientModal
                        id={ingredient.id}
                        defaultValues={{
                          name_vi: ingredient.name.vi,
                          name_en: ingredient.name.en,
                        }}
                        onUpdated={() => fetchIngredients(appliedFilter)}
                      />
                      {ingredient.is_active ? (
                        <Button
                          onClick={() => handleDisabled(ingredient.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                          aria-label="Disable ingredient"
                          title="Disable ingredient"
                        >
                          <Ban className="h-5 w-5" />
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleRestore(ingredient.id)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            aria-label="Restore ingredient"
                            title="Restore ingredient"
                          >
                            <RotateCcw className="h-5 w-5" />
                          </Button>
                          <Button
                            onClick={() => deleteIngredient(ingredient.id)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Delete ingredient"
                            title="Delete ingredient"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer count */}
        <div className="flex items-center justify-between border-t px-6 py-3">
          <p className="text-xs text-muted-foreground">
            {t("admin.table.pagination.showing")}{" "}
            <span className="font-medium text-foreground">
              {ingredients.length}
            </span>{" "}
            {t("admin.table.pagination.of")}{" "}
            <span className="font-medium text-foreground">
              {pagination?.total_items ?? ingredients.length}
            </span>{" "}
            {locale == "vi" ? "nguyên liệu" : "ingredients"}
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
