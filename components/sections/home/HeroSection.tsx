"use client";

import { useI18n } from "@/context/I18nContext";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const SLIDES = [
  { src: "/images/banner1.webp", alt: "Freshly baked bread loaves" },
  { src: "/images/banner2.webp", alt: "Artisan bakery display" },
  { src: "/images/banner3.webp", alt: "Fresh pastries and bread" },
];

const SLIDE_DURATION = 6000;

export default function HeroSection() {
  const [active, setActive] = useState(0);
  const { t } = useI18n();

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="home"
      className="relative flex h-screen min-h-[680px] flex-col items-center justify-center overflow-hidden px-6 pt-16"
    >
      <div className="absolute inset-0 overflow-hidden">
        {SLIDES.map((slide, i) => {
          const step = (i - active + SLIDES.length) % SLIDES.length;
          const pos = step === 0 ? 0 : step === 1 ? 1 : -1;
          return (
            <div
              key={slide.src}
              className="absolute inset-0 transition-transform duration-&lsqb;1000ms&rsqb; ease-&lsqb;cubic-bezier(0.65,0,0.35,1)&rsqb;"
              style={{ transform: `translateY(${pos * 100}%)` }}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={i === 0}
                className="object-cover object-center"
              />
            </div>
          );
        })}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/65 via-charcoal-900/25 to-charcoal-900/75" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_55%_at_50%_42%,rgba(0,0,0,0.4),transparent_70%)]" />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center animate-fadeInUp">
        <p className="font-script text-4xl text-amber sm:text-5xl">
          {t("homePage.heroSection.badge")}
        </p>
        <h1 className="mt-1 text-4xl font-bold leading-[1.15] text-white sm:text-5xl lg:text-6xl whitespace-pre-line">
          {t("homePage.heroSection.title")}
        </h1>
        <p className="mt-6 max-w-md text-balance text-white/75">
          {t("homePage.heroSection.description")}
        </p>

        <Link
          href="/menu"
          className="group mt-8 inline-flex items-center gap-2 border-b border-white/40 pb-1 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:border-amber hover:text-amber"
        >
          {t("button.orderNow")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-3 lg:right-10 lg:flex">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setActive(i)}
            className={`rounded-full transition-all ${
              i === active
                ? "h-2.5 w-2.5 bg-amber"
                : "h-1.5 w-1.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
