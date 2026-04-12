export const RECORDS_CACHE_LIMIT = 50;

function isValidCachedRecord(record) {
  return Boolean(
    record &&
    typeof record.id === "string" &&
    typeof record.userId === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.updatedAt === "string" &&
    typeof record.title === "string" &&
    typeof record.body === "string"
  );
}

export function getRecordsCacheKey(userId) {
  return `records:list:${userId}`;
}

export function parseStoredRecordsCache(rawCache) {
  if (typeof rawCache !== "string" || rawCache === "") {
    return null;
  }

  try {
    const parsed = JSON.parse(rawCache);

    if (
      !parsed ||
      typeof parsed.cachedAt !== "string" ||
      !Array.isArray(parsed.records) ||
      !parsed.records.every(isValidCachedRecord)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function loadRecordsCache(userId, storage = globalThis?.localStorage) {
  try {
    return parseStoredRecordsCache(storage?.getItem(getRecordsCacheKey(userId)));
  } catch {
    return null;
  }
}

export function persistRecordsCache(userId, records, storage = globalThis?.localStorage) {
  const payload = {
    cachedAt: new Date().toISOString(),
    records,
  };

  try {
    storage?.setItem(getRecordsCacheKey(userId), JSON.stringify(payload));
  } catch {
    return payload;
  }

  return payload;
}
