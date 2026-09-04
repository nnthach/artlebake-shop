"use client";

import { Dispatch, SetStateAction } from "react";
import { Filter as FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useI18n } from "@/context/I18nContext";
import CreateCategoryModal from "@/components/sections/admin/categories/CreateCategoryModal";

export interface FilterState {
  is_active: boolean | undefined;
  sort_by: "name" | "created_at";
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
  sort_by: "created_at",
  order: "desc",
  limit: DEFAULT_LIMIT,
};

interface FilterProps {
  appliedFilter: FilterState;
  tempFilter: FilterState;
  setTempFilter: Dispatch<SetStateAction<FilterState>>;
  onApply: () => void;
  onClearFilter: () => void;
  onCreated: () => void;
}

export default function Filter({
  appliedFilter,
  tempFilter,
  setTempFilter,
  onApply,
  onClearFilter,
  onCreated,
}: FilterProps) {
  const { t } = useI18n();

  const statusOptions = [
    { label: t("admin.categoriesPage.filter.options.all"), value: "" },
    { label: t("admin.categoriesPage.filter.options.active"), value: "true" },
    {
      label: t("admin.categoriesPage.filter.options.inactive"),
      value: "false",
    },
  ];

  const sortByOptions = [
    {
      label: t("admin.categoriesPage.filter.options.createdAt"),
      value: "created_at",
    },
    {
      label: t("admin.categoriesPage.filter.options.name"),
      value: "name",
    },
  ];

  const orderOptions = [
    {
      label: t("admin.categoriesPage.filter.options.desc"),
      value: "desc",
    },
    {
      label: t("admin.categoriesPage.filter.options.asc"),
      value: "asc",
    },
  ];

  const isFilterActive =
    appliedFilter.is_active !== undefined ||
    appliedFilter.sort_by !== DEFAULT_FILTER.sort_by ||
    appliedFilter.order !== DEFAULT_FILTER.order ||
    appliedFilter.limit !== DEFAULT_FILTER.limit;

  const activeFilterCount =
    (appliedFilter.is_active !== undefined ? 1 : 0) +
    (appliedFilter.sort_by !== DEFAULT_FILTER.sort_by ||
    appliedFilter.order !== DEFAULT_FILTER.order
      ? 1
      : 0) +
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
          <PopoverContent align="start" className="w-56">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <p className="text-sm font-medium leading-none">
                  {t("admin.categoriesPage.filter.status")}
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
                  {t("admin.categoriesPage.filter.sortBy")}
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
                  {t("admin.categoriesPage.filter.order")}
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
                  {t("admin.categoriesPage.filter.limit")}
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

      <CreateCategoryModal onCreated={onCreated} />
    </div>
  );
}
