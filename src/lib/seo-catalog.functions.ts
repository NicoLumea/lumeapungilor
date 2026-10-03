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

// Resolve navigation in one browser/server round trip. The redirect lookup and
// public category read are independent, so neither needs to delay the other.
export const getCategoryNavigation = createServerFn({ method: "GET" })
  .validator(slugInput)
  .handler(async ({ data }) => {
    const { fetchSeoCategory, fetchSeoRedirect } = await import("@/lib/seo-catalog.server");
    const [redirectTo, categoryResult] = await Promise.all([
      fetchSeoRedirect(`/categorie/${data.slug}`),
      fetchSeoCategory(data.slug).then(
        (value) => ({ value, error: null }),
        (error: unknown) => ({ value: null, error }),
      ),
    ]);
    // An old URL must still redirect even if its former category no longer loads.
    if (redirectTo) return { redirectTo, result: null };
    if (categoryResult.error) throw categoryResult.error;
    return { redirectTo: null, result: categoryResult.value };
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
