import { createFileRoute } from "@tanstack/react-router";

const BUCKET = "product-images";

export const Route = createFileRoute("/api/public/img/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const raw = (params as { _splat?: string })._splat ?? "";
        const path = raw.replace(/^\/+/, "");

        if (!path || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        const supabaseUrl = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!supabaseUrl || !key) {
          return new Response("Storage not configured", { status: 500 });
        }

        const upstream = await fetch(
          `${supabaseUrl}/storage/v1/object/${BUCKET}/${path
            .split("/")
            .map(encodeURIComponent)
            .join("/")}`,
          { headers: { apikey: key } },
        );

        if (!upstream.ok || !upstream.body) {
          return new Response("Not found", { status: 404 });
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
