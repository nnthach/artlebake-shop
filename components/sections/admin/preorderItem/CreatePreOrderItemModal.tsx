"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Loader2, ImageOff, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useI18n } from "@/context/I18nContext";

interface ProductOption {
  id: string;
  name: string;
  price: number;
  image_url: string[];
  is_active: boolean;
}

interface PreorderScheduleOption {
  id: string;
  date: string;
  status: boolean;
}

interface PreorderItemRowState {
  key: string;
  product_id: string;
  quantity: string;
}

const createEmptyRow = (): PreorderItemRowState => ({
  key: crypto.randomUUID(),
  product_id: "",
  quantity: "0",
});

interface CreatePreOrderItemModalProps {
  onCreated?: () => void;
}

export default function CreatePreOrderItemModal({
  onCreated,
}: CreatePreOrderItemModalProps) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<PreorderItemRowState[]>([createEmptyRow()]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [fetchProductsFailed, setFetchProductsFailed] = useState(false);

  const [schedules, setSchedules] = useState<PreorderScheduleOption[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [fetchSchedulesFailed, setFetchSchedulesFailed] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");

  // --------------------------------------------------
  // Fetch products + schedules when modal opens
  // --------------------------------------------------
  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      try {
        setIsLoadingProducts(true);
        setIsLoadingSchedules(true);

        setFetchProductsFailed(false);
        setFetchSchedulesFailed(false);

        const [productsRes, schedulesRes] = await Promise.all([
          fetch(
            `/api/admin/products?is_active=true&locale=${locale}&limit=100`,
            {
              cache: "no-store",
            },
          ),

          fetch("/api/admin/preorder-schedule?status=true", {
            cache: "no-store",
          }),
        ]);

        if (!productsRes.ok) {
          throw new Error("Failed to fetch products");
        }

        if (!schedulesRes.ok) {
          throw new Error("Failed to fetch preorder schedules");
        }

        const productsData = await productsRes.json();
        const schedulesData = await schedulesRes.json();

        if (productsData.success && Array.isArray(productsData.data)) {
          setProducts(productsData.data);
        } else {
          setProducts([]);
        }

        if (schedulesData.success && Array.isArray(schedulesData.data)) {
          setSchedules(schedulesData.data);
        } else {
          setSchedules([]);
        }
      } catch (error) {
        console.error("Fetch preorder modal data error:", error);

        setFetchProductsFailed(true);
        setFetchSchedulesFailed(true);

        setProducts([]);
        setSchedules([]);
      } finally {
        setIsLoadingProducts(false);
        setIsLoadingSchedules(false);
      }
    };

    fetchData();
  }, [open, locale]);

  const getAvailableProducts = (rowKey: string) => {
    const selectedElsewhere = new Set(
      rows
        .filter((row) => row.key !== rowKey && row.product_id)
        .map((row) => row.product_id),
    );

    return products.filter((product) => !selectedElsewhere.has(product.id));
  };

  const formatScheduleDate = (dateString: string) => {
    return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${dateString}T00:00:00`));
  };

  // --------------------------------------------------
  // Row
  // --------------------------------------------------
  const updateRow = (
    key: string,
    field: "product_id" | "quantity",
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );

    if (errors[key]) {
      setErrors((prev) => ({
        ...prev,
        [key]: "",
      }));
    }
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const handleRemoveRow = (key: string) => {
    setRows((prev) => prev.filter((row) => row.key !== key));

    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // --------------------------------------------------
  // Validation
  // --------------------------------------------------
  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    const seenProductIds = new Set<string>();

    if (!selectedScheduleId) {
      nextErrors.schedule = t(
        "admin.preorderItemPage.createModal.errors.scheduleRequired",
      );
    }

    rows.forEach((row) => {
      if (!row.product_id) {
        nextErrors[row.key] = t(
          "admin.preorderItemPage.createModal.errors.productRequired",
        );
        return;
      }

      if (seenProductIds.has(row.product_id)) {
        nextErrors[row.key] = t(
          "admin.preorderItemPage.createModal.errors.productDuplicate",
        );
        return;
      }

      seenProductIds.add(row.product_id);

      const quantity = Number(row.quantity);

      if (
        row.quantity.trim() === "" ||
        Number.isNaN(quantity) ||
        quantity < 0
      ) {
        nextErrors[row.key] = t(
          "admin.preorderItemPage.createModal.errors.quantityInvalid",
        );
      }
    });

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  // submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setIsSubmitting(true);

      const items = rows.map((row) => ({
        product_id: row.product_id,
        quantity: Number(row.quantity),
      }));

      const response = await fetch("/api/admin/preorder-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedule_id: selectedScheduleId,
          items,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to create preorder items");
      }

      setRows([createEmptyRow()]);
      setSelectedScheduleId("");
      setErrors({});

      setOpen(false);

      onCreated?.();
    } catch (error) {
      console.error("Create preorder items error:", error);

      alert(
        error instanceof Error
          ? error.message
          : t("admin.preorderItemPage.createModal.messages.createFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setRows([createEmptyRow()]);
      setSelectedScheduleId("");
      setErrors({});
    }

    setOpen(next);
  };

  const canAddRow =
    !isLoadingProducts && rows.length < products.length && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={"default"} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t("admin.preorderItemPage.createModal.trigger")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {t("admin.preorderItemPage.createModal.title")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5 py-2">
            {/* =========================================
                PRE-ORDER DATE
            ========================================= */}

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {t("admin.preorderItemPage.createModal.fields.scheduleDate")}
              </label>

              <select
                value={selectedScheduleId}
                onChange={(e) => {
                  setSelectedScheduleId(e.target.value);

                  if (errors.schedule) {
                    setErrors((prev) => ({
                      ...prev,
                      schedule: "",
                    }));
                  }
                }}
                disabled={isLoadingSchedules || isSubmitting}
                className={`flex h-10 w-full outline-primary rounded-md border bg-background px-3 py-2 text-sm ${
                  errors.schedule ? "border-red-500" : "border-input"
                }`}
              >
                <option value="">
                  {isLoadingSchedules
                    ? t(
                        "admin.preorderItemPage.createModal.fields.scheduleLoading",
                      )
                    : t(
                        "admin.preorderItemPage.createModal.fields.schedulePlaceholder",
                      )}
                </option>

                {schedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {formatScheduleDate(schedule.date)}
                  </option>
                ))}
              </select>

              {errors.schedule && (
                <p className="text-xs text-red-500">{errors.schedule}</p>
              )}

              {fetchSchedulesFailed && (
                <p className="text-xs text-red-500">
                  {t(
                    "admin.preorderItemPage.createModal.fields.failedLoadSchedules",
                  )}
                </p>
              )}

              {!isLoadingSchedules &&
                !fetchSchedulesFailed &&
                schedules.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "admin.preorderItemPage.createModal.fields.scheduleEmpty",
                    )}
                  </p>
                )}
            </div>

            {/* =========================================
                PRODUCTS
            ========================================= */}

            <div className="space-y-3">
              <div className="flex items-center gap-3 px-1">
                <span className="flex-1 text-sm font-medium">
                  {t("admin.preorderItemPage.createModal.fields.product")}
                </span>

                <span className="w-28 text-sm font-medium">
                  {t("admin.preorderItemPage.createModal.fields.quantity")}
                </span>

                <span className="w-8" />
              </div>

              <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
                {rows.map((row) => {
                  const availableProducts = getAvailableProducts(row.key);

                  const rowError = errors[row.key];

                  const selectedProduct = products.find(
                    (product) => product.id === row.product_id,
                  );

                  return (
                    <div key={row.key} className="space-y-1">
                      <div className="flex items-center gap-3">
                        {/* Product image */}

                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                          {selectedProduct?.image_url?.[0] ? (
                            <Image
                              src={selectedProduct.image_url[0]}
                              alt={selectedProduct.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <ImageOff className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground" />
                          )}
                        </div>

                        {/* Product */}

                        <select
                          value={row.product_id}
                          onChange={(e) =>
                            updateRow(row.key, "product_id", e.target.value)
                          }
                          disabled={isLoadingProducts || isSubmitting}
                          className={`flex h-10 flex-1 outline-primary rounded-md border bg-background px-3 py-2 text-sm ${
                            rowError ? "border-red-500" : "border-input"
                          }`}
                        >
                          <option value="">
                            {isLoadingProducts
                              ? t(
                                  "admin.preorderItemPage.createModal.fields.productLoading",
                                )
                              : t(
                                  "admin.preorderItemPage.createModal.fields.productPlaceholder",
                                )}
                          </option>

                          {availableProducts.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>

                        {/* Quantity */}

                        <input
                          type="number"
                          min={0}
                          value={row.quantity}
                          onChange={(e) =>
                            updateRow(row.key, "quantity", e.target.value)
                          }
                          disabled={isSubmitting}
                          className={`flex h-10 w-28 outline-primary rounded-md border bg-background px-3 py-2 text-sm ${
                            rowError ? "border-red-500" : "border-input"
                          }`}
                        />

                        {/* Remove */}

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveRow(row.key)}
                          disabled={rows.length === 1 || isSubmitting}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {rowError && (
                        <p className="text-xs text-red-500">{rowError}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Product fetch errors */}

              {!isLoadingProducts &&
                !fetchProductsFailed &&
                products.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "admin.preorderItemPage.createModal.fields.productEmpty",
                    )}
                  </p>
                )}

              {fetchProductsFailed && (
                <p className="text-xs text-red-500">
                  {t(
                    "admin.preorderItemPage.createModal.fields.failedLoadProducts",
                  )}
                </p>
              )}

              {/* Add row */}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleAddRow}
                disabled={!canAddRow}
              >
                <Plus className="h-4 w-4" />
                {t("admin.preorderItemPage.createModal.fields.addProduct")}
              </Button>
            </div>
          </div>

          {/* =========================================
              FOOTER
          ========================================= */}

          <DialogFooter className="mt-5 gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                {t("admin.modal.cancel")}
              </Button>
            </DialogClose>

            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingProducts ||
                isLoadingSchedules ||
                schedules.length === 0
              }
              className="min-w-24"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("admin.preorderItemPage.createModal.submit")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
