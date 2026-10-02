import { HeadingText } from "@/components/site/HeadingText";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { submitFeedback } from "@/lib/feedback.functions";
import { usePublishedProducts } from "@/lib/products";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Trimite feedback — Lumea Pungilor" },
      { name: "description", content: "Spune-ne cum putem îmbunătăți experiența ta." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FeedbackPage,
});

function FeedbackPage() {
  const auth = useAuth();
  const send = useServerFn(submitFeedback);
  const { data: products } = usePublishedProducts();
  const [type, setType] = useState<"website" | "product" | "experience">("website");
  const [productId, setProductId] = useState("");
  const [rating, setRating] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (auth.user?.email) setEmail(auth.user.email);
  }, [auth.user?.email]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await send({
        data: {
          feedbackType: type,
          productId: type === "product" ? productId || null : null,
          rating: rating ? Number(rating) : null,
          message,
          email,
          orderNumber: orderNumber || undefined,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSent(true);
    } catch {
      toast.error("Feedbackul nu a putut fi trimis.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="site-container max-w-[760px] py-12 md:py-20">
      <p className="micro-sm text-muted-foreground">Părerea ta contează</p>
      <h1 className="display mt-3 text-3xl md:text-4xl"><HeadingText id="feedback_h1" /></h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Spune-ne ce putem îmbunătăți pe site, la un produs sau în experiența generală. Pentru
        retururi și reclamații folosește{" "}
        <Link to="/retur" className="link-underline text-foreground">
          fluxul dedicat
        </Link>
        .
      </p>
      {sent ? (
        <div className="mt-9 border border-border bg-field p-6 text-sm" role="status">
          Mulțumim! Feedbackul tău a fost trimis echipei noastre.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-9 space-y-6">
          <label className="block">
            <span className="micro-sm">Tip feedback</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as typeof type)}
              className="mt-2 min-h-11 w-full border border-input bg-background px-3 text-sm"
            >
              <option value="website">Website</option>
              <option value="product">Produs</option>
              <option value="experience">Experiență generală</option>
            </select>
          </label>
          {type === "product" ? (
            <label className="block">
              <span className="micro-sm">Produs *</span>
              <select
                required
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                className="mt-2 min-h-11 w-full border border-input bg-background px-3 text-sm"
              >
                <option value="">Alege un produs</option>
                {(products ?? []).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block">
            <span className="micro-sm">Evaluare (opțional)</span>
            <select
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              className="mt-2 min-h-11 w-full border border-input bg-background px-3 text-sm"
            >
              <option value="">Fără evaluare</option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="micro-sm">Mesaj *</span>
            <textarea
              required
              minLength={10}
              maxLength={3000}
              rows={6}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="mt-2 w-full border border-input bg-background px-3 py-3 text-sm"
            />
          </label>
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="micro-sm">E-mail *</span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 min-h-11 w-full border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="block">
              <span className="micro-sm">Număr comandă (opțional)</span>
              <input
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                className="mt-2 min-h-11 w-full border border-input bg-background px-3 text-sm"
              />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Folosim e-mailul doar pentru a putea răspunde feedbackului tău. Citește{" "}
            <Link to="/confidentialitate" className="link-underline">
              Politica de confidențialitate
            </Link>
            .
          </p>
          <button
            type="submit"
            disabled={busy}
            className="micro min-h-11 border border-foreground bg-foreground px-7 py-3 text-background disabled:opacity-50"
          >
            {busy ? "Se trimite…" : "Trimite feedback"}
          </button>
        </form>
      )}
    </div>
  );
}
