import welcomeImage from "../assets/images/初始化图.png";

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

export default function RecordDetail({
  draft,
  selectedRecord,
  pending,
  feedback,
  onChange,
  onSave,
  onDelete,
  onBack,
}) {
  if (!draft) {
    return (
      <section className="detail-card detail-card--empty" aria-label="记录详情">
        <div className="detail-card__empty-media">
          <img className="detail-card__empty-image" src={welcomeImage} alt="欢迎插图" />
        </div>
        <div className="detail-card__empty-copy">
          <h2 className="detail-card__empty-title">今天也棒哦！</h2>
          <p className="detail-card__empty-text">点击“新建记录”开始写下今天想留下的内容吧。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="detail-card" aria-label="记录详情">
      <div className="detail-card__header">
        <button type="button" className="detail-card__back" onClick={onBack} aria-label="返回列表">
          ←
        </button>

        <div className="detail-card__actions">
          <button
            type="button"
            className="detail-card__button detail-card__button--ghost"
            onClick={onDelete}
            disabled={pending || !selectedRecord}
          >
            删除
          </button>
          <button
            type="button"
            className="detail-card__button detail-card__button--primary"
            onClick={onSave}
            disabled={pending}
          >
            {pending ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      <div className="detail-card__meta">
        <span className="detail-card__meta-label">更新时间</span>
        <time className="detail-card__meta-value" dateTime={draft.updatedAt || undefined}>
          {formatRecordTime(draft.updatedAt)}
        </time>
      </div>

      <div className="detail-card__body">
        <label className="detail-card__field">
          <span className="detail-card__label">标题</span>
          <input
            className="detail-card__input"
            type="text"
            value={draft.title}
            onChange={(event) => onChange("title", event.target.value)}
            placeholder="请输入标题"
            disabled={pending}
          />
        </label>

        <label className="detail-card__field detail-card__field--grow">
          <span className="detail-card__label">内容</span>
          <textarea
            className="detail-card__textarea"
            value={draft.body}
            onChange={(event) => onChange("body", event.target.value)}
            placeholder="把想记住的事情写在这里..."
            disabled={pending}
          />
        </label>
      </div>

      <div className="detail-card__footer" aria-live="polite" aria-atomic="true">
        {feedback ? (
          <p className={`detail-card__message detail-card__message--${feedback.type}`}>
            {feedback.text}
          </p>
        ) : (
          <p className="detail-card__hint" />
        )}
      </div>
    </section>
  );
}
