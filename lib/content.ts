import { BakeryReason, BakeryStandard, MenuCategory } from "@/types";
import { Clock, Heart, Leaf, Wheat } from "lucide-react";

export const BAKERY_PRINCIPLES: BakeryStandard[] = [
  {
    image: "/images/banner1.webp",
    key: "natural",
  },
  {
    image: "/images/banner2.webp",
    key: "handcraftedDaily",
  },
  {
    image: "/images/banner3.webp",
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
    key: "slowFermented",
    icon: Wheat,
  },
  {
    key: "handmadeProcess",
    icon: Heart,
  },
];
