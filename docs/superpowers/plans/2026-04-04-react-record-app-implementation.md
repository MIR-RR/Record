# React Record App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current static frontend with a React + Vite single-page app while keeping Supabase as the backend for auth and records.

**Architecture:** Build a small React app with one root `App` component that switches between logged-out and logged-in states based on the Supabase session. Keep all backend responsibilities in Supabase, centralize client initialization in `src/lib/supabase.js`, and split the UI into focused components for auth, record creation, and record listing.

**Tech Stack:** React, Vite, native CSS, Supabase JS

---

## File Structure

- Create: `package.json`
- Create: `vite.config.js`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/lib/supabase.js`
- Create: `src/components/AuthCard.jsx`
- Create: `src/components/DashboardShell.jsx`
- Create: `src/components/RecordComposer.jsx`
- Create: `src/components/RecordList.jsx`
- Create: `src/styles/app.css`
- Modify: `index.html`
- Delete or replace usage of: `app.js`, `style.css`

## Task 1: Scaffold the React + Vite entrypoint

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Modify: `index.html`

- [ ] **Step 1: Write the target package and Vite config content**

```json
{
  "name": "react-record-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.8",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.10"
  }
}
```

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 2: Replace the HTML shell with a Vite root**

Use this `index.html` body structure:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Record Space</title>
    <script type="module" src="/src/main.jsx"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

- [ ] **Step 3: Run install to create the React workspace dependencies**

Run: `npm install`
Expected: dependencies install successfully and `package-lock.json` is created

- [ ] **Step 4: Commit the scaffold**

```bash
git add package.json package-lock.json vite.config.js index.html
git commit -m "chore: scaffold react vite frontend"
```

## Task 2: Centralize Supabase client setup

**Files:**
- Create: `src/lib/supabase.js`
- Test: manual startup verification through the app shell

- [ ] **Step 1: Write the failing scenario as acceptance criteria**

```js
// Expected behavior:
// - app can create one Supabase client from environment-safe constants
// - app returns a readable error if config is missing
// - backend remains Supabase for auth and records
```

- [ ] **Step 2: Create the Supabase client module**

```js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zxftwrluhiddwbgdavjl.supabase.co";
const supabaseAnonKey = "sb_publishable_6OYpUqsFFncHBUijjcml0w_2dZ1bP6p";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase 配置缺失，无法初始化客户端。");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 3: Verify the module imports cleanly**

Run: `node -e "import('./src/lib/supabase.js').then(() => console.log('ok'))"`
Expected: prints `ok`

- [ ] **Step 4: Commit the client module**

```bash
git add src/lib/supabase.js
git commit -m "feat: add shared supabase client"
```

## Task 3: Build the React entrypoint and app shell

