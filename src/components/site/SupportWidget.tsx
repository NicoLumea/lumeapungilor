import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  MessageCircle,
  MessagesSquare,
  Minus,
  PackageSearch,
  RotateCcw,
  Send,
  ShoppingBag,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { submitContactRequest } from "@/lib/account.functions";
import { useMyOrders } from "@/lib/dashboard-data";
import { useProduct } from "@/lib/products";
import {
  restoreSupportMessages,
  SUPPORT_TOPICS,
  supportMessageBody,
  supportSubject,
  type StoredSupportMessage,
  type SupportTopic,
} from "@/lib/support-widget";
import { useAuth } from "@/lib/use-auth";

const TOPIC_ICONS = {
  order: ShoppingBag,
  product: PackageSearch,
  return: RotateCcw,
  other: MessagesSquare,
} as const;

function messageId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `support-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function SupportWidget() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const auth = useAuth();
  const sendRequest = useServerFn(submitContactRequest);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<SupportTopic | null>(null);
  const [message, setMessage] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestOrderNumber, setGuestOrderNumber] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [messages, setMessages] = useState<StoredSupportMessage[]>([]);
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productSlug = useMemo(() => {
    if (!pathname.startsWith("/produs/")) return undefined;
    const value = pathname.slice("/produs/".length);
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }, [pathname]);
  const { data: product } = useProduct(productSlug);
  const { data: orders, isLoading: ordersLoading } = useMyOrders(
    auth.user?.id,
    open && topic === "order",
  );
  const recentOrders = (orders ?? []).slice(0, 5);
  const selectedOrder = recentOrders.find((order) => order.id === selectedOrderId) ?? null;
  const storageKey = auth.loading ? null : `lumea-pungilor:support:${auth.user?.id ?? "guest"}`;

  useEffect(() => {
    if (!storageKey) return;
    setMessages(restoreSupportMessages(window.sessionStorage.getItem(storageKey)));
    setLoadedStorageKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || loadedStorageKey !== storageKey) return;
    window.sessionStorage.setItem(storageKey, JSON.stringify(messages));
  }, [loadedStorageKey, messages, storageKey]);

  useEffect(() => {
    if (!open) return;
    threadEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, open, topic]);

  function chooseTopic(nextTopic: SupportTopic) {
    setTopic(nextTopic);
    setError(null);
    if (nextTopic !== "order") {
      setGuestOrderNumber("");
      setSelectedOrderId(null);
    }
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function submitMessage(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const text = message.trim();
    const email = auth.user?.email ?? guestEmail.trim();
    const name =
      (auth.user?.user_metadata["full_name"] as string | undefined)?.trim() ||
      auth.user?.email?.split("@")[0] ||
      guestName.trim();

    if (text.length < 10) {
      setError("Scrie un mesaj de cel puțin 10 caractere.");
      return;
    }
    if (!name || !email) {
      setError("Completează numele și adresa de e-mail pentru a putea primi răspunsul.");
      return;
    }

    setBusy(true);
    try {
      const result = await sendRequest({
        data: {
          name,
          email,
          subject: supportSubject(topic),
          message: supportMessageBody(text, {
            route: pathname,
            product: product ? { id: product.id, name: product.name } : null,
            order: selectedOrder
              ? { id: selectedOrder.id, number: selectedOrder.order_number }
              : null,
            guestOrderNumber: auth.user ? null : guestOrderNumber,
          }),
        },
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const now = new Date().toISOString();
      setMessages((current) => [
        ...current,
        { id: messageId(), role: "customer", text, createdAt: now },
        {
          id: messageId(),
          role: "team",
          text: `Mesajul tău a ajuns la echipa noastră. Îți vom răspunde la ${email}.`,
          createdAt: now,
        },
      ]);
      setMessage("");
    } catch {
      setError("Mesajul nu a putut fi trimis. Încearcă din nou sau folosește pagina Contact.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
      <DialogPrimitive.Trigger asChild>
        <button
          ref={launcherRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Deschide ajutorul Lumea Pungilor"
          className={`fixed bottom-4 right-4 z-40 inline-flex size-14 items-center justify-center rounded-full border border-brand/20 bg-hero text-brand shadow-[0_12px_32px_rgba(38,24,20,0.16)] transition-[transform,background-color,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:bg-[#f4ead8] hover:shadow-[0_16px_36px_rgba(38,24,20,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none md:bottom-8 md:right-8 md:size-[3.75rem] ${open ? "pointer-events-none opacity-0" : "opacity-100"}`}
        >
          <MessageCircle className="size-6 stroke-[1.7]" aria-hidden="true" />
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-[1px] sm:hidden" />
        <DialogPrimitive.Content
          aria-describedby="support-description"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            launcherRef.current?.focus();
          }}
          className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] top-[max(0.75rem,env(safe-area-inset-top))] z-50 flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-[1.5rem] border border-border bg-background shadow-[0_24px_70px_rgba(38,24,20,0.24)] outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-3 data-[state=closed]:duration-[180ms] data-[state=open]:duration-[220ms] motion-reduce:transition-none sm:inset-auto sm:bottom-24 sm:right-8 sm:h-[min(650px,calc(100dvh-8rem))] sm:w-[390px] sm:rounded-[1.5rem]"
        >
          <header className="flex items-center gap-3 border-b border-brand/10 bg-hero px-5 py-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-background/80 text-brand">
              <MessageCircle className="size-5 stroke-[1.7]" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-base font-medium text-foreground">
                Cu ce te putem ajuta?
              </DialogPrimitive.Title>
              <DialogPrimitive.Description
                id="support-description"
                className="mt-0.5 text-xs text-muted-foreground"
              >
                Scrie-ne simplu, așa cum îți este mai ușor.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Minimizează fereastra de ajutor"
                className="grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Minus className="size-5" aria-hidden="true" />
              </button>
            </DialogPrimitive.Close>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Închide fereastra de ajutor"
                className="grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </DialogPrimitive.Close>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
            <DialogPrimitive.Close asChild>
              <Link
                to="/feedback"
                className="micro-sm mb-4 inline-flex min-h-10 items-center link-underline"
              >
                Trimite feedback despre experiența ta
              </Link>
            </DialogPrimitive.Close>
            <div className="max-w-[88%] rounded-[1.1rem] rounded-tl-sm bg-field px-4 py-3 text-sm leading-relaxed">
              <p className="micro-sm mb-2 text-brand">Echipa Lumea Pungilor</p>
              <p>Salut! 👋</p>
              <p className="mt-1 text-muted-foreground">
                Poți alege o opțiune sau ne poți scrie direct.
              </p>
            </div>

            {product ? (
              <div className="mt-4 rounded-[1rem] border border-brand/15 bg-hero/45 p-4">
                <p className="micro-sm text-brand">Context produs</p>
                <p className="mt-2 text-sm font-medium">Întrebarea ta este despre acest produs?</p>
                <p className="mt-1 text-sm text-muted-foreground">{product.name}</p>
                <button
                  type="button"
                  onClick={() => chooseTopic("product")}
                  className="micro-sm mt-3 min-h-10 rounded-full border border-brand/30 bg-background px-4 text-brand transition-colors hover:bg-brand hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  Da, despre acest produs
                </button>
              </div>
            ) : null}

            {messages.length === 0 ? (
              <div className="mt-5 grid gap-2" aria-label="Subiecte sugerate">
                {(Object.keys(SUPPORT_TOPICS) as SupportTopic[]).map((key) => {
                  const Icon = TOPIC_ICONS[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={topic === key}
                      onClick={() => chooseTopic(key)}
                      className="flex min-h-11 items-center gap-3 rounded-[0.9rem] border border-border bg-background px-4 py-2.5 text-left text-sm transition-colors hover:border-brand/35 hover:bg-hero/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand aria-pressed:border-brand/40 aria-pressed:bg-hero/60"
                    >
                      <Icon className="size-[1.125rem] shrink-0 text-brand" aria-hidden="true" />
                      <span>{SUPPORT_TOPICS[key]}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {topic === "order" ? (
              <section className="mt-4 rounded-[1rem] border border-border p-4">
                <p className="text-sm font-medium">Despre ce comandă este vorba?</p>
                {auth.user ? (
                  <div className="mt-3">
                    {ordersLoading ? (
                      <p className="text-xs text-muted-foreground">Încărcăm comenzile tale…</p>
                    ) : recentOrders.length > 0 ? (
                      <div className="grid gap-2">
                        {recentOrders.map((order) => (
                          <button
                            key={order.id}
                            type="button"
                            aria-pressed={selectedOrderId === order.id}
                            onClick={() => setSelectedOrderId(order.id)}
                            className="flex min-h-10 items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-xs transition-colors hover:border-brand/35 aria-pressed:border-brand aria-pressed:bg-hero/50"
                          >
                            <span className="font-medium">{order.order_number}</span>
                            <span className="text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString("ro-RO")}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Nu am găsit comenzi în cont. Poți descrie situația în mesaj.
                      </p>
                    )}
                  </div>
                ) : (
                  <label className="mt-3 block text-xs text-muted-foreground">
                    Număr comandă <span className="font-normal">(opțional)</span>
                    <input
                      value={guestOrderNumber}
                      onChange={(event) => setGuestOrderNumber(event.target.value)}
                      autoComplete="off"
                      className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                    <span className="mt-2 block leading-relaxed">
                      Nu afișăm datele comenzii doar pe baza acestui număr.
                    </span>
                  </label>
                )}
              </section>
            ) : null}

            {topic === "return" ? (
              <section className="mt-4 rounded-[1rem] border border-border bg-hero/30 p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Pentru o cerere formală, folosește fluxul securizat de retur. Dacă nu ești sigur,
                  ne poți scrie aici.
                </p>
                <DialogPrimitive.Close asChild>
                  <Link
                    to={auth.user ? "/retururi" : "/ajutor-comanda"}
                    className="micro-sm mt-3 inline-flex min-h-10 items-center rounded-full border border-brand/30 bg-background px-4 text-brand transition-colors hover:bg-brand hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    Începe cererea de retur
                  </Link>
                </DialogPrimitive.Close>
              </section>
            ) : null}

            {messages.length > 0 ? (
              <ol className="mt-5 space-y-3" aria-label="Mesajele din această sesiune">
                {messages.map((item) => (
                  <li
                    key={item.id}
                    className={
                      item.role === "customer"
                        ? "ml-auto max-w-[86%] rounded-[1.1rem] rounded-br-sm bg-brand px-4 py-3 text-sm leading-relaxed text-white"
                        : "max-w-[88%] rounded-[1.1rem] rounded-tl-sm bg-field px-4 py-3 text-sm leading-relaxed"
                    }
                  >
                    {item.role === "team" ? (
                      <p className="micro-sm mb-2 text-brand">Echipa Lumea Pungilor</p>
                    ) : null}
                    <p>{item.text}</p>
                  </li>
                ))}
              </ol>
            ) : null}
            <div ref={threadEndRef} />
          </div>

          <form
            onSubmit={submitMessage}
            className="border-t border-border bg-background p-4 sm:p-5"
          >
            {!auth.loading && !auth.user ? (
              <div className="mb-3 grid grid-cols-2 gap-2">
                <label className="text-xs text-muted-foreground">
                  Nume
                  <input
                    required
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    autoComplete="name"
                    className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  E-mail
                  <input
                    required
                    type="email"
                    value={guestEmail}
                    onChange={(event) => setGuestEmail(event.target.value)}
                    autoComplete="email"
                    className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </label>
              </div>
            ) : null}
            <label htmlFor="support-message" className="sr-only">
              Mesaj pentru echipa Lumea Pungilor
            </label>
            <div className="flex items-end gap-2 rounded-[1rem] border border-input bg-background p-2 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
              <textarea
                ref={inputRef}
                id="support-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Scrie aici mesajul tău..."
                rows={2}
                maxLength={1600}
                className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-base outline-none placeholder:text-muted-foreground sm:text-sm"
              />
              <button
                type="submit"
                disabled={busy || auth.loading}
                aria-label="Trimite mesajul"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-white transition-[opacity,transform] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
              >
                <Send className="size-[1.125rem]" aria-hidden="true" />
              </button>
            </div>
            {error ? (
              <p className="mt-2 text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : (
              <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted-foreground">
                Mesajele ajung la echipa noastră. Răspunsul va veni la adresa ta de e-mail.
              </p>
            )}
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
