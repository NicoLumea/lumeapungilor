import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { NECESSARY_ONLY_CONSENT, type CookieConsent } from "@/lib/cookieConsent";

export function CookiePreferences({
  open,
  onOpenChange,
  consent,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consent: CookieConsent;
  onSave: (consent: CookieConsent) => void;
}) {
  const [draft, setDraft] = useState<CookieConsent>(NECESSARY_ONLY_CONSENT);

  useEffect(() => {
    if (open) setDraft(consent);
  }, [consent, open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-foreground/25" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[60] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-border bg-background p-6 shadow-xl outline-none">
          <DialogPrimitive.Title className="display text-2xl text-foreground">
            Setări cookie
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Alege ce tehnologii opționale permiți. Cele necesare rămân active pentru funcționarea
            site-ului.
          </DialogPrimitive.Description>

          <div className="mt-6 space-y-4">
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked disabled className="mt-1 accent-foreground" />
              <span>
                <span className="block font-medium text-foreground">Necesare</span>
                <span className="text-muted-foreground">Întotdeauna active.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={draft.analytics}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, analytics: event.target.checked }))
                }
                className="mt-1 accent-foreground"
              />
              <span>
                <span className="block font-medium text-foreground">Analiză</span>
                <span className="text-muted-foreground">
                  Opțională. Nu există momentan scripturi de analiză.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={draft.marketing}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, marketing: event.target.checked }))
                }
                className="mt-1 accent-foreground"
              />
              <span>
                <span className="block font-medium text-foreground">Marketing</span>
                <span className="text-muted-foreground">
                  Opțional. Nu există momentan scripturi de marketing.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-7 flex flex-wrap justify-end gap-3">
            <DialogPrimitive.Close className="min-h-11 border border-border px-4 py-2 text-sm">
              Anulează
            </DialogPrimitive.Close>
            <button
              type="button"
              onClick={() => onSave({ ...draft, necessary: true })}
              className="min-h-11 border border-foreground bg-foreground px-4 py-2 text-sm text-background"
            >
              Salvează preferințele
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