**Files:**
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/styles/app.css`

- [ ] **Step 1: Write the failing app shell acceptance criteria**

```jsx
// Expected behavior:
// - React mounts into #root
// - App shows a loading state while session is checked
// - App swaps between auth view and dashboard view
```

- [ ] **Step 2: Create the React mount file**

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/app.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 3: Create the base `App.jsx` session shell**

```jsx
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (mounted) {
          setSession(currentSession);
        }
      } catch (error) {
        if (mounted) {
          setAuthError(error.message);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (authLoading) {
    return <div className="app-state">正在准备应用...</div>;
  }

  if (authError) {
    return <div className="app-state app-state-error">{authError}</div>;
  }

  return <div className="app-shell">{session ? "dashboard" : "auth"}</div>;
}
```

- [ ] **Step 4: Add base app-level styles**

```css
:root {
  color-scheme: light;
  font-family: "Noto Sans SC", "Segoe UI", sans-serif;
  background: #f6f3ee;
  color: #201a16;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(242, 206, 178, 0.9), transparent 30%),
    linear-gradient(180deg, #f8f5f0 0%, #f1ece5 100%);
}

#root {
  min-height: 100vh;
}

.app-shell,
.app-state {
  min-height: 100vh;
}

.app-state {
  display: grid;
  place-items: center;
  padding: 24px;
}

.app-state-error {
  color: #a43f2d;
}
```

- [ ] **Step 5: Verify the app boots**

Run: `npm run build`
Expected: Vite build succeeds with no syntax errors

- [ ] **Step 6: Commit the app shell**

```bash
git add src/main.jsx src/App.jsx src/styles/app.css
git commit -m "feat: add react app shell"
```

## Task 4: Build the logged-out auth experience

**Files:**
- Create: `src/components/AuthCard.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles/app.css`

- [ ] **Step 1: Write the auth UI acceptance criteria**

```jsx
// Expected behavior:
// - one card supports login and register modes
// - user sees pending, success, and error feedback
// - successful auth relies on Supabase session updates
```

- [ ] **Step 2: Create the auth component**

```jsx
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthCard() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setMessage(mode === "login" ? "正在登录..." : "正在注册...");
    setMessageType("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage("登录成功，正在进入你的空间。");
        setMessageType("success");
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage(
          data.session
            ? "注册成功，已自动登录。"
            : "注册成功。如启用了邮箱确认，请先确认邮箱。"
        );
        setMessageType("success");
      }
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-copy">
        <p className="eyebrow">Record Space</p>
        <h1>轻量、清楚、真的能用的记录空间</h1>
        <p className="subtitle">
          给用户一个舒服的地方，快速写下内容，也能自然回看最近记录。
        </p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-switch">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            登录
          </button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            注册
          </button>
        </div>

        <label>
          <span>邮箱</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <label>
          <span>密码</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>

        <button className="primary-btn" type="submit" disabled={pending}>
          {pending ? "请稍候..." : mode === "login" ? "邮箱登录" : "创建账号"}
        </button>

        <p className={`feedback ${messageType}`}>{message}</p>
      </form>
    </section>
  );
}
```

- [ ] **Step 3: Render the auth component from `App.jsx`**

```jsx
import AuthCard from "./components/AuthCard";

// inside App return:
return <div className="app-shell">{session ? "dashboard" : <AuthCard />}</div>;
```

- [ ] **Step 4: Add auth layout styles**

```css
.auth-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 24px;
  align-items: center;
  padding: 40px;
}

.auth-copy,
.auth-card {
  border-radius: 28px;
  background: rgba(255, 252, 247, 0.88);
  border: 1px solid rgba(85, 67, 51, 0.08);
  box-shadow: 0 24px 60px rgba(69, 50, 34, 0.1);
}

.auth-copy {
  padding: 48px;
}

.auth-card {
  display: grid;
  gap: 16px;
  padding: 32px;
}

.auth-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #f0e7dd;
  border-radius: 999px;
  padding: 4px;
}

.auth-switch button.active {
  background: #ffffff;
}
```

- [ ] **Step 5: Verify auth UI renders**

Run: `npm run build`
Expected: build passes and the app renders the auth view when no session exists

- [ ] **Step 6: Commit the auth experience**

```bash
git add src/components/AuthCard.jsx src/App.jsx src/styles/app.css
git commit -m "feat: add auth card experience"
```

## Task 5: Build the logged-in dashboard layout

**Files:**
- Create: `src/components/DashboardShell.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles/app.css`

- [ ] **Step 1: Write the dashboard shell acceptance criteria**

```jsx
// Expected behavior:
// - top bar shows product identity and current user
// - logout button is visible and usable
// - dashboard hosts the composer and records list areas
```

- [ ] **Step 2: Create the dashboard shell component**

```jsx
export default function DashboardShell({ userEmail, onLogout, logoutPending, composer, recordList }) {
  return (
    <section className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Your Record Space</p>
          <h2>欢迎回来</h2>
          <p className="subtitle">{userEmail}</p>
        </div>

        <button className="secondary-btn" onClick={onLogout} disabled={logoutPending}>
          {logoutPending ? "退出中..." : "退出登录"}
        </button>
      </header>

      <main className="dashboard-grid">
        <section className="panel panel-primary">{composer}</section>
        <section className="panel">{recordList}</section>
      </main>
    </section>
  );
}
```

- [ ] **Step 3: Update `App.jsx` to render the dashboard shell placeholder**

```jsx
import DashboardShell from "./components/DashboardShell";

