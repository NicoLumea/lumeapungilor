import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const inputSchema = z.object({ email: z.string().trim().email().max(320) });
const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };
const genericMessage =
  "Dacă există un cont pentru această adresă, vei primi un e-mail cu instrucțiuni.";

export const Route = createFileRoute("/api/auth/password-reset")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { isSameOrigin, requestPasswordResetWithProtection } =
          await import("@/lib/auth-security.server");
        if (!isSameOrigin(request)) {
          return Response.json({ ok: false, error: "Cerere invalidă." }, { status: 403, headers });
        }

        const input = inputSchema.safeParse(await request.json().catch(() => null));
        if (!input.success) {
          return Response.json({ ok: true, message: genericMessage }, { status: 202, headers });
        }

        try {
          const result = await requestPasswordResetWithProtection(request, input.data.email);
          if (result.status === "rate_limited") {
            const retryAfter = Math.max(1, result.retryAfterSeconds);
            return Response.json(
              {
                ok: false,
                code: "rate_limited",
                error: "Prea multe solicitări. Încearcă din nou peste câteva minute.",
                retryAfterSeconds: retryAfter,
              },
              { status: 429, headers: { ...headers, "Retry-After": String(retryAfter) } },
            );
          }
          return Response.json({ ok: true, message: genericMessage }, { status: 202, headers });
        } catch {
          // Keep the public response generic so provider errors cannot reveal
          // whether the submitted account exists.
          return Response.json({ ok: true, message: genericMessage }, { status: 202, headers });
        }
      },
    },
  },
});
