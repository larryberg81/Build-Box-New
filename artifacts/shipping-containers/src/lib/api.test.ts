import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { apiUrl } from "./api";

describe("API URL configuration", () => {
  it("keeps Replit requests on the current same-origin API path by default", () => {
    assert.equal(apiUrl("/api/contact"), "/api/contact");
  });
});
