"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import {
  Boxes,
  Calendar,
  FlaskConical,
  LayoutDashboard,
  Package,
  ShoppingBag,
  ShoppingCart,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/context/I18nContext";
import Image from "next/image";
import { cn } from "@/utils/format-sth";

const NAV_MANAGEMENT = [
  { key: "dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { key: "orders", href: "/admin/orders", icon: ShoppingCart },
];

const NAV_STORE_MANAGEMENT = [
  { key: "storeInventories", href: "/admin/store-inventories", icon: Boxes },
  {
    key: "preorderSchedules",
    href: "/admin/preorder-schedules",
    icon: Calendar,
  },
  {
    key: "preorderItems",
    href: "/admin/preorder-items",
    icon: ShoppingBag,
  },
];

const NAV_PRODUCTS = [
  { key: "products", href: "/admin/products", icon: Package },
  { key: "categories", href: "/admin/categories", icon: Tag },
  { key: "ingredients", href: "/admin/ingredients", icon: FlaskConical },
];

function NavGroup({
  items,
  label,
  pathname,
  t,
}: {
  items: { key: string; href: string; icon: React.ElementType }[];
  label: string;
  pathname: string;
  t: (key: string) => string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.href;
          const title = t(`admin.sidebar.nav.${item.key}`);
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={title}
                className={cn(
                  "transition-colors",
                  isActive &&
                    "bg-primary/10 text-primary font-medium hover:bg-primary/15 hover:text-primary",
                )}
              >
                <Link href={item.href}>
                  <item.icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span>{title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-zinc-100 bg-white shadow-md"
    >
      {/* Header - Logo */}
      <SidebarHeader className="border-b border-sidebar-border pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[state=open]:bg-sidebar-accent"
            >
              <Link href="/admin/dashboard">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber flex-shrink-0">
                  <Image
                    src="/images/logo.jpg"
                    alt="Artle Bakeshop"
                    width={32}
                    height={32}
                    className="h-full w-full rounded-full object-cover"
                  />{" "}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-sidebar-foreground">
                    Artle Bakeshop
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Admin CMS
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="custom-scrollbar">
        <NavGroup
          items={NAV_MANAGEMENT}
          label={t("admin.sidebar.groups.management")}
          pathname={pathname}
          t={t}
        />

        <NavGroup
          items={NAV_STORE_MANAGEMENT}
          label={t("admin.sidebar.groups.productSellManagement")}
          pathname={pathname}
          t={t}
        />

        <NavGroup
          items={NAV_PRODUCTS}
          label={t("admin.sidebar.groups.products")}
          pathname={pathname}
          t={t}
        />
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
