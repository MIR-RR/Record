import { useCallback, useEffect, useRef, useState } from "react";
import AuthCard from "./components/AuthCard";
import DashboardShell from "./components/DashboardShell";
import RecordDetail from "./components/RecordDetail";
import RecordList from "./components/RecordList";
import {
  clearNoteDraft,
  loadNoteDraft,
  persistNoteDraft,
  shouldRestoreNoteDraft,
} from "./lib/record-draft";
import { supabase, supabaseInitError } from "./lib/supabase";
import { createDefaultTitle } from "./components/record-utils";
import { applyTheme, persistTheme, readStoredTheme, resolveThemePreference } from "./lib/theme";

const APP_ROUTE = "/Record/";
const AUTO_SAVE_DEBOUNCE_MS = 1000;
const AUTO_SAVE_INTERVAL_MS = 10000;

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

function getSaveFeedback(saveStatus, _lastSavedAt, _version) {
  switch (saveStatus) {
    case "dirty":
      return { type: "dirty", text: "有未保存修改" };
    case "saving":
      return { type: "pending", text: "正在保存..." };
    case "saved":
      return { type: "success", text: "已保存" };
    case "error":
      return { type: "error", text: "保存失败，内容仍保留在本地" };
    default:
      return null;
  }
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
  const [detailFeedbackOverride, setDetailFeedbackOverride] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [version, setVersion] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [newlySavedId, setNewlySavedId] = useState(null);
  const recordsRequestIdRef = useRef(0);
  const activeUserIdRef = useRef(null);
  const draftRef = useRef(null);
  const dirtyRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const saveRequestIdRef = useRef(0);
  const createPendingRef = useRef(false);
  const saveNowRef = useRef(null);

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
    draftRef.current = draft;
  }, [draft]);

  function clearAutoSaveTimer() {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }

  function cacheDraftLocally(nextDraft, noteId = nextDraft?.id) {
    if (!nextDraft) {
      return;
    }

    persistNoteDraft(noteId, {
      title: nextDraft.title,
      content: nextDraft.body,
      updatedAt: new Date().toISOString(),
    });
  }

  function restoreDraftFromLocal(baseDraft, noteId, remoteUpdatedAt) {
    const storedDraft = loadNoteDraft(noteId);

    if (!storedDraft || !shouldRestoreNoteDraft(storedDraft.updatedAt, remoteUpdatedAt)) {
      return { nextDraft: baseDraft, restored: false };
    }

    return {
      nextDraft: {
        ...baseDraft,
        title: storedDraft.title,
        body: storedDraft.content,
        updatedAt: storedDraft.updatedAt,
      },
      restored: true,
    };
  }

  function scheduleAutoSave(delay = AUTO_SAVE_DEBOUNCE_MS) {
    clearAutoSaveTimer();
    debounceTimerRef.current = window.setTimeout(() => {
      void saveNowRef.current?.({ reason: "debounce", allowInvalid: false });
    }, delay);
  }

  async function saveNow({ reason = "manual", allowInvalid = reason === "manual" } = {}) {
    const currentDraft = draftRef.current;
    const userId = session?.user?.id;

    if (!currentDraft) {
      return false;
    }

    if (!userId) {
      if (allowInvalid) {
        setDetailFeedbackOverride({ type: "error", text: "当前没有可用的登录用户。" });
        setSaveStatus("error");
      }
      return false;
    }

    const trimmedTitle = currentDraft.title.trim();
    const trimmedBody = currentDraft.body.trim();

    if (!trimmedTitle || !trimmedBody) {
      if (allowInvalid) {
        setDetailFeedbackOverride({
          type: "error",
          text: !trimmedTitle ? "标题不能为空。" : "内容不能为空。",
        });
        setSaveStatus("error");
      }
      return false;
    }

    if (!supabase) {
      if (allowInvalid) {
        setDetailFeedbackOverride({
          type: "error",
          text: supabaseInitError || "Supabase 客户端未初始化。",
        });
        setSaveStatus("error");
      }
      return false;
    }

    if (!dirtyRef.current && reason !== "manual") {
      return false;
    }

    if (!currentDraft.id && createPendingRef.current) {
      return false;
    }

    const requestId = saveRequestIdRef.current + 1;
    saveRequestIdRef.current = requestId;
    clearAutoSaveTimer();

    const saveSnapshot = {
      ...currentDraft,
      title: trimmedTitle,
      body: trimmedBody,
    };

    dirtyRef.current = false;
    setDetailFeedbackOverride(null);
    setSaveStatus("saving");

    if (!saveSnapshot.id) {
      createPendingRef.current = true;
    }

    try {
      let savedRow = null;

      if (saveSnapshot.id) {
        const { data, error } = await supabase
          .from("records")
          .update({
            title: saveSnapshot.title,
            content: saveSnapshot.body,
          })
          .eq("id", saveSnapshot.id)
          .eq("user_id", userId)
          .select("id, title, content, created_at, update_at, user_id")
          .single();

        if (error) {
          throw error;
        }

        savedRow = data;
      } else {
        const { data, error } = await supabase
          .from("records")
          .insert([
            {
              title: saveSnapshot.title,
              content: saveSnapshot.body,
              update_at: new Date().toISOString(),
              user_id: userId,
            },
          ])
          .select("id, title, content, created_at, update_at, user_id")
          .single();

        if (error) {
          throw error;
        }

        savedRow = data;
      }

      createPendingRef.current = false;

      if (requestId !== saveRequestIdRef.current) {
        return true;
      }

      const nextRecord = mapRecord(savedRow);
      const hasNewerEdits = dirtyRef.current;

      setRecords((currentRecords) => {
        const nextRecords = saveSnapshot.id
          ? currentRecords.map((record) => (record.id === nextRecord.id ? nextRecord : record))
          : [nextRecord, ...currentRecords.filter((record) => record.id !== nextRecord.id)];

        return nextRecords.sort(
          (left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)
        );
      });

      setSelectedRecordId(nextRecord.id);
      setLastSavedAt(nextRecord.updatedAt);
      setVersion(typeof savedRow?.version === "number" ? savedRow.version : null);

      if (hasNewerEdits) {
        const latestDraft = draftRef.current
          ? {
              ...draftRef.current,
              id: nextRecord.id,
              updatedAt: nextRecord.updatedAt,
            }
          : {
              ...saveSnapshot,
              id: nextRecord.id,
              updatedAt: nextRecord.updatedAt,
            };

        draftRef.current = latestDraft;
        setDraft(latestDraft);
        cacheDraftLocally(latestDraft, nextRecord.id);

        if (!saveSnapshot.id) {
          clearNoteDraft(null);
        }

        setSaveStatus("dirty");
        scheduleAutoSave();
        return true;
      }

      const persistedDraft = createDraft(nextRecord);
      draftRef.current = persistedDraft;
      setDraft(persistedDraft);
      clearNoteDraft(saveSnapshot.id);

      if (!saveSnapshot.id) {
        clearNoteDraft(null);
        setNewlySavedId(nextRecord.id);
        setTimeout(() => setNewlySavedId(null), 600);
      }

      setSaveStatus("saved");
      return true;
    } catch (error) {
      createPendingRef.current = false;

      if (requestId !== saveRequestIdRef.current) {
        return false;
      }

      dirtyRef.current = true;
      cacheDraftLocally(saveSnapshot, saveSnapshot.id);
      setSaveStatus("error");
      console.error("保存记录失败:", error);
      return false;
    }
  }

  saveNowRef.current = saveNow;

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
      setDetailFeedbackOverride(null);
      setSaveStatus("idle");
      dirtyRef.current = false;
      clearAutoSaveTimer();
      return;
    }

    refreshRecords(userId);
  }, [refreshRecords, session]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!dirtyRef.current) {
        return;
      }

      void saveNowRef.current?.({ reason: "interval", allowInvalid: false });
    }, AUTO_SAVE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden" && dirtyRef.current) {
        void saveNowRef.current?.({ reason: "visibilitychange", allowInvalid: false });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearAutoSaveTimer();
    };
  }, []);

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
      setDetailFeedbackOverride(null);
      setSaveStatus("idle");
      dirtyRef.current = false;
      clearAutoSaveTimer();
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
    clearAutoSaveTimer();
    const { nextDraft, restored } = restoreDraftFromLocal(createDraft(), null, null);
    setSelectedRecordId(null);
    setDraft(nextDraft);
    draftRef.current = nextDraft;
    dirtyRef.current = restored;
    setDetailFeedbackOverride(null);
    setSaveStatus(restored ? "dirty" : "idle");
  }

  function handleSelectRecord(recordId) {
    const selectedRecord = records.find((record) => record.id === recordId);

    if (!selectedRecord) {
      return;
    }

    clearAutoSaveTimer();

    const { nextDraft, restored } = restoreDraftFromLocal(
      createDraft(selectedRecord),
      selectedRecord.id,
      selectedRecord.updatedAt
    );

    setSelectedRecordId(recordId);
    setDraft(nextDraft);
    draftRef.current = nextDraft;
    dirtyRef.current = restored;
    setDetailFeedbackOverride(null);
    setSaveStatus(restored ? "dirty" : "idle");
    setLastSavedAt(selectedRecord.updatedAt);
  }

  function handleDraftChange(field, value) {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      const nextDraft = {
        ...currentDraft,
        [field]: value,
      };

      draftRef.current = nextDraft;
      dirtyRef.current = true;
      cacheDraftLocally(nextDraft);
      return nextDraft;
    });

    setDetailFeedbackOverride(null);
    setSaveStatus("dirty");
    scheduleAutoSave();
  }

  function handleBackToList() {
    clearAutoSaveTimer();
    setSelectedRecordId(null);
    setDraft(null);
    draftRef.current = null;
    dirtyRef.current = false;
    setDetailFeedbackOverride(null);
    setSaveStatus("idle");
  }

  function handleSaveDetail() {
    void saveNow({ reason: "manual", allowInvalid: true });
  }

  async function handleDeleteDetail() {
    if (!session?.user?.id || !draft?.id || detailPending || !supabase) {
      return;
    }

    const deletingId = draft.id;
    clearAutoSaveTimer();
    setRemovingId(deletingId);
    setDetailPending(true);
    setDetailFeedbackOverride({ type: "pending", text: "正在删除记录..." });

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
      draftRef.current = null;
      dirtyRef.current = false;
      clearNoteDraft(deletingId);
      setDetailFeedbackOverride(null);
      setSaveStatus("idle");
    } catch (error) {
      setDetailFeedbackOverride({
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
  const detailFeedback = detailFeedbackOverride || getSaveFeedback(saveStatus, lastSavedAt, version);
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
            saveStatus={saveStatus}
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
