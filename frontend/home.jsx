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

// ---- Premium Icons ----
function PremiumIcon({ name, size = 24 }) {
  const paths = {
    compass: <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></>,
    network: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
    book: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    database: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>,
    pen: <><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-1.5L2 22v3h3L18 13z"/><path d="M2 22l3 3"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    bot: <><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></>,
    spark: <><path d="M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6L12 2z"/></>,
    code: <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>,
    layer: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    server: <><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></>,
    map: <><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></>,
    brain: <><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></>,
    eye_off: <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--gold)" }}>
      {paths[name] || paths.spark}
    </svg>
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
      icon: "compass",
      title: "Real Natal Chart Computation",
      desc: "Planetary positions calculated via pyswisseph (Swiss Ephemeris): no approximation, no guessing. Accurate from 1800 to 2400 CE.",
    },
    {
      icon: "network",
      title: "LangGraph Multi-Agent Pipeline",
      desc: "A 7-node directed graph: router → sensitivity gate → reasoning → tools → cache → safety → editor. Each node has a clear, testable purpose.",
    },
    {
      icon: "book",
      title: "RAG Knowledge Base",
      desc: "7 curated markdown files indexed into ChromaDB with sentence-transformers embeddings. The agent grounds every interpretation in astrological tradition.",
    },
    {
      icon: "zap",
      title: "Streaming SSE Responses",
      desc: "Tokens arrive in real-time via Server-Sent Events. A live activity chip shows which tool is running. The UI feels alive, not loading.",
    },
    {
      icon: "shield",
      title: "Human-in-the-Loop Safety",
      desc: "LangGraph interrupt() pauses execution for sensitive topics. A confirmation dialog lets you choose how the reading proceeds, ensuring you stay in control.",
    },
    {
      icon: "database",
      title: "Session Persistence",
      desc: "Charts and conversations persist in SQLite. Return in a new tab and your chart is cached, your history is restored, and nothing recomputes.",
    },
    {
      icon: "pen",
      title: "Second Editor Agent",
      desc: "A post-safety LLM pass reviews tone without altering facts. Chart data stays untouched; only phrasing softens. Transparent and honest.",
    },
    {
      icon: "lock",
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
              <div className="feature-card-icon"><PremiumIcon name={f.icon} size={24} /></div>
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
    { icon: "network", name: "LangGraph", role: "Agent Orchestration" },
    { icon: "code", name: "LangChain", role: "LLM Framework" },
    { icon: "book", name: "RAG Pipeline", role: "Knowledge Retrieval" },
    { icon: "spark", name: "Google Gemini", role: "Language Model" },
    { icon: "server", name: "FastAPI", role: "Backend + SSE" },
    { icon: "layer", name: "ChromaDB", role: "Vector Store" },
    { icon: "compass", name: "Swiss Ephemeris", role: "Chart Computation" },
    { icon: "brain", name: "sentence-transformers", role: "Embeddings" },
    { icon: "database", name: "SQLite", role: "Session Store" },
    { icon: "globe", name: "React", role: "Frontend UI" },
    { icon: "lock", name: "Neon DB", role: "Auth & Storage" },
    { icon: "map", name: "Nominatim", role: "Geocoding" },
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
              <div style={{ display: "flex", justifyContent: "center" }}><PremiumIcon name={t.icon} size={28} /></div>
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
      icon: "lock",
      title: "Local-First Storage",
      desc: "All session data lives in SQLite on the server. No external databases, no cloud analytics. Your birth details never leave the deployment.",
    },
    {
      icon: "eye_off",
      title: "No Tracking",
      desc: "Zero analytics scripts, no cookies beyond session ID, no third-party trackers. The app doesn't even know your name unless you tell it.",
    },
    {
      icon: "shield",
      title: "Safety Guardrails",
      desc: "Multi-layer content safety: router classification, sensitivity gate with human-in-the-loop, safety node for medical/legal/financial topics, prompt injection handling.",
    },
    {
      icon: "clock",
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
              <div className="privacy-icon"><PremiumIcon name={item.icon} size={24} /></div>
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
            <div className="founder-role">Founder & Developer | Bhagyakram AI</div>
            <p className="founder-bio">
              An AI/ML engineer with deep expertise in building production-grade LLM applications. 
              Experienced in architecting multi-agent systems using <strong style={{color:"var(--ivory)"}}>LangGraph</strong> and <strong style={{color:"var(--ivory)"}}>LangChain</strong>, 
              designing <strong style={{color:"var(--ivory)"}}>RAG pipelines</strong> for knowledge-grounded reasoning, 
              and fine-tuning large language models for domain-specific tasks.
            </p>
            <p className="founder-bio" style={{ marginTop: 0 }}>
              Bhagyakram represents the convergence of ancient astrological wisdom with modern AI engineering: 
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
    <footer className="home-footer" style={{ paddingBottom: 60 }}>
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
      
      <div style={{
        marginTop: 40,
        paddingTop: 30,
        borderTop: "1px solid rgba(244,239,230,0.06)",
        textAlign: "center"
      }}>
        <p style={{ 
          margin: "0 auto", 
          fontSize: 11, 
          color: "rgba(244, 239, 230, 0.4)", 
          maxWidth: 680, 
          lineHeight: 1.6, 
          fontStyle: "italic" 
        }}>
          <strong>AI Disclaimer:</strong> Bhagyakram is an AI-powered conversational agent. While it relies on real astronomical data, ephemeris libraries, and curated astrological texts, its interpretations are generated by AI. It cannot be fully trusted for absolute accuracy, and should not replace professional medical, legal, or financial advice. Astrology offers reflection, not fate.
        </p>
      </div>
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