const user = session?.user ?? null;

async function handleLogout() {
  setAuthError("");
  await supabase.auth.signOut({ scope: "local" });
}

return session ? (
  <DashboardShell
    userEmail={user?.email || "未命名用户"}
    onLogout={handleLogout}
    logoutPending={false}
    composer={<div>composer</div>}
    recordList={<div>list</div>}
  />
) : (
  <AuthCard />
);
```

- [ ] **Step 4: Add dashboard shell styles**

```css
.dashboard-shell {
  min-height: 100vh;
  padding: 28px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 20px;
}

.panel {
  padding: 24px;
  border-radius: 24px;
  background: rgba(255, 252, 247, 0.92);
  border: 1px solid rgba(85, 67, 51, 0.08);
}

.panel-primary {
  min-height: 360px;
}
```

- [ ] **Step 5: Verify login-state layout builds**

Run: `npm run build`
Expected: build passes and dashboard shell compiles with the session branch

- [ ] **Step 6: Commit the dashboard shell**

```bash
git add src/components/DashboardShell.jsx src/App.jsx src/styles/app.css
git commit -m "feat: add dashboard shell layout"
```

## Task 6: Build record composer and record list components

**Files:**
- Create: `src/components/RecordComposer.jsx`
- Create: `src/components/RecordList.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles/app.css`

- [ ] **Step 1: Write the records acceptance criteria**

```jsx
// Expected behavior:
// - composer saves records to Supabase
// - list loads current-user records from Supabase
// - list shows loading, empty, and error states
```

- [ ] **Step 2: Create the composer component**

```jsx
import { useState } from "react";

