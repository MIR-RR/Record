function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="dashboard-shell__theme-icon">
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.75v2.5M12 18.75v2.5M21.25 12h-2.5M5.25 12h-2.5M18.54 5.46l-1.76 1.76M7.22 16.78l-1.76 1.76M18.54 18.54l-1.76-1.76M7.22 7.22 5.46 5.46"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="dashboard-shell__theme-icon">
      <path
        d="M15.66 3.2a8.92 8.92 0 1 0 5.14 15.94 8.2 8.2 0 0 1-3.12.6 8.95 8.95 0 0 1-8.94-8.94 8.22 8.22 0 0 1 6.92-8.1Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function DashboardShell({
  userEmail,
  onLogout,
  logoutPending,
  theme,
  onThemeChange,
  sidebar,
  detail,
  detailOpen,
  detailEyebrow,
  detailTitle,
}) {
  return (
    <main className="dashboard-shell">
      <header className="dashboard-shell__topbar">
        <div className="dashboard-shell__identity">
          <div>
            <h1 className="dashboard-shell__title">Record Space</h1>
            <p className="dashboard-shell__subtitle">像写便签一样快速留下灵感、待办和当天发生的重要事。</p>
          </div>
        </div>

        <div className="dashboard-shell__account">
          <div className="dashboard-shell__user">
            <strong className="dashboard-shell__user-value">{userEmail}</strong>
          </div>

          <div className="dashboard-shell__theme-switch" role="group" aria-label="主题切换">
            <button
              type="button"
              className={`dashboard-shell__theme-option ${theme === "light" ? "is-active" : ""}`}
              onClick={() => onThemeChange("light")}
              aria-pressed={theme === "light"}
              aria-label="切换为浅色模式"
            >
              <SunIcon />
            </button>
            <button
              type="button"
              className={`dashboard-shell__theme-option ${theme === "dark" ? "is-active" : ""}`}
              onClick={() => onThemeChange("dark")}
              aria-pressed={theme === "dark"}
              aria-label="切换为深色模式"
            >
              <MoonIcon />
            </button>
          </div>

          <button
            type="button"
            className="dashboard-shell__logout"
            onClick={onLogout}
            disabled={logoutPending}
          >
            {logoutPending ? "退出中..." : "退出登录"}
          </button>
        </div>
      </header>

      <section
        className={`dashboard-shell__workspace ${detailOpen ? "dashboard-shell__workspace--detail-open" : ""}`}
        aria-label="记录工作区"
      >
        <section className="dashboard-panel dashboard-panel--sidebar" aria-label="记录列表区">
          <div className="dashboard-panel__header">
            <div>
              <p className="dashboard-panel__eyebrow">Records</p>
              <h2 className="dashboard-panel__title">记录列表</h2>
            </div>
          </div>
          {sidebar}
        </section>

        <section className="dashboard-panel dashboard-panel--detail" aria-label="记录详情区">
          <div className="dashboard-panel__header">
            <div>
              <p className="dashboard-panel__eyebrow">{detailEyebrow}</p>
              <h2 className="dashboard-panel__title">{detailTitle}</h2>
            </div>
          </div>
          {detail}
        </section>
      </section>
    </main>
  );
}
