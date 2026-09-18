import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";

export const Route = createFileRoute("/livrare")({
  head: () => ({
    meta: [
      { title: "Livrare — Lumea Pungilor" },
      { name: "description", content: "Condiții de livrare și termene de expediere." },
      { property: "og:title", content: "Livrare — Lumea Pungilor" },
      { property: "og:description", content: "Condiții de livrare și termene de expediere." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ContentPage contentKey="shipping" fallbackTitle="Livrare" showCompany />,
});
