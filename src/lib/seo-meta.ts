import defaultSocialAsset from "@/assets/lumea-pungilor-b2b-header-1920x800.png.asset.json";
import { text } from "@/lib/content";
import { imageUrl } from "@/lib/images";
import { absolutePublicUrl } from "@/lib/product-seo";
import { descriptionExcerpt } from "@/lib/safe-markdown";

export function resolvedSeoTitle(block: Record<string, unknown> | undefined, h1: string): string {
  return text(block, "meta_title") ?? `${h1} — Lumea Pungilor`;
}

export function resolvedSeoDescription(
  block: Record<string, unknown> | undefined,
  source: string | null | undefined,
  h1: string,
): string {
  return text(block, "meta_description") ?? (descriptionExcerpt(source) || h1);
}

export function socialImageUrl(
  configured: string | null | undefined,
  fallback: string | null | undefined = defaultSocialAsset.url,
): string | null {
  const source = imageUrl(configured) ?? imageUrl(fallback);
  return source ? absolutePublicUrl(source) : null;
}

export function staticPageHead({
  block,
  h1,
  body,
  path,
  image,
}: {
  block: Record<string, unknown> | undefined;
  h1: string;
  body: string | null | undefined;
  path: string;
  image?: string | null;
}) {
  const title = resolvedSeoTitle(block, h1);
  const description = resolvedSeoDescription(block, body, h1);
  const canonical = absolutePublicUrl(path);
  const shareImage = socialImageUrl(image);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonical },
      { property: "og:type", content: "website" },
      ...(shareImage ? [{ property: "og:image", content: shareImage }] : []),
      { name: "twitter:card", content: "summary_large_image" },
      ...(shareImage ? [{ name: "twitter:image", content: shareImage }] : []),
    ],
    links: [{ rel: "canonical", href: canonical }],
  };
}

export function safeGoogleVerificationToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const token = value.trim();
  return token.length > 0 && token.length <= 255 && /^[A-Za-z0-9_-]+$/.test(token) ? token : null;
}
