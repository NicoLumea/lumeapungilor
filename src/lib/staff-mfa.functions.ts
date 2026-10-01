import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sessionIdFromClaims } from "./authorization.server";

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
  .validator((input: unknown) => z.object({ code: z.string().regex(/^\d{6}$/) }).parse(input))
  .handler(async ({ data, context }) => {
    const sessionId = sessionIdFromClaims(context.claims);
    if (!sessionId) return { ok: false as const, error: SESSION_ERROR };
    const { verifyStaffCode } = await import("./staff-mfa.server");
    return verifyStaffCode(context.userId, sessionId, data.code);
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
