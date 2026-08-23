/* global React, CosmicBackground, BhagyakramLogo, LogoMark */
const { useState: useStateA, useEffect: useEffectA } = React;

function AuthPage({ onAuthSuccess, onBackToHome }) {
  const [mode, setMode] = useStateA("login"); // "login" or "signup"
  const [otpStep, setOtpStep] = useStateA(false); // signup step 2: enter the emailed code
  const [email, setEmail] = useStateA("");
  const [password, setPassword] = useStateA("");
  const [otp, setOtp] = useStateA("");
  const [error, setError] = useStateA(null);
  const [loading, setLoading] = useStateA(false);
  const [hover, setHover] = useStateA(false);

  const friendlyError = (err) => {
    // Basic mapping for API errors
    const msg = err.toString().toLowerCase();
    if (msg.includes("email already registered")) return "An account with this email already exists. Try signing in.";
    if (msg.includes("incorrect email or password")) return "Invalid email or password. Please check your credentials.";
    if (msg.includes("invalid or expired code") || msg.includes("invalid_otp") || msg.includes("could not verify the code")) return "That code is invalid or has expired. Please try again.";
    if (msg.includes("could not send the verification code") || msg.includes("could not reach the email verification service")) return "Couldn't send the verification email. Please try again in a moment.";
    if (msg.includes("network")) return "Network error. Please check your connection.";
    return err.toString() || "Something went wrong. Please try again.";
  };

  const postJson = async (url, body) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Something went wrong");
    }
    return response.json();
  };

  const handleLogin = async () => {
    const data = await postJson("/api/auth/login", { email, password });
    localStorage.setItem("bhagyakram_token", data.access_token);
    onAuthSuccess(data.email);
  };

  const handleRequestOtp = async () => {
    await postJson("/api/auth/signup/request-otp", { email });
    setOtpStep(true);
  };

  const handleVerifyOtp = async () => {
    const data = await postJson("/api/auth/signup/verify-otp", { email, otp, password });
    localStorage.setItem("bhagyakram_token", data.access_token);
    onAuthSuccess(data.email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === "signup" && otpStep) {
      if (!otp.trim()) {
        setError("Please enter the code we emailed you.");
        return;
      }
    } else if (!email.trim() || !password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        await handleLogin();
      } else if (otpStep) {
        await handleVerifyOtp();
      } else {
        await handleRequestOtp();
      }
    } catch (err) {
      setError(friendlyError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setOtpStep(false);
    setOtp("");
    setError(null);
  };

  const backFromOtp = () => {
    setOtpStep(false);
    setOtp("");
    setError(null);
  };

  const isSignupOtpStep = mode === "signup" && otpStep;

  const heading = mode === "login"
    ? "Welcome Back"
    : (isSignupOtpStep ? "Check Your Email" : "Create Account");

  const subheading = mode === "login"
    ? "Sign in to continue your celestial journey"
    : (isSignupOtpStep
      ? `Enter the code we sent to ${email}`
      : "Begin your journey with Bhagyakram AI");

  const buttonLabel = mode === "login"
    ? (loading ? "Signing in…" : "Sign In")
    : (isSignupOtpStep
      ? (loading ? "Verifying…" : "Verify & Create Account")
      : (loading ? "Sending code…" : "Send Verification Code"));

  return (
    <div style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden" }}>
      <CosmicBackground />

      <div className="auth-container">
        <div className="auth-card">
          {/* Back button */}
          <button
            onClick={isSignupOtpStep ? backFromOtp : onBackToHome}
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
            {heading}
          </h2>
          <p style={{
            textAlign: "center", fontSize: 14, color: "var(--ivory-dim)",
            margin: "0 0 28px",
          }}>
            {subheading}
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {!isSignupOtpStep && (
              <>
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
              </>
            )}

            {isSignupOtpStep && (
              <>
                <label style={{
                  fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: "var(--ivory-dim)", display: "block", marginBottom: 8,
                }}>Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  maxLength={8}
                  style={{ marginBottom: 12, letterSpacing: "0.3em", textAlign: "center" }}
                />
                <button
                  type="button"
                  onClick={async () => {
                    setError(null);
                    setLoading(true);
                    try {
                      await postJson("/api/auth/signup/request-otp", { email });
                    } catch (err) {
                      setError(friendlyError(err.message));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  style={{
                    background: "none", border: "none", color: "var(--gold)",
                    cursor: "pointer", fontSize: 13, fontFamily: "var(--sans)",
                    padding: 0, marginBottom: 24, display: "block",
                  }}
                >
                  Resend code
                </button>
              </>
            )}

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
              {buttonLabel}
            </button>
          </form>

          {!isSignupOtpStep && (
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
          )}

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
