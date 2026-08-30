import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/context/I18nContext";
import { formatDateTime } from "@/lib/utils";
import { PreorderSchedule } from "@/types";
import { CalendarDays, Clock3, Pencil } from "lucide-react";
import React from "react";

interface CardSlotDetailProps {
  selectedDate: Date;
  editingStatus: boolean;
  selectedSchedule?: PreorderSchedule;
  isSaving: boolean;
  onStatusChange: (status: boolean) => void;
  onSave: () => void;
}

export default function CardSlotDetail({
  selectedDate,
  editingStatus,
  selectedSchedule,
  isSaving,
  onStatusChange,
  onSave,
}: CardSlotDetailProps) {
  const { t } = useI18n();

  return (
    <Card className="border border-zinc-200 bg-white shadow-sm">
      <CardContent className="flex h-full flex-col p-6">
        {/* Detail header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("admin.preorderSchedulePage.detail.selectedDate")}
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              {formatDateTime(selectedDate).date}
            </h2>
          </div>

          <Badge
            variant={editingStatus ? "default" : "secondary"}
            className={
              editingStatus
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                : ""
            }
          >
            {editingStatus
              ? t("admin.preorderSchedulePage.detail.status.open.label")
              : t("admin.preorderSchedulePage.detail.status.closed.label")}
          </Badge>
        </div>

        <Separator className="my-6" />

        {/* Description */}
        <div>
          <h3 className="text-sm font-semibold">
            {t("admin.preorderSchedulePage.detail.title")}
          </h3>

          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            {t("admin.preorderSchedulePage.detail.description")}
          </p>
        </div>

        {/* Status options */}
        <div className="mt-6 space-y-3">
          {/* Open */}
          <div
            className={`
                  flex items-center justify-between
                  rounded-xl border p-4
                  transition-colors
                  ${
                    editingStatus
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-emerald-100 bg-[#f5faf6]"
                  }
                `}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                      flex h-9 w-9 items-center justify-center
                      rounded-full
                      ${editingStatus ? "bg-emerald-100" : "bg-emerald-50"}
                    `}
              >
                <span
                  className={`
                        h-2.5 w-2.5 rounded-full
                        ${editingStatus ? "bg-emerald-600" : "bg-emerald-300"}
                      `}
                />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  {t("admin.preorderSchedulePage.detail.status.open.label")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "admin.preorderSchedulePage.detail.status.open.description",
                  )}
                </p>
              </div>
            </div>

            <Switch
              className="data-[state=checked]:bg-emerald-600"
              checked={editingStatus}
              onCheckedChange={onStatusChange}
            />
          </div>

          {/* Closed */}
          <div
            className={`
                  flex items-center justify-between
                  rounded-xl border p-4
                  transition-colors
                  ${
                    editingStatus === false
                      ? "border-stone-200 bg-stone-100"
                      : "border-stone-200 bg-[#f7f7f5]"
                  }
                `}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-200">
                <span className="h-2.5 w-2.5 rounded-full bg-stone-500" />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  {t("admin.preorderSchedulePage.detail.status.closed.label")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "admin.preorderSchedulePage.detail.status.closed.description",
                  )}
                </p>
              </div>
            </div>

            <Switch
              checked={!editingStatus}
              onCheckedChange={(checked) => {
                onStatusChange(!checked);
              }}
            />
          </div>
        </div>

        <Separator className="my-6" />

        {/* Metadata */}
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>
                {t("admin.preorderSchedulePage.detail.metadata.date")}
              </span>
            </div>

            <span className="text-sm font-medium">
              {formatDateTime(selectedDate).date}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              <span>
                {t("admin.preorderSchedulePage.detail.metadata.createdAt")}
              </span>
            </div>

            <span className="text-sm font-medium">
              {selectedSchedule
                ? formatDateTime(selectedSchedule.created_at).full
                : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Pencil className="h-4 w-4" />
              <span>
                {t("admin.preorderSchedulePage.detail.metadata.lastUpdated")}
              </span>
            </div>

            <span className="text-sm font-medium">
              {selectedSchedule
                ? formatDateTime(selectedSchedule.updated_at).full
                : "—"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center justify-end gap-2 pt-8">
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving
              ? t("admin.preorderSchedulePage.detail.actions.saving")
              : t("admin.preorderSchedulePage.detail.actions.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
