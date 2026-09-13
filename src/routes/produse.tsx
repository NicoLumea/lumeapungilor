import { createFileRoute } from "@tanstack/react-router";
import { Catalogue } from "@/components/site/Catalogue";

export const Route = createFileRoute("/produse")({
  head: () => ({
    meta: [
      { title: "Catalog produse — Lumea Pungilor" },
      {
        name: "description",
        content: "Toate ambalajele disponibile: pungi, fețe de masă și folie cu bule.",
      },
      { property: "og:title", content: "Catalog produse — Lumea Pungilor" },
      { property: "og:description", content: "Toate ambalajele disponibile pentru comandă." },
    ],
  }),
  component: () => <Catalogue title="Toate produsele" />,
});
