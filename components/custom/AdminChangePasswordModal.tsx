"use client";

import {
  AdminResetPasswordFormData,
  adminResetPasswordSchema,
} from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";

type AdminChangePasswordModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AdminChangePasswordModal({
  open,
  onOpenChange,
}: AdminChangePasswordModalProps) {
  const { t, locale } = useI18n();
  const { logout } = useAuth();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const signInSchema = useMemo(() => adminResetPasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminResetPasswordFormData>({
    resolver: zodResolver(signInSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const handleOpenChange = (value: boolean) => {
    if (!value && !isSubmitting) {
      reset();
    }

    onOpenChange(value);
  };

  const onSubmit = async (data: AdminResetPasswordFormData) => {
    try {
      const response = await fetch("/api/admin/auth/reset-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            (locale === "vi"
              ? "Đổi mật khẩu thất bại!"
              : "Failed to change password!"),
        );
      }

      toast.success(
        locale === "vi"
          ? "Đổi mật khẩu thành công!"
          : "Password changed successfully!",
      );

      handleOpenChange(false);

      await logout();

      toast.success(
        locale === "vi" ? "Vui lòng đăng nhập lại!" : "Please sign in again!",
      );
    } catch (error) {
      console.error("Change password error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : locale === "vi"
            ? "Đổi mật khẩu thất bại!"
            : "Failed to change password!",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {locale === "vi" ? "Đổi mật khẩu" : "Change password"}
          </DialogTitle>

          <DialogDescription>
            {locale === "vi"
              ? "Nhập mật khẩu hiện tại và mật khẩu mới của bạn."
              : "Enter your current password and your new password."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5"
        >
          {/* Current password */}
          <div>
            <label
              htmlFor="currentPassword"
              className="mb-1.5 block text-sm font-medium text-white/80"
            >
              {locale === "vi" ? "Mật khẩu hiện tại" : "Current password"}
            </label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder={
                  locale == "vi" ? "Mật khẩu hiện tại" : "Current Password"
                }
                autoComplete="current-password"
                disabled={isSubmitting}
                className="border-black/30 bg-white/5 pl-10 text-black placeholder:text-grey-100 hover:border-primary/40 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                {...register("currentPassword")}
              />

              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                disabled={isSubmitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={
                  showCurrentPassword
                    ? "Hide current password"
                    : "Show current password"
                }
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {errors.currentPassword && (
              <p className="mt-1.5 text-xs text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New password */}
          <div>
            <label
              htmlFor="newPassword"
              className="mb-1.5 block text-sm font-medium text-white/80"
            >
              {locale === "vi" ? "Mật khẩu mới" : "New password"}
            </label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder={locale == "vi" ? "Mật khẩu mới" : "New Password"}
                autoComplete="new-password"
                disabled={isSubmitting}
                className="border-black/30 bg-white/5 pl-10 text-black placeholder:text-grey-100 hover:border-primary/40 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                {...register("newPassword")}
              />

              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                disabled={isSubmitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={
                  showNewPassword ? "Hide new password" : "Show new password"
                }
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {errors.newPassword && (
              <p className="mt-1.5 text-xs text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-white/80"
            >
              {locale === "vi"
                ? "Xác nhận mật khẩu mới"
                : "Confirm new password"}
            </label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder={
                  locale == "vi"
                    ? "Xác nhận mật khẩu mới"
                    : "Confirm New Password"
                }
                autoComplete="new-password"
                disabled={isSubmitting}
                className="border-black/30 bg-white/5 pl-10 text-black placeholder:text-grey-100 hover:border-primary/40 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                {...register("confirmPassword")}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                disabled={isSubmitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
            >
              {locale === "vi" ? "Hủy" : "Cancel"}
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : locale === "vi" ? (
                "Đổi mật khẩu"
              ) : (
                "Change password"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
