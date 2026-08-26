"use client";

import { useI18n } from "@/context/I18nContext";
import { useInView } from "@/hooks/useInView";
import { BAKERY_PRINCIPLES } from "@/lib/content";
import Image from "next/image";

export default function OurStandardsSection() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const { t } = useI18n();

  return (
    <section
      id="standards"
      className="relative z-10 flex min-h-screen flex-col justify-center bg-sand px-6 py-24"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        <p className="font-script text-3xl text-amber sm:text-4xl">
          {t("homePage.standardSection.badge")}
        </p>
        <h2 className="mt-2 text-3xl font-bold leading-tight text-charcoal sm:text-4xl">
          {t("homePage.standardSection.title")}
        </h2>
        <p className="mt-5 max-w-lg text-charcoal/60">
          {t("homePage.standardSection.description")}
        </p>

        <div
          ref={ref}
          className="-mx-6 mt-14 flex w-full gap-10 overflow-x-auto px-6 pb-2 sm:justify-center sm:gap-14 sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden"
        >
          {BAKERY_PRINCIPLES.map((item, index) => (
            <div
              key={item.key}
              style={{ animationDelay: `${index * 120}ms` }}
              className={`flex w-[220px] shrink-0 flex-col items-center text-center sm:w-[260px] ${
                inView
                  ? "animate-fadeUp opacity-100"
                  : "opacity-0 translate-y-6"
              }`}
            >
              <div className="relative h-[220px] w-[220px] overflow-hidden rounded-full shadow-lg ring-4 ring-white sm:h-[260px] sm:w-[260px]">
                <Image
                  src={item.image}
                  alt={t(
                    `homePage.standardSection.principles.${item.key}.title`,
                  )}
                  fill
                  className="object-cover"
                />
              </div>
              <p className="mt-5 text-sm font-bold uppercase tracking-widest text-charcoal">
                {t(`homePage.standardSection.principles.${item.key}.title`)}
              </p>
              <p className="mt-1 text-xs text-charcoal/55">
                {t(
                  `homePage.standardSection.principles.${item.key}.description`,
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
