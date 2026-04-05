export default function DashboardShell({
  userEmail,
  onLogout,
  logoutPending,
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
            <span className="dashboard-shell__user-label">当前用户</span>
            <strong className="dashboard-shell__user-value">{userEmail}</strong>
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
