const FALLBACK_NOTE_ID = "new";

function normalizeNoteId(noteId) {
  if (noteId === null || noteId === undefined || noteId === "") {
    return FALLBACK_NOTE_ID;
  }

  return String(noteId);
}

export function getNoteDraftStorageKey(noteId) {
  return `note:draft:${normalizeNoteId(noteId)}`;
}

export function parseStoredNoteDraft(rawDraft) {
  if (typeof rawDraft !== "string" || rawDraft === "") {
    return null;
  }

  try {
    const parsed = JSON.parse(rawDraft);

    if (
      !parsed ||
      typeof parsed.title !== "string" ||
      typeof parsed.content !== "string" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }

    return {
      noteId: normalizeNoteId(parsed.noteId),
      title: parsed.title,
      content: parsed.content,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function shouldRestoreNoteDraft(localUpdatedAt, remoteUpdatedAt) {
  const localTime = new Date(localUpdatedAt).getTime();

  if (Number.isNaN(localTime)) {
    return false;
  }

  const remoteTime = new Date(remoteUpdatedAt).getTime();

  if (Number.isNaN(remoteTime)) {
    return true;
  }

  return localTime > remoteTime;
}

export function loadNoteDraft(noteId, storage = globalThis?.localStorage) {
  try {
    return parseStoredNoteDraft(storage?.getItem(getNoteDraftStorageKey(noteId)));
  } catch {
    return null;
  }
}

export function persistNoteDraft(noteId, draft, storage = globalThis?.localStorage) {
  if (!draft) {
    return null;
  }

  const payload = {
    noteId: normalizeNoteId(noteId),
    title: typeof draft.title === "string" ? draft.title : "",
    content: typeof draft.content === "string" ? draft.content : "",
    updatedAt: typeof draft.updatedAt === "string" ? draft.updatedAt : new Date().toISOString(),
  };

  try {
    storage?.setItem(getNoteDraftStorageKey(noteId), JSON.stringify(payload));
  } catch {
    return payload;
  }

  return payload;
}

export function clearNoteDraft(noteId, storage = globalThis?.localStorage) {
  try {
    storage?.removeItem(getNoteDraftStorageKey(noteId));
  } catch {
    return;
  }
}
