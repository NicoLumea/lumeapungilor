import assert from "node:assert/strict";
import test from "node:test";
import {
  PASSWORD_RESET_GENERIC_MESSAGE,
  passwordValidationError,
  readRecoveryCallback,
  recoveryCallbackConsumed,
  recoveryErrorMessage,
} from "./password-recovery.ts";

test("public reset response never identifies an account", () => {
  assert.equal(
    PASSWORD_RESET_GENERIC_MESSAGE,
    "Dacă există un cont asociat acestei adrese de email, vei primi în scurt timp instrucțiuni pentru resetarea parolei.",
  );
});

test("password policy rejects short and mismatched passwords", () => {
  assert.match(passwordValidationError("scurta", "scurta") ?? "", /cel puțin 8/);
  assert.equal(
    passwordValidationError("parola-lunga", "alta-parola"),
    "Cele două parole nu coincid.",
  );
  assert.equal(passwordValidationError("parola-lunga", "parola-lunga"), null);
});

test("implicit recovery callback is recognized before Supabase consumes its fragment", () => {
  const callback = readRecoveryCallback(
    "https://example.com/parola-noua#access_token=secret&refresh_token=secret&type=recovery",
  );
  assert.equal(callback.kind, "implicit");
  assert.equal(recoveryCallbackConsumed(callback, "https://example.com/parola-noua"), true);
  assert.equal(
    recoveryCallbackConsumed(callback, "https://example.com/parola-noua#access_token=secret"),
    false,
  );
});

test("PKCE callback is recognized but cannot authorize a pre-existing session", () => {
  const callback = readRecoveryCallback("https://example.com/parola-noua?code=secret");
  assert.equal(callback.kind, "pkce");
  assert.equal(
    recoveryCallbackConsumed(callback, "https://example.com/parola-noua?code=secret"),
    false,
  );
  assert.equal(recoveryCallbackConsumed(callback, "https://example.com/parola-noua"), true);
});

test("callback errors in query or fragment remain distinct from missing links", () => {
  const expired = readRecoveryCallback(
    "https://example.com/parola-noua?error=access_denied&error_code=otp_expired",
  );
  assert.equal(expired.kind, "error");
  assert.match(recoveryErrorMessage(expired), /expirat/);
  const denied = readRecoveryCallback(
    "https://example.com/parola-noua#error=access_denied&error_description=invalid",
  );
  assert.equal(denied.kind, "error");
  assert.doesNotMatch(recoveryErrorMessage(denied), /expirat/);
  assert.equal(readRecoveryCallback("https://example.com/parola-noua").kind, "none");
  assert.equal(
    readRecoveryCallback("https://example.com/parola-noua?type=recovery").kind,
    "incomplete",
  );
});
