import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useCart } from "@/lib/cart";
import { useCartLines } from "@/lib/use-cart-lines";
import { formatRon } from "@/lib/format";
import { placeOrder } from "@/lib/shop.functions";
import { useAuth } from "@/lib/use-auth";
import { useGuestCartLimit, useMyProfile } from "@/lib/dashboard-data";
import { checkoutCustomerSchema, type CheckoutCustomer } from "@/lib/checkout-schema";
import { ROMANIAN_COUNTIES } from "@/lib/counties";
import { CompanyIdentity } from "@/components/site/CompanyIdentity";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizare comandă — Lumea Pungilor" },
      { name: "description", content: "Date de contact, livrare și facturare." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const emptyForm: CheckoutCustomer = {
  contact_name: "",
  email: "",
  phone: "",
  company_name: "",
  cui: "",
  reg_com: "",
  delivery_address: "",
  city: "",
  county: "",
  postal_code: "",
  delivery_instructions: "",
  same_as_delivery: true,
  billing_address: "",
  billing_city: "",
  billing_county: "",
  billing_postal_code: "",
};
type FieldName = Exclude<keyof CheckoutCustomer, "same_as_delivery">;

function TextField({
  name,
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  multiline = false,
}: {
  name: FieldName;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  required?: boolean;
  type?: string;
  multiline?: boolean;
}) {
  const id = `checkout-${name}`;
  return (
    <div>
      <label htmlFor={id} className="micro-sm text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </label>
      {multiline ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          rows={3}
          className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
        />
      )}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CountyField({
  name,
  label,
  value,
  onChange,
  error,
}: {
  name: "county" | "billing_county";
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
}) {
  const id = `checkout-${name}`;
  return (
    <div>
      <label htmlFor={id} className="micro-sm text-muted-foreground">
        {label} *
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
      >
        <option value="">Alege județul</option>
        {ROMANIAN_COUNTIES.map((county) => (
          <option key={county} value={county}>
            {county}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { lines: cartLines, clear } = useCart();
  const cart = useCartLines();
  const submit = useServerFn(placeOrder);
  const auth = useAuth();
  const { data: profile } = useMyProfile(auth.user?.id);
  const { data: guestLimit } = useGuestCartLimit();
  const [form, setForm] = useState<CheckoutCustomer>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const busyRef = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const distinctProducts = new Set(cartLines.map((line) => line.productId)).size;
  const overGuestLimit =
    !auth.user && typeof guestLimit === "number" && distinctProducts > guestLimit;
  const blocked =
    cart.isLoading ||
    cart.isError ||
    cart.invalidItems.length > 0 ||
    cart.hasStockError ||
    cart.hasQuantityError ||
    !cart.configurationReady ||
    overGuestLimit ||
    cartLines.length === 0;

  useEffect(() => {
    if (prefilled || auth.loading || (auth.user && !profile)) return;
    setForm((current) => ({
      ...current,
      email: profile?.email ?? auth.user?.email ?? "",
      contact_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      company_name: profile?.company_name ?? "",
      cui: profile?.cui ?? "",
      reg_com: profile?.reg_com ?? "",
      delivery_address: profile?.delivery_address ?? "",
      city: profile?.city ?? "",
      county: profile?.county ?? "",
      postal_code: profile?.postal_code ?? "",
      billing_address: profile?.billing_address ?? "",
    }));
    setPrefilled(true);
  }, [auth.loading, auth.user, profile, prefilled]);

  const set = (name: FieldName) => (value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busyRef.current || blocked) return;
    const parsed = checkoutCustomerSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setServerError("Verifică câmpurile marcate mai jos.");
      errorRef.current?.focus();
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setServerError("");
    try {
      await cart.refresh();
      const result = await submit({
        data: {
          idempotencyKey,
          expectedTotal: cart.total,
          customer: parsed.data,
          lines: cartLines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            qty: line.qty,
          })),
        },
      });
      if (!result.ok) {
        setServerError(result.error);
        if (result.refreshCart) await cart.refresh();
        errorRef.current?.focus();
        return;
      }
      sessionStorage.setItem(`lp-order-token:${result.orderNumber}`, result.token);
      clear();
      navigate({ to: "/comanda/$number", params: { number: result.orderNumber } });
    } catch {
      setServerError("Comanda nu a putut fi trimisă. Verifică conexiunea și încearcă din nou.");
      errorRef.current?.focus();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  if (cart.isLoading)
    return <div className="site-container py-24">Se verifică produsele din coș…</div>;
  if (cartLines.length === 0)
    return (
      <div className="site-container py-24">
        <h1 className="display text-3xl">Finalizare comandă</h1>
        <p className="mt-6">Coșul este gol.</p>
        <Link to="/produse" className="micro mt-6 inline-block link-underline">
          Vezi catalogul
        </Link>
      </div>
    );

  return (
    <div className="site-container max-w-[1200px] py-14">
      <h1 className="display text-3xl md:text-4xl">Finalizare comandă</h1>
      {!auth.user ? (
        <p className="mt-6 border border-border bg-field p-4 text-sm">
          Comanzi fără cont. Poți comanda maximum {typeof guestLimit === "number" ? guestLimit : 3}{" "}
          produse diferite, o singură dată per adresă de e-mail.
        </p>
      ) : null}
      <p className="mt-6 border border-border bg-field p-4 text-sm">
        <span className="micro-sm">Comandă fără plată online</span> — cererea este înregistrată,
        fără nicio taxare. Te contactăm pentru confirmare.
      </p>
      <div
        ref={errorRef}
        tabIndex={-1}
        role="alert"
        className="mt-5 text-sm text-destructive outline-none"
      >
        {serverError ||
          (cart.isError ? "Produsele nu au putut fi verificate. Reîncarcă pagina." : "")}
        {cart.invalidItems.map((item) => (
          <p key={`${item.productId}-${item.variantId}`}>{item.message}</p>
        ))}
        {cart.hasStockError ? <p>Stocul s-a modificat. Verifică din nou coșul.</p> : null}
        {cart.hasQuantityError ? <p>Verifică numărul de seturi din coș.</p> : null}
        {!cart.configurationReady ? (
          <p>Livrarea și TVA trebuie configurate înainte de finalizarea comenzii.</p>
        ) : null}
        {overGuestLimit ? <p>Ai depășit limita pentru comenzile fără cont.</p> : null}
      </div>
      <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          <fieldset className="space-y-5">
            <legend className="micro-sm text-muted-foreground">Contact</legend>
            <TextField
              name="contact_name"
              label="Nume și prenume"
              value={form.contact_name}
              onChange={set("contact_name")}
              error={errors["contact_name"]}
              required
            />
            <TextField
              name="email"
              label="E-mail"
              type="email"
              value={form.email}
              onChange={set("email")}
              error={errors["email"]}
              required
            />
            <TextField
              name="phone"
              label="Telefon"
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              error={errors["phone"]}
              required
            />
          </fieldset>
          <fieldset className="space-y-5">
            <legend className="micro-sm text-muted-foreground">Adresa de livrare</legend>
            <CountyField
              name="county"
              label="Județ"
              value={form.county}
              onChange={set("county")}
              error={errors["county"]}
            />
            <TextField
              name="city"
              label="Oraș / localitate"
              value={form.city}
              onChange={set("city")}
              error={errors["city"]}
              required
            />
            <TextField
              name="postal_code"
              label="Cod poștal"
              value={form.postal_code}
              onChange={set("postal_code")}
              error={errors["postal_code"]}
              required
            />
            <TextField
              name="delivery_address"
              label="Adresă completă de livrare"
              value={form.delivery_address}
              onChange={set("delivery_address")}
              error={errors["delivery_address"]}
              required
              multiline
            />
            <TextField
              name="delivery_instructions"
              label="Instrucțiuni de livrare (opțional)"
              value={form.delivery_instructions}
              onChange={set("delivery_instructions")}
              multiline
            />
          </fieldset>
          <fieldset className="space-y-5">
            <legend className="micro-sm text-muted-foreground">Facturare</legend>
            <TextField
              name="company_name"
              label="Firmă (opțional)"
              value={form.company_name}
              onChange={set("company_name")}
            />
            <TextField name="cui" label="CUI (opțional)" value={form.cui} onChange={set("cui")} />
            <TextField
              name="reg_com"
              label="Nr. Reg. Com. (opțional)"
              value={form.reg_com}
              onChange={set("reg_com")}
            />
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.same_as_delivery}
                onChange={(event) =>
                  setForm((current) => ({ ...current, same_as_delivery: event.target.checked }))
                }
              />
              Adresa de facturare este aceeași cu adresa de livrare
            </label>
            {!form.same_as_delivery ? (
              <>
                <CountyField
                  name="billing_county"
                  label="Județ de facturare"
                  value={form.billing_county}
                  onChange={set("billing_county")}
                  error={errors["billing_county"]}
                />
                <TextField
                  name="billing_city"
                  label="Oraș / localitate de facturare"
                  value={form.billing_city}
                  onChange={set("billing_city")}
                  error={errors["billing_city"]}
                  required
                />
                <TextField
                  name="billing_postal_code"
                  label="Cod poștal de facturare"
                  value={form.billing_postal_code}
                  onChange={set("billing_postal_code")}
                  error={errors["billing_postal_code"]}
                  required
                />
                <TextField
                  name="billing_address"
                  label="Adresă completă de facturare"
                  value={form.billing_address}
                  onChange={set("billing_address")}
                  error={errors["billing_address"]}
                  required
                  multiline
                />
              </>
            ) : null}
          </fieldset>
        </div>
        <aside className="h-fit border border-border p-6">
          <p className="micro-sm text-muted-foreground">Comanda ta</p>
          <ul className="mt-5 space-y-3 text-sm">
            {cart.lines.map((line) => (
              <li
                key={`${line.product.id}-${line.variant?.id ?? "std"}`}
                className="flex justify-between gap-4"
              >
                <span className="min-w-0 break-words">
                  {line.product.name}
                  {line.variant ? ` — ${line.variant.name}` : ""} × {line.qty} seturi
                </span>
                <span>{formatRon(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatRon(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Livrare</dt>
              <dd>{cart.configurationReady ? formatRon(cart.shipping) : "Neconfigurată"}</dd>
            </div>
            {cart.configurationReady ? (
              <div className="flex justify-between">
                <dt>
                  TVA ({cart.vatRate}%{cart.pricesIncludeVat ? ", inclus" : ""})
                </dt>
                <dd>{formatRon(cart.tax)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-border pt-3 text-base">
              <dt>Total</dt>
              <dd>{cart.configurationReady ? formatRon(cart.total) : "Indisponibil"}</dd>
            </div>
          </dl>
          <button
            type="submit"
            disabled={busy || blocked}
            className="micro mt-8 w-full border border-foreground bg-foreground px-8 py-4 text-background disabled:opacity-40"
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
