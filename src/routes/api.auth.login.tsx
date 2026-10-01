import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const inputSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(1000),
});

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { isSameOrigin, loginWithProtection } = await import("@/lib/auth-security.server");
        if (!isSameOrigin(request)) {
          return Response.json({ ok: false, error: "Cerere invalidă." }, { status: 403, headers });
        }

        const input = inputSchema.safeParse(await request.json().catch(() => null));
        if (!input.success) {
          return Response.json(
            { ok: false, error: "E-mail sau parolă incorecte." },
            { status: 400, headers },
          );
        }

        try {
          const result = await loginWithProtection(request, input.data.email, input.data.password);
          if (result.status === "rate_limited") {
            const retryAfter = Math.max(1, result.retryAfterSeconds);
            return Response.json(
              {
                ok: false,
                code: "rate_limited",
                error: "Prea multe încercări nereușite. Încearcă din nou peste câteva minute.",
                retryAfterSeconds: retryAfter,
              },
              { status: 429, headers: { ...headers, "Retry-After": String(retryAfter) } },
            );
          }
          if (result.status === "invalid") {
            return Response.json(
              { ok: false, code: "invalid_credentials", error: "E-mail sau parolă incorecte." },
              { status: 401, headers },
            );
          }
          return Response.json(
            {
              ok: true,
              accessToken: result.session.access_token,
              refreshToken: result.session.refresh_token,
            },
            { status: 200, headers },
          );
        } catch {
          return Response.json(
            { ok: false, error: "Autentificarea nu este disponibilă momentan." },
            { status: 503, headers },
          );
        }
      },
    },
  },
});
