import { useI18n } from "@/context/I18nContext";
import { ViewType } from "@/types/sub-type";
import React from "react";

type FilterValue = {
  viewType: ViewType;
  month: number;
  year: number;
};

type Props = {
  value: FilterValue;
  onChange: (val: FilterValue) => void;
  showYear?: boolean;
  showMonth?: boolean;
};

const ChartFilter: React.FC<Props> = ({
  value,
  onChange,
  showYear = true,
  showMonth = true,
}) => {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  return (
    <div className="flex items-center gap-2 p-1 rounded-lg">
      {/* View Type */}
      <select
        value={value.viewType}
        onChange={(e) => {
          const newType = e.target.value as ViewType;
          const now = new Date();

          onChange({
            viewType: newType,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          });
        }}
        className="bg-gray-100 text-sm font-medium rounded-md px-2 py-1 outline-none"
      >
        <option value="week">{t("admin.dashboardPage.totalOrderChart.filter.week")}</option>
        <option value="month">{t("admin.dashboardPage.totalOrderChart.filter.month")}</option>
        <option value="year">{t("admin.dashboardPage.totalOrderChart.filter.year")}</option>
      </select>

      {/* Month */}
      {showMonth && value.viewType === "month" && (
        <select
          value={value.month}
          onChange={(e) =>
            onChange({ ...value, month: parseInt(e.target.value) })
          }
          className="bg-gray-100 text-sm font-medium rounded-md px-2 py-1 outline-none"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {t("admin.dashboardPage.totalOrderChart.filter.month")} {i + 1}
            </option>
          ))}
        </select>
      )}

      {/* Year */}
      {showYear &&
        (value.viewType === "month" || value.viewType === "year") && (
          <select
            value={value.year}
            onChange={(e) =>
              onChange({ ...value, year: parseInt(e.target.value) })
            }
            className="bg-gray-100 text-sm font-medium rounded-md px-2 py-1 outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {t("admin.dashboardPage.totalOrderChart.filter.year")} {y}
              </option>
            ))}
          </select>
        )}
    </div>
  );
};

export default ChartFilter;
