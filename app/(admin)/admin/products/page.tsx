"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Trash2,
  LayoutGrid,
  Loader2,
  Star,
  RotateCcw,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductItem } from "@/types";
import { useI18n } from "@/context/I18nContext";
import UpdateProductModal from "@/components/sections/admin/products/UpdateProductModal";
import Image from "next/image";
import AdminPagination from "@/components/custom/AdminPagination";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import ProductFilter, {
  DEFAULT_FILTER,
  FilterState,
} from "@/app/(admin)/admin/products/components/Filter";
import { formatStatusBooleanColor } from "@/utils/format-status";
import toast from "react-hot-toast";

export default function AdminProductPage() {
  const { locale, t } = useI18n();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appliedFilter, setAppliedFilter] =
    useState<FilterState>(DEFAULT_FILTER);
  const [tempFilter, setTempFilter] = useState<FilterState>(DEFAULT_FILTER);

  const { page, setPage, pagination, setPagination, resetPage } =
    usePagination();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const isFirstSearch = useRef(true);

  const fetchProducts = useCallback(
    async (filter: FilterState = appliedFilter, pageNum: number = page) => {
      try {
        setIsLoading(true);

        const params = new URLSearchParams();
        if (filter.is_active !== undefined) {
          params.set("is_active", String(filter.is_active));
        }
        params.set("order", filter.order);
        params.set("locale", locale);
        params.set("page", String(pageNum));
        params.set("limit", String(filter.limit));
        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }

        const res = await fetch(`/api/admin/products?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();

        if (data.success && data.data) {
          setProducts(data.data);
          setPagination(data.pagination ?? null);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [appliedFilter, locale, page, debouncedSearch, setPagination],
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // reset to page 1 whenever the (debounced) search term changes
  useEffect(() => {
    if (isFirstSearch.current) {
      isFirstSearch.current = false;
      return;
    }
    resetPage();
    fetchProducts(appliedFilter, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // delete
  const deleteProduct = async (id: string) => {
    try {
      await fetch(`/api/admin/products/${id}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      fetchProducts(appliedFilter, page);
    } catch (error) {
      console.error(error);
      alert("Failed to delete");
    }
  };

  const handleDisabled = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}/disabled`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed to disable product");
      }

      await fetchProducts(appliedFilter, page);

      toast.success(
        locale === "vi"
          ? "Đã ẩn sản phẩm thành công"
          : "Product disabled successfully",
      );
    } catch (error) {
      console.error(error);

      toast.error(
        locale === "vi" ? "Không thể ẩn sản phẩm" : "Failed to disable product",
      );
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}/restore`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed to restore product");
      }

      await fetchProducts(appliedFilter, page);

      toast.success(
        locale === "vi"
          ? "Đã khôi phục sản phẩm thành công"
          : "Product restored successfully",
      );
    } catch (error) {
      console.error(error);

      toast.error(
        locale === "vi"
          ? "Không thể khôi phục sản phẩm"
          : "Failed to restore product",
      );
    }
  };

  // apply filter
  const handleApply = () => {
    setAppliedFilter(tempFilter);
    resetPage();
    fetchProducts(tempFilter, 1);
  };

  // clear filter
  const handleClearFilter = () => {
    setAppliedFilter(DEFAULT_FILTER);
    setTempFilter(DEFAULT_FILTER);
    resetPage();
    fetchProducts(DEFAULT_FILTER, 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {t("admin.productsPage.headerTitle.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.productsPage.headerTitle.subtitle")}
        </p>
      </div>

      {/* Main card */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-md">
        {/* Card header */}
        <ProductFilter
          appliedFilter={appliedFilter}
          tempFilter={tempFilter}
          setTempFilter={setTempFilter}
          search={search}
          setSearch={setSearch}
          onApply={handleApply}
          onClearFilter={handleClearFilter}
          onCreated={() => fetchProducts(appliedFilter)}
        />

        {/* Table */}
        <Table>
          <TableHeader className="bg-gradient-to-br from-white to-[#FAF6F0]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center">
                {t("admin.table.columns.no")}
              </TableHead>
              <TableHead>
                {t("admin.productsPage.table.columns.image")}
              </TableHead>
              <TableHead>
                {t("admin.productsPage.table.columns.name")}
              </TableHead>
              <TableHead>
                {t("admin.productsPage.table.columns.price")}
              </TableHead>
              <TableHead>
                {t("admin.productsPage.table.columns.category")}
              </TableHead>
              <TableHead>
                {t("admin.productsPage.table.columns.bestseller")}
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
                  colSpan={9}
                  className="py-20 text-center text-muted-foreground"
                >
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-20 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-3">
                    <LayoutGrid className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Không tìm thấy sản phẩm nào</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product, index) => (
                <TableRow key={product.id}>
                  <TableCell className="text-center text-muted-foreground text-xs">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="relative w-12 h-12 overflow-hidden rounded-md">
                      <Image
                        src={product.image_url[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="">
                    {product.price.toLocaleString()} VND
                  </TableCell>
                  <TableCell className="">
                    {product.category.name[locale]}
                  </TableCell>
                  <TableCell>
                    {product.is_bestseller ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${formatStatusBooleanColor(
                        product.is_active,
                      )}`}
                    >
                      {t(
                        `admin.storeInventoriesPage.status.${product.is_active ? "active" : "inactive"}`,
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(product.created_at).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <UpdateProductModal
                        product={product}
                        onUpdated={() => fetchProducts(appliedFilter, page)}
                      />
                      {product.is_active ? (
                        <Button
                          onClick={() => handleDisabled(product.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                          aria-label="Disable product"
                          title="Disable product"
                        >
                          <Ban className="h-5 w-5" />
                        </Button>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <Button
                            onClick={() => handleRestore(product.id)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            aria-label="Restore product"
                            title="Restore product"
                          >
                            <RotateCcw className="h-5 w-5" />
                          </Button>
                          <Button
                            onClick={() => deleteProduct(product.id)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            aria-label="Delete product"
                            title="Delete product"
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
              {products.length}
            </span>{" "}
            {t("admin.table.pagination.of")}{" "}
            <span className="font-medium text-foreground">
              {pagination?.total_items ?? products.length}
            </span>{" "}
            {locale == "en" ? "products" : "sản phẩm"}
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
