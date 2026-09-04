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
import { CategoryItem } from "@/types";
import { useI18n } from "@/context/I18nContext";
import UpdateCategoryModal from "@/components/sections/admin/categories/UpdateCategoryModal";
import AdminPagination from "@/components/custom/AdminPagination";
import { usePagination } from "@/hooks/usePagination";
import CategoryFilter, {
  DEFAULT_FILTER,
  FilterState,
} from "@/app/(admin)/admin/categories/components/Filter";
import { formatStatusBooleanColor } from "@/utils/format-status";
import toast from "react-hot-toast";

export default function AdminCategoryPage() {
  const { t, locale } = useI18n();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appliedFilter, setAppliedFilter] =
    useState<FilterState>(DEFAULT_FILTER);
  const [tempFilter, setTempFilter] = useState<FilterState>(DEFAULT_FILTER);

  const { page, setPage, pagination, setPagination, resetPage } =
    usePagination();

  const fetchCategories = useCallback(
    async (filter: FilterState = appliedFilter, pageNum: number = page) => {
      try {
        setIsLoading(true);

        const params = new URLSearchParams();
        if (filter.is_active !== undefined) {
          params.set("is_active", String(filter.is_active));
        }
        params.set("sort_by", filter.sort_by);
        params.set("order", filter.order);
        params.set("page", String(pageNum));
        params.set("limit", String(filter.limit));

        const res = await fetch(`/api/admin/categories?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();

        if (data.success && data.data) {
          setCategories(data.data);
          setPagination(data.pagination ?? null);
        }
      } catch (error) {
        console.error(error);
        alert("Không thể tải danh sách danh mục.");
      } finally {
        setIsLoading(false);
      }
    },
    [appliedFilter, page, setPagination],
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // DELETE METHOD
  const deleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to delete category");
      await fetchCategories(appliedFilter, page);
      toast.success(
        locale === "vi"
          ? "Đã xóa danh mục thành công"
          : "Category deleted successfully",
      );
    } catch (error) {
      console.error(error);
      toast.error(
        locale === "vi" ? "Không thể xóa danh mục" : "Failed to delete category",
      );
    }
  };

  const handleDisabled = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}/disabled`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to disable category");
      await fetchCategories(appliedFilter, page);
      toast.success(
        locale === "vi"
          ? "Đã vô hiệu hóa danh mục thành công"
          : "Category disabled successfully",
      );
    } catch (error) {
      console.error(error);
      toast.error(
        locale === "vi"
          ? "Không thể vô hiệu hóa danh mục"
          : "Failed to disable category",
      );
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}/restore`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to restore category");
      await fetchCategories(appliedFilter, page);
      toast.success(
        locale === "vi"
          ? "Đã khôi phục danh mục thành công"
          : "Category restored successfully",
      );
    } catch (error) {
      console.error(error);
      toast.error(
        locale === "vi"
          ? "Không thể khôi phục danh mục"
          : "Failed to restore category",
      );
    }
  };

  // apply filter
  const handleApply = () => {
    setAppliedFilter(tempFilter);
    resetPage();
    fetchCategories(tempFilter, 1);
  };

  // clear filter
  const handleClearFilter = () => {
    setAppliedFilter(DEFAULT_FILTER);
    setTempFilter(DEFAULT_FILTER);
    resetPage();
    fetchCategories(DEFAULT_FILTER, 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {t("admin.categoriesPage.headerTitle.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.categoriesPage.headerTitle.subtitle")}
        </p>
      </div>

      {/* Main card */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-md">
        <CategoryFilter
          appliedFilter={appliedFilter}
          tempFilter={tempFilter}
          setTempFilter={setTempFilter}
          onApply={handleApply}
          onClearFilter={handleClearFilter}
          onCreated={() => fetchCategories(appliedFilter)}
        />

        {/* Table */}
        <Table>
          <TableHeader className="bg-gradient-to-br from-white to-[#FAF6F0]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center">
                {t("admin.table.columns.no")}
              </TableHead>
              <TableHead>
                {t("admin.categoriesPage.table.columns.name")}
              </TableHead>
              <TableHead>
                {t("admin.categoriesPage.table.columns.description")}
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
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-20 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-3">
                    <LayoutGrid className="h-10 w-10 opacity-30" />
                    <p className="text-sm">
                      {locale == "vi"
                        ? "Không tìm thấy danh mục nào"
                        : "No categories found"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category, index) => (
                <TableRow key={category.id}>
                  <TableCell className="text-center text-muted-foreground text-xs">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {category.name[locale] ?? category.name.vi}
                  </TableCell>
                  <TableCell className="text-sm">
                    {category.description?.[locale] ?? category.description?.vi}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${formatStatusBooleanColor(
                        category.is_active,
                      )}`}
                    >
                      {t(
                        `admin.storeInventoriesPage.status.${category.is_active ? "active" : "inactive"}`,
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(category.created_at).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <UpdateCategoryModal
                        id={category.id}
                        defaultValues={{
                          name_vi: category.name.vi,
                          description_vi: category.description.vi,
                          name_en: category.name.en,
                          description_en: category.description.en,
                        }}
                        onUpdated={() => fetchCategories(appliedFilter, page)}
                      />
                      {category.is_active ? (
                        <Button
                          onClick={() => handleDisabled(category.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                          aria-label="Disable category"
                          title="Disable category"
                        >
                          <Ban className="h-5 w-5" />
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleRestore(category.id)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            aria-label="Restore category"
                            title="Restore category"
                          >
                            <RotateCcw className="h-5 w-5" />
                          </Button>
                          <Button
                            onClick={() => deleteCategory(category.id)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Delete category"
                            title="Delete category"
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
              {categories.length}
            </span>{" "}
            {t("admin.table.pagination.of")}{" "}
            <span className="font-medium text-foreground">
              {pagination?.total_items ?? categories.length}
            </span>{" "}
            {locale == "vi" ? "danh mục" : "categories"}
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
