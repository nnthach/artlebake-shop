"use client";

import { Dispatch, SetStateAction } from "react";
import { Filter as FilterIcon, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useI18n } from "@/context/I18nContext";
import CreateProductModal from "@/components/sections/admin/products/CreateProductModal";

export interface FilterState {
  is_active: boolean | undefined;
  order: "asc" | "desc";
  limit: number;
}

const DEFAULT_LIMIT = 8;

const LIMIT_OPTIONS = [
  { label: `${DEFAULT_LIMIT}`, value: String(DEFAULT_LIMIT) },
  { label: "10", value: "10" },
  { label: "15", value: "15" },
  { label: "20", value: "20" },
  { label: "50", value: "50" },
];

export const DEFAULT_FILTER: FilterState = {
  is_active: undefined,
  order: "desc",
  limit: DEFAULT_LIMIT,
};

interface FilterProps {
  appliedFilter: FilterState;
  tempFilter: FilterState;
  setTempFilter: Dispatch<SetStateAction<FilterState>>;
  search: string;
  setSearch: (value: string) => void;
  onApply: () => void;
  onClearFilter: () => void;
  onCreated: () => void;
}

export default function Filter({
  appliedFilter,
  tempFilter,
  setTempFilter,
  search,
  setSearch,
  onApply,
  onClearFilter,
  onCreated,
}: FilterProps) {
  const { locale, t } = useI18n();

  const statusOptions = [
    { label: t("admin.productsPage.filter.options.all"), value: "" },
    { label: t("admin.productsPage.filter.options.active"), value: "true" },
    {
      label: t("admin.productsPage.filter.options.inactive"),
      value: "false",
    },
  ];

  const orderOptions = [
    {
      label: t("admin.productsPage.filter.options.dateDesc"),
      value: "desc",
    },
    {
      label: t("admin.productsPage.filter.options.dateAsc"),
      value: "asc",
    },
  ];

  const isFilterActive =
    appliedFilter.is_active !== undefined ||
    appliedFilter.order !== DEFAULT_FILTER.order ||
    appliedFilter.limit !== DEFAULT_FILTER.limit;

  const activeFilterCount =
    (appliedFilter.is_active !== undefined ? 1 : 0) +
    (appliedFilter.order !== DEFAULT_FILTER.order ? 1 : 0) +
    (appliedFilter.limit !== DEFAULT_FILTER.limit ? 1 : 0);

  return (
    <div className="flex w-full items-center justify-between border-b border-zinc-100 px-4 py-4">
      <div className="flex items-center gap-3">
        <Popover onOpenChange={(open) => open && setTempFilter(appliedFilter)}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-card hover:bg-sand-100"
            >
              <FilterIcon className="h-4 w-4" />
              {t("button.filter")}
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <p className="text-sm font-medium leading-none">
                  {t("admin.productsPage.filter.status")}
                </p>
                <select
                  className="h-9 w-full rounded-md border px-2 text-sm"
                  value={
                    tempFilter.is_active === undefined
                      ? ""
                      : String(tempFilter.is_active)
                  }
                  onChange={(event) => {
                    const value = event.target.value;
                    setTempFilter((previous) => ({
                      ...previous,
                      is_active: value === "" ? undefined : value === "true",
                    }));
                  }}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <p className="text-sm font-medium leading-none">
                  {t("admin.productsPage.filter.order")}
                </p>
                <select
                  className="h-9 w-full rounded-md border px-2 text-sm"
                  value={tempFilter.order}
                  onChange={(event) =>
                    setTempFilter((previous) => ({
                      ...previous,
                      order: event.target.value as FilterState["order"],
                    }))
                  }
                >
                  {orderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <p className="text-sm font-medium leading-none">
                  {t("admin.productsPage.filter.limit")}
                </p>
                <select
                  className="h-9 w-full rounded-md border px-2 text-sm"
                  value={String(tempFilter.limit)}
                  onChange={(event) =>
                    setTempFilter((previous) => ({
                      ...previous,
                      limit: parseInt(event.target.value, 10),
                    }))
                  }
                >
                  {LIMIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <PopoverClose asChild>
                <Button variant="default" size="sm" onClick={onApply}>
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
            onChange={(event) => setSearch(event.target.value)}
            placeholder={
              locale === "vi" ? "Tìm sản phẩm..." : "Search products..."
            }
            className="h-9 w-56 border-primary/30 bg-white pl-8 pr-8 text-sm transition-colors hover:border-primary/50 focus:border-primary focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label={locale === "vi" ? "Xóa tìm kiếm" : "Clear search"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {isFilterActive && (
          <button
            type="button"
            onClick={onClearFilter}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            {t("button.clearFilter")}
          </button>
        )}
      </div>

      <CreateProductModal onCreated={onCreated} />
    </div>
  );
}
