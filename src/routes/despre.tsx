import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";

export const Route = createFileRoute("/despre")({
  head: () => ({
    meta: [
      { title: "Despre noi — Lumea Pungilor" },
      { name: "description", content: "Cine suntem și ce ambalaje furnizăm." },
      { property: "og:title", content: "Despre noi — Lumea Pungilor" },
      { property: "og:description", content: "Cine suntem și ce ambalaje furnizăm." },
    ],
  }),
  component: () => <ContentPage contentKey="about" fallbackTitle="Despre noi" />,
});
