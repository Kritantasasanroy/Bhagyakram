/* global React, ReactDOM, CosmicBackground, BhagyakramLogo, LogoMark, BirthDetailsForm, ChatPanel, ConfirmationDialog, runAgent, runResume, HomePage, AuthPage */
const { useState: useS, useRef: useR, useEffect: useE } = React;

const SESSION_KEY = "bhagyakram_session_id";
const AUTO_CLEAR_TURNS = 20;

let _id = 0;
const nextId = () => "m" + (++_id);

function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) { id = "sess_" + Math.random().toString(36).slice(2, 10); localStorage.setItem(SESSION_KEY, id); }
  return id;
}

function authHeaders() {
  const token = localStorage.getItem("bhagyakram_token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

function useMedia(query) {
  const [m, setM] = useS(() => window.matchMedia(query).matches);
  useE(() => {
    const mq = window.matchMedia(query);
    const fn = (e) => setM(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [query]);
  return m;
}

function ErrorToast({ message, onClose }) {
  useE(() => {
    const t = setTimeout(onClose, 5200);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <div style={{
      position: "fixed", top: 22, left: "50%", transform: "translateX(-50%)", zIndex: 100,
      display: "flex", alignItems: "center", gap: 11,
      background: "rgba(40,26,22,0.92)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
      border: "1px solid rgba(217,138,106,0.4)", borderRadius: 13, padding: "12px 16px",
      color: "#F2D9CC", fontSize: 14, maxWidth: "90vw",
      boxShadow: "0 12px 40px rgba(0,0,0,0.4)", animation: "toastIn 0.4s var(--ease) both",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--error)", flexShrink: 0 }} />
      {message}
      <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(242,217,204,0.7)", cursor: "pointer", fontSize: 17, lineHeight: 1, marginLeft: 4 }}>×</button>
    </div>
  );
}

function InfoToast({ message, onClose }) {
  useE(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <div style={{
      position: "fixed", top: 22, left: "50%", transform: "translateX(-50%)", zIndex: 100,
      display: "flex", alignItems: "center", gap: 11,
      background: "rgba(18,26,46,0.95)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
      border: "1px solid rgba(201,168,76,0.35)", borderRadius: 13, padding: "12px 18px",
      color: "var(--ivory-dim)", fontSize: 14, maxWidth: "90vw",
      boxShadow: "0 12px 40px rgba(0,0,0,0.4)", animation: "toastIn 0.4s var(--ease) both",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }} />
      {message}
    </div>
  );
}

// ---- Chat App (the main astrology interface) ----
function ChatApp({ userEmail, onSignOut }) {
  const isMobile = useMedia("(max-width: 860px)");

  const [birth, setBirth] = useS({ date: "", time: "", approxTime: false, place: "" });
  const [messages, setMessages] = useS([]);
  const [tool, setTool] = useS(null);
  const [streamingId, setStreamingId] = useS(null);
  const [error, setError] = useS(null);
  const [infoMsg, setInfoMsg] = useS(null);
  const [drawerOpen, setDrawerOpen] = useS(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useS(true);
  const [pendingConfirmation, setPendingConfirmation] = useS(null);
  const [sessionId, setSessionId] = useS(getOrCreateSessionId);

  const hasRead = useR(false);
  const cancelRef = useR(null);
  const turnCount = useR(0);

  // Restore previous session messages on mount
  useE(() => {
    fetch(`/session/${sessionId}/messages`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.messages && data.messages.length > 0) {
          setMessages(data.messages.map(m => ({ id: nextId(), role: m.role, text: m.text })));
          hasRead.current = true;
          turnCount.current = data.messages.filter(m => m.role === "user").length;
        }
      })
      .catch(() => {});
  }, []);

  const clearChat = () => {
    const newId = "sess_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(SESSION_KEY, newId);
    setSessionId(newId);
    setMessages([]);
    setTool(null);
    setStreamingId(null);
    hasRead.current = false;
    turnCount.current = 0;
    // Delete server session in background — UI doesn't wait for this
    fetch(`/session/${sessionId}`, { method: "DELETE", headers: authHeaders() }).catch(() => {});
  };


  const busy = !!streamingId || !!tool;

  const send = (text) => {
    if (busy || !text.trim()) return;
    setError(null);
    const userMsg = { id: nextId(), role: "user", text };
    const botId = nextId();
    setMessages((prev) => [...prev, userMsg, { id: botId, role: "assistant", text: "" }]);
    setTool({ label: "consulting the stars", leaving: false });

    const firstTurn = !hasRead.current;
    cancelRef.current = runAgent(
      { message: text, session_id: sessionId, birth_details: { date: birth.date, time: birth.time, place: birth.place }, firstTurn },
      {
        onToolStart: (label) => setTool({ label, leaving: false }),
        onToolEnd: () => {},
        onToken: (tk) => {
          setTool(null);
          setStreamingId(botId);
          setMessages((prev) => prev.map((m) => m.id === botId ? { ...m, text: m.text + tk } : m));
        },
        onReplace: (full) => {
          setStreamingId(botId);
          setMessages((prev) => prev.map((m) => m.id === botId ? { ...m, text: full } : m));
        },
        onDone: () => {
          hasRead.current = true;
          setStreamingId(null);
          turnCount.current += 1;
          if (turnCount.current >= AUTO_CLEAR_TURNS) {
            setTimeout(() => {
              clearChat();
              setInfoMsg("Chat cleared after 20 exchanges — starting fresh.");
            }, 1200);
          }
        },
        onError: (msg) => {
          setError(msg);
          setStreamingId(null);
          setTool(null);
          setMessages((prev) => prev.filter((m) => !(m.id === botId && m.text === "")));
        },
        onConfirmationNeeded: (evt) => {
          setPendingConfirmation({ ...evt, botId });
        },
      }
    );
  };

  const readChart = () => {
    if (busy) return;
    if (isMobile) setDrawerOpen(false);
    const place = birth.place.trim();
    send(place
      ? `Please read my chart. I was born ${birth.date || "(date unset)"} at ${birth.time || "an unknown time"} in ${place}.`
      : "Please read my chart and tell me what you see.");
  };

  useE(() => () => { if (cancelRef.current) cancelRef.current(); }, []);

  const handleConfirmation = (confirmed) => {
    if (!pendingConfirmation) return;
    const { thread_id, session_id, botId } = pendingConfirmation;
    setPendingConfirmation(null);
    setTool({ label: "consulting the stars", leaving: false });
    cancelRef.current = runResume(
      { thread_id, session_id, confirmed, birth_details: { date: birth.date, time: birth.time, place: birth.place } },
      {
        onToolStart: (label) => setTool({ label, leaving: false }),
        onToolEnd: () => {},
        onToken: (tk) => {
          setTool(null);
          setStreamingId(botId);
          setMessages((prev) => prev.map((m) => m.id === botId ? { ...m, text: m.text + tk } : m));
        },
        onReplace: (full) => {
          setStreamingId(botId);
          setMessages((prev) => prev.map((m) => m.id === botId ? { ...m, text: full } : m));
        },
        onDone: () => { hasRead.current = true; setStreamingId(null); },
        onError: (msg) => { setError(msg); setStreamingId(null); setTool(null); },
      }
    );
  };

  const formProps = {
    values: birth, onChange: setBirth, onSubmit: readChart, submitting: busy,
  };

  return (
    <div style={{ position: "relative", height: "100%", width: "100%", zIndex: 1, overflow: "hidden", display: "flex", background: "var(--base)" }}>
      <CosmicBackground />

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
      {infoMsg && <InfoToast message={infoMsg} onClose={() => setInfoMsg(null)} />}

      {pendingConfirmation && (
        <ConfirmationDialog
          data={pendingConfirmation}
          onConfirm={() => handleConfirmation(true)}
          onDecline={() => handleConfirmation(false)}
        />
      )}

      {/* Left panel (desktop) */}
      {!isMobile && desktopSidebarOpen && (
        <aside style={{
          position: "relative", zIndex: 2, height: "100%",
          flex: "0 0 clamp(320px, 30%, 420px)",
          background: "rgba(15,21,37,0.82)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          borderRight: "1px solid var(--hairline)",
        }}>
          <BirthDetailsForm {...formProps} onCloseDrawer={() => setDesktopSidebarOpen(false)} />
        </aside>
      )}

      {/* Right panel — chat */}
      <main style={{
        position: "relative", zIndex: 2, height: "100%",
        flex: "1 1 0%", minWidth: 0,
      }}>
        <ChatPanel
          messages={messages}
          tool={tool}
          streamingId={streamingId}
          onSend={send}
          onPrompt={send}
          onEditDetails={() => isMobile ? setDrawerOpen(true) : setDesktopSidebarOpen(true)}
          showEditChip={isMobile || (!isMobile && !desktopSidebarOpen)}
          userEmail={userEmail}
          onSignOut={onSignOut}
          onClearChat={clearChat}
        />
      </main>

      {/* Mobile slide-up drawer */}
      {isMobile && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 40, background: "rgba(5,7,12,0.6)",
              opacity: drawerOpen ? 1 : 0, pointerEvents: drawerOpen ? "auto" : "none",
              transition: "opacity 0.3s var(--ease)", backdropFilter: "blur(2px)",
            }}
          />
          <div style={{
            position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
            height: "92%", maxHeight: 720,
            background: "var(--panel)", borderTop: "1px solid var(--hairline-2)",
            borderRadius: "22px 22px 0 0",
            transform: drawerOpen ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.42s var(--ease)",
            boxShadow: "0 -20px 60px rgba(0,0,0,0.5)", overflow: "hidden",
          }}>
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 10 }}>
              <div style={{ width: 38, height: 4, borderRadius: 99, background: "var(--hairline-2)" }} />
            </div>
            <BirthDetailsForm {...formProps} isDrawer onCloseDrawer={() => setDrawerOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}

// ---- Root App with routing ----
function App() {
  // Page state: "home" | "auth" | "chat"
  const [page, setPage] = useS("home");
  const [user, setUser] = useS(null);
  const [authChecked, setAuthChecked] = useS(false);

  // Listen for auth state
  useE(() => {
    const token = localStorage.getItem("bhagyakram_token");
    if (!token) {
      setAuthChecked(true);
      return;
    }

    fetch("/api/auth/me", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then((data) => {
        setUser({ email: data.email });
        setPage("chat");
        setAuthChecked(true);
      })
      .catch(() => {
        localStorage.removeItem("bhagyakram_token");
        setUser(null);
        setAuthChecked(true);
      });
  }, []);

  const handleGetStarted = () => {
    if (user) {
      setPage("chat");
    } else {
      setPage("auth");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("bhagyakram_token");
    setUser(null);
    setPage("home");
  };

  const handleAuthSuccess = (email) => {
    setUser({ email });
    setPage("chat");
  };

  // Show nothing until auth state is checked
  if (!authChecked) {
    return (
      <div style={{
        height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--base)",
      }}>
        <LogoMark size={48} spin glow />
      </div>
    );
  }

  if (page === "home") {
    return <HomePage onGetStarted={handleGetStarted} />;
  }

  if (page === "auth") {
    return (
      <AuthPage
        onAuthSuccess={handleAuthSuccess}
        onBackToHome={() => setPage("home")}
      />
    );
  }

  // page === "chat"
  return (
    <ChatApp
      userEmail={user ? user.email : null}
      onSignOut={handleSignOut}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
