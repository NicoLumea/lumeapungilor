import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";

export const Route = createFileRoute("/confidentialitate")({
  head: () => ({
    meta: [
      { title: "Confidențialitate — Lumea Pungilor" },
      { name: "description", content: "Cum sunt prelucrate datele personale." },
      { property: "og:title", content: "Confidențialitate — Lumea Pungilor" },
      { property: "og:description", content: "Cum sunt prelucrate datele personale." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ContentPage contentKey="privacy" fallbackTitle="Confidențialitate" showCompany />,
});
