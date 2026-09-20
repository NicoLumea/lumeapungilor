import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { cancelRestockNotice } from "@/lib/restock.functions";

export const Route = createFileRoute("/dezabonare")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Dezabonare anunțuri de stoc — Lumea Pungilor" },
      {
        name: "description",
        content: "Oprește anunțurile prin e-mail privind revenirea produselor în stoc.",
      },
      { property: "og:title", content: "Dezabonare anunțuri de stoc — Lumea Pungilor" },
      { property: "og:description", content: "Oprește anunțurile privind revenirea în stoc." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const cancel = useServerFn(cancelRestockNotice);
  const [state, setState] = useState<"pending" | "done" | "error">("pending");

  useEffect(() => {
    if (!/^[0-9a-f-]{36}$/i.test(token)) {
      setState("error");
      return;
    }
    void cancel({ data: { token } })
      .then((r) => setState(r.ok ? "done" : "error"))
      .catch(() => setState("error"));
  }, [cancel, token]);

  return (
    <div className="site-container max-w-[700px] py-24">
      <h1 className="display text-3xl">Dezabonare</h1>
      <p className="mt-6 text-sm text-muted-foreground" role="status">
        {state === "pending"
          ? "Se procesează cererea…"
          : state === "done"
            ? "Nu vei mai primi anunțuri pentru acest produs."
            : "Linkul de dezabonare nu este valid sau a fost deja folosit."}
      </p>
      <Link to="/magazin" className="micro mt-8 inline-block link-underline">
        Înapoi la magazin
      </Link>
    </div>
  );
}
