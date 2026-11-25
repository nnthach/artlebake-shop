"use client";

import AdminChangePasswordModal from "@/components/custom/AdminChangePasswordModal";
import PageLoader from "@/components/custom/PageLoader";
import { useAuth } from "@/context/AuthContext";
import { UserRoleEnum } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ROLE_HOME_PATH: Record<UserRoleEnum, string> = {
  admin: "/admin/dashboard",
  staff: "/staff/dashboard",
  customer: "/",
};

export default function ChangePasswordPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/signin");
    } else if (!user.must_change_password) {
      router.replace(ROLE_HOME_PATH[user.role] ?? "/");
    }
  }, [isLoading, router, user]);

  if (isLoading || !user?.must_change_password) return <PageLoader />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10">
      <AdminChangePasswordModal
        open
        required
        onOpenChange={() => undefined}
      />
    </main>
  );
}
