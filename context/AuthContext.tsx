"use client";

import { UserItem } from "@/types";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import PageLoader from "@/components/custom/PageLoader";
import toast from "react-hot-toast";
import { useI18n } from "./I18nContext";
import {
  authenticatedFetch,
  markAuthSessionChanged,
} from "@/lib/fastapi/auth-fetch";

export interface AuthUser extends UserItem {
  email?: string;
  is_active?: boolean;
  must_change_password?: boolean;
  auth_provider?: "fastapi";
  staff?: {
    id: string;
    store_id: string;
    is_active: boolean;
  } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useI18n();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await authenticatedFetch("/api/auth/me");
        const data = await res.json();

        if (data.success && data.data?.user) {
          setUser(data.data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (
      !isLoading &&
      user?.must_change_password &&
      pathname !== "/change-password"
    ) {
      router.replace("/change-password");
    }
  }, [isLoading, pathname, router, user]);

  const logout = async () => {
    try {
      const response = await authenticatedFetch("/api/auth/signout", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Logout request failed");
      toast.success(
        locale === "vi" ? "Đăng xuất thành công!" : "Sign out successfully!",
      );
    } catch {
      toast.error(
        locale === "vi" ? "Đăng xuất thất bại!" : "Failed to sign out!",
      );
    } finally {
      markAuthSessionChanged(false);
      setUser(null);
      router.push("/");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>
      {isLoading ||
      (user?.must_change_password && pathname !== "/change-password") ? (
        <PageLoader />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("failed to init useAuth");
  }

  return context;
}
