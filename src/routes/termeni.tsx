import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import { getSeoContent } from "@/lib/seo-catalog.functions";
import { staticPageHead } from "@/lib/seo-meta";
import { text } from "@/lib/content";

export const Route = createFileRoute("/termeni")({
  loader: () => getSeoContent({ data: { key: "terms" } }),
  head: ({ loaderData }) =>
    staticPageHead({
      block: loaderData,
      h1: text(loaderData, "title") ?? "Termeni și condiții",
      body:
        text(loaderData, "body") ??
        "Termenii și condițiile aplicabile utilizării site-ului și comenzilor Lumea Pungilor.",
      path: "/termeni",
      image: text(loaderData, "image_url"),
    }),
  component: TermsPage,
});

function TermsPage() {
  const block = Route.useLoaderData();
  return (
    <ContentPage
      contentKey="terms"
      fallbackTitle="Termeni și condiții"
      showCompany
      initialBlock={block}
    />
  );
}
