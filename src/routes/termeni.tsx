import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";

export const Route = createFileRoute("/termeni")({
  head: () => ({
    meta: [
      { title: "Termeni și condiții — Lumea Pungilor" },
      { name: "description", content: "Termenii și condițiile de utilizare a magazinului." },
      { property: "og:title", content: "Termeni și condiții — Lumea Pungilor" },
      { property: "og:description", content: "Termenii și condițiile de utilizare a magazinului." },
    ],
  }),
  component: () => <ContentPage contentKey="terms" fallbackTitle="Termeni și condiții" />,
});
