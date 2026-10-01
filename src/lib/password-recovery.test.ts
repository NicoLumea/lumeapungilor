import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeRecoveryCode,
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

test("only six numeric recovery-code characters are accepted", () => {
  assert.equal(normalizeRecoveryCode(" 012345 "), "012345");
  assert.equal(normalizeRecoveryCode("12345"), null);
  assert.equal(normalizeRecoveryCode("12a456"), null);
  assert.equal(normalizeRecoveryCode("1234567"), null);
});
