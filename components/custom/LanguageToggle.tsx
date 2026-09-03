import { useI18n } from "@/context/I18nContext";
import { Locale } from "@/lib/translation";
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
      className={`group inline-flex sm:h-8 sm:w-8 h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${
        admin ? "text-xs font-bold" : "text-xs font-semibold"
      } ${
        isLight
          ? "bg-white/20 text-white hover:bg-white/30 active:scale-95"
          : "bg-primary/10 text-primary hover:bg-primary/20 active:scale-95"
      }`}
    >
      <span className="uppercase">{locale}</span>
    </button>
  );
}
