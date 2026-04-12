export function formatDateTime(value) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return "时间未知";
  }

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return formatter.format(date).replace(" ", " ");
}

export function createDefaultTitle(value = new Date()) {
  return formatDateTime(value);
}

export function shouldAutoSelectTitle(draft, selectedRecord) {
  if (!draft) {
    return false;
  }

  return draft.id === null && !selectedRecord;
}

export function getDraftSaveValidationMessage(draft) {
  if (!draft?.title?.trim()) {
    return "标题不能为空。";
  }

  return null;
}
