import { useI18n } from "@/context/I18nContext";
import { Locale } from "@/lib/translation";
import { Globe } from "lucide-react";
import React from "react";

const NEXT_LOCALE: Record<string, Locale> = { en: "vi", vi: "en" };

export default function LanguageToggle({
  scrolled,
  variant = "light",
  admin = false,
}: {
  scrolled?: boolean;
  admin?: boolean;
  variant?: "light" | "dark";
}) {
  const { locale, setLocale } = useI18n();
  const isDark = variant === "dark";
  const isLight = !isDark && !scrolled;

  return (
    <button
      type="button"
      onClick={() => setLocale(NEXT_LOCALE[locale])}
      aria-label={`Switch language to ${NEXT_LOCALE[locale].toUpperCase()}`}
      className={`group flex items-center gap-1.5 rounded-full border px-3 py-1 ${admin ? "text-[13px] font-bold" : "text-[14px]"} tracking-wide transition-all duration-300 ${
        isLight
          ? "border-white/30 text-white/80 hover:border-white hover:text-white"
          : "border-charcoal/15 text-charcoal/60 hover:border-amber/60 hover:text-amber-600"
      }`}
    >
      <Globe
        className={`  h-4 w-4 transition-transform duration-500 group-hover:rotate-180`}
      />
      <span className="uppercase">{locale}</span>
    </button>
  );
}
