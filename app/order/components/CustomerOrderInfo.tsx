"use client";

import { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";

import InputFormField from "@/components/custom/InputFormField";
import { useI18n } from "@/context/I18nContext";
import { ShippingFormData } from "@/lib/validations/order";

const fieldClassName =
  "flex w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground";

interface CustomerOrderInfoProps {
  register: UseFormRegister<ShippingFormData>;
  setValue: UseFormSetValue<ShippingFormData>;
  errors: FieldErrors<ShippingFormData>;
  isSubmitting: boolean;
}

export default function CustomerOrderInfo({
  register,
  errors,
  isSubmitting,
}: CustomerOrderInfoProps) {
  const { t } = useI18n();

  return (
    <section className="">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
        {t("orderPage.info.title")}
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputFormField
          label={t("orderPage.info.fullName")}
          type="text"
          placeholder={t("orderPage.info.fullNamePlaceholder")}
          required
          disabled={isSubmitting}
          error={errors.name?.message}
          className={fieldClassName}
          {...register("name")}
        />

        <InputFormField
          label={t("orderPage.info.phone")}
          type="text"
          placeholder={t("orderPage.info.phonePlaceholder")}
          required
          disabled={isSubmitting}
          error={errors.phone?.message}
          className={fieldClassName}
          {...register("phone")}
        />

        <div className="sm:col-span-2">
          <InputFormField
            label={t("orderPage.info.email")}
            type="email"
            placeholder={t("orderPage.info.emailPlaceholder")}
            required
            disabled={isSubmitting}
            error={errors.email?.message}
            className={fieldClassName}
            {...register("email")}
          />
        </div>

        <div className="sm:col-span-2">
          <InputFormField
            label={t("orderPage.info.note")}
            type="textarea"
            rows={2}
            placeholder={t("orderPage.info.notePlaceholder")}
            disabled={isSubmitting}
            error={errors.note?.message}
            className={fieldClassName}
            {...register("note")}
          />
        </div>
      </div>
    </section>
  );
}
