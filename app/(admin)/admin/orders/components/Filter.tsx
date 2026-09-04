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
import { OrderEnum } from "@/enums/order-status.enum";
import { useI18n } from "@/context/I18nContext";

export interface FilterState {
  status: OrderEnum | undefined;
  sort_by: "created_at" | "full_name";
  order: "asc" | "desc";
  limit: number;
}

export const DEFAULT_LIMIT = 8;

export const LIMIT_OPTIONS = [
  { label: `${DEFAULT_LIMIT}`, value: String(DEFAULT_LIMIT) },
  { label: "10", value: "10" },
  { label: "15", value: "15" },
  { label: "20", value: "20" },
  { label: "50", value: "50" },
];

export const DEFAULT_FILTER: FilterState = {
  status: undefined,
  sort_by: "created_at",
  order: "desc",
  limit: DEFAULT_LIMIT,
};

export interface SelectOption<T extends string> {
  label: string;
  value: T;
}

export interface StatusOption {
  label: string;
  value: OrderEnum | "";
}

interface FilterProps {
  appliedFilter: FilterState;
  tempFilter: FilterState;
  setTempFilter: Dispatch<SetStateAction<FilterState>>;
  search: string;
  setSearch: (value: string) => void;
  onApply: () => void;
  onClearFilter: () => void;
}

export default function Filter({
  appliedFilter,
  tempFilter,
  setTempFilter,
  search,
  setSearch,
  onApply,
  onClearFilter,
}: FilterProps) {
  const { t } = useI18n();

  const statusOptions: StatusOption[] = [
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

  const sortByOptions: SelectOption<FilterState["sort_by"]>[] = [
    {
      label: t("admin.staffsPage.filter.sortByOptions.createdAt"),
      value: "created_at",
    },
    {
      label: t("admin.staffsPage.filter.sortByOptions.fullname"),
      value: "full_name",
    },
  ];

  const orderOptions: SelectOption<FilterState["order"]>[] = [
    { label: t("admin.staffsPage.filter.orderOptions.desc"), value: "desc" },
    { label: t("admin.staffsPage.filter.orderOptions.asc"), value: "asc" },
  ];

  const activeFilterCount =
    (appliedFilter.status !== undefined ? 1 : 0) +
    (appliedFilter.sort_by !== DEFAULT_FILTER.sort_by ||
    appliedFilter.order !== DEFAULT_FILTER.order
      ? 1
      : 0) +
    (appliedFilter.limit !== DEFAULT_FILTER.limit ? 1 : 0);

  const isFilterActive =
    appliedFilter.status !== undefined ||
    appliedFilter.sort_by !== DEFAULT_FILTER.sort_by ||
    appliedFilter.order !== DEFAULT_FILTER.order ||
    appliedFilter.limit !== DEFAULT_FILTER.limit;
  return (
    <div className="flex items-center gap-3 bg-white">
      <Popover onOpenChange={(open) => open && setTempFilter(appliedFilter)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-card hover:border-primary hover:bg-primary/10 hover:text-primary"
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
                {t("admin.orderPage.filter.statusLabel")}
              </p>
              <select
                className="h-9 w-full rounded-md border px-2 text-sm"
                value={tempFilter.status ?? ""}
                onChange={(event) =>
                  setTempFilter((previous) => ({
                    ...previous,
                    status: event.target.value
                      ? (event.target.value as OrderEnum)
                      : undefined,
                  }))
                }
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
                {t("admin.staffsPage.filter.sortByLabel")}
              </p>
              <select
                className="h-9 w-full rounded-md border px-2 text-sm"
                value={tempFilter.sort_by}
                onChange={(event) =>
                  setTempFilter((previous) => ({
                    ...previous,
                    sort_by: event.target.value as FilterState["sort_by"],
                  }))
                }
              >
                {sortByOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <p className="text-sm font-medium leading-none">
                {t("admin.staffsPage.filter.orderLabel")}
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
                {t("admin.orderPage.filter.limitPerPage")}
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
          placeholder={t("admin.orderPage.searchPlaceholder")}
          className="h-9 w-64 border-primary/30 bg-white pl-8 pr-8 text-sm transition-colors hover:border-primary/50 focus:border-primary focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
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
          type="button"
          onClick={onClearFilter}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          {t("button.clearFilter")}
        </button>
      )}
    </div>
  );
}
