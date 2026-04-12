import { useCallback, useEffect, useRef, useState } from "react";
import AuthCard from "./components/AuthCard";
import DashboardShell from "./components/DashboardShell";
import RecordDetail from "./components/RecordDetail";
import RecordList from "./components/RecordList";
import { supabase, supabaseInitError } from "./lib/supabase";
import { createDefaultTitle } from "./components/record-utils";
import { applyTheme, persistTheme, readStoredTheme, resolveThemePreference } from "./lib/theme";

const APP_ROUTE = "/Record/";

function getNormalizedRoute(pathname) {
  if (pathname === APP_ROUTE || pathname === "/Record") {
    return APP_ROUTE;
  }

  return APP_ROUTE;
}

function syncRoute(nextRoute) {
  const normalizedRoute = getNormalizedRoute(nextRoute);

  if (window.location.pathname === normalizedRoute) {
    return;
  }

  window.history.replaceState(null, "", normalizedRoute);
}

async function fetchRecordsForUser(userId) {
  if (!supabase) {
    throw new Error(supabaseInitError || "Supabase 客户端未初始化。");
  }

  const { data, error } = await supabase
    .from("records")
    .select("id, title, content, created_at, update_at, user_id")
    .eq("user_id", userId)
    .order("update_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

function mapRecord(row) {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.update_at || row.created_at,
    title: typeof row.title === "string" && row.title.trim() ? row.title : createDefaultTitle(row.created_at),
    body: typeof row.content === "string" ? row.content : "",
  };
}

function createDraft(record) {
  const now = new Date();

  if (!record) {
    return {
      id: null,
      title: createDefaultTitle(now),
      body: "",
      updatedAt: now.toISOString(),
    };
  }

  return {
    id: record.id,
    title: record.title,
    body: record.body,
    updatedAt: record.updatedAt,
  };
}

export default function App() {
  const [theme, setTheme] = useState(() => readStoredTheme());
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState("");
  const [logoutPending, setLogoutPending] = useState(false);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [detailPending, setDetailPending] = useState(false);
  const [detailFeedback, setDetailFeedback] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [newlySavedId, setNewlySavedId] = useState(null);
  const recordsRequestIdRef = useRef(0);
  const activeUserIdRef = useRef(null);

  const refreshRecords = useCallback(async (userId) => {
    const requestId = recordsRequestIdRef.current + 1;
    recordsRequestIdRef.current = requestId;

    if (!userId) {
      activeUserIdRef.current = null;
      setRecords([]);
      setRecordsError("");
      setRecordsLoading(false);
      return;
    }

    activeUserIdRef.current = userId;
    setRecordsLoading(true);
    setRecordsError("");

    try {
      const nextRecords = await fetchRecordsForUser(userId);

      if (recordsRequestIdRef.current !== requestId || activeUserIdRef.current !== userId) {
        return;
      }

      setRecords(nextRecords.map(mapRecord));
    } catch (error) {
      if (recordsRequestIdRef.current !== requestId || activeUserIdRef.current !== userId) {
        return;
      }

      setRecords([]);
      setRecordsError(error instanceof Error ? error.message : "加载记录失败。");
    } finally {
      if (recordsRequestIdRef.current === requestId && activeUserIdRef.current === userId) {
        setRecordsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!supabase) {
        if (mounted) {
          setBootstrapError(supabaseInitError || "Supabase 客户端未初始化。");
          setAuthLoading(false);
        }
        return;
      }

      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (mounted) {
          setSession(currentSession);
          setBootstrapError("");
        }
      } catch (error) {
        if (mounted) {
          setBootstrapError(error instanceof Error ? error.message : "获取登录状态失败。");
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
      if (mounted) {
        setSession(nextSession);
        setBootstrapError("");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    syncRoute(window.location.pathname);
  }, []);

  useEffect(() => {
    const resolvedTheme = resolveThemePreference(theme);
    applyTheme(resolvedTheme);
    persistTheme(resolvedTheme);
  }, [theme]);

  useEffect(() => {
    const userId = session?.user?.id;

    if (!userId) {
      activeUserIdRef.current = null;
      recordsRequestIdRef.current += 1;
      setRecords([]);
      setRecordsError("");
      setRecordsLoading(false);
      setSelectedRecordId(null);
      setDraft(null);
      setDetailFeedback(null);
      return;
    }

    refreshRecords(userId);
  }, [refreshRecords, session]);

  async function handleLogout() {
    if (!supabase) {
      setBootstrapError(supabaseInitError || "Supabase 客户端未初始化。");
      return;
    }

    if (logoutPending) {
      return;
    }

    setLogoutPending(true);

    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });

      if (error) {
        throw error;
      }

      activeUserIdRef.current = null;
      recordsRequestIdRef.current += 1;
      setRecords([]);
      setRecordsError("");
      setRecordsLoading(false);
      setSelectedRecordId(null);
      setDraft(null);
      setDetailFeedback(null);
    } catch (error) {
      console.error("退出登录失败:", error);
    } finally {
      setLogoutPending(false);
    }
  }

  function handleThemeChange(nextTheme) {
    setTheme((currentTheme) => {
      const resolvedNextTheme = resolveThemePreference(nextTheme);
      return currentTheme === resolvedNextTheme ? currentTheme : resolvedNextTheme;
    });
  }

  function handleCreateRecord() {
    setSelectedRecordId(null);
    setDraft(createDraft());
    setDetailFeedback(null);
  }

  function handleSelectRecord(recordId) {
    const selectedRecord = records.find((record) => record.id === recordId);

    if (!selectedRecord) {
      return;
    }

    setSelectedRecordId(recordId);
    setDraft(createDraft(selectedRecord));
    setDetailFeedback(null);
  }

  function handleDraftChange(field, value) {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        [field]: value,
      };
    });
    setDetailFeedback(null);
  }

  function handleBackToList() {
    setSelectedRecordId(null);
    setDraft(null);
    setDetailFeedback(null);
  }

  async function handleSaveDetail() {
    if (!session?.user?.id) {
      setDetailFeedback({ type: "error", text: "当前没有可用的登录用户。" });
      return;
    }

    if (!draft || detailPending) {
      return;
    }

    const trimmedTitle = draft.title.trim();
    const trimmedBody = draft.body.trim();

    if (!trimmedTitle) {
      setDetailFeedback({ type: "error", text: "标题不能为空。" });
      return;
    }

    if (!trimmedBody) {
      setDetailFeedback({ type: "error", text: "内容不能为空。" });
      return;
    }

    if (!supabase) {
      setDetailFeedback({ type: "error", text: supabaseInitError || "Supabase 客户端未初始化。" });
      return;
    }

    setDetailPending(true);
    setDetailFeedback({ type: "pending", text: "正在保存记录..." });

    const nextUpdatedAt = new Date().toISOString();

    try {
      if (draft.id) {
        const { data, error } = await supabase
          .from("records")
          .update({
            title: trimmedTitle,
            content: trimmedBody,
            update_at: nextUpdatedAt,
          })
          .eq("id", draft.id)
          .eq("user_id", session.user.id)
          .select("id, title, content, created_at, update_at, user_id")
          .single();

        if (error) {
          throw error;
        }

        const nextRecord = mapRecord(data);
        setRecords((currentRecords) =>
          currentRecords
            .map((record) => (record.id === nextRecord.id ? nextRecord : record))
            .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
        );
        setSelectedRecordId(nextRecord.id);
        setDraft(createDraft(nextRecord));
      } else {
        const { data, error } = await supabase
          .from("records")
          .insert([
            {
              title: trimmedTitle,
              content: trimmedBody,
              update_at: nextUpdatedAt,
              user_id: session.user.id,
            },
          ])
          .select("id, title, content, created_at, update_at, user_id")
          .single();

        if (error) {
          throw error;
        }

        const nextRecord = mapRecord(data);
        setRecords((currentRecords) =>
          [nextRecord, ...currentRecords].sort(
            (left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)
          )
        );
        setSelectedRecordId(nextRecord.id);
        setDraft(createDraft(nextRecord));
        setNewlySavedId(nextRecord.id);
        setTimeout(() => setNewlySavedId(null), 600);
      }

      setDetailFeedback({ type: "success", text: "记录已保存。" });
    } catch (error) {
      setDetailFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "保存失败，请稍后重试。",
      });
    } finally {
      setDetailPending(false);
    }
  }

  async function handleDeleteDetail() {
    if (!session?.user?.id || !draft?.id || detailPending || !supabase) {
      return;
    }

    const deletingId = draft.id;
    setRemovingId(deletingId);
    setDetailPending(true);
    setDetailFeedback({ type: "pending", text: "正在删除记录..." });

    await new Promise((resolve) => setTimeout(resolve, 260));

    try {
      const { error } = await supabase
        .from("records")
        .delete()
        .eq("id", deletingId)
        .eq("user_id", session.user.id);

      if (error) {
        throw error;
      }

      setRecords((currentRecords) => currentRecords.filter((record) => record.id !== deletingId));
      setSelectedRecordId(null);
      setDraft(null);
      setDetailFeedback(null);
    } catch (error) {
      setDetailFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "删除失败，请稍后重试。",
      });
    } finally {
      setRemovingId(null);
      setDetailPending(false);
    }
  }

  const unsavedEntry = draft && !draft.id
    ? [{ id: null, title: draft.title, updatedAt: draft.updatedAt }]
    : [];

  const sidebarRecords = [
    ...unsavedEntry,
    ...records.map((record) =>
      record.id === selectedRecordId && draft
        ? { ...record, title: draft.title || record.title }
        : record
    ),
  ];

  const selectedRecord = selectedRecordId
    ? records.find((record) => record.id === selectedRecordId) || null
    : null;
  const detailEyebrow = selectedRecord ? "Detail" : draft ? "Creating" : "Detail";
  const detailTitle = selectedRecord ? "记录详情" : draft ? "新建记录" : "记录详情";

  if (authLoading) {
    return <div className="app-state">正在准备应用...</div>;
  }

  if (bootstrapError) {
    return (
      <main className="app-shell app-shell--error">
        <div className="app-shell__backdrop" aria-hidden="true" />
        <section className="auth-page">
          <div className="auth-page__rail">
            <h1 className="auth-page__title">登录服务暂时不可用</h1>
            <p className="auth-page__copy">
              我们暂时无法连接到 Supabase session。请稍后重试，或者检查环境变量是否已正确配置。
            </p>
          </div>

          <div className="auth-page__panel auth-page__panel--error" role="alert">
            <p className="auth-feedback auth-feedback--error">{bootstrapError}</p>
          </div>
        </section>
      </main>
    );
  }

  if (session) {
    return (
      <DashboardShell
        userEmail={session.user?.email || "已登录用户"}
        onLogout={handleLogout}
        logoutPending={logoutPending}
        theme={theme}
        onThemeChange={handleThemeChange}
        detailOpen={Boolean(draft)}
        detailEyebrow={detailEyebrow}
        detailTitle={detailTitle}
        sidebar={
          <RecordList
            records={sidebarRecords}
            loading={recordsLoading}
            error={recordsError}
            selectedId={selectedRecordId}
            onSelect={handleSelectRecord}
            onCreate={handleCreateRecord}
            removingId={removingId}
            newlySavedId={newlySavedId}
          />
        }
        detail={
          <RecordDetail
            draft={draft}
            selectedRecord={selectedRecord}
            pending={detailPending}
            feedback={detailFeedback}
            onChange={handleDraftChange}
            onSave={handleSaveDetail}
            onDelete={handleDeleteDetail}
            onBack={handleBackToList}
          />
        }
      />
    );
  }

  return (
    <main className="app-shell">
      <div className="app-shell__backdrop" aria-hidden="true" />
      <AuthCard />
    </main>
  );
}
