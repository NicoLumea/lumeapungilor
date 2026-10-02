import { IMAGE_VARIANT_WIDTHS, canOptimizeImage, imageVariantPath } from "@/lib/image-variants";
import { IMAGE_BUCKET } from "@/lib/images";
import { supabase } from "@/integrations/supabase/client";

async function webpBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.9),
  );
  if (!blob || blob.type !== "image/webp") throw new Error("WebP encoding is unavailable");
  return blob;
}

/** Create the same versioned paths used by the offline backfill; originals stay untouched. */
export async function uploadImageVariants(file: File, originalPath: string): Promise<void> {
  if (!canOptimizeImage(originalPath)) return;
  const bitmap = await createImageBitmap(file);
  try {
    for (const width of IMAGE_VARIANT_WIDTHS) {
      const outputWidth = Math.min(width, bitmap.width);
      const outputHeight = Math.max(1, Math.round((bitmap.height * outputWidth) / bitmap.width));
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas context is unavailable");
      context.drawImage(bitmap, 0, 0, outputWidth, outputHeight);
      const blob = await webpBlob(canvas);
      const { error } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(imageVariantPath(originalPath, width), blob, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: false,
        });
      if (error) throw error;
    }
  } finally {
    bitmap.close();
  }
}
