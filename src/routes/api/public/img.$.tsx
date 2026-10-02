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

        // The bucket is private with no public read policy; images are served
        // exclusively through this endpoint using the server-side admin client.
        let data: Blob | null = null;
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const result = await supabaseAdmin.storage.from(BUCKET).download(path);
          if (result.error) return new Response("Not found", { status: 404 });
          data = result.data;
        } catch (err) {
          console.warn("[img] storage unavailable", err instanceof Error ? err.message : String(err));
          return new Response("Image temporarily unavailable", {
            status: 503,
            headers: { "Cache-Control": "no-store" },
          });
        }

        if (!data) {
          return new Response("Not found", { status: 404 });
        }

        return new Response(data, {
          status: 200,
          headers: {
            "Content-Type": data.type || "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
