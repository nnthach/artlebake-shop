import { BakeryReason, BakeryStandard, MenuCategory } from "@/types";
import { Clock, Cookie, Heart, Leaf } from "lucide-react";

export const BAKERY_PRINCIPLES: BakeryStandard[] = [
  {
    image: "/images/brownie2.jpg",
    key: "natural",
  },
  {
    image: "/images/banner2.webp",
    key: "handcraftedDaily",
  },
  {
    image: "/images/cinamonrollbanner.jpg",
    key: "alwaysFresh",
  },
];

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: "all", label: "All" },
  { id: "bread", label: "Bread" },
  { id: "cake", label: "Cake" },
  { id: "pastry", label: "Pastry" },
];

export const WHY_RETURN_REASONS: BakeryReason[] = [
  {
    key: "freshDaily",
    icon: Clock,
  },
  {
    key: "organicIngredients",
    icon: Leaf,
  },
  {
    key: "richFlavor",
    icon: Cookie,
  },
  {
    key: "handmadeProcess",
    icon: Heart,
  },
];
