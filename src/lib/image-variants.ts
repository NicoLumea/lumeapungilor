import { imageUrl } from "./images.ts";

export const IMAGE_VARIANT_WIDTHS = [160, 320, 640, 960, 1600] as const;
export type ImageVariantWidth = (typeof IMAGE_VARIANT_WIDTHS)[number];
export const IMAGE_VARIANTS_READY_PATH = "_variants/v1/ready.json";

/** Storage reports duplicate uploads as either 400 or 409, depending on the API path. */
export function isExistingStorageObject(error: {
  statusCode?: string | number | undefined;
  message?: string | undefined;
}): boolean {
  return (
    String(error.statusCode) === "409" ||
    (String(error.statusCode) === "400" && /already exists/i.test(error.message ?? ""))
  );
}

export function canOptimizeImage(path: string): boolean {
  return !/\.(?:gif|svg|ico)(?:\?|$)/i.test(path);
}

/** Variants live beside their untouched original in the same private bucket. */
export function imageVariantPath(path: string, width: ImageVariantWidth): string {
  return `_variants/v1/w${width}/${path.replace(/^\/+/, "")}.webp`;
}

export function imageVariantUrl(
  path: string | null | undefined,
  width: ImageVariantWidth,
): string | null {
  const original = imageUrl(path);
  if (!original || !original.startsWith("/api/public/img/") || !canOptimizeImage(original)) {
    return original;
  }
  const url = new URL(original, "http://localhost");
  url.searchParams.set("w", String(width));
  url.searchParams.set("v", "2");
  return `${url.pathname}${url.search}`;
}

export function imageVariantSrcSet(
  path: string | null | undefined,
  widths: readonly ImageVariantWidth[],
): string | undefined {
  if (!path || !imageUrl(path)?.startsWith("/api/public/img/") || !canOptimizeImage(path)) {
    return undefined;
  }
  return widths.map((width) => `${imageVariantUrl(path, width)} ${width}w`).join(", ");
}
