import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const slugInput = (data: unknown) =>
  z.object({ slug: z.string().trim().min(1).max(200) }).parse(data);

const contentInput = (data: unknown) =>
  z.object({ key: z.string().regex(/^[a-z][a-z0-9_-]{0,49}$/) }).parse(data);

const pathInput = (data: unknown) =>
  z.object({ path: z.string().regex(/^\/(produs|categorie)\/[a-z0-9][a-z0-9-]*$/) }).parse(data);

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

export const getSeoContent = createServerFn({ method: "GET" })
  .validator(contentInput)
  .handler(async ({ data }) => {
    const { fetchSeoContent } = await import("@/lib/seo-catalog.server");
    return fetchSeoContent(data.key);
  });

export const getSeoRedirect = createServerFn({ method: "GET" })
  .validator(pathInput)
  .handler(async ({ data }) => {
    const { fetchSeoRedirect } = await import("@/lib/seo-catalog.server");
    return fetchSeoRedirect(data.path);
  });
