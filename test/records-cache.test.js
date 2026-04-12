import test from "node:test";
import assert from "node:assert/strict";

import {
  getRecordsCacheKey,
  parseStoredRecordsCache,
} from "../src/lib/records-cache.js";

test("builds a records cache key from user id", () => {
  assert.equal(getRecordsCacheKey("user-1"), "records:list:user-1");
});

test("parses valid records cache payloads", () => {
  const parsed = parseStoredRecordsCache(
    JSON.stringify({
      cachedAt: "2026-04-12T22:00:00.000Z",
      records: [
        {
          id: "1",
          userId: "user-1",
          createdAt: "2026-04-12T20:00:00.000Z",
          updatedAt: "2026-04-12T21:00:00.000Z",
          title: "first",
          body: "content",
        },
      ],
    })
  );

  assert.deepEqual(parsed, {
    cachedAt: "2026-04-12T22:00:00.000Z",
    records: [
      {
        id: "1",
        userId: "user-1",
        createdAt: "2026-04-12T20:00:00.000Z",
        updatedAt: "2026-04-12T21:00:00.000Z",
        title: "first",
        body: "content",
      },
    ],
  });
});

test("returns null for malformed records cache payloads", () => {
  assert.equal(parseStoredRecordsCache("{"), null);
  assert.equal(parseStoredRecordsCache(JSON.stringify({})), null);
  assert.equal(
    parseStoredRecordsCache(JSON.stringify({ cachedAt: "now", records: [{}] })),
    null
  );
});
