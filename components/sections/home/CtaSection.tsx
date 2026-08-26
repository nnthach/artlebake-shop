"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/context/I18nContext";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function CtaSection() {
  const { t } = useI18n();
  return (
    <section className="relative z-10 flex min-h-[70vh] flex-col items-center justify-center overflow-hidden bg-sand px-6 py-24 text-center">
      <Image
        src="/images/cake_banner.webp"
        alt="Fresh pastries on the counter"
        fill
        className="object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-sand" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <p className="font-script text-3xl text-amber sm:text-4xl">
          {t("homePage.ctaSection.badge")}
        </p>
        <h2 className="mt-4 text-3xl font-bold leading-tight text-charcoal sm:text-4xl">
          {t("homePage.ctaSection.titleOne")}
          <br />
          <span className="text-charcoal/40">
            {t("homePage.ctaSection.titleTwo")}
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-charcoal/60">
          {t("homePage.ctaSection.description")}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link href={"/menu"}>
            <Button
              variant="accent"
              size={"lg"}
              className="gap-2 font-semibold"
            >
              {t("button.exploreMenu")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={"/#"}>
            <Button
              variant="outline"
              size={"lg"}
              className="gap-2 border-charcoal/25 bg-transparent font-semibold text-charcoal hover:bg-charcoal/5 hover:text-charcoal"
            >
              {t("button.visitOurBakery")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
