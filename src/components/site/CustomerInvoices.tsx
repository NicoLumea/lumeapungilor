import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getCustomerInvoices } from "@/lib/order-communications.functions";
import { SUPPORT_EMAIL } from "@/lib/company-legal";

export function CustomerInvoices({
  number,
  accessToken,
}: {
  number: string;
  accessToken: string | undefined;
}) {
  const load = useServerFn(getCustomerInvoices);
  const [invoices, setInvoices] = useState<{ id: string; number: string; url: string }[]>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="mt-6 border border-border p-4 text-sm">
      <p className="font-medium">Factura comenzii</p>
      <p className="mt-2">
        Factura va fi disponibilă după emitere. Poți solicita o copie prin e-mail.
      </p>
      <button
        type="button"
        className="mt-3 min-h-11 border border-foreground px-4 disabled:opacity-50"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            setInvoices(await load({ data: { number, accessToken } }));
          } catch {
            setError("Factura nu a putut fi încărcată. Încearcă din nou sau contactează-ne.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Se încarcă…" : "Afișează facturile"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-destructive">
          {error}
        </p>
      )}
      {invoices?.length === 0 && <p className="mt-2">Factura nu este încă disponibilă online.</p>}
      {invoices && invoices.length > 0 && (
        <>
          <ul className="mt-3 space-y-2">
            {invoices.map((i) => (
              <li key={i.id}>
                <a href={i.url} target="_blank" rel="noreferrer" className="underline">
                  Descarcă factura {i.number} (PDF)
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-muted-foreground">
            Linkurile expiră în 2 minute. Apasă din nou „Afișează facturile” pentru a le reînnoi.
          </p>
        </>
      )}
      <a
        className="mt-3 inline-flex min-h-11 items-center underline"
        href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Solicitare copie factură — comanda ${number}`)}`}
      >
        Solicită o copie a facturii
      </a>
    </div>
  );
}
