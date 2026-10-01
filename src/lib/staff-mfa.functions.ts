import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { rolesForUser, sessionIdFromClaims } from "./authorization.server";
import { resolvePostAuthDestination } from "./staff-auth-flow";

const SESSION_ERROR = "Sesiunea de autentificare nu este validă.";

export const getStaffVerificationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sessionId = sessionIdFromClaims(context.claims);
    if (!sessionId) return { required: true, verified: false, error: SESSION_ERROR };
    const { staffVerificationStatus } = await import("./staff-mfa.server");
    return staffVerificationStatus(context.userId, sessionId);
  });

export const resendStaffVerificationCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({}).parse(input ?? {}))
  .handler(async ({ context }) => {
    const sessionId = sessionIdFromClaims(context.claims);
    if (!sessionId) return { ok: false as const, error: SESSION_ERROR };
    const { beginStaffChallenge } = await import("./staff-mfa.server");
    return beginStaffChallenge(context.userId, sessionId, true);
  });

export const confirmStaffVerificationCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        code: z.string().regex(/^\d{6}$/),
        destination: z.string().max(1000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sessionId = sessionIdFromClaims(context.claims);
    if (!sessionId) return { ok: false as const, error: SESSION_ERROR };
    const { verifyStaffCode } = await import("./staff-mfa.server");
    const result = await verifyStaffCode(context.userId, sessionId, data.code);
    if (!result.ok) return result;
    const roles = await rolesForUser(context.userId);
    return {
      ...result,
      destination: resolvePostAuthDestination(data.destination, roles),
    };
  });

export const clearStaffVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({}).parse(input ?? {}))
  .handler(async ({ context }) => {
    const sessionId = sessionIdFromClaims(context.claims);
    if (sessionId) {
      const { clearStaffSession } = await import("./staff-mfa.server");
      await clearStaffSession(context.userId, sessionId);
    }
    return { ok: true as const };
  });
