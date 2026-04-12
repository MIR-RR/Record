import test from "node:test";
import assert from "node:assert/strict";

import {
  getNoteDraftStorageKey,
  parseStoredNoteDraft,
  shouldRestoreNoteDraft,
} from "../src/lib/record-draft.js";

test("builds the storage key from note id", () => {
  assert.equal(getNoteDraftStorageKey("abc"), "note:draft:abc");
  assert.equal(getNoteDraftStorageKey(null), "note:draft:new");
});

test("restores a draft only when it is newer than the remote timestamp", () => {
  assert.equal(
    shouldRestoreNoteDraft("2026-04-12T12:00:00.000Z", "2026-04-12T11:00:00.000Z"),
    true
  );
  assert.equal(
    shouldRestoreNoteDraft("2026-04-12T10:00:00.000Z", "2026-04-12T11:00:00.000Z"),
    false
  );
  assert.equal(shouldRestoreNoteDraft("bad-date", "2026-04-12T11:00:00.000Z"), false);
});

test("parses valid stored drafts and rejects malformed payloads", () => {
  const draft = parseStoredNoteDraft(
    JSON.stringify({
      noteId: "abc",
      title: "hello",
      content: "world",
      updatedAt: "2026-04-12T12:00:00.000Z",
    })
  );

  assert.deepEqual(draft, {
    noteId: "abc",
    title: "hello",
    content: "world",
    updatedAt: "2026-04-12T12:00:00.000Z",
  });

  assert.equal(parseStoredNoteDraft("{"), null);
  assert.equal(parseStoredNoteDraft(JSON.stringify({})), null);
});