export default function RecordComposer({ onCreate }) {
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!content.trim()) {
      setMessage("记录内容不能为空。");
      setMessageType("error");
      return;
    }

    setPending(true);
    setMessage("正在保存...");
    setMessageType("");

    try {
      await onCreate(content.trim());
      setContent("");
      setMessage("保存成功。");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <div className="section-head">
        <h3>快速记录</h3>
        <p>把现在要记住的内容写下来。</p>
      </div>

      <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={10} />

      <button className="primary-btn" type="submit" disabled={pending}>
        {pending ? "保存中..." : "保存记录"}
      </button>

      <p className={`feedback ${messageType}`}>{message}</p>
    </form>
  );
}
```

- [ ] **Step 3: Create the record list component**

```jsx
export default function RecordList({ records, loading, error }) {
  if (loading) {
    return <div className="records-state">正在加载记录...</div>;
  }

  if (error) {
    return <div className="records-state records-state-error">{error}</div>;
  }

  if (!records.length) {
    return <div className="records-state">还没有记录，先写下第一条内容。</div>;
  }

  return (
    <div className="record-list">
      <div className="section-head">
        <h3>最近记录</h3>
        <p>只显示当前登录用户自己的内容。</p>
      </div>

      {records.map((record) => (
        <article className="record-item" key={record.id}>
          <time>{new Date(record.created_at).toLocaleString("zh-CN")}</time>
          <p>{record.content}</p>
        </article>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Connect record loading and creation in `App.jsx`**

```jsx
const [records, setRecords] = useState([]);
const [recordsLoading, setRecordsLoading] = useState(false);
const [recordsError, setRecordsError] = useState("");
const [logoutPending, setLogoutPending] = useState(false);

async function loadRecords(userId) {
  setRecordsLoading(true);
  setRecordsError("");

  try {
    const { data, error } = await supabase
      .from("records")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setRecords(data || []);
  } catch (error) {
    setRecordsError(error.message);
  } finally {
    setRecordsLoading(false);
  }
}

async function handleCreateRecord(content) {
  const userId = session?.user?.id;
  if (!userId) throw new Error("当前没有可用的登录用户。");

  const { error } = await supabase.from("records").insert([{ content, user_id: userId }]);
  if (error) throw error;
  await loadRecords(userId);
}

async function handleLogout() {
  setLogoutPending(true);
  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw error;
    setRecords([]);
    setRecordsError("");
  } finally {
    setLogoutPending(false);
  }
}
```

- [ ] **Step 5: Trigger record loading when session changes**

```jsx
useEffect(() => {
  const userId = session?.user?.id;
  if (userId) {
    loadRecords(userId);
  } else {
    setRecords([]);
    setRecordsError("");
  }
}, [session]);
```

- [ ] **Step 6: Add records UI styles**

```css
.composer,
.record-list {
  display: grid;
  gap: 16px;
}

.section-head h3,
.section-head p {
  margin: 0;
}

textarea,
input {
  width: 100%;
  border-radius: 18px;
  border: 1px solid rgba(95, 77, 62, 0.12);
  padding: 14px 16px;
  font: inherit;
  background: #fffdfa;
}

.primary-btn,
.secondary-btn {
  border: 0;
  border-radius: 999px;
  padding: 14px 18px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.primary-btn {
  background: #ca6237;
  color: #fffaf6;
}

.secondary-btn {
  background: #f0e7dd;
  color: #241c16;
}

.record-item {
  border-top: 1px solid rgba(95, 77, 62, 0.08);
  padding-top: 14px;
}

.feedback.error,
.records-state-error {
  color: #a43f2d;
}

.feedback.success {
  color: #23724c;
}
```

- [ ] **Step 7: Verify records workflow compiles**

Run: `npm run build`
Expected: build passes with record create/list logic wired through the React app

- [ ] **Step 8: Commit the records workflow**

```bash
git add src/components/RecordComposer.jsx src/components/RecordList.jsx src/App.jsx src/styles/app.css
git commit -m "feat: add record composer and list"
```

## Task 7: Replace legacy assets and finalize responsive behavior

**Files:**
- Modify: `src/styles/app.css`
- Delete: `app.js`
- Delete: `style.css`
- Modify: `start-frontend.sh` (optional if needed to point users to Vite)

- [ ] **Step 1: Add responsive layout rules**

```css
@media (max-width: 900px) {
  .auth-layout,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .topbar {
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .auth-layout,
  .dashboard-shell {
    padding: 16px;
  }

  .auth-copy,
  .auth-card,
  .panel {
    padding: 20px;
  }
}
```

- [ ] **Step 2: Remove the legacy static frontend files from active use**

Run:

```bash
rm app.js style.css
```

Expected: only the React app remains as the active frontend codepath

- [ ] **Step 3: Update the local startup script to use Vite**

Use this script content:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm install
exec npm run dev -- --host 127.0.0.1 --port "${1:-4174}"
```

- [ ] **Step 4: Verify the full frontend**

Run: `npm run build`
Expected: production build succeeds

Run: `./start-frontend.sh`
Expected: local dev server starts and prints a localhost URL

- [ ] **Step 5: Commit the migration cleanup**

```bash
git add start-frontend.sh src index.html package.json vite.config.js
git rm app.js style.css
git commit -m "refactor: migrate static app to react frontend"
```

## Task 8: Manual product verification

**Files:**
- Test: running app in browser

- [ ] **Step 1: Verify registration flow**

Run: `./start-frontend.sh`
Expected: app opens on local host and shows the auth screen

Manual check:
- switch to register mode
- submit valid email/password
- confirm success or email-confirmation messaging appears

- [ ] **Step 2: Verify login flow**

Manual check:
- switch to login mode
- submit a known account
- confirm dashboard shell appears

- [ ] **Step 3: Verify record creation**

Manual check:
- enter text in composer
- save the record
- confirm the new record appears in the list

- [ ] **Step 4: Verify logout**

Manual check:
- click logout
- confirm the app returns to auth view
- refresh the page and confirm logged-out state persists

- [ ] **Step 5: Verify empty and mobile states**

Manual check:
- test a user with no records
- test narrow viewport layout

- [ ] **Step 6: Commit any final polish**

```bash
git add src
git commit -m "fix: polish react record app states"
```
