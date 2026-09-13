import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Lumea Pungilor" },
      { name: "description", content: "Date de contact pentru comenzi și oferte." },
      { property: "og:title", content: "Contact — Lumea Pungilor" },
      { property: "og:description", content: "Date de contact pentru comenzi și oferte." },
    ],
  }),
  component: () => <ContentPage contentKey="contact" fallbackTitle="Contact" showCompany />,
});
