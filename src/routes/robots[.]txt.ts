import { createFileRoute } from "@tanstack/react-router";
import { SITEMAP_ORIGIN } from "@/lib/sitemap";

const PRIVATE_PATHS = [
  "/admin",
  "/n7q4-v2m9",
  // Match the account page only; a prefix rule also blocks the public /contact page.
  "/cont$",
  "/comenzile-mele",
  "/checkout",
  "/cos",
  "/autentificare",
  "/resetare-parola",
  "/parola-noua",
];

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          [
            "User-agent: *",
            "Allow: /",
            ...PRIVATE_PATHS.map((path) => `Disallow: ${path}`),
            "",
            `Sitemap: ${SITEMAP_ORIGIN}/sitemap.xml`,
            "",
          ].join("\n"),
          {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "public, max-age=300",
            },
          },
        ),
    },
  },
});
