import assert from "node:assert/strict";
import test from "node:test";
import { COMPANY_PHONE } from "./company-legal.ts";
import { internationalTelephone, telephoneHref, whatsappHref } from "./company-phone.ts";

test("the shared contact number renders and links correctly", () => {
  assert.equal(COMPANY_PHONE, "0765 514 422");
  assert.equal(internationalTelephone(COMPANY_PHONE), "+40 765 514 422");
  assert.equal(telephoneHref(COMPANY_PHONE), "tel:+40765514422");
  assert.equal(whatsappHref(COMPANY_PHONE), "https://wa.me/40765514422");
});

test("Romanian international input does not duplicate the country code", () => {
  assert.equal(telephoneHref("+40 765 514 422"), "tel:+40765514422");
  assert.equal(whatsappHref("+40 765 514 422"), "https://wa.me/40765514422");
  assert.equal(whatsappHref("40765514422"), "https://wa.me/40765514422");
});

test("secondary Romanian contact remains separately dialable", () => {
  assert.equal(telephoneHref("0371 900 033"), "tel:+40371900033");
});
