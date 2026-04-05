export default function DashboardShell({
  userEmail,
  onLogout,
  logoutPending,
  composer,
  recordList,
}) {
  return (
    <main className="dashboard-shell">
      <header className="dashboard-shell__topbar">
        <div className="dashboard-shell__identity">
          <div>
            <h1 className="dashboard-shell__title">记录工作台</h1>
            <p className="dashboard-shell__subtitle">
              像写便签一样快速留下灵感、待办和当天发生的重要事。
            </p>
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

      <section className="dashboard-shell__stack" aria-label="记录工作区">
        <section className="dashboard-panel dashboard-panel--composer" aria-label="记录编辑区">
          <div className="dashboard-panel__header">
            <div>
              <p className="dashboard-panel__eyebrow">Composer</p>
              <h2 className="dashboard-panel__title">记录编辑器</h2>
            </div>
            <span className="dashboard-panel__status">实时保存到云端</span>
          </div>
          <p className="dashboard-panel__copy">
            适合写下想法、备忘、今天发生的小事，或者任何你想在稍后回看的内容。
          </p>
          {composer}
        </section>

        <section className="dashboard-panel dashboard-panel--list" aria-label="记录列表区">
          <div className="dashboard-panel__header">
            <div>
              <p className="dashboard-panel__eyebrow">Timeline</p>
              <h2 className="dashboard-panel__title">最近记录</h2>
            </div>
          </div>
          <p className="dashboard-panel__copy">
            保存成功后会按时间倒序出现在这里，形成一条干净的个人记录流。
          </p>
          {recordList}
        </section>
      </section>
    </main>
  );
}
