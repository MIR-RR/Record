import { useEffect, useState } from "react";
import { formatDateTime } from "./record-utils";

function RecordItem({ record, isActive, isNew, isRemoving, onSelect }) {
  const [entered, setEntered] = useState(!isNew);

  useEffect(() => {
    if (!isNew) return;
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isUnsaved = record.id === null;
  const className = [
    "record-list__item",
    isActive ? "is-active" : "",
    isNew ? "record-list__item--new" : "",
    isNew && entered ? "is-entered" : "",
    isRemoving ? "record-list__item--removing" : "",
  ].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={className}
      onClick={() => !isUnsaved && onSelect(record.id)}
    >
      <div className="record-list__meta">
        <h3 className="record-list__title">{record.title}</h3>
        <time className="record-list__time" dateTime={record.updatedAt || undefined}>
          {formatDateTime(record.updatedAt)}
        </time>
      </div>
    </button>
  );
}

export default function RecordList({
  records,
  loading,
  error,
  selectedId,
  onSelect,
  onCreate,
  removingId,
  newlySavedId,
}) {
  let content = null;

  if (loading) {
    content = <div className="record-list__state" aria-live="polite">正在加载记录...</div>;
  } else if (error) {
    content = (
      <div className="record-list__state record-list__state--error" role="alert">
        <strong className="record-list__state-title">记录加载失败</strong>
        <p className="record-list__state-copy">{error}</p>
      </div>
    );
  } else if (!records.length) {
    content = (
      <div className="record-list__state record-list__state--empty" aria-live="polite">
        <strong className="record-list__state-title">还没有记录</strong>
        <p className="record-list__state-copy">点击上方"新建记录"，开始写下今天的第一条内容。</p>
      </div>
    );
  } else {
    content = (
      <div className="record-list" aria-live="polite">
        {records.map((record) => {
          const isUnsaved = record.id === null;
          const isActive = isUnsaved ? !selectedId : selectedId === record.id;
          const isRemoving = record.id !== null && record.id === removingId;
          const isNew = isUnsaved || record.id === newlySavedId;

          return (
            <RecordItem
              key={record.id ?? "__new__"}
              record={record}
              isActive={isActive}
              isNew={isNew}
              isRemoving={isRemoving}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="record-list-shell">
      <button type="button" className="record-list__create" onClick={onCreate}>
        新建记录
      </button>
      <div className="record-list-shell__content">{content}</div>
    </div>
  );
}
