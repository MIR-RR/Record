import test from "node:test";
import assert from "node:assert/strict";

import { shouldAutoSelectTitle } from "../src/components/record-utils.js";

test("auto-selects the title for a new draft", () => {
  assert.equal(
    shouldAutoSelectTitle(
      { id: null, title: "2026-04-12 22:00", body: "", updatedAt: "2026-04-12T22:00:00.000Z" },
      null
    ),
    true
  );
});

test("does not auto-select the title for an existing record", () => {
  assert.equal(
    shouldAutoSelectTitle(
      { id: "record-1", title: "existing", body: "body", updatedAt: "2026-04-12T22:00:00.000Z" },
      { id: "record-1" }
    ),
    false
  );
});

test("does not auto-select when there is no draft", () => {
  assert.equal(shouldAutoSelectTitle(null, null), false);
});
