/* global React, CosmicBackground, BhagyakramLogo, LogoMark */
const { useState: useStateH, useEffect: useEffectH, useRef: useRefH } = React;

// ---- Animated counter ----
function AnimatedCount({ target, suffix = "", duration = 2000 }) {
  const [count, setCount] = useStateH(0);
  const ref = useRefH(null);
  const started = useRefH(false);

  useEffectH(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const step = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} style={{ animation: "countShine 0.6s var(--ease) both" }}>
      {count}{suffix}
    </span>
  );
}

// ---- Scroll-reveal wrapper ----
function Reveal({ children, delay = 0 }) {
  const [visible, setVisible] = useStateH(false);
  const ref = useRefH(null);

  useEffectH(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => setVisible(true), delay);
        observer.disconnect();
      }
    }, { threshold: 0.15 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(30px)",
      transition: `opacity 0.7s var(--ease) ${delay}ms, transform 0.7s var(--ease) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ---- Nav bar ----
function HomeNav({ onGetStarted }) {
  const [scrolled, setScrolled] = useStateH(false);

  useEffectH(() => {
    const el = document.querySelector(".bhagyakram-home");
    if (!el) return;
    const handleScroll = () => setScrolled(el.scrollTop > 60);
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 32px",
      background: scrolled ? "rgba(11,15,26,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(14px)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(14px)" : "none",
      borderBottom: scrolled ? "1px solid var(--hairline)" : "1px solid transparent",
      transition: "all 0.35s var(--ease)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <LogoMark size={32} glow />
        <span style={{
          fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 20,
          color: "var(--gold)", letterSpacing: "0.04em",
        }}>Bhagyakram</span>
      </div>
      <button
        onClick={onGetStarted}
        style={{
          background: "linear-gradient(135deg, #E4C766, #C9A84C)",
          border: "none", borderRadius: 99, padding: "10px 24px",
          color: "#1a1408", fontFamily: "var(--sans)", fontWeight: 600,
          fontSize: 14, cursor: "pointer",
          transition: "box-shadow 0.3s var(--ease), transform 0.2s var(--ease)",
        }}
        onMouseEnter={(e) => { e.target.style.boxShadow = "0 8px 28px rgba(201,168,76,0.35)"; e.target.style.transform = "translateY(-1px)"; }}
        onMouseLeave={(e) => { e.target.style.boxShadow = "none"; e.target.style.transform = "none"; }}
      >
        Get Started
      </button>
    </nav>
  );
}

// ---- Hero section ----
function HeroSection({ onGetStarted }) {
  return (
    <section style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "120px 40px 80px", textAlign: "center", position: "relative",
    }}>
      <div style={{ animation: "heroFloat 6s ease-in-out infinite" }}>
        <BhagyakramLogo scale={0.9} animate tagline />
      </div>

      <p style={{
        maxWidth: 560, margin: "30px auto 0", fontSize: 17, lineHeight: 1.7,
        color: "var(--ivory-dim)",
        animation: "fadeUp 0.9s var(--ease) 1.6s both",
      }}>
        A conversational AI astrology companion that computes real natal charts using 
        Swiss Ephemeris data, reasons through a multi-agent LangGraph pipeline, and 
        responds with warmth and depth.
      </p>

      <div style={{
        display: "flex", gap: 16, marginTop: 36,
        animation: "fadeUp 0.9s var(--ease) 1.9s both",
        flexWrap: "wrap", justifyContent: "center",
      }}>
        <button
          onClick={onGetStarted}
          style={{
            background: "linear-gradient(105deg, #b08f38 0%, #E4C766 38%, #C9A84C 60%, #b08f38 100%)",
            backgroundSize: "200% 100%",
            border: "none", borderRadius: 13, padding: "15px 32px",
            color: "#1a1408", fontFamily: "var(--sans)", fontWeight: 600, fontSize: 15,
            cursor: "pointer", transition: "box-shadow 0.3s var(--ease)",
          }}
          onMouseEnter={(e) => { e.target.style.boxShadow = "0 12px 40px rgba(201,168,76,0.35)"; e.target.style.animation = "btnShimmer 1.1s linear infinite"; }}
          onMouseLeave={(e) => { e.target.style.boxShadow = "none"; e.target.style.animation = "none"; }}
        >
          Start Your Reading ✦
        </button>
        <button
          onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
          style={{
            background: "rgba(244,239,230,0.06)", border: "1px solid var(--hairline-2)",
            borderRadius: 13, padding: "15px 28px",
            color: "var(--ivory-dim)", fontFamily: "var(--sans)", fontWeight: 500, fontSize: 15,
            cursor: "pointer", transition: "all 0.3s var(--ease)",
          }}
          onMouseEnter={(e) => { e.target.style.borderColor = "rgba(201,168,76,0.4)"; e.target.style.color = "var(--ivory)"; }}
          onMouseLeave={(e) => { e.target.style.borderColor = "var(--hairline-2)"; e.target.style.color = "var(--ivory-dim)"; }}
        >
          Explore Features
        </button>
      </div>

      {/* Stats bar */}
      <div style={{
        display: "flex", gap: 50, marginTop: 60, flexWrap: "wrap", justifyContent: "center",
        animation: "fadeUp 0.9s var(--ease) 2.2s both",
      }}>
        {[
          { value: 30, suffix: "/30", label: "Eval Score" },
          { value: 7, suffix: "", label: "Agent Nodes" },
          { value: 0, suffix: "", label: "Cost ($0.00)", noAnimate: true },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 28, fontWeight: 700, color: "var(--gold)",
            }}>
              {s.noAnimate ? "$0.00" : <AnimatedCount target={s.value} suffix={s.suffix} />}
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ivory-faint)", letterSpacing: "0.1em", marginTop: 4, textTransform: "uppercase" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)",
        animation: "fadeUp 0.9s var(--ease) 2.5s both",
      }}>
        <svg width="20" height="30" viewBox="0 0 20 30" fill="none" style={{ animation: "heroFloat 2s ease-in-out infinite" }}>
          <rect x="1" y="1" width="18" height="28" rx="9" stroke="var(--ivory-faint)" strokeWidth="1.5" />
          <circle cx="10" cy="10" r="2.5" fill="var(--gold)" style={{ animation: "heroFloat 1.5s ease-in-out infinite" }} />
        </svg>
      </div>
    </section>
  );
}

// ---- Features section ----
function FeaturesSection() {
  const features = [
    {
      icon: "🪐",
      title: "Real Natal Chart Computation",
      desc: "Planetary positions calculated via pyswisseph (Swiss Ephemeris) — no approximation, no guessing. Accurate from 1800 to 2400 CE.",
    },
    {
      icon: "🤖",
      title: "LangGraph Multi-Agent Pipeline",
      desc: "A 7-node directed graph: router → sensitivity gate → reasoning → tools → cache → safety → editor. Each node has a clear, testable purpose.",
    },
    {
      icon: "📚",
      title: "RAG Knowledge Base",
      desc: "7 curated markdown files indexed into ChromaDB with sentence-transformers embeddings. The agent grounds every interpretation in astrological tradition.",
    },
    {
      icon: "⚡",
      title: "Streaming SSE Responses",
      desc: "Tokens arrive in real-time via Server-Sent Events. A live activity chip shows which tool is running. The UI feels alive, not loading.",
    },
    {
      icon: "🛡️",
      title: "Human-in-the-Loop Safety",
      desc: "LangGraph interrupt() pauses execution for sensitive topics. A confirmation dialog lets you choose how the reading proceeds — you stay in control.",
    },
    {
      icon: "💾",
      title: "Session Persistence",
      desc: "Charts and conversations persist in SQLite. Return in a new tab — your chart is cached, your history is restored, nothing recomputes.",
    },
    {
      icon: "✏️",
      title: "Second Editor Agent",
      desc: "A post-safety LLM pass reviews tone without altering facts. Chart data stays untouched; only phrasing softens. Transparent and honest.",
    },
    {
      icon: "🔒",
      title: "Prompt Injection Handling",
      desc: "When the model's safety layer fires a flat refusal, the safety node replaces it with an in-character response that stays warm and offers a real reading.",
    },
  ];

  return (
    <section id="features" className="home-section">
      <Reveal>
        <div className="section-title">Powerful Features</div>
        <p className="section-subtitle">
          Every feature is built for real utility, not just demonstration. From chart computation 
          to agent safety — each layer is production-grade.
        </p>
      </Reveal>
      <div className="feature-grid">
        {features.map((f, i) => (
          <Reveal key={i} delay={i * 80}>
            <div className="feature-card">
              <div className="feature-card-icon">{f.icon}</div>
              <div className="feature-card-title">{f.title}</div>
              <div className="feature-card-desc">{f.desc}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ---- Tech stack section ----
function TechSection() {
  const techs = [
    { icon: "🔗", name: "LangGraph", role: "Agent Orchestration" },
    { icon: "🦜", name: "LangChain", role: "LLM Framework" },
    { icon: "📖", name: "RAG Pipeline", role: "Knowledge Retrieval" },
    { icon: "✨", name: "Google Gemini", role: "Language Model" },
    { icon: "⚡", name: "FastAPI", role: "Backend + SSE" },
    { icon: "🗄️", name: "ChromaDB", role: "Vector Store" },
    { icon: "🔭", name: "Swiss Ephemeris", role: "Chart Computation" },
    { icon: "🧠", name: "sentence-transformers", role: "Embeddings" },
    { icon: "📦", name: "SQLite", role: "Session Store" },
    { icon: "🌐", name: "React", role: "Frontend UI" },
    { icon: "🔐", name: "Neon DB", role: "Auth & Storage" },
    { icon: "🗺️", name: "Nominatim", role: "Geocoding" },
  ];

  return (
    <section className="home-section">
      <Reveal>
        <div className="section-title">Technology Stack</div>
        <p className="section-subtitle">
          Built entirely on free, open-source tools. The only paid component is a free-tier 
          Google Gemini API key — no credit card required.
        </p>
      </Reveal>
      <div className="tech-grid">
        {techs.map((t, i) => (
          <Reveal key={i} delay={i * 50}>
            <div className="tech-card">
              <div style={{ fontSize: 28 }}>{t.icon}</div>
              <div className="tech-card-name">{t.name}</div>
              <div className="tech-card-role">{t.role}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ---- Architecture section ----
function ArchitectureSection() {
  return (
    <section className="home-section">
      <Reveal>
        <div className="section-title">Agent Architecture</div>
        <p className="section-subtitle">
          A LangGraph stateful agent with 7 specialized nodes, each with a clear responsibility. 
          The graph loops through reasoning and tool calls until it has what it needs.
        </p>
      </Reveal>
      <Reveal delay={200}>
        <div style={{
          background: "rgba(15,21,37,0.7)", backdropFilter: "blur(14px)",
          border: "1px solid var(--hairline-2)", borderRadius: 18,
          padding: "36px 32px", maxWidth: 800, margin: "0 auto",
          fontFamily: "var(--mono)", fontSize: 13, lineHeight: 2.2,
          color: "var(--ivory-dim)", whiteSpace: "pre-wrap", overflowX: "auto",
        }}>
{`START → router → sensitivity_gate → reasoning ──→ tools → cache_chart → reasoning (loop)
                                   ↘ safety → editor → END

┌─ router ────────────── classifies intent: chart / horoscope / freeform / off-topic
├─ sensitivity_gate ──── HITL interrupt on sensitive topics (death timing)
├─ reasoning ─────────── LLM decides which tools to call next
├─ tools ─────────────── geocode, birth chart, transits, knowledge lookup
├─ cache_chart ───────── saves computed chart to session state
├─ safety ────────────── catches overly certain medical/legal/financial language
└─ editor ────────────── second LLM pass to soften tone without changing facts`}
        </div>
      </Reveal>
    </section>
  );
}

// ---- Privacy section ----
function PrivacySection() {
  const items = [
    {
      icon: "🔐",
      title: "Local-First Storage",
      desc: "All session data lives in SQLite on the server. No external databases, no cloud analytics. Your birth details never leave the deployment.",
    },
    {
      icon: "🚫",
      title: "No Tracking",
      desc: "Zero analytics scripts, no cookies beyond session ID, no third-party trackers. The app doesn't even know your name unless you tell it.",
    },
    {
      icon: "🛡️",
      title: "Safety Guardrails",
      desc: "Multi-layer content safety: router classification, sensitivity gate with human-in-the-loop, safety node for medical/legal/financial topics, prompt injection handling.",
    },
    {
      icon: "⏳",
      title: "Session-Scoped Data",
      desc: "Your data exists only within your session. There's no user profiling, no cross-session linking, no recommendation engine mining your chart.",
    },
  ];

  return (
    <section className="home-section">
      <Reveal>
        <div className="section-title">Data Privacy</div>
        <p className="section-subtitle">
          Your cosmic data stays yours. Bhagyakram is designed with privacy as a first-class concern, not an afterthought.
        </p>
      </Reveal>
      <div className="privacy-grid">
        {items.map((item, i) => (
          <Reveal key={i} delay={i * 100}>
            <div className="privacy-card">
              <div className="privacy-icon">{item.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ivory)", marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ivory-dim)" }}>{item.desc}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ---- Founder section ----
function FounderSection() {
  return (
    <section className="home-section">
      <Reveal>
        <div className="section-title">Meet the Founder</div>
        <p className="section-subtitle">
          The mind behind Bhagyakram AI
        </p>
      </Reveal>
      <Reveal delay={200}>
        <div className="founder-section">
          <div className="founder-avatar">
            <LogoMark size={120} glow />
          </div>
          <div className="founder-info">
            <h3>Kritanta Sasan Roy</h3>
            <div className="founder-role">Founder & Developer — Bhagyakram AI</div>
            <p className="founder-bio">
              An AI/ML engineer with deep expertise in building production-grade LLM applications. 
              Experienced in architecting multi-agent systems using <strong style={{color:"var(--ivory)"}}>LangGraph</strong> and <strong style={{color:"var(--ivory)"}}>LangChain</strong>, 
              designing <strong style={{color:"var(--ivory)"}}>RAG pipelines</strong> for knowledge-grounded reasoning, 
              and fine-tuning large language models for domain-specific tasks.
            </p>
            <p className="founder-bio" style={{ marginTop: 0 }}>
              Bhagyakram represents the convergence of ancient astrological wisdom with modern AI engineering — 
              real planetary computation, agentic reasoning, and thoughtful human-in-the-loop design, 
              all running on a zero-cost open-source stack.
            </p>

            <div className="founder-skills">
              {[
                "LangGraph", "LangChain", "RAG Systems", "LLM Engineering",
                "Multi-Agent AI", "Python", "FastAPI", "Vector Databases",
                "Prompt Engineering", "AI Safety", "React",
              ].map((s) => (
                <span key={s} className="skill-tag">{s}</span>
              ))}
            </div>

            <div style={{ marginTop: 20 }}>
              <a
                href="https://www.linkedin.com/in/kritantasasanroy/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  color: "var(--gold)", fontSize: 14, fontFamily: "var(--sans)",
                  textDecoration: "none",
                  transition: "color 0.2s var(--ease)",
                }}
                onMouseEnter={(e) => e.target.style.color = "var(--ivory)"}
                onMouseLeave={(e) => e.target.style.color = "var(--gold)"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Connect on LinkedIn
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ---- Footer ----
function HomeFooter() {
  return (
    <footer className="home-footer">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
        <LogoMark size={22} glow />
        <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 18, color: "var(--gold)" }}>Bhagyakram</span>
      </div>
      <p style={{ margin: "0 0 6px" }}>
        Built with ✦ by <a href="https://www.linkedin.com/in/kritantasasanroy/" target="_blank" rel="noopener noreferrer">Kritanta Sasan Roy</a>
      </p>
      <p style={{ margin: 0, fontSize: 12, color: "rgba(244,239,230,0.25)" }}>
        Powered by LangGraph · LangChain · Google Gemini · Swiss Ephemeris
      </p>
    </footer>
  );
}

// ---- Main Home Page ----
function HomePage({ onGetStarted }) {
  return (
    <div style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden" }}>
      <CosmicBackground />
      <div className="bhagyakram-home" style={{ position: "relative", zIndex: 1 }}>
        <HomeNav onGetStarted={onGetStarted} />
        <HeroSection onGetStarted={onGetStarted} />
        <FeaturesSection />
        <ArchitectureSection />
        <TechSection />
        <PrivacySection />
        <FounderSection />
        <HomeFooter />
      </div>
    </div>
  );
}

Object.assign(window, { HomePage });
