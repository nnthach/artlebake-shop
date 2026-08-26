"use client";

import { Locale, translations } from "@/lib/translation";
import React, { createContext, useContext, useEffect, useState } from "react";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");

  useEffect(() => {
    const savedLocale = localStorage.getItem("locale");

    if (savedLocale === "vi" || savedLocale === "en") {
      setLocale(savedLocale);
    } else {
      setLocaleState("vi");
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  const t = (path: string): string => {
    const keys = path.split(".");

    let value: unknown = translations[locale];

    for (const key of keys) {
      if (typeof value === "object" && value !== null && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return path;
      }
    }

    return typeof value === "string" ? value : path;
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("failed to init useI18n");
  }

  return context;
}
