import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadImageVariants } from "@/lib/image-upload-variants";
import {
  canOptimizeImage,
  IMAGE_VARIANTS_READY_PATH,
  isExistingStorageObject,
} from "@/lib/image-variants";
import { IMAGE_BUCKET, imageUrl } from "@/lib/images";
import type { Category, Product } from "@/lib/shop-types";

type Progress = {
  done: number;
  total: number;
  originalBytes: number;
  newVariantBytes: number;
  uploaded: number;
  existing: number;
  failed: string[];
};

function formatBytes(bytes: number): string {
  return `${(bytes / 1_000_000).toLocaleString("ro-RO", { maximumFractionDigits: 2 })} MB`;
}

function storedPath(path: unknown): path is string {
  return (
    typeof path === "string" &&
    path.length > 0 &&
    !/^https?:\/\//i.test(path) &&
    !path.startsWith("/api/public/img/") &&
    canOptimizeImage(path)
  );
}

async function downloadOriginal(path: string): Promise<Blob> {
  const url = imageUrl(path);
  if (!url) throw new Error("Adresa imaginii lipsește.");
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) return await response.blob();
      if (response.status < 500) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (attempt === 2) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  throw new Error("Imaginea nu a putut fi descărcată.");
}

export function ImageOptimizationPanel({
  products,
  categories,
}: {
  products: Product[] | undefined;
  categories: Category[] | undefined;
}) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);

  async function optimizeExistingImages() {
    if (!products || !categories || running) return;
    setRunning(true);
    setProgress(null);
    try {
      const { data: home, error: homeError } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "home")
        .maybeSingle();
      if (homeError) throw homeError;
      const homeValue = home?.value;
      const homePaths =
        homeValue && typeof homeValue === "object" && !Array.isArray(homeValue)
          ? Object.entries(homeValue)
              .filter(([name]) => name.endsWith("image_url"))
              .map(([, path]) => path)
          : [];
      const paths = [
        ...new Set(
          [
            ...products.flatMap((product) =>
              (product.product_images ?? []).map((image) => image.url),
            ),
            ...categories.map((category) => category.image_url),
            ...homePaths,
          ].filter(storedPath),
        ),
      ];
      const summary: Progress = {
        done: 0,
        total: paths.length,
        originalBytes: 0,
        newVariantBytes: 0,
        uploaded: 0,
        existing: 0,
        failed: [],
      };
      setProgress({ ...summary });
      for (const path of paths) {
        try {
          const original = await downloadOriginal(path);
          summary.originalBytes += original.size;
          const result = await uploadImageVariants(original, path, true);
          summary.newVariantBytes += result.newBytes;
          summary.uploaded += result.uploaded;
          summary.existing += result.existing;
        } catch (error) {
          console.warn("[images] optimization failed", path, error);
          summary.failed.push(path);
        }
        summary.done++;
        setProgress({ ...summary, failed: [...summary.failed] });
      }
      if (summary.failed.length === 0 && paths.length > 0) {
        const marker = new Blob(
          [
            JSON.stringify({
              version: 1,
              completedAt: new Date().toISOString(),
              originals: paths.length,
            }),
          ],
          { type: "application/json" },
        );
        const { error } = await supabase.storage
          .from(IMAGE_BUCKET)
          .upload(IMAGE_VARIANTS_READY_PATH, marker, {
            contentType: "application/json",
            cacheControl: "30",
            upsert: false,
          });
        if (error && !isExistingStorageObject(error)) throw error;
        toast.success(
          "Imaginile optimizate sunt gata. Reîncarcă previzualizarea în 30 de secunde.",
        );
      } else if (summary.failed.length > 0) {
        toast.error(
          `${summary.failed.length} imagini nu au putut fi optimizate. Poți relua operația.`,
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Optimizarea imaginilor a eșuat.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="mt-6 border border-border p-4" aria-label="Optimizarea fotografiilor">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Fotografii optimizate pentru încărcare rapidă</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Creează o singură dată versiuni WebP în spațiul de stocare. Originalele rămân intacte.
          </p>
        </div>
        <button
          type="button"
          disabled={running || !products || !categories}
          onClick={optimizeExistingImages}
          className="micro border border-foreground px-4 py-2 disabled:opacity-50"
        >
          {running ? "Se optimizează…" : "Optimizează fotografiile existente"}
        </button>
      </div>
      {progress ? (
        <div className="mt-3 text-xs text-muted-foreground" role="status" aria-live="polite">
          <p>
            {progress.done}/{progress.total} imagini · {progress.uploaded} versiuni noi ·{" "}
            {progress.existing} deja existente · {progress.failed.length} erori
          </p>
          <p>
            Originale citite: {formatBytes(progress.originalBytes)} · versiuni noi salvate:{" "}
            {formatBytes(progress.newVariantBytes)}
          </p>
          {progress.failed.length > 0 && !running ? (
            <p className="mt-1 text-red-700">Nereușite: {progress.failed.join(", ")}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
