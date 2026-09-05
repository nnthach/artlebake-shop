"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import CreatePreOrderScheduleModal from "@/components/sections/admin/preorderSchedule/CreatePreOrderScheduleModal";
import CardSlotDetail from "./components/CardSlotDetail";
import CalendarSchedule from "./components/CalendarSchedule";
import type { PreorderSchedule } from "@/types";

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function PreOrderSchedule() {
  const { t } = useI18n();

  const [currentMonth, setCurrentMonth] = useState(
    new Date(2026, 8, 1), // September 2026
  );

  const [selectedDate, setSelectedDate] = useState(new Date(2026, 8, 19));
  const [schedules, setSchedules] = useState<PreorderSchedule[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingStatus, setEditingStatus] = useState<boolean>(false);

  const fetchSchedules = useCallback(async () => {
    const startDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );

    const endDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    );

    const url = new URL("/api/admin/preorder-schedule", window.location.origin);

    url.searchParams.set("start_date", formatDateKey(startDate));
    url.searchParams.set("end_date", formatDateKey(endDate));

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch preorder schedules");
      }

      const result = await response.json();

      const nextSchedules = Array.isArray(result?.data) ? result.data : [];

      setSchedules(nextSchedules);
    } catch (error) {
      console.error("Fetch schedules error:", error);
      setSchedules([]);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // --------------------------------
  // Calendar
  // --------------------------------
  const selectedDateKey = formatDateKey(selectedDate);

  const selectedSchedule = schedules.find(
    (schedule) => schedule.date === selectedDateKey,
  );

  const isCurrentMonth = (date: Date) =>
    date.getMonth() === currentMonth.getMonth() &&
    date.getFullYear() === currentMonth.getFullYear();

  // --------------------------------
  // Actions
  // --------------------------------
  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const goToToday = () => {
    const today = new Date();

    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));

    setSelectedDate(today);
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);

    if (!isCurrentMonth(date)) {
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }

    const dateKey = formatDateKey(date);
    const schedule = schedules.find((schedule) => schedule.date === dateKey);

    setEditingStatus(schedule?.status ?? true);
  };

  const handleSave = async () => {
    if (editingStatus === null) return;

    setIsSaving(true);

    try {
      const dateKey = selectedDateKey;

      // Schedule đã tồn tại → PATCH
      if (selectedSchedule) {
        const response = await fetch("/api/admin/preorder-schedule", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: selectedSchedule.id,
            status: editingStatus,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to update schedule");
        }
      }

      // Chưa có schedule → POST
      else {
        const response = await fetch("/api/admin/preorder-schedule", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: dateKey,
            status: editingStatus,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create schedule");
        }
      }

      // Fetch lại data từ server
      await fetchSchedules();

      // Đồng bộ lại editing state
      setEditingStatus(editingStatus);
    } catch (error) {
      console.error("Save preorder schedule error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {t("admin.preorderSchedulePage.headerTitle.title")}
          </h1>

          <p className="text-sm text-muted-foreground">
            {t("admin.preorderSchedulePage.headerTitle.subtitle")}
          </p>
        </div>

        <CreatePreOrderScheduleModal />
      </div>

      {/* Main content */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.9fr)]">
        {/* ================= CALENDAR ================= */}
        <CalendarSchedule
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          schedules={schedules}
          onPreviousMonth={previousMonth}
          onNextMonth={nextMonth}
          onToday={goToToday}
          onSelectDate={handleSelectDate}
        />

        {/* ================= DETAIL ================= */}
        <CardSlotDetail
          selectedDate={selectedDate}
          editingStatus={editingStatus}
          selectedSchedule={selectedSchedule}
          isSaving={isSaving}
          onStatusChange={setEditingStatus}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
