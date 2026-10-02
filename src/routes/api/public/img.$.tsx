import { createFileRoute } from "@tanstack/react-router";
import {
  IMAGE_VARIANT_WIDTHS,
  IMAGE_VARIANTS_READY_PATH,
  imageVariantPath,
} from "@/lib/image-variants";

const BUCKET = "product-images";
let readyUntil = 0;
let ready = false;
let pendingReadyCheck: Promise<boolean> | null = null;

function storageVariantsReady(check: () => Promise<boolean>): Promise<boolean> {
  if (Date.now() < readyUntil) return Promise.resolve(ready);
  if (!pendingReadyCheck) {
    pendingReadyCheck = check()
      .then((found) => {
        ready = found;
        readyUntil = Date.now() + (found ? 60_000 : 15_000);
        return found;
      })
      .finally(() => {
        pendingReadyCheck = null;
      });
  }
  return pendingReadyCheck;
}

export const Route = createFileRoute("/api/public/img/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const raw = (params as { _splat?: string })._splat ?? "";
        const path = raw.replace(/^\/+/, "");

        if (!path || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        // The bucket is private with no public read policy; images are served
        // exclusively through this endpoint using the server-side admin client.
        let data: Blob | null = null;
        let variantFound = false;
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const bucket = supabaseAdmin.storage.from(BUCKET);
          const requestedWidth = Number(new URL(request.url).searchParams.get("w"));
          const hasWidth = IMAGE_VARIANT_WIDTHS.includes(
            requestedWidth as (typeof IMAGE_VARIANT_WIDTHS)[number],
          );
          const variantsReady =
            hasWidth &&
            (process.env["PRODUCT_IMAGE_VARIANTS_READY"] === "1" ||
              (await storageVariantsReady(async () => {
                const { error } = await bucket.download(IMAGE_VARIANTS_READY_PATH);
                return !error;
              })));
          if (variantsReady) {
            const variant = await bucket.download(
              imageVariantPath(path, requestedWidth as (typeof IMAGE_VARIANT_WIDTHS)[number]),
            );
            if (!variant.error) {
              data = variant.data;
              variantFound = true;
            }
          }
          if (!data) {
            let original;
            try {
              original = await bucket.download(path);
            } catch {
              // Retry brief storage/network hiccups while preserving the original fallback.
              await new Promise((resolve) => setTimeout(resolve, 400));
              original = await bucket.download(path);
            }
            if (original.error) return new Response("Not found", { status: 404 });
            data = original.data;
          }
        } catch (err) {
          console.warn(
            "[img] storage unavailable",
            err instanceof Error ? err.message : String(err),
          );
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
            "X-Image-Source": variantFound ? "webp-variant" : "original",
            // A short fallback TTL lets a newly backfilled variant replace an original.
            "Cache-Control": variantFound
              ? "public, max-age=31536000, immutable"
              : "public, max-age=30",
          },
        });
      },
    },
  },
});
