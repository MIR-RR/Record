import { useState } from "react";

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "保存失败，请稍后重试。";
}

export default function RecordComposer({ onCreate }) {
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setFeedback({ type: "error", text: "记录内容不能为空。" });
      return;
    }

    if (pending) {
      return;
    }

    setPending(true);
    setFeedback({ type: "pending", text: "正在保存记录..." });

    try {
      await onCreate(trimmedContent);
      setContent("");
      setFeedback({ type: "success", text: "记录已保存。" });
    } catch (error) {
      setFeedback({ type: "error", text: getErrorMessage(error) });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="record-composer" onSubmit={handleSubmit}>
      <label className="record-composer__field">
        <span className="record-composer__label">记录内容</span>
        <textarea
          className="record-composer__textarea"
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            if (feedback) {
              setFeedback(null);
            }
          }}
          placeholder="把想记住的事情写在这里..."
          rows={8}
          disabled={pending}
        />
      </label>

      <div className="record-composer__footer">
        <div className="record-composer__feedback" aria-live="polite" aria-atomic="true">
          {feedback ? (
            <p className={`record-composer__message record-composer__message--${feedback.type}`}>
              {feedback.text}
            </p>
          ) : (
            <p className="record-composer__hint">保存后会自动出现在下方记录列表里。</p>
          )}
        </div>

        <button className="record-composer__submit" type="submit" disabled={pending}>
          {pending ? "保存中..." : "保存记录"}
        </button>
      </div>
    </form>
  );
}
