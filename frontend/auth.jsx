/* global React, CosmicBackground, BhagyakramLogo, LogoMark */
const { useState: useStateA, useEffect: useEffectA } = React;

function AuthPage({ onAuthSuccess, onBackToHome }) {
  const [mode, setMode] = useStateA("login"); // "login" or "signup"
  const [email, setEmail] = useStateA("");
  const [password, setPassword] = useStateA("");
  const [error, setError] = useStateA(null);
  const [loading, setLoading] = useStateA(false);
  const [hover, setHover] = useStateA(false);

  const friendlyError = (err) => {
    // Basic mapping for API errors
    const msg = err.toString().toLowerCase();
    if (msg.includes("email already registered")) return "An account with this email already exists. Try signing in.";
    if (msg.includes("incorrect email or password")) return "Invalid email or password. Please check your credentials.";
    if (msg.includes("network")) return "Network error. Please check your connection.";
    return err.toString() || "Something went wrong. Please try again.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Authentication failed");
      }

      const data = await response.json();
      localStorage.setItem("bhagyakram_token", data.access_token);
      onAuthSuccess(data.email);
    } catch (err) {
      setError(friendlyError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError(null);
  };

  return (
    <div style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden" }}>
      <CosmicBackground />

      <div className="auth-container">
        <div className="auth-card">
          {/* Back button */}
          <button
            onClick={onBackToHome}
            style={{
              position: "absolute", top: 16, left: 20,
              background: "none", border: "none", color: "var(--ivory-dim)",
              cursor: "pointer", fontSize: 14, fontFamily: "var(--sans)",
              display: "flex", alignItems: "center", gap: 6,
              transition: "color 0.2s var(--ease)",
            }}
            onMouseEnter={(e) => e.target.style.color = "var(--ivory)"}
            onMouseLeave={(e) => e.target.style.color = "var(--ivory-dim)"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>

          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <LogoMark size={56} glow />
          </div>

          <h2 style={{
            fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 500,
            fontSize: 26, textAlign: "center", margin: "0 0 6px",
            color: "var(--ivory)",
          }}>
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p style={{
            textAlign: "center", fontSize: 14, color: "var(--ivory-dim)",
            margin: "0 0 28px",
          }}>
            {mode === "login"
              ? "Sign in to continue your celestial journey"
              : "Begin your journey with Bhagyakram AI"}
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label style={{
              fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: "0.18em",
              textTransform: "uppercase", color: "var(--ivory-dim)", display: "block", marginBottom: 8,
            }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              style={{ marginBottom: 18 }}
            />

            <label style={{
              fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: "0.18em",
              textTransform: "uppercase", color: "var(--ivory-dim)", display: "block", marginBottom: 8,
            }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              style={{ marginBottom: 24 }}
            />

            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              style={{
                width: "100%", border: "none", cursor: loading ? "default" : "pointer",
                borderRadius: 13, padding: "15px 16px", color: "#1a1408",
                fontFamily: "var(--sans)", fontWeight: 600, fontSize: 15,
                background: "linear-gradient(105deg, #b08f38 0%, #E4C766 38%, #C9A84C 60%, #b08f38 100%)",
                backgroundSize: "200% 100%",
                boxShadow: hover ? "0 10px 34px rgba(201,168,76,0.30)" : "0 6px 22px rgba(201,168,76,0.16)",
                animation: hover && !loading ? "btnShimmer 1.1s linear infinite" : "none",
                transition: "box-shadow 0.3s var(--ease)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}
            >
              {loading && (
                <svg width="17" height="17" viewBox="0 0 24 24" style={{ animation: "spin 0.9s linear infinite" }}>
                  <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(26,20,8,0.25)" strokeWidth="2.4" />
                  <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="#1a1408" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              )}
              {loading
                ? (mode === "login" ? "Signing in…" : "Creating account…")
                : (mode === "login" ? "Sign In" : "Create Account")}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 22 }}>
            <span style={{ fontSize: 14, color: "var(--ivory-dim)" }}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              onClick={toggleMode}
              style={{
                background: "none", border: "none", color: "var(--gold)",
                cursor: "pointer", fontSize: 14, fontFamily: "var(--sans)",
                textDecoration: "underline", textUnderlineOffset: 3,
              }}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </div>

          <p style={{
            textAlign: "center", fontSize: 11, color: "var(--ivory-faint)",
            marginTop: 24, lineHeight: 1.5,
          }}>
            Built by Kritanta Sasan Roy
          </p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AuthPage });
