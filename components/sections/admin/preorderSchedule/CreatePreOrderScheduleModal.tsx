"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/context/I18nContext";

const createScheduleSchema = z.object({
  date: z.string().min(1, "Date is required"),
  status: z.boolean(),
});

type CreateScheduleForm = z.infer<typeof createScheduleSchema>;

interface CreatePreOrderScheduleProps {
  onCreated?: () => void;
}

export default function CreatePreOrderScheduleModal({
  onCreated,
}: CreatePreOrderScheduleProps) {
  const [open, setOpen] = useState(false);
  const { locale, t } = useI18n();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<CreateScheduleForm>({
    resolver: zodResolver(createScheduleSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      status: true,
    },
  });

  const status = watch("status");

  const onSubmit = async (data: CreateScheduleForm) => {
    try {
      const res = await fetch("/api/admin/preorder-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: data.date,
          status: data.status,
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result?.error || "Failed to create preorder schedule");
      }

      toast.success(
        locale === "vi"
          ? "Tạo lịch đặt trước thành công!"
          : "Pre-order schedule created successfully!",
      );

      reset();
      setOpen(false);
      onCreated?.();
    } catch (error) {
      console.error(error);
      toast.error(
        locale === "vi"
          ? "Không thể tạo lịch đặt trước."
          : "Failed to create preorder schedule.",
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t("admin.preorderSchedulePage.headerTitle.title") || "Add Schedule"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {locale === "vi"
              ? "Tạo lịch đặt trước"
              : "Create pre-order schedule"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {locale === "vi" ? "Ngày" : "Date"}
            </label>
            <input
              type="date"
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("date")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {locale === "vi" ? "Trạng thái" : "Status"}
            </label>

            <div className="flex items-center justify-between rounded-md border border-input bg-white px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <CalendarPlus className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {status
                      ? locale === "vi"
                        ? "Mở đặt trước"
                        : "Open for pre-order"
                      : locale === "vi"
                        ? "Đóng đặt trước"
                        : "Closed for pre-order"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {locale === "vi"
                      ? "Cho phép khách hàng đặt hàng cho ngày này."
                      : "Allow customers to place orders for this date."}
                  </p>
                </div>
              </div>

              <Switch
                checked={status}
                disabled={isSubmitting}
                onCheckedChange={(checked) =>
                  setValue("status", checked, { shouldValidate: true })
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                {locale === "vi" ? "Huỷ" : "Cancel"}
              </Button>
            </DialogClose>

            <Button type="submit" disabled={isSubmitting} className="min-w-24">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : locale === "vi" ? (
                "Tạo"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
