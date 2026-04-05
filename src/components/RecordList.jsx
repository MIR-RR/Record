import { formatDateTime } from "./record-utils";

export default function RecordList({
  records,
  loading,
  error,
  selectedId,
  onSelect,
  onCreate,
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
        <p className="record-list__state-copy">点击上方“新建记录”，开始写下今天的第一条内容。</p>
      </div>
    );
  } else {
    content = (
      <div className="record-list" aria-live="polite">
        {records.map((record) => (
          <button
            type="button"
            className={`record-list__item ${selectedId === record.id ? "is-active" : ""}`}
            key={record.id}
            onClick={() => onSelect(record.id)}
          >
            <div className="record-list__meta">
              <h3 className="record-list__title">{record.title}</h3>
              <time className="record-list__time" dateTime={record.updatedAt || undefined}>
                {formatDateTime(record.updatedAt)}
              </time>
            </div>
          </button>
        ))}
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
