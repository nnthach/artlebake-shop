"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, User } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import LanguageToggle from "@/components/custom/LanguageToggle";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";

const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: "dashboard",
  categories: "categories",
  ingredients: "ingredients",
  orders: "orders",
  products: "products",
  reviews: "reviews",
  customers: "customers",
  settings: "settings",
  staffs: "staffs",
  stores: "stores",
  "store-inventories": "storeInventories",
  "preorder-schedules": "preorderSchedules",
  "preorder-items": "preorder-items",
};

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  // segments: ["admin", "dashboard"] or ["admin", "products", "123"]
  const crumbs = segments.slice(1).map((seg, idx) => ({
    label: BREADCRUMB_MAP[seg] ?? seg,
    href: "/" + segments.slice(0, idx + 2).join("/"),
    isLast: idx === segments.slice(1).length - 1,
  }));
  return crumbs;
}

export function AdminHeader() {
  const crumbs = useBreadcrumbs();
  const { t } = useI18n();
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-zinc-200 bg-white px-6 backdrop-blur-sm">
      {/* Sidebar toggle */}
      <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />

      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Breadcrumb */}
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink asChild>
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground"
              >
                Artle Bakeshop
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {crumbs.map((crumb) => (
            <span key={crumb.href} className="flex items-center gap-1.5">
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage className="font-medium">
                    {t(`admin.headerBreadcrumb.${crumb.label}`)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={crumb.href}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {t(`admin.headerBreadcrumb.${crumb.label}`)}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-muted-foreground hover:text-white"
          aria-label="Thông báo"
        >
          <Bell className="h-6 w-6" />
          {/* Notification badge */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>

        <LanguageToggle scrolled={true} admin={true} />

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-primary/30 bg-background shadow-sm hover:bg-primary/5"
              aria-label="Tài khoản"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatar.png" alt="Admin" />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold">Admin</p>
                <p className="text-xs text-muted-foreground">
                  admin@artlebakeshop.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              {t("admin.headerDropdown.profile")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              {t("admin.headerDropdown.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
