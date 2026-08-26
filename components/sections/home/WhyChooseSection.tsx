"use client";

import { useI18n } from "@/context/I18nContext";
import { useInView } from "@/hooks/useInView";
import { WHY_RETURN_REASONS } from "@/lib/content";

const ICON_COLORS = [
  "text-amber",
  "text-emerald-600",
  "text-coral",
  "text-rose-500",
];

export default function WhyChooseSection() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const { t } = useI18n();

  return (
    <section
      id="why"
      className="relative z-10 flex flex-col justify-center bg-gradient-to-br from-[#EAE1D3] via-[#F2EBE0] to-[#E5DBCB] px-6 py-24"
    >
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="font-serif text-4xl italic text-charcoal sm:text-5xl">
          {t("homePage.whyChooseSection.title")}
        </h2>

        <div
          ref={ref}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {WHY_RETURN_REASONS.map((reason, index) => {
            const Icon = reason.icon;
            const color = ICON_COLORS[index % ICON_COLORS.length];
            return (
              <div
                key={reason.key}
                style={{ animationDelay: `${index * 100}ms` }}
                className={`rounded-2xl bg-sand-100 p-8 text-center transition hover:shadow-lg
  ${inView ? "animate-fadeUp opacity-100" : "opacity-0 translate-y-6"}
`}
              >
                <span
                  className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border ${color} border-current/30`}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <h3 className="font-serif text-lg text-charcoal">
                  {t(`homePage.whyChooseSection.reasons.${reason.key}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-charcoal/55">
                  {t(
                    `homePage.whyChooseSection.reasons.${reason.key}.description`,
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
