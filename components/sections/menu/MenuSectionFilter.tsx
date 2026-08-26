"use client";

import { useI18n } from "@/context/I18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CategoryItem } from "@/types";
import { Menu, Search } from "lucide-react";

interface MenuSectionFilterProps {
  isMobile: boolean;
  categories: CategoryItem[];
  activeCategory: string;
  search: string;
  isFilterOpen: boolean;
  onSelectCategory: (id: string) => void;
  onSearchChange: (value: string) => void;
  onFilterOpenChange: (open: boolean) => void;
}

export default function MenuSectionFilter({
  isMobile,
  categories,
  activeCategory,
  search,
  isFilterOpen,
  onSelectCategory,
  onSearchChange,
  onFilterOpenChange,
}: MenuSectionFilterProps) {
  const { t, locale } = useI18n();

  const categoryButtons = (
    <>
      <button
        type="button"
        onClick={() => onSelectCategory("all")}
        className={cn(
          "rounded-md border px-4 py-3 text-left text-sm font-semibold transition md:rounded-full md:px-5 md:py-2",
          activeCategory === "all"
            ? "border-primary bg-primary text-white shadow-sm"
            : "border-charcoal/15 bg-white text-charcoal/60 hover:border-primary/50 hover:text-charcoal",
        )}
      >
        {t("menuPage.menuFilter.all")}
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelectCategory(category.id)}
          className={cn(
            "rounded-md border px-4 py-3 text-left text-sm font-semibold transition md:rounded-full md:px-5 md:py-2",
            activeCategory === category.id
              ? "border-primary bg-primary text-white shadow-sm"
              : "border-charcoal/15 bg-white text-charcoal/60 hover:border-primary/50 hover:text-charcoal",
          )}
        >
          {category.name[locale] ?? category.name.vi}
        </button>
      ))}
    </>
  );

  if (isMobile) {
    return (
      <div className="flex items-center gap-3">
        <Sheet open={isFilterOpen} onOpenChange={onFilterOpenChange}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Open category filters"
              className="h-9 w-9 shrink-0 rounded-lg border-charcoal/15 bg-white"
            >
              <Menu className="h-4 w-4 text-charcoal/60" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85%] bg-sand sm:max-w-sm">
            <SheetHeader>
              <SheetTitle className="text-left text-charcoal">
                {t("menuPage.menuFilter.all")}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-8 flex flex-col gap-3">{categoryButtons}</div>
          </SheetContent>
        </Sheet>

        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm tên món"
            aria-label="Search products"
            className="h-9 rounded-lg border-charcoal/15 bg-white pl-10 text-xs placeholder:text-charcoal/50"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {categoryButtons}
    </div>
  );
}
