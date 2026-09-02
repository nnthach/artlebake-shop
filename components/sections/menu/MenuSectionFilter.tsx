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

  const mobileCategoryButtons = (
    <nav className="flex flex-col gap-2">
      {/* Nút "Tất cả" */}
      <button
        type="button"
        onClick={() => onSelectCategory("all")}
        className={cn(
          "group relative flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-all duration-200",
          activeCategory === "all"
            ? "bg-white text-primary shadow-md font-semibold"
            : "text-charcoal/70 hover:bg-white/60 hover:text-charcoal",
        )}
      >
        {activeCategory === "all" && (
          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
        )}
        <span>{t("menuPage.menuFilter.all")}</span>

        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full transition-all",
            activeCategory === "all"
              ? "bg-primary scale-110"
              : "bg-transparent group-hover:bg-charcoal/20",
          )}
        />
      </button>

      {/* Các nút danh mục */}
      {categories.map((category) => {
        const isActive = activeCategory === category.id;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "group relative flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-all duration-200",
              isActive
                ? "bg-white text-primary shadow-md font-semibold"
                : "text-charcoal/70 hover:bg-white/60 hover:text-charcoal",
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
            )}
            <span>{category.name[locale] ?? category.name.vi}</span>

            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-all",
                isActive
                  ? "bg-primary scale-110"
                  : "bg-transparent group-hover:bg-charcoal/20",
              )}
            />
          </button>
        );
      })}
    </nav>
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
              className="group h-9 w-9 shrink-0 rounded-lg border-charcoal/15 bg-white transition hover:border-primary hover:bg-primary"
            >
              <Menu className="h-4 w-4 text-charcoal/60 transition group-hover:text-white" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[50%] bg-sand sm:max-w-sm">
            <SheetHeader>
              <SheetTitle className="text-left text-charcoal">
                {locale === "vi" ? "Danh mục" : "Categories"}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-8 flex flex-col gap-3">
              {mobileCategoryButtons}
            </div>
          </SheetContent>
        </Sheet>

        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/40 focus:text-primary" />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={locale === "vi" ? "Tìm kiếm..." : "Search..."}
            aria-label="Search products"
            className="h-9 rounded-lg border border-charcoal/15 bg-white pl-10 text-xs placeholder:text-charcoal/50 transition hover:border-primary/50 focus:border-primary focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-3 items-center">
      {/* Cột 1: Trống (để giữ đối trọng với ô Search) */}
      <div className="hidden md:block" />

      {/* Cột 2: Cụm Category nằm chính giữa màn hình */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {categoryButtons}
      </div>

      {/* Cột 3: Ô Search nằm sát lề phải */}
      <div className="flex justify-end">
        <div className="group relative w-full max-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/40 transition-colors group-focus-within:text-primary" />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={locale === "vi" ? "Tìm kiếm..." : "Search..."}
            aria-label="Search products"
            className="h-[38px] w-full rounded-full border border-charcoal/15 bg-white pl-10 pr-4 text-xs placeholder:text-charcoal/50 transition hover:border-primary/50 focus:border-primary focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>
    </div>
  );
}
