function formatRecordTime(value) {
  if (!value) {
    return "时间未知";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "时间未知";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function RecordList({ records, loading, error }) {
  if (loading) {
    return (
      <div className="record-list__state" aria-live="polite">
        正在加载记录...
      </div>
    );
  }

  if (error) {
    return (
      <div className="record-list__state record-list__state--error" role="alert">
        <strong className="record-list__state-title">记录加载失败</strong>
        <p className="record-list__state-copy">{error}</p>
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="record-list__state record-list__state--empty" aria-live="polite">
        <strong className="record-list__state-title">还没有记录</strong>
        <p className="record-list__state-copy">先在上面的编辑器里写下第一条内容，保存后会出现在这里。</p>
      </div>
    );
  }

  return (
    <div className="record-list" aria-live="polite">
      {records.map((record, index) => (
        <article className="record-list__item" key={record.id}>
          <div className="record-list__meta">
            <span className="record-list__index">{String(index + 1).padStart(2, "0")}</span>
            <time className="record-list__time" dateTime={record.created_at || undefined}>
              {formatRecordTime(record.created_at)}
            </time>
          </div>
          <p className="record-list__content">{record.content}</p>
        </article>
      ))}
    </div>
  );
}
