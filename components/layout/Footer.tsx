"use client";

import { useI18n } from "@/context/I18nContext";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path
        fill="#1877F2"
        d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.79 8.44-4.94 8.44-9.94Z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <defs>
        <linearGradient id="igGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFDD55" />
          <stop offset="25%" stopColor="#FF543E" />
          <stop offset="50%" stopColor="#C837AB" />
          <stop offset="75%" stopColor="#7638FA" />
          <stop offset="100%" stopColor="#3E5CFF" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="url(#igGradient)" />
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
      />
      <circle cx="17.2" cy="6.8" r="1.1" fill="#fff" />
    </svg>
  );
}

function TiktokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      {/* lớp cyan (offset trái) */}
      <path
        fill="#25F4EE"
        transform="translate(-0.9, 0.6)"
        d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z"
      />
      {/* lớp hồng (offset phải) */}
      <path
        fill="#FE2C55"
        transform="translate(0.9, -0.6)"
        d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z"
      />
      {/* lớp đen chính giữa */}
      <path
        fill="#000000"
        d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z"
      />
    </svg>
  );
}

export default function Footer() {
  const { t, locale } = useI18n();

  return (
    <footer
      id="contact"
      className="relative z-10 bg-sand border-t border-sand-200 px-4 py-10 sm:px-6 sm:py-16 text-charcoal/80"
    >
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {/*shop */}
        <div>
          <div className="flex items-center gap-2 text-xl font-bold text-charcoal">
            <Image
              src="/images/logo.jpg"
              alt="Artle Bakeshop"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
            <span className="font-serif">Artle Bakeshop</span>
          </div>
          <p className="mt-4 text-sm text-charcoal/60 whitespace-pre-line">
            {t("footer.brand.description")}
          </p>
          <div className="mt-5 flex gap-3">
            <a
              href="https://www.facebook.com/profile.php?id=61569251378180"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/15 transition hover:bg-charcoal/5"
            >
              <FacebookIcon />
            </a>
            <a
              href="https://www.instagram.com/artlebakeshop/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/15 transition hover:bg-charcoal/5"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://www.tiktok.com/@artlebakeshop"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/15 transition hover:bg-charcoal/5"
            >
              <TiktokIcon />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:contents">
          {/*Our menu */}
          <div>
            <h4 className="font-serif text-charcoal">
              {t("footer.menu.title")}
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-charcoal/60">
              <li>
                <Link
                  href="/#bestsellers"
                  className="transition hover:text-charcoal"
                >
                  {t("footer.menu.links.bestsellers")}
                </Link>
              </li>
              <li>
                <Link
                  href="/#standards"
                  className="transition hover:text-charcoal"
                >
                  {t("footer.menu.links.standards")}
                </Link>
              </li>
              <li>
                <Link href="/#why" className="transition hover:text-charcoal">
                  {t("footer.menu.links.whyChoose")}
                </Link>
              </li>
            </ul>
          </div>

          {/*About us */}
          <div>
            <h4 className="font-serif text-charcoal">
              {t("footer.about.title")}
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-charcoal/60">
              <li>
                <Link href="/#story" className="transition hover:text-charcoal">
                  {t("footer.about.links.ourStory")}
                </Link>
              </li>
              <li>
                <Link href="/#home" className="transition hover:text-charcoal">
                  {t("footer.about.links.ourBakery")}
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact"
                  className="transition hover:text-charcoal"
                >
                  {t("footer.about.links.getInTouch")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/*address info */}
        <div>
          <h4 className="font-serif text-charcoal">
            {t("footer.visit.title")}
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-charcoal/60">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-primary" />{" "}
              {locale === "vi"
                ? "331 Bến Vân Đồn, Phường Vĩnh Hội, Quận 4, TP Hồ Chí Minh"
                : "331 Ben Van Don, Vinh Hoi Ward, District 4, Ho Chi Minh City"}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> {"0123456789"}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />{" "}
              {"artlebakeshop@gmail.com"}
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />{" "}
              {locale === "vi"
                ? "Mở cửa hàng ngày: 8:00 - 20:00"
                : "Open Daily: 8:00 AM – 8:00 PM"}{" "}
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl border-t border-charcoal/10 pt-6 text-center text-xs text-charcoal/40">
        {t("footer.copyright")}
      </div>
    </footer>
  );
}
