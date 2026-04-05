import { useCallback, useEffect, useRef, useState } from "react";
import AuthCard from "./components/AuthCard";
import DashboardShell from "./components/DashboardShell";
import RecordComposer from "./components/RecordComposer";
import RecordList from "./components/RecordList";
import { supabase, supabaseInitError } from "./lib/supabase";

const ROUTES = {
  login: "/Record/",
  app: "/app",
};

function getNormalizedRoute(pathname) {
  if (pathname === "/Record") {
    return ROUTES.login;
  }

  if (pathname === ROUTES.app) {
    return ROUTES.app;
  }

  return ROUTES.login;
}

function syncRoute(nextRoute, mode = "replace") {
  const normalizedRoute = getNormalizedRoute(nextRoute);

  if (window.location.pathname === normalizedRoute) {
    return;
  }

  const historyMethod = mode === "push" ? "pushState" : "replaceState";
  window.history[historyMethod](null, "", normalizedRoute);
}

async function fetchRecordsForUser(userId) {
  if (!supabase) {
    throw new Error(supabaseInitError || "Supabase 客户端未初始化。");
  }

  const { data, error } = await supabase
    .from("records")
    .select("id, content, created_at, user_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export default function App() {
  const [pathname, setPathname] = useState(() => getNormalizedRoute(window.location.pathname));
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState("");
  const [logoutPending, setLogoutPending] = useState(false);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");
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

      setRecords(nextRecords);
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
    function handlePopState() {
      setPathname(getNormalizedRoute(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
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
    if (authLoading || bootstrapError) {
      return;
    }

    const targetRoute = session ? ROUTES.app : ROUTES.login;

    if (pathname !== targetRoute) {
      syncRoute(targetRoute);
      setPathname(targetRoute);
    }
  }, [authLoading, bootstrapError, pathname, session]);

  useEffect(() => {
    const userId = session?.user?.id;

    if (!userId) {
      activeUserIdRef.current = null;
      recordsRequestIdRef.current += 1;
      setRecords([]);
      setRecordsError("");
      setRecordsLoading(false);
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
    } catch (error) {
      console.error("退出登录失败:", error);
    } finally {
      setLogoutPending(false);
    }
  }

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
    if (pathname !== ROUTES.app) {
      return <div className="app-state">正在进入应用...</div>;
    }

    return (
      <DashboardShell
        userEmail={session.user?.email || "已登录用户"}
        onLogout={handleLogout}
        logoutPending={logoutPending}
        composer={
          <RecordComposer
            onCreate={async (content) => {
              const userId = session.user?.id;

              if (!userId) {
                throw new Error("当前没有可用的登录用户。");
              }

              if (!supabase) {
                throw new Error(supabaseInitError || "Supabase 客户端未初始化。");
              }

              const { error } = await supabase.from("records").insert([
                {
                  content,
                  user_id: userId,
                },
              ]);

              if (error) {
                throw error;
              }

              try {
                await refreshRecords(userId);
              } catch (refreshError) {
                setRecordsError(
                  refreshError instanceof Error ? refreshError.message : "列表刷新失败。"
                );
              }
            }}
          />
        }
        recordList={<RecordList records={records} loading={recordsLoading} error={recordsError} />}
      />
    );
  }

  if (pathname !== ROUTES.login) {
    return <div className="app-state">正在进入登录页...</div>;
  }

  return (
    <main className="app-shell">
      <div className="app-shell__backdrop" aria-hidden="true" />
      <AuthCard />
    </main>
  );
}
