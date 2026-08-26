"use client";

import { useI18n } from "@/context/I18nContext";
import Image from "next/image";

export default function MenuHeroSection() {
  const { t } = useI18n();
  return (
    <section className="relative flex h-[60vh] min-h-[420px] flex-col items-center justify-center overflow-hidden px-6 pt-16">
      <Image
        src="/images/bread_banner.webp"
        alt="Freshly baked breads on a wooden table"
        fill
        priority
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/70 via-charcoal-900/40 to-charcoal-900/80" />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center animate-fadeInUp">
        <p className="font-script text-4xl text-amber sm:text-5xl">
          {t("menuPage.heroSection.badge")}
        </p>
        <h1 className="mt-1 text-4xl font-bold leading-[1.15] text-white sm:text-5xl whitespace-pre-line">
          {t("menuPage.heroSection.title")}
        </h1>
        <p className="mt-6 max-w-md text-balance text-white/75">
          {t("menuPage.heroSection.description")}
        </p>
      </div>
    </section>
  );
}
