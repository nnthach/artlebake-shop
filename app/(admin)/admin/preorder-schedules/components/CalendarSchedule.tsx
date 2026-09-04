import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/context/I18nContext";
import { PreorderSchedule } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

interface CalendarScheduleProps {
  currentMonth: Date;
  selectedDate: Date;
  schedules: PreorderSchedule[];

  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectDate: (date: Date) => void;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function CalendarSchedule({
  currentMonth,
  selectedDate,
  schedules,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onSelectDate,
}: CalendarScheduleProps) {
  const { t, locale } = useI18n();
  const weekDays = [
    t("admin.preorderSchedulePage.calendar.weekdays.mon"),
    t("admin.preorderSchedulePage.calendar.weekdays.tue"),
    t("admin.preorderSchedulePage.calendar.weekdays.wed"),
    t("admin.preorderSchedulePage.calendar.weekdays.thu"),
    t("admin.preorderSchedulePage.calendar.weekdays.fri"),
    t("admin.preorderSchedulePage.calendar.weekdays.sat"),
    t("admin.preorderSchedulePage.calendar.weekdays.sun"),
  ];
  const selectedDateKey = formatDateKey(selectedDate);

  const monthLabel = new Intl.DateTimeFormat(
    locale === "vi" ? "vi-VN" : "en-US",
    {
      month: "long",
      year: "numeric",
    },
  )
    .format(currentMonth)
    .replace(/^./, (char) => char.toUpperCase());

  const calendarDays = React.useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);

    const startOffset = (firstDay.getDay() + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const previousMonthDays = new Date(year, month, 0).getDate();

    const days: Date[] = [];

    // Previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, previousMonthDays - i));
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    // Next month
    while (days.length < 42) {
      const nextDay = days.length - startOffset - daysInMonth + 1;

      days.push(new Date(year, month + 1, nextDay));
    }

    return days;
  }, [currentMonth]);

  const isCurrentMonth = (date: Date) =>
    date.getMonth() === currentMonth.getMonth() &&
    date.getFullYear() === currentMonth.getFullYear();

  const isSelected = (date: Date) => formatDateKey(date) === selectedDateKey;

  const isToday = (date: Date) =>
    formatDateKey(date) === formatDateKey(new Date());

  const getSchedule = (date: Date) => {
    const dateKey = formatDateKey(date);

    return schedules.find((schedule) => schedule.date === dateKey);
  };

  return (
    <Card className="overflow-hidden border border-zinc-200 bg-white shadow-sm">
      <CardContent className="p-0">
        {/* Calendar header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4">
          <Button
            className="bg-white border border-zinc-200"
            size="icon"
            onClick={onPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4 text-slate-400" />
          </Button>

          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{monthLabel}</h2>

            <Button
              className="bg-white border border-zinc-200 text-slate-400"
              size="sm"
              onClick={onToday}
            >
              {t("admin.preorderSchedulePage.calendar.today")}
            </Button>
          </div>

          <Button
            className="bg-white border border-zinc-200"
            size="icon"
            onClick={onNextMonth}
          >
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Button>
        </div>

        {/* Week days */}
        <div className="grid grid-cols-7 border-b border-zinc-200 bg-gradient-to-br from-white to-[#FAF6F0]">
          {weekDays.map((day) => (
            <div
              key={day}
              className="border-r border-zinc-100 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date) => {
            const schedule = getSchedule(date);
            const current = isCurrentMonth(date);
            const selected = isSelected(date);
            const today = isToday(date);

            return (
              <button
                key={formatDateKey(date)}
                type="button"
                onClick={() => onSelectDate(date)}
                className={`
                      group relative
                      min-h-[100px]
                      border-b border-r border-zinc-200
                      p-3
                      text-left
                      transition-colors
                      hover:bg-primary/20
                      focus:outline-none
                      focus:ring-2
                      focus:ring-primary/40
                      focus:ring-inset
                      ${!current ? "bg-muted/10" : ""}
                      ${selected ? "bg-primary/[0.04]" : ""}
                    `}
              >
                {/* Date number */}
                <div className="flex items-center justify-between">
                  <span
                    className={`
                          flex h-8 w-8 items-center justify-center
                          rounded-full text-sm font-medium
                          ${
                            selected
                              ? "bg-primary text-white"
                              : today
                                ? "border-2 border-primary text-primary"
                                : current
                                  ? "text-foreground"
                                  : "text-muted-foreground/40"
                          }
                        `}
                  >
                    {date.getDate()}
                  </span>
                </div>

                {/* Status */}
                {schedule && current && (
                  <div className="mt-4">
                    <div
                      className={`
                            flex items-center gap-1.5 text-xs font-medium
                            ${
                              schedule.status
                                ? "text-emerald-600"
                                : "text-muted-foreground"
                            }
                          `}
                    >
                      <span
                        className={`
                              h-2 w-2 rounded-full
                              ${
                                schedule.status
                                  ? "bg-emerald-500"
                                  : "bg-muted-foreground/40"
                              }
                            `}
                      />

                      {schedule.status
                        ? t("admin.preorderSchedulePage.calendar.legend.open")
                        : t(
                            "admin.preorderSchedulePage.calendar.legend.closed",
                          )}
                    </div>
                  </div>
                )}

                {/* Selected indicator */}
                {selected && (
                  <div className="absolute bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t px-5 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            {t("admin.preorderSchedulePage.calendar.legend.open")}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
            {t("admin.preorderSchedulePage.calendar.legend.closed")}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full border border-muted-foreground/30" />
            {t("admin.preorderSchedulePage.calendar.legend.noSchedule")}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
