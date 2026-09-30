import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  number: z.string().trim().min(3).max(40),
  accessToken: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
});

export const getOrderConfirmation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const { readAuthorizedOrder } = await import("./order-confirmation.server");
    const order = await readAuthorizedOrder(
      data.number,
      data.accessToken,
      getRequestHeader("authorization"),
    );
    return order ? { ok: true as const, order } : { ok: false as const };
  });

export const getOrderConfirmationPdf = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const { readAuthorizedOrder } = await import("./order-confirmation.server");
    const order = await readAuthorizedOrder(
      data.number,
      data.accessToken,
      getRequestHeader("authorization"),
    );
    if (!order) return { ok: false as const };
    const { renderOrderPdf } = await import("./order-pdf.server");
    const bytes = await renderOrderPdf(order);
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 8192) {
      binary += String.fromCharCode(...bytes.slice(offset, offset + 8192));
    }
    return { ok: true as const, base64: btoa(binary) };
  });
