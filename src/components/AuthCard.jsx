import { useState } from "react";
import { supabase } from "../lib/supabase";

const MODES = {
  login: {
    actionLabel: "登录",
    switchLabel: "切换到注册",
    headline: "欢迎回来",
    helper: "使用你的账号登录，或者注册一个新账号记录美好生活",
    waitingCopy: "登录请求已提交，正在等待会话更新。",
    submitLabel: "登录",
  },
  register: {
    actionLabel: "注册",
    switchLabel: "切换到登录",
    headline: "创建新账号",
    helper: "注册后你可以直接进入记录空间，记录你的每一分时刻。",
    waitingCopy: "注册请求已提交，正在等待会话更新。",
    submitLabel: "注册",
  },
};

function getAuthMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "认证请求失败，请稍后重试。";
}

export default function AuthCard() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const currentMode = MODES[mode];

  async function handleSubmit(event) {
    event.preventDefault();

    if (pending) {
      return;
    }

    setPending(true);
    setFeedback({ type: "pending", text: `${currentMode.actionLabel}中，请稍候...` });

    try {
      const authResult =
        mode === "register"
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });

      const { error, data } = authResult;

      if (error) {
        throw error;
      }

      if (mode === "register") {
        if (data?.session) {
          setFeedback({ type: "pending", text: currentMode.waitingCopy });
          return;
        }

        setFeedback({
          type: "success",
          text: "注册已提交，若需要确认邮件请检查你的收件箱。",
        });
        return;
      }

      setFeedback({
        type: "pending",
        text: currentMode.waitingCopy,
      });
    } catch (error) {
      setFeedback({ type: "error", text: getAuthMessage(error) });
    } finally {
      setPending(false);
    }
  }

  function switchMode(nextMode) {
    if (pending || nextMode === mode) {
      return;
    }

    setMode(nextMode);
    setFeedback(null);
  }

  function toggleMode() {
    switchMode(mode === "login" ? "register" : "login");
  }

  return (
    <section className="auth-page">
      <div className="auth-page__rail">
        <h1 className="auth-page__title">{currentMode.headline}</h1>
        <p className="auth-page__copy">{currentMode.helper}</p>
      </div>

      <div className="auth-page__panel">
        <div className="auth-card">
          <div className="auth-card__mode-switch" role="group" aria-label="认证模式">
            <button
              type="button"
              className={`auth-card__mode ${mode === "login" ? "is-active" : ""}`}
              onClick={() => switchMode("login")}
              aria-pressed={mode === "login"}
              disabled={pending}
            >
              登录
            </button>
            <button
              type="button"
              className={`auth-card__mode ${mode === "register" ? "is-active" : ""}`}
              onClick={() => switchMode("register")}
              aria-pressed={mode === "register"}
              disabled={pending}
            >
              注册
            </button>
          </div>

          <form className="auth-card__form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span className="auth-field__label">电子邮箱</span>
              <input
                className="auth-field__input"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                required
              />
            </label>

            <label className="auth-field">
              <span className="auth-field__label">密码</span>
              <input
                className="auth-field__input"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="至少 6 位"
                minLength={6}
                required
              />
            </label>

            <div className="auth-card__feedback" aria-live="polite" aria-atomic="true">
              {feedback ? (
                <p className={`auth-feedback auth-feedback--${feedback.type}`}>{feedback.text}</p>
              ) : (
                <p className="auth-card__hint" />
              )}
            </div>

            <button className="auth-card__submit" type="submit" disabled={pending}>
              {pending ? "处理中..." : currentMode.submitLabel}
            </button>
          </form>

          <button type="button" className="auth-card__swap" onClick={toggleMode} disabled={pending}>
            {currentMode.switchLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
