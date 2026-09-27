import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/site/ContentPage";
import { PrivacyPolicy } from "@/components/site/PrivacyPolicy";

const PRIVACY_INTRO =
  "Protecția datelor cu caracter personal este importantă pentru Lumea Pungilor. Prezenta politică explică ce date putem prelucra atunci când utilizezi site-ul, scopurile pentru care sunt utilizate, temeiurile prelucrării și drepturile de care beneficiezi.";

export const Route = createFileRoute("/confidentialitate")({
  head: () => ({
    meta: [
      { title: "Politica de confidențialitate — Lumea Pungilor" },
      {
        name: "description",
        content: "Cum prelucrează Lumea Pungilor datele personale și care sunt drepturile tale.",
      },
      { property: "og:title", content: "Politica de confidențialitate — Lumea Pungilor" },
      {
        property: "og:description",
        content: "Cum prelucrează Lumea Pungilor datele personale și care sunt drepturile tale.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ContentPage
      contentKey="privacy"
      fallbackTitle="Politica de confidențialitate"
      titleOverride="Politica de confidențialitate"
      bodyOverride={PRIVACY_INTRO}
    >
      <PrivacyPolicy />
    </ContentPage>
  ),
});
