/* global React */

// Bhagyakram logo — uses the logo.png image instead of SVG lotus
// The image-based mark supports sizing, spinning (thinking), and glow effects.

function LogoMark({ size = 24, spin = false, glow = false }) {
  return (
    <img
      src="logo.png"
      alt="Bhagyakram"
      width={size}
      height={size}
      style={{
        display: "block",
        borderRadius: "50%",
        objectFit: "cover",
        animation: spin
          ? "lotusThink 6s linear infinite"
          : "none",
        filter: glow ? "drop-shadow(0 0 8px rgba(201,168,76,0.5))" : "none",
        transformOrigin: "50% 50%",
      }}
    />
  );
}

// Full lockup: orbit ring + logo.png + shimmer wordmark
function BhagyakramLogo({ scale = 1, withText = true, animate = true, tagline = false }) {
  const D = 132 * scale;
  const fontSize = 34 * scale;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 * scale }}>
      <div style={{
        position: "relative", width: D, height: D,
        animation: animate ? "fadeUp 0.9s var(--ease) both" : "none",
      }}>
        {/* Orbit ring — thin circle that slowly rotates, carrying a gold planet */}
        <svg
          width={D} height={D} viewBox="0 0 100 100"
          style={{
            position: "absolute", inset: 0,
            animation: animate
              ? "orbitSpin 26s linear infinite, fadeUp 1s var(--ease) 0.5s both"
              : "orbitSpin 26s linear infinite",
            transformOrigin: "50% 50%",
          }}
        >
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(201,168,76,0.35)" strokeWidth="0.6" />
          <circle cx="50" cy="4" r="1.9" fill="var(--gold)" />
          <circle cx="50" cy="4" r="3.4" fill="none" stroke="rgba(201,168,76,0.25)" strokeWidth="0.5" />
        </svg>

        {/* Soft halo behind logo */}
        <div style={{
          position: "absolute", inset: "16%",
          background: "radial-gradient(circle, rgba(201,168,76,0.16), transparent 68%)",
          borderRadius: "50%",
        }} />

        {/* Logo image */}
        <div style={{
          position: "absolute", inset: "16%",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <img
            src="logo.png"
            alt="Bhagyakram"
            style={{
              width: D * 0.66, height: D * 0.66,
              borderRadius: "50%",
              objectFit: "cover",
              animation: animate ? "bloomIn 1.4s var(--ease) 0.05s both" : "none",
              filter: "drop-shadow(0 0 12px rgba(201,168,76,0.35))",
            }}
          />
        </div>
      </div>

      {withText && (
        <div style={{
          textAlign: "center",
          animation: animate ? "fadeUp 0.9s var(--ease) 0.95s both" : "none",
        }}>
          <div style={{
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize,
            lineHeight: 1,
            letterSpacing: `${0.22 * scale}em`,
            paddingLeft: `${0.22 * scale}em`,
            background: "linear-gradient(105deg, #9c8336 0%, #f3e2a6 28%, #C9A84C 52%, #9c8336 100%)",
            backgroundSize: "240% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: animate ? "shimmerSweep 1.6s var(--ease) 1.1s 1 both" : "none",
            backgroundPosition: animate ? undefined : "0 0",
          }}>
            Bhagyakram
          </div>
          {tagline && (
            <div style={{
              marginTop: 10 * scale,
              fontFamily: "var(--mono)",
              fontSize: 10.5 * scale,
              letterSpacing: "0.42em",
              paddingLeft: "0.42em",
              textTransform: "uppercase",
              color: "var(--ivory-faint)",
            }}>
              AI Astrology Companion
            </div>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { LogoMark, BhagyakramLogo });
