import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getOrderCommunications,
  prepareOrderEmail,
  saveOrderOperations,
  supplyLegacyTerms,
  uploadOrderInvoice,
  confirmInvoiceEmail,
} from "@/lib/order-communications.functions";
import { downloadText, emlDraft, mailtoUrl, type MailKind, type OrderMail } from "@/lib/order-mail";

const statuses = ["nou", "confirmat", "in_livrare", "finalizat", "anulat"] as const;
const payments = ["in_asteptare", "platit", "rambursat", "anulat"] as const;
type Status = (typeof statuses)[number];
type Payment = (typeof payments)[number];
const button = "min-h-11 border border-foreground px-4 py-2 text-sm disabled:opacity-40";
const input = "mt-2 block w-full border border-input bg-background px-3 py-2";
type Order = {
  id: string;
  order_number: string;
  updated_at: string;
  status: string;
  payment_status: string;
  internal_notes: string | null;
};

function EmailStep({
  order,
  kind,
  invoiceId,
  tracking,
  onConfirm,
}: {
  order: Order;
  kind: MailKind;
  invoiceId?: string | undefined;
  tracking: string;
  onConfirm: (id: string | undefined) => void;
}) {
  const prepare = useServerFn(prepareOrderEmail);
  const [mail, setMail] = useState<OrderMail>();
  const [opened, setOpened] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function makeDraft() {
    setBusy(true);
    setError("");
    setMail(undefined);
    setOpened(false);
    setConfirmed(false);
    onConfirm(undefined);
    try {
      setMail(
        await prepare({
          data: { orderId: order.id, kind, tracking, invoiceId, version: order.updated_at },
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mesajul nu a putut fi pregătit.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-5 space-y-3 border border-border p-4 text-sm">
      <p className="font-medium">
        {kind === "acceptance"
          ? "E-mail de acceptare"
          : kind === "dispatch"
            ? "E-mail de predare la curier"
            : "E-mail cu factura"}
      </p>
      <p>
        Trimite din <strong>contact@lumeapungilor.ro</strong>. Site-ul deschide un proiect de mesaj;
        nu trimite și nu verifică livrarea e-mailului. Verifică destinatarul, conținutul și
        atașamentele înainte de trimitere.
      </p>
      <button type="button" className={button} disabled={busy} onClick={makeDraft}>
        {busy ? "Se pregătește…" : "Pregătește mesajul"}
      </button>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {mail && (
        <>
          <p className="break-all">Către: {mail.recipient}</p>
          <details>
            <summary className="cursor-pointer py-2 underline">Verifică textul mesajului</summary>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words border p-3 font-sans">
              {mail.subject}
              {"\n\n"}
              {mail.body}
            </pre>
          </details>
          {mail.attachments.length > 0 && (
            <div className="space-y-2">
              <p>
                Descarcă și atașează ambele documente. Ele rămân disponibile clientului în e-mail,
                chiar dacă pagina de termeni se schimbă.
              </p>
              {mail.attachments.map((a) => (
                <button
                  type="button"
                  className={`${button} mr-2`}
                  key={a.name}
                  onClick={() => downloadText(a.name, a.text)}
                >
                  Descarcă {a.name}
                </button>
              ))}
            </div>
          )}
          {mail.invoiceUrl && (
            <p>
              <a className="underline" href={mail.invoiceUrl} target="_blank" rel="noreferrer">
                Descarcă factura PDF pentru atașare
              </a>{" "}
              (link valabil 2 minute; pregătește din nou mesajul dacă expiră).
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {mailtoUrl(mail).length <= 1800 && (
              <a
                className={`${button} inline-flex items-center`}
                href={mailtoUrl(mail)}
                onClick={() => setOpened(true)}
              >
                Deschide e-mailul
              </a>
            )}
            <button
              type="button"
              className={button}
              onClick={() => {
                downloadText("mesaj-comanda.eml", emlDraft(mail), "message/rfc822");
                setOpened(true);
              }}
            >
              Descarcă proiectul de e-mail (.eml)
            </button>
            <button
              type="button"
              className={button}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(mail.body);
                  toast.success("Text copiat.");
                } catch {
                  toast.error("Copiază textul din previzualizare.");
                }
              }}
            >
              Copiază textul
            </button>
          </div>
          <p className="text-muted-foreground">
            Deschide fișierul .eml în aplicația de e-mail și alege editare/retrimitere dacă este
            necesar. Termenii și formularul sunt incluse în .eml; factura PDF se atașează separat.
            Dacă folosești webmail, copiază textul și atașează documentele manual.
          </p>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4"
              disabled={!opened}
              checked={confirmed}
              onChange={(e) => {
                setConfirmed(e.target.checked);
                onConfirm(e.target.checked ? mail.id : undefined);
              }}
            />
            <span>
              Confirm că am trimis acest e-mail din contact@lumeapungilor.ro, cu toate documentele
              indicate atașate. Declarația va fi înregistrată pe contul meu de utilizator.
            </span>
          </label>
        </>
      )}
    </div>
  );
}

export function OrderOperationsPanel({ order: o }: { order: Order }) {
  const qc = useQueryClient();
  const load = useServerFn(getOrderCommunications);
  const save = useServerFn(saveOrderOperations);
  const legacy = useServerFn(supplyLegacyTerms);
  const upload = useServerFn(uploadOrderInvoice);
  const confirm = useServerFn(confirmInvoiceEmail);
  const query = useQuery({
    queryKey: ["staff", "communications", o.id],
    queryFn: () => load({ data: { orderId: o.id } }),
    retry: false,
  });
  const [status, setStatus] = useState<Status>(o.status as Status);
  const [payment, setPayment] = useState<Payment>(o.payment_status as Payment);
  const [note, setNote] = useState(o.internal_notes ?? "");
  const [tracking, setTracking] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [draftId, setDraftId] = useState<string>();
  const [invoiceDraft, setInvoiceDraft] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [file, setFile] = useState<File>();
  const [terms, setTerms] = useState("");
  const kind =
    status !== o.status
      ? status === "confirmat"
        ? "acceptance"
        : status === "in_livrare"
          ? "dispatch"
          : undefined
      : undefined;
  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["staff", "communications", o.id] });
    await qc.invalidateQueries({ queryKey: ["staff", "order-detail", o.id] });
    await qc.invalidateQueries({ queryKey: ["staff", "orders"] });
  }
  async function action(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      toast.success("Salvat.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operațiunea nu a reușit.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-8 border border-border p-5">
      <h2 className="display text-xl">Informații operaționale</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Prețurile și cantitățile nu se modifică aici. Acceptarea și predarea la curier necesită
        confirmarea trimiterii e-mailului. Anularea restituie stocul o singură dată și nu poate fi
        inversată.
      </p>
      {query.error && (
        <p role="alert" className="mt-4 text-destructive">
          Comunicările nu sunt disponibile. Verifică aplicarea actualizării bazei de date înainte de
          utilizare.
        </p>
      )}
      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void action(() =>
            save({
              data: {
                orderId: o.id,
                version: o.updated_at,
                status,
                payment,
                note,
                draftId,
                confirmed: !!draftId,
              },
            }),
          );
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            Status comandă
            <select
              className={input}
              value={status}
              disabled={o.status === "anulat" || busy}
              onChange={(e) => {
                setStatus(e.target.value as Status);
                setDraftId(undefined);
              }}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status plată
            <select
              className={input}
              value={payment}
              onChange={(e) => setPayment(e.target.value as Payment)}
            >
              {payments.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          Notițe interne
          <textarea
            className={input}
            maxLength={10000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        {kind === "dispatch" && (
          <label className="block">
            AWB DPD (opțional)
            <input
              className={input}
              maxLength={100}
              value={tracking}
              onChange={(e) => {
                setTracking(e.target.value);
                setDraftId(undefined);
              }}
            />
          </label>
        )}
        {kind === "dispatch" && (
          <label className="block">
            Factură de atașat
            <select
              className={input}
              value={invoiceId}
              onChange={(e) => {
                setInvoiceId(e.target.value);
                setDraftId(undefined);
                setInvoiceDraft(undefined);
              }}
            >
              <option value="">Factura va fi trimisă separat</option>
              {query.data?.invoices.map((i) => (
                <option value={i.id} key={i.id}>
                  {i.invoice_number}
                </option>
              ))}
            </select>
          </label>
        )}
        {kind && (
          <EmailStep
            key={`${o.updated_at}:${kind}:${tracking}:${invoiceId}`}
            order={o}
            kind={kind}
            tracking={tracking}
            invoiceId={kind === "dispatch" ? invoiceId || undefined : undefined}
            onConfirm={setDraftId}
          />
        )}
        <button
          className={`${button} bg-foreground text-background`}
          disabled={busy || query.isLoading || !!query.error || (!!kind && !draftId)}
          type="submit"
        >
          {busy ? "Se salvează…" : "Salvează"}
        </button>
      </form>
      {query.data && !query.data.legal && (
        <div className="mt-6 border-t pt-5 text-sm">
          <p className="font-medium">Termenii originali lipsesc pentru această comandă</p>
          <p className="mt-2">
            Comenzile noi păstrează automat versiunea termenilor. Pentru o comandă mai veche,
            introdu textul complet al termenilor și informațiilor de retragere aplicabile la data
            comenzii, din arhiva firmei. Nu folosi automat termenii de astăzi.
          </p>
          <textarea
            className={input}
            rows={6}
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            aria-label="Termenii originali ai comenzii"
          />
          <button
            type="button"
            className={`${button} mt-3`}
            disabled={busy || terms.trim().length < 100}
            onClick={() => void action(() => legacy({ data: { orderId: o.id, terms } }))}
          >
            Confirm versiunea originală și o salvez
          </button>
        </div>
      )}
      <div className="mt-6 border-t pt-5 text-sm">
        <p className="font-medium">Factura emisă de firmă</p>
        <p className="mt-2">
          Încarcă PDF-ul emis de programul de facturare. Site-ul nu emite facturi fiscale. Predarea
          la curier este posibilă și când factura urmează să fie emisă; urmărește separat emiterea
          și trimiterea ei.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label>
            Număr factură
            <input
              className={input}
              value={invoiceNumber}
              maxLength={100}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </label>
          <label>
            PDF (maximum 10 MB, 50 pagini)
            <input
              type="file"
              accept="application/pdf,.pdf"
              className={input}
              onChange={(e) => setFile(e.target.files?.[0])}
            />
          </label>
        </div>
        <button
          type="button"
          className={`${button} mt-3`}
          disabled={
            busy ||
            !file ||
            !invoiceNumber.trim() ||
            !["confirmat", "in_livrare", "finalizat"].includes(o.status)
          }
          onClick={() =>
            void action(async () => {
              if (!file || file.size > 10485760) throw new Error("Alege un PDF de maximum 10 MB.");
              const bytes = new Uint8Array(await file.arrayBuffer());
              let binary = "";
              for (let n = 0; n < bytes.length; n += 8192)
                binary += String.fromCharCode(...bytes.slice(n, n + 8192));
              await upload({ data: { orderId: o.id, invoiceNumber, base64: btoa(binary) } });
              setFile(undefined);
              setInvoiceNumber("");
            })
          }
        >
          Adaugă factura
        </button>
        <label className="mt-5 block">
          Trimite o factură separat
          <select
            className={input}
            value={invoiceId}
            onChange={(e) => {
              setInvoiceId(e.target.value);
              setInvoiceDraft(undefined);
              setDraftId(undefined);
            }}
          >
            <option value="">Selectează factura</option>
            {query.data?.invoices.map((i) => (
              <option key={i.id} value={i.id}>
                {i.invoice_number}
              </option>
            ))}
          </select>
        </label>
        {invoiceId && (
          <>
            <EmailStep
              key={`invoice:${invoiceId}:${o.updated_at}`}
              order={o}
              kind="invoice"
              invoiceId={invoiceId}
              tracking=""
              onConfirm={setInvoiceDraft}
            />
            <button
              type="button"
              className={`${button} mt-3`}
              disabled={busy || !invoiceDraft}
              onClick={() =>
                void action(async () => {
                  await confirm({ data: { draftId: invoiceDraft!, confirmed: true } });
                  setInvoiceDraft(undefined);
                  setInvoiceId("");
                })
              }
            >
              Salvează confirmarea trimiterii facturii
            </button>
          </>
        )}
      </div>
      <div className="mt-6 border-t pt-5 text-sm">
        <p className="font-medium">Istoricul declarațiilor de trimitere</p>
        <p className="mt-2 text-muted-foreground">
          Contul de mai jos a confirmat trimiterea. Nu reprezintă verificarea contului din aplicația
          de e-mail sau dovada livrării.
        </p>
        <ul className="mt-3 space-y-2">
          {query.data?.history.map((h) => (
            <li key={h.id} className="break-words">
              {h.kind === "acceptance"
                ? "Acceptare"
                : h.kind === "dispatch"
                  ? "Predare la curier"
                  : "Factură"}{" "}
              · {h.actor_email} · {new Date(h.declared_sent_at).toLocaleString("ro-RO")}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
