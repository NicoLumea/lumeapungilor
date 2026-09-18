import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useCartLines } from "@/lib/use-cart-lines";
import { formatRon } from "@/lib/format";
import { placeOrder } from "@/lib/shop.functions";
import { useAuth } from "@/lib/use-auth";
import { useGuestCartLimit } from "@/lib/dashboard-data";
import { CompanyIdentity } from "@/components/site/CompanyIdentity";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizare comandă — Lumea Pungilor" },
      { name: "description", content: "Date de contact, livrare și facturare." },
      { property: "og:title", content: "Finalizare comandă — Lumea Pungilor" },
      { property: "og:description", content: "Date de contact, livrare și facturare." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutPage,
});

const emptyForm = {
  contact_name: "",
  email: "",
  phone: "",
  company_name: "",
  cui: "",
  reg_com: "",
  billing_address: "",
  delivery_address: "",
  city: "",
  county: "",
  postal_code: "",
  notes: "",
};

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="micro-sm text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {textarea ? (
        <textarea
          value={value}
          required={required}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
        />
      ) : (
        <input
          type={type}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
        />
      )}
    </label>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { lines: cartLines, clear } = useCart();
  const { lines, subtotal, shipping, shippingConfigured, tax, vatRate, total, paymentsConfigured } =
    useCartLines();
  const submit = useServerFn(placeOrder);
  const auth = useAuth();
  const { data: guestLimit } = useGuestCartLimit();
  const distinctProducts = new Set(cartLines.map((l) => l.productId)).size;
  const overGuestLimit = !auth.user && typeof guestLimit === "number" && distinctProducts > guestLimit;
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const set = (key: keyof typeof emptyForm) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return;
    setBusy(true);
    try {
      const result = await submit({
        data: {
          idempotencyKey,
          expectedTotal: total,
          customer: form,
          lines: cartLines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            qty: l.qty,
          })),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      clear();
      navigate({ to: "/comanda/$number", params: { number: result.orderNumber } });
    } catch {
      toast.error("Comanda nu a putut fi trimisă. Încearcă din nou.");
    } finally {
      setBusy(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="site-container max-w-[900px] py-24">
        <h1 className="display text-3xl">Finalizare comandă</h1>
        <p className="mt-6 text-sm text-muted-foreground">Coșul este gol.</p>
        <Link to="/produse" className="micro mt-6 inline-block link-underline">
          Vezi catalogul
        </Link>
      </div>
    );
  }

  return (
    <div className="site-container max-w-[1200px] py-14">
      <h1 className="display text-3xl md:text-4xl">Finalizare comandă</h1>

      {!auth.user ? (
        <div className="mt-6 border border-border bg-field p-4 text-sm">
          <p>
            Comanzi fără cont. Fără cont poți comanda maximum{" "}
            {typeof guestLimit === "number" ? guestLimit : 3} produse diferite, o singură dată per adresă
            de e-mail.
          </p>
          <Link to="/" hash="cont" className="micro-sm mt-2 inline-block link-underline">
            Creează un cont pentru comenzi nelimitate
          </Link>
        </div>
      ) : null}

      {overGuestLimit ? (
        <p className="mt-4 border border-destructive p-4 text-sm text-destructive" role="alert">
          Ai {distinctProducts} produse diferite în coș. Fără cont poți comanda maximum {guestLimit}.
          Creează un cont sau scoate câteva produse din coș.
        </p>
      ) : null}

      {!paymentsConfigured ? (
        <p className="mt-6 border border-border bg-field p-4 text-sm">
          <span className="micro-sm">Flux de test</span> — plata online nu este încă activată. Comanda
          este înregistrată ca cerere, fără nicio plată reală.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          <fieldset className="space-y-5">
            <legend className="micro-sm text-muted-foreground">Contact</legend>
            <Field label="Nume și prenume" value={form.contact_name} onChange={set("contact_name")} required />
            <Field label="E-mail" type="email" value={form.email} onChange={set("email")} required />
            <Field label="Telefon" value={form.phone} onChange={set("phone")} />
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="micro-sm text-muted-foreground">Date de facturare</legend>
            <Field label="Firmă" value={form.company_name} onChange={set("company_name")} />
            <Field label="CUI" value={form.cui} onChange={set("cui")} />
            <Field label="Nr. Reg. Com." value={form.reg_com} onChange={set("reg_com")} />
            <Field label="Adresă de facturare" value={form.billing_address} onChange={set("billing_address")} textarea />
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="micro-sm text-muted-foreground">Livrare</legend>
            <Field label="Adresă de livrare" value={form.delivery_address} onChange={set("delivery_address")} textarea />
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Oraș" value={form.city} onChange={set("city")} />
              <Field label="Județ" value={form.county} onChange={set("county")} />
              <Field label="Cod poștal" value={form.postal_code} onChange={set("postal_code")} />
            </div>
            <Field label="Observații" value={form.notes} onChange={set("notes")} textarea />
          </fieldset>
        </div>

        <aside className="h-fit border border-border p-6">
          <p className="micro-sm text-muted-foreground">Comanda ta</p>
          <ul className="mt-5 space-y-3 text-sm">
            {lines.map((l) => (
              <li key={`${l.product.id}-${l.variant?.id ?? "std"}`} className="flex justify-between gap-4">
                <span>
                  {l.product.name}
                  {l.variant ? ` — ${l.variant.name}` : ""} × {l.qty} {l.product.selling_unit}
                </span>
                <span>{formatRon(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatRon(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Livrare</dt>
              <dd>{shippingConfigured ? formatRon(shipping) : "Se stabilește după confirmare"}</dd>
            </div>
            {vatRate !== null ? (
              <div className="flex justify-between">
                <dt>TVA ({vatRate}%)</dt>
                <dd>{formatRon(tax)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-border pt-3 text-base">
              <dt>Total</dt>
              <dd>{formatRon(total)}</dd>
            </div>
          </dl>
          <button
            type="submit"
            disabled={busy || overGuestLimit}
            className="micro mt-8 w-full border border-foreground bg-foreground px-8 py-4 text-background transition-opacity hover:opacity-85 disabled:opacity-40"
          >
            {busy ? "Se trimite…" : paymentsConfigured ? "Plătește" : "Trimite comanda (test)"}
          </button>
          <div className="mt-6 border-t border-border pt-5">
            <p className="micro-sm mb-3 text-muted-foreground">Datele vânzătorului</p>
            <CompanyIdentity sellerLabel showPhones />
          </div>
        </aside>
      </form>
    </div>
  );
}
