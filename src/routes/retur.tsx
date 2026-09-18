import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";

export const Route = createFileRoute("/retur")({
  head: () => ({
    meta: [
      { title: "Retur — Lumea Pungilor" },
      { name: "description", content: "Politica de retur și schimb al produselor." },
      { property: "og:title", content: "Retur — Lumea Pungilor" },
      { property: "og:description", content: "Politica de retur și schimb al produselor." },
    ],
  }),
  component: () => <ContentPage contentKey="returns" fallbackTitle="Retur" showCompany />,
});
