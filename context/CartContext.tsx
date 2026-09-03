"use client";

import { CartItem } from "@/types";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import toast from "react-hot-toast";
import { useI18n } from "./I18nContext";

type CartType = "available" | "preorder" | "select";

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  totalItems: number;
  totalPrice: number;
  cartType: CartType | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addItem: (product: CartItem["product"], quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = "bakery_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { locale } = useI18n();

  const refreshCart = useCallback(async () => {
    try {
      setIsLoading(true);

      const storedCart = localStorage.getItem(CART_STORAGE_KEY);

      if (!storedCart) {
        setItems([]);
        return;
      }

      const parsedCart: CartItem[] = JSON.parse(storedCart);

      setItems(Array.isArray(parsedCart) ? parsedCart : []);
    } catch (error) {
      console.error("Failed to load cart:", error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = async (
    product: CartItem["product"],
    quantity = 1,
  ): Promise<void> => {
    try {
      const existingItem = items.find((item) => item.product.id === product.id);

      let newItems: CartItem[];

      if (existingItem) {
        newItems = items.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item,
        );
      } else {
        newItems = [
          ...items,
          {
            id: crypto.randomUUID(),
            quantity,
            product,
          },
        ];
      }

      setItems(newItems);

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));

      toast.success(
        locale === "vi" ? "Đã thêm sản phẩm vào giỏ hàng." : "Added to cart.",
      );
    } catch (error) {
      console.error("Failed to add item:", error);

      toast.error(
        locale === "vi"
          ? "Không thể thêm sản phẩm vào giỏ hàng."
          : "Failed to add item to cart.",
      );
    }
  };

  const updateQuantity = async (
    itemId: string,
    quantity: number,
  ): Promise<void> => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    const newItems = items.map((item) =>
      item.id === itemId ? { ...item, quantity } : item,
    );

    setItems(newItems);

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
  };

  const removeItem = async (itemId: string): Promise<void> => {
    const newItems = items.filter((item) => item.id !== itemId);

    setItems(newItems);

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));

    toast.success("Đã xóa sản phẩm khỏi giỏ hàng.");
  };

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  // total
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0,
  );

  // cart type
  const canAvailable =
    items.length > 0 && items.every((item) => item.product.available);

  const canPreorder =
    items.length > 0 && items.every((item) => item.product.preorder);

  const cartType: CartType | null =
    items.length === 0
      ? null
      : canAvailable && canPreorder
        ? "select"
        : canAvailable
          ? "available"
          : canPreorder
            ? "preorder"
            : null;

  console.log("cart type", cartType);

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        totalItems,
        totalPrice,
        isOpen,
        setIsOpen,
        addItem,
        updateQuantity,
        removeItem,
        refreshCart,
        clearCart,
        cartType,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("failed to init useCart");
  }

  return context;
}
