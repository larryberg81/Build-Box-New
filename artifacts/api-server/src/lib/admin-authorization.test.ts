import assert from "node:assert/strict";
import { test } from "node:test";
import { isSalesOwner, isSameOriginWrite } from "./admin-authorization.js";

const ownerEmail = "owner@example.com";
const owner = {
  primaryEmailAddressId: "primary",
  emailAddresses: [{ id: "primary", emailAddress: ownerEmail, verification: { status: "verified" } }],
};
test("only the configured verified primary email has owner access", () => {
  assert.equal(isSalesOwner(owner, ownerEmail), true);
  assert.equal(isSalesOwner(owner, " OWNER@EXAMPLE.COM "), true);
  assert.equal(isSalesOwner(owner, undefined), false);
  assert.equal(isSalesOwner(owner, "different@example.com"), false);
  assert.equal(isSalesOwner({ ...owner, primaryEmailAddressId: null }, ownerEmail), false);
  assert.equal(isSalesOwner({
    ...owner, emailAddresses: [{ ...owner.emailAddresses[0], verification: { status: "unverified" } }],
  }, ownerEmail), false);
  assert.equal(isSalesOwner({
    primaryEmailAddressId: "other",
    emailAddresses: [...owner.emailAddresses, {
      id: "other", emailAddress: "other@example.com", verification: { status: "verified" },
    }],
  }, ownerEmail), false);
});
test("mutations reject missing or cross-origin sources", () => {
  assert.equal(isSameOriginWrite("https://shop.example.com", "shop.example.com"), true);
  assert.equal(isSameOriginWrite("https://attacker.example", "shop.example.com"), false);
  assert.equal(isSameOriginWrite(undefined, "shop.example.com"), false);
  assert.equal(isSameOriginWrite("null", "shop.example.com"), false);
  assert.equal(isSameOriginWrite("https://shop.example.com:8000", "shop.example.com"), false);
});
