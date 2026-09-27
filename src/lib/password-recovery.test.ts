import assert from "node:assert/strict";
import test from "node:test";
import {
  hasRecoveryError,
  hasRecoveryMarker,
  PASSWORD_RESET_GENERIC_MESSAGE,
  passwordValidationError,
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

test("recovery markers and provider errors are recognized without exposing tokens", () => {
  assert.equal(
    hasRecoveryMarker(
      "https://example.ro/parola-noua#access_token=secret&refresh_token=secret2&type=recovery",
    ),
    true,
  );
  assert.equal(hasRecoveryMarker("https://example.ro/parola-noua"), false);
  assert.equal(
    hasRecoveryError("https://example.ro/parola-noua#error=access_denied&error_code=otp_expired"),
    true,
  );
});
