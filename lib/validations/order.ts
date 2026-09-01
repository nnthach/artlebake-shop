import { z } from "zod";

export const createShippingSchema = (
  t: (path: string) => string,
  fulfillmentMethod: "delivery" | "pickup",
) =>
  z
    .object({
      name: z.string().min(1, t("orderPage.errors.fullNameRequired")),

      phone: z
        .string()
        .min(1, t("orderPage.errors.phoneRequired"))
        .regex(/^(0|\+84)\d{9,10}$/, t("orderPage.errors.phoneInvalid")),

      email: z
        .string()
        .min(1, t("orderPage.errors.emailRequired"))
        .email(t("orderPage.errors.emailInvalid")),

      city: z.string().optional(),
      district: z.string().optional(),
      ward: z.string().optional(),
      address: z.string().optional(),

      note: z.string().optional(),

      paymentMethod: z.enum(["visa", "qr", ""]),
    })
    .superRefine((data, ctx) => {
      // Chỉ validate địa chỉ khi giao hàng
      if (fulfillmentMethod === "delivery") {
        if (!data.city) {
          ctx.addIssue({
            code: "custom",
            path: ["city"],
            message: t("orderPage.errors.cityRequired"),
          });
        }

        if (!data.district) {
          ctx.addIssue({
            code: "custom",
            path: ["district"],
            message: t("orderPage.errors.districtRequired"),
          });
        }

        if (!data.ward) {
          ctx.addIssue({
            code: "custom",
            path: ["ward"],
            message: t("orderPage.errors.wardRequired"),
          });
        }

        if (!data.address) {
          ctx.addIssue({
            code: "custom",
            path: ["address"],
            message: t("orderPage.errors.addressRequired"),
          });
        }
      }
    });

export type ShippingFormData = z.infer<ReturnType<typeof createShippingSchema>>;
