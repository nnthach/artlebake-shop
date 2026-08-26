import {
  BakeryReason,
  BakeryStandard,
  MenuCategory,
  MenuProduct,
} from "@/types";
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

export const MENU_PRODUCTS: MenuProduct[] = [
  {
    id: "cream-bread",
    category: "bread",
    image: "/images/bread_list/cream_bread.webp",
    name: "Fresh Cream Bread",
    description: "Soft milk bread, sweet cream swirl.",
    price: "$3.80",
    ingredients: ["wheatFlour", "freshMilk", "butter", "sweetCream", "yeast"],
  },
  {
    id: "cream-cheese-bread",
    category: "bread",
    image: "/images/bread_list/cream_cheese.png",
    name: "Cream Cheese Bread",
    description: "Soft white bread, cream cheese center.",
    price: "$3.90",
    ingredients: ["wheatFlour", "creamCheese", "milk", "butter", "sugar"],
  },
  {
    id: "raisin-bread",
    category: "bread",
    image: "/images/bread_list/raisin.webp",
    name: "Raisin Bread",
    description: "Soft milk bread, sweet raisins throughout.",
    price: "$3.60",
    ingredients: ["wheatFlour", "raisins", "milk", "butter", "honey"],
  },
  {
    id: "frankfurter-roll",
    category: "bread",
    image: "/images/bread_list/frank_roll.png",
    name: "Frankfurter Roll",
    description: "Savory sausage wrapped in soft bread.",
    price: "$4.10",
    ingredients: [
      "wheatFlour",
      "frankfurterSausage",
      "butter",
      "onion",
      "ketchup",
    ],
  },
  {
    id: "purple-sweet-potato-loaf",
    category: "bread",
    image: "/images/bread_list/purple_potato.webp",
    name: "Purple Sweet Potato Loaf",
    description: "Naturally sweet, vibrant purple hue.",
    price: "$4.20",
    ingredients: [
      "wheatFlour",
      "purpleSweetPotato",
      "milk",
      "butter",
      "sugar",
    ],
  },
  {
    id: "red-bean-bun",
    category: "bread",
    image: "/images/bread_list/redbean.png",
    name: "Red Bean Bun",
    description: "Soft bun, silky red bean filling.",
    price: "$3.50",
    ingredients: ["wheatFlour", "redBeanPaste", "milk", "butter", "sugar"],
  },
  {
    id: "green-tea-cream-cake",
    category: "cake",
    image: "/images/cake_list/greentea.webp",
    name: "Green Tea Cream Cake",
    description: "Matcha sponge, light whipped cream.",
    price: "$32.00",
    ingredients: [
      "matchaPowder",
      "spongeCake",
      "freshCream",
      "sugar",
      "eggs",
    ],
  },
  {
    id: "strawberry-shortcake",
    category: "cake",
    image: "/images/cake_list/strawberry.webp",
    name: "Strawberry Shortcake",
    description: "Classic sponge, fresh strawberries, cream.",
    price: "$34.00",
    ingredients: [
      "freshStrawberries",
      "spongeCake",
      "whippedCream",
      "sugar",
      "eggs",
    ],
  },
  {
    id: "cloud-cheesecake",
    category: "cake",
    image: "/images/cake_list/cloud.webp",
    name: "Cloud Cheesecake",
    description: "Airy, light Japanese-style cotton cheesecake.",
    price: "$28.00",
    ingredients: ["creamCheese", "eggs", "freshMilk", "sugar", "cornStarch"],
  },
  {
    id: "triple-berry-cake",
    category: "cake",
    image: "/images/cake_list/tripleberry.png",
    name: "Triple Berry Cake",
    description: "Strawberry, blueberry, raspberry medley.",
    price: "$36.00",
    ingredients: [
      "strawberries",
      "blueberries",
      "raspberries",
      "spongeCake",
      "freshCream",
    ],
  },
  {
    id: "almond-croissant",
    category: "pastry",
    image: "/images/sweet_list/almond_croissant.png",
    name: "Almond Croissant",
    description: "Buttery layers, toasted almonds.",
    price: "$4.50",
    ingredients: [
      "butter",
      "wheatFlour",
      "almondCream",
      "slicedAlmonds",
      "sugar",
    ],
  },
  {
    id: "chocolate-croissant",
    category: "pastry",
    image: "/images/sweet_list/chocolate.webp",
    name: "Chocolate Croissant",
    description: "Rich dark chocolate, crisp layers.",
    price: "$4.80",
    ingredients: ["butter", "wheatFlour", "darkChocolate", "cocoa", "sugar"],
  },
  {
    id: "strawberry-cream-croissant",
    category: "pastry",
    image: "/images/sweet_list/strawberry.png",
    name: "Strawberry Cream Croissant",
    description: "Fresh strawberries, light cream.",
    price: "$5.20",
    ingredients: [
      "butter",
      "wheatFlour",
      "freshStrawberries",
      "whippedCream",
      "sugar",
    ],
  },
  {
    id: "original-butter-croissant",
    category: "pastry",
    image: "/images/sweet_list/original.webp",
    name: "Original Butter Croissant",
    description: "Classic French recipe, flaky golden layers.",
    price: "$3.90",
    ingredients: ["butter", "wheatFlour", "milk", "yeast", "salt"],
  },
  {
    id: "garlic-cheese-bread",
    category: "pastry",
    image: "/images/sweet_list/garlic_cheese.jpg",
    name: "Garlic Cheese Bread",
    description: "Savory garlic butter, melted cheese.",
    price: "$4.40",
    ingredients: [
      "wheatFlour",
      "garlicButter",
      "mozzarellaCheese",
      "parsley",
      "milk",
    ],
  },
];

const BESTSELLER_IDS = [
  "almond-croissant",
  "chocolate-croissant",
  "strawberry-cream-croissant",
  "cream-bread",
  "purple-sweet-potato-loaf",
  "red-bean-bun",
];

export const BESTSELLER_PRODUCTS: MenuProduct[] = BESTSELLER_IDS.map(
  (id) => MENU_PRODUCTS.find((product) => product.id === id)!,
);

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
