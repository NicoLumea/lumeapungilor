import { createFileRoute } from "@tanstack/react-router";
import { RecommendedProducts } from "@/components/site/RecommendedProducts";
import { StoreHero } from "@/components/site/StoreHero";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumea Pungilor — Ambalaje pentru afaceri" },
      {
        name: "description",
        content: "Ambalaje pentru afaceri și produse disponibile pentru comenzi online.",
      },
      { property: "og:title", content: "Lumea Pungilor — Ambalaje pentru afaceri" },
      {
        property: "og:description",
        content: "Descoperă produsele recomandate și intră în magazinul Lumea Pungilor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <div className="min-h-svh bg-background">
      <StoreHero welcome />
      <RecommendedProducts concise />
    </div>
  );
}
