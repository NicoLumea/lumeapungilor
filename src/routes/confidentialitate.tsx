import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import { PrivacyPolicy } from "@/components/site/PrivacyPolicy";
import { getSeoContent } from "@/lib/seo-catalog.functions";
import { staticPageHead } from "@/lib/seo-meta";
import { text } from "@/lib/content";

const PRIVACY_INTRO =
  "Protecția datelor cu caracter personal este importantă pentru Lumea Pungilor. Prezenta politică explică ce date putem prelucra atunci când utilizezi site-ul, scopurile pentru care sunt utilizate, temeiurile prelucrării și drepturile de care beneficiezi.";

export const Route = createFileRoute("/confidentialitate")({
  loader: () => getSeoContent({ data: { key: "privacy" } }),
  head: ({ loaderData }) =>
    staticPageHead({
      block: loaderData,
      h1: text(loaderData, "title") ?? "Politica de confidențialitate",
      body: text(loaderData, "body") ?? PRIVACY_INTRO,
      path: "/confidentialitate",
      image: text(loaderData, "image_url"),
    }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const block = Route.useLoaderData();
  return (
    <ContentPage
      contentKey="privacy"
      fallbackTitle="Politica de confidențialitate"
      bodyOverride={text(block, "body") ?? PRIVACY_INTRO}
      initialBlock={block}
    >
      <PrivacyPolicy />
    </ContentPage>
  );
}
