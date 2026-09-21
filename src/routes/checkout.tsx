import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useCartLines } from "@/lib/use-cart-lines";
import { formatRon } from "@/lib/format";
import { placeOrder } from "@/lib/shop.functions";
import { useAuth } from "@/lib/use-auth";
import { useGuestCartLimit } from "@/lib/dashboard-data";
import { CompanyIdentity } from "@/components/site/CompanyIdentity";
import { SUPPORT_EMAIL, telephoneHref } from "@/lib/company";
import { useEnabledMethods } from "@/lib/methods";

const SUPPORT_PHONE = "0765 514 422";

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

type FormKey = keyof typeof emptyForm;

function Field({
  id,
  label,
  value,
  onChange,
  required,
  type = "text",
  textarea,
  autoComplete,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  textarea?: boolean;
  autoComplete?: string | undefined;
  error?: string | undefined;
}) {
  const describedBy = error ? `${id}-error` : undefined;
  const cls =
    "mt-2 w-full border bg-background px-3 py-2 text-sm outline-none focus:border-foreground";
  const style = { borderColor: error ? "var(--destructive)" : "var(--input)" };
  return (
    <div>
      <label htmlFor={id} className="block">
        <span className="micro-sm text-muted-foreground">
          {label}
          {required ? " *" : ""}
        </span>
      </label>
      {textarea ? (
        <textarea
          id={id}
          value={value}
          rows={3}
          autoComplete={autoComplete}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
          style={style}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
          style={style}
        />
      )}
      {error ? (
        <p id={describedBy} role="alert" className="mt-1 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const DRAFT_KEY = "lp-checkout-draft";

function CheckoutPage() {
  const navigate = useNavigate();
  const { lines: cartLines, clear } = useCart();
  const { lines, subtotal, shipping, shippingConfigured, tax, vatRate, total } = useCartLines();
  const submit = useServerFn(placeOrder);
  const auth = useAuth();
  const { data: guestLimit } = useGuestCartLimit();
  const distinctProducts = new Set(cartLines.map((l) => l.productId)).size;
  const overGuestLimit =
    !auth.user && typeof guestLimit === "number" && distinctProducts > guestLimit;
  const [form, setForm] = useState(emptyForm);
  const [customerType, setCustomerType] = useState<"persoana" | "companie">("persoana");
  const [billingSame, setBillingSame] = useState(true);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FormKey | "terms", string | undefined>>>({});
  const [busy, setBusy] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  // Going back to the cart and returning must not lose what was already typed.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        form?: Partial<typeof emptyForm>;
        customerType?: "persoana" | "companie";
        billingSame?: boolean;
      };
      if (saved.form) setForm((f) => ({ ...f, ...saved.form }));
      if (saved.customerType) setCustomerType(saved.customerType);
      if (typeof saved.billingSame === "boolean") setBillingSame(saved.billingSame);
    } catch {
      /* a corrupted draft simply starts the form empty */
    }
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, customerType, billingSame }));
  }, [form, customerType, billingSame]);

  const set = (key: FormKey) => (v: string) => {
    setForm((f) => ({ ...f, [key]: v }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function validate() {
    const next: Partial<Record<FormKey | "terms", string | undefined>> = {};
    if (form.contact_name.trim().length < 2) next.contact_name = "Introdu numele și prenumele.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()))
      next.email = "Introdu o adresă de e-mail validă.";
    if (form.phone.replace(/\D/g, "").length < 9) next.phone = "Introdu un număr de telefon valid.";
    if (form.delivery_address.trim().length < 5)
      next.delivery_address = "Introdu adresa de livrare.";
    if (form.city.trim().length < 2) next.city = "Introdu orașul.";
    if (form.county.trim().length < 2) next.county = "Introdu județul.";
    if (!/^\d{4,10}$/.test(form.postal_code.trim())) next.postal_code = "Introdu codul poștal.";
    if (customerType === "companie") {
      if (form.company_name.trim().length < 2) next.company_name = "Introdu numele firmei.";
      if (form.cui.trim().length < 2) next.cui = "Introdu CUI-ul firmei.";
      if (!billingSame && form.billing_address.trim().length < 5)
        next.billing_address = "Introdu adresa de facturare.";
    } else if (!billingSame && form.billing_address.trim().length < 5) {
      next.billing_address = "Introdu adresa de facturare.";
    }
    if (!terms)
      next.terms =
        "Pentru a trimite cererea trebuie să accepți Termenii și Politica de confidențialitate.";
    setErrors(next);
    const firstInvalid = Object.keys(next)[0];
    if (firstInvalid && firstInvalid !== "terms") {
      window.document.getElementById(firstInvalid)?.focus();
    }
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0 || busy) return;
    if (!validate()) {
      toast.error("Te rugăm să completezi câmpurile obligatorii.");
      return;
    }
    setBusy(true);
    try {
      const billing = billingSame
        ? [
            form.delivery_address,
            [form.city, form.county, form.postal_code].filter(Boolean).join(", "),
          ]
            .filter(Boolean)
            .join("\n")
        : form.billing_address;
      const result = await submit({
        data: {
          idempotencyKey,
          expectedTotal: total,
          termsAccepted: true as const,
          customer: {
            ...form,
            billing_address: billing,
            company_name: customerType === "companie" ? form.company_name : null,
            cui: customerType === "companie" ? form.cui : null,
            reg_com: customerType === "companie" ? form.reg_com : null,
          },
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
      window.sessionStorage.removeItem(DRAFT_KEY);
      navigate({ to: "/comanda/$number", params: { number: result.orderNumber } });
    } catch {
      toast.error("Cererea de comandă nu a putut fi trimisă. Încearcă din nou.");
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
      <Link to="/cos" className="micro-sm inline-flex min-h-11 items-center link-underline">
        ← Înapoi la coș
      </Link>
      <h1 className="display mt-3 text-3xl md:text-4xl">Finalizare comandă</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Ajutor pentru comandă:{" "}
        <a href={telephoneHref(SUPPORT_PHONE)} className="link-underline text-foreground">
          {SUPPORT_PHONE}
        </a>{" "}
        /{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="link-underline text-foreground">
          {SUPPORT_EMAIL}
        </a>
      </p>

      {!auth.user ? (
        <div className="mt-6 border border-border bg-field p-4 text-sm">
          <p>
            Comanzi fără cont. Fără cont poți comanda maximum{" "}
            {typeof guestLimit === "number" ? guestLimit : 3} produse diferite, o singură dată per
            adresă de e-mail.
          </p>
          <Link
            to="/autentificare"
            search={{ redirect: "/checkout" }}
            className="micro-sm mt-2 inline-block link-underline"
          >
            Creează un cont pentru comenzi nelimitate
          </Link>
        </div>
      ) : null}

      {overGuestLimit ? (
        <p className="mt-4 border border-destructive p-4 text-sm text-destructive" role="alert">
          Ai {distinctProducts} produse diferite în coș. Fără cont poți comanda maximum {guestLimit}
          . Creează un cont sau scoate câteva produse din coș.
        </p>
      ) : null}

      <p className="mt-6 border border-border bg-field p-4 text-sm">
        Comanda este trimisă spre confirmare. Echipa Lumea Pungilor te va contacta pentru
        confirmarea disponibilității, livrării și modalității de plată.
      </p>

      <ConfirmedMethods />

      <form onSubmit={onSubmit} noValidate className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          <fieldset className="space-y-5">
            <legend className="micro-sm text-muted-foreground">Contact</legend>
            <Field
              id="contact_name"
              label="Nume și prenume"
              autoComplete="name"
              value={form.contact_name}
              onChange={set("contact_name")}
              required
              error={errors.contact_name}
            />
            <Field
              id="email"
              label="E-mail"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set("email")}
              required
              error={errors.email}
            />
            <Field
              id="phone"
              label="Telefon"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={set("phone")}
              required
              error={errors.phone}
            />
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="micro-sm text-muted-foreground">Livrare</legend>
            <Field
              id="delivery_address"
              label="Adresă de livrare"
              autoComplete="shipping street-address"
              value={form.delivery_address}
              onChange={set("delivery_address")}
              required
              textarea
              error={errors.delivery_address}
            />
            <div className="grid gap-5 md:grid-cols-3">
              <Field
                id="city"
                label="Oraș"
                autoComplete="shipping address-level2"
                value={form.city}
                onChange={set("city")}
                required
                error={errors.city}
              />
              <Field
                id="county"
                label="Județ"
                autoComplete="shipping address-level1"
                value={form.county}
                onChange={set("county")}
                required
                error={errors.county}
              />
              <Field
                id="postal_code"
                label="Cod poștal"
                autoComplete="shipping postal-code"
                value={form.postal_code}
                onChange={set("postal_code")}
                required
                error={errors.postal_code}
              />
            </div>
            <Field
              id="notes"
              label="Observații"
              value={form.notes}
              onChange={set("notes")}
              textarea
            />
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="micro-sm text-muted-foreground">Facturare</legend>

            <div role="radiogroup" aria-label="Tip client" className="flex flex-wrap gap-3">
              {(["persoana", "companie"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={customerType === t}
                  onClick={() => setCustomerType(t)}
                  className="micro-sm min-h-11 border px-5 py-2.5"
                  style={{
                    borderColor: customerType === t ? "var(--foreground)" : "var(--border)",
                    background: customerType === t ? "var(--foreground)" : "transparent",
                    color: customerType === t ? "var(--background)" : "inherit",
                  }}
                >
                  {t === "persoana" ? "Persoană fizică" : "Companie"}
                </button>
              ))}
            </div>

            {customerType === "companie" ? (
              <>
                <Field
                  id="company_name"
                  label="Firmă"
                  autoComplete="organization"
                  value={form.company_name}
                  onChange={set("company_name")}
                  required
                  error={errors.company_name}
                />
                <Field
                  id="cui"
                  label="CUI"
                  value={form.cui}
                  onChange={set("cui")}
                  required
                  error={errors.cui}
                />
                <Field
                  id="reg_com"
                  label="Nr. Reg. Com."
                  value={form.reg_com}
                  onChange={set("reg_com")}
                  error={errors.reg_com}
                />
              </>
            ) : null}

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={billingSame}
                onChange={(e) => setBillingSame(e.target.checked)}
                className="mt-1 size-4"
              />
              <span>Adresa de facturare este aceeași cu adresa de livrare</span>
            </label>

            {!billingSame ? (
              <Field
                id="billing_address"
                label="Adresă de facturare"
                autoComplete="billing street-address"
                value={form.billing_address}
                onChange={set("billing_address")}
                required
                textarea
                error={errors.billing_address}
              />
            ) : null}
          </fieldset>
        </div>

        <aside className="h-fit border border-border p-6">
          <p className="micro-sm text-muted-foreground">Comanda ta</p>
          <ul className="mt-5 space-y-3 text-sm">
            {lines.map((l) => (
              <li
                key={`${l.product.id}-${l.variant?.id ?? "std"}`}
                className="flex justify-between gap-4"
              >
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

          <label className="mt-6 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => {
                setTerms(e.target.checked);
                if (e.target.checked) setErrors((x) => ({ ...x, terms: undefined }));
              }}
              aria-invalid={!!errors.terms}
              aria-describedby={errors.terms ? "terms-error" : undefined}
              className="mt-1 size-4"
            />
            <span>
              Am citit și accept{" "}
              <a
                href="/termeni"
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline"
              >
                Termenii și condițiile
              </a>{" "}
              și{" "}
              <a
                href="/confidentialitate"
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline"
              >
                Politica de confidențialitate
              </a>
              .
            </span>
          </label>
          {errors.terms ? (
            <p id="terms-error" role="alert" className="mt-2 text-sm text-destructive">
              {errors.terms}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || overGuestLimit}
            className="micro mt-6 w-full border border-foreground bg-foreground px-8 py-4 text-background transition-opacity hover:opacity-85 disabled:opacity-40"
          >
            {busy ? "Se trimite…" : "Trimite cererea de comandă"}
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

function MethodList({
  title,
  items,
}: {
  title: string;
  items: { label: string; description: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="micro-sm text-muted-foreground">{title}</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {items.map((m) => (
          <li key={m.label}>
            <span className="font-medium">{m.label}</span>
            {m.description ? (
              <span className="text-muted-foreground"> — {m.description}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Shows only the payment and delivery methods an administrator has confirmed. */
function ConfirmedMethods() {
  const { data: payments } = useEnabledMethods("payment_methods");
  const { data: deliveries } = useEnabledMethods("delivery_methods");
  if (payments.length === 0 && deliveries.length === 0) return null;
  return (
    <div className="mt-4 grid gap-6 border border-border p-4 sm:grid-cols-2">
      <MethodList title="Modalități de plată" items={payments} />
      <MethodList title="Modalități de livrare" items={deliveries} />
    </div>
  );
}
