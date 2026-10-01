import { createFileRoute } from "@tanstack/react-router";
import { buildSitemap } from "@/lib/sitemap";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { fetchSitemapCatalog } = await import("@/lib/sitemap.server");
          const { categories, products } = await fetchSitemapCatalog();
          return new Response(buildSitemap(categories, products), {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=300",
            },
          });
        } catch (error) {
          console.error("[sitemap] public catalog unavailable", error);
          return new Response("Sitemap temporarily unavailable", {
            status: 503,
            headers: { "Cache-Control": "no-store" },
          });
        }
      },
    },
  },
});
