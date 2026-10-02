import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const slugInput = (data: unknown) =>
  z.object({ slug: z.string().trim().min(1).max(200) }).parse(data);

export const getSeoCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchSeoCatalog } = await import("@/lib/seo-catalog.server");
  return fetchSeoCatalog();
});

export const getSeoCategory = createServerFn({ method: "GET" })
  .validator(slugInput)
  .handler(async ({ data }) => {
    const { fetchSeoCategory } = await import("@/lib/seo-catalog.server");
    return fetchSeoCategory(data.slug);
  });

export const getSeoProduct = createServerFn({ method: "GET" })
  .validator(slugInput)
  .handler(async ({ data }) => {
    const { fetchSeoProduct } = await import("@/lib/seo-catalog.server");
    return fetchSeoProduct(data.slug);
  });
