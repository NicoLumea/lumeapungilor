import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  EVIDENCE_REASONS,
  MAX_RETURN_IMAGE_BYTES,
  MAX_RETURN_IMAGES,
  RETURN_REASON_LABEL,
  type ReturnReason,
} from "@/lib/returns-core";
import {
  submitAuthenticatedReturn,
  submitGuestReturn,
  type EligibleReturnOrder,
} from "@/lib/returns.functions";

async function encodeImage(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return {
    name: file.name,
    mime: file.type as "image/jpeg" | "image/png" | "image/webp",
    size: file.size,
    base64: dataUrl.split(",")[1] ?? "",
  };
}

export function ReturnRequestForm({
  orders,
  guestToken,
  initialOrderNumber,
  onSubmitted,
}: {
  orders: EligibleReturnOrder[];
  guestToken?: string;
  initialOrderNumber?: string | undefined;
  onSubmitted?: () => void;
}) {
  const authenticatedSubmit = useServerFn(submitAuthenticatedReturn);
  const guestSubmit = useServerFn(submitGuestReturn);
  const firstOrder = orders.find((order) => order.order_number === initialOrderNumber) ?? orders[0];
  const [orderId, setOrderId] = useState(firstOrder?.id ?? "");
  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === orderId) ?? orders[0],
    [orderId, orders],
  );
  const [itemId, setItemId] = useState(selectedOrder?.items[0]?.id ?? "");
  const selectedItem =
    selectedOrder?.items.find((item) => item.id === itemId) ?? selectedOrder?.items[0];
  const [customer, setCustomer] = useState({
    name: firstOrder?.contact_name ?? "",
    email: firstOrder?.email ?? "",
    phone: firstOrder?.phone ?? "",
  });
  const [reason, setReason] = useState<ReturnReason>("damaged");
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  function changeOrder(nextId: string) {
    const next = orders.find((order) => order.id === nextId);
    setOrderId(nextId);
    setItemId(next?.items[0]?.id ?? "");
    setQuantity(1);
    if (next) setCustomer({ name: next.contact_name, email: next.email, phone: next.phone ?? "" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder || !selectedItem || busy) return;
    if (EVIDENCE_REASONS.has(reason) && files.length === 0) {
      toast.error("Pentru acest motiv este necesară cel puțin o fotografie.");
      return;
    }
    setBusy(true);
    try {
      const images = await Promise.all(files.map(encodeImage));
      const payload = {
        orderId: selectedOrder.id,
        orderItemId: selectedItem.id,
        customerName: customer.name,
        email: customer.email,
        phone: customer.phone,
        requestedQuantity: quantity,
        reason,
        description,
        images,
        idempotencyKey,
      };
      const result = guestToken
        ? await guestSubmit({ data: { ...payload, guestToken } })
        : await authenticatedSubmit({ data: payload });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Cererea a fost trimisă și va fi verificată de echipa noastră.");
      setDescription("");
      setFiles([]);
      setIdempotencyKey(crypto.randomUUID());
      onSubmitted?.();
    } catch {
      toast.error("Cererea nu a putut fi trimisă.");
    } finally {
      setBusy(false);
    }
  }

  if (!selectedOrder || selectedOrder.items.length === 0)
    return (
      <p className="mt-8 text-sm text-muted-foreground">
        Nu există comenzi achitate cu produse eligibile.
      </p>
    );

  return (
    <form onSubmit={submit} className="mt-8 space-y-8 border border-border p-5 sm:p-7">
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="micro mb-5">Date client</legend>
        <Field label="Nume și prenume">
          <input
            required
            value={customer.name}
            onChange={(e) => setCustomer((v) => ({ ...v, name: e.target.value }))}
            className="form-input"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            required
            readOnly
            value={customer.email}
            className="form-input bg-field"
          />
        </Field>
        <Field label="Număr de telefon">
          <input
            type="tel"
            required
            value={customer.phone}
            onChange={(e) => setCustomer((v) => ({ ...v, phone: e.target.value }))}
            className="form-input"
          />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="micro mb-5">Comandă și produs</legend>
        <Field label="Număr comandă">
          <select
            value={selectedOrder.id}
            onChange={(e) => changeOrder(e.target.value)}
            className="form-input"
          >
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.order_number} · {new Date(order.created_at).toLocaleDateString("ro-RO")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Data comenzii">
          <input
            readOnly
            value={new Date(selectedOrder.created_at).toLocaleDateString("ro-RO")}
            className="form-input bg-field"
          />
        </Field>
        <Field label="Produs">
          <select
            value={selectedItem?.id ?? ""}
            onChange={(e) => {
              setItemId(e.target.value);
              setQuantity(1);
            }}
            className="form-input"
          >
            {selectedOrder.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.product_name}
                {item.variant_name ? ` — ${item.variant_name}` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cantitate cumpărată">
          <input readOnly value={selectedItem?.quantity ?? 0} className="form-input bg-field" />
        </Field>
        <Field label="Cantitate solicitată pentru retur">
          <input
            type="number"
            required
            min={1}
            max={selectedItem?.quantity ?? 1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="form-input"
          />
        </Field>
        <Field label="Motivul returului / reclamației">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as ReturnReason)}
            className="form-input"
          >
            {Object.entries(RETURN_REASON_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <Field label="Descrie problema">
        <textarea
          required
          minLength={10}
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrie cât mai clar problema întâmpinată cu produsul."
          className="form-input"
        />
      </Field>

      <div>
        <label className="micro-sm text-muted-foreground" htmlFor="return-images">
          Fotografii
        </label>
        <input
          id="return-images"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const next = Array.from(e.target.files ?? []);
            if (next.length > MAX_RETURN_IMAGES) {
              toast.error(`Poți încărca maximum ${MAX_RETURN_IMAGES} fotografii.`);
              e.target.value = "";
              return;
            }
            if (
              next.some(
                (file) =>
                  file.size > MAX_RETURN_IMAGE_BYTES ||
                  !["image/jpeg", "image/png", "image/webp"].includes(file.type),
              )
            ) {
              toast.error(
                "Fotografiile trebuie să fie JPG, PNG sau WEBP și să nu depășească 5 MB fiecare.",
              );
              e.target.value = "";
              return;
            }
            setFiles(next);
          }}
          className="mt-2 block w-full text-sm file:mr-4 file:border file:border-border file:bg-background file:px-4 file:py-2"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Maximum 5 fotografii, 5 MB fiecare. JPG, JPEG, PNG sau WEBP.
          {EVIDENCE_REASONS.has(reason)
            ? " Este necesară cel puțin una pentru motivul selectat."
            : ""}
        </p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="micro min-h-11 border border-foreground bg-foreground px-7 py-3 text-background disabled:opacity-40"
      >
        {busy ? "Se trimite…" : "Trimite cererea"}
      </button>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Datele și fotografiile sunt folosite pentru verificarea și soluționarea cererii. Detalii în{" "}
        <Link to="/confidentialitate" target="_blank" className="link-underline">
          Politica de confidențialitate
        </Link>
        .
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="micro-sm text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
