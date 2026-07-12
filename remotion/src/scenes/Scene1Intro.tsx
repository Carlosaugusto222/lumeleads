import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Background } from "../components/Background";
import { Logo } from "../components/Logo";
import { theme } from "../theme";

export const Scene1Intro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = spring({ frame, fps, config: { damping: 18, stiffness: 140 } });
  const titleIn = spring({ frame: frame - 12, fps, config: { damping: 20, stiffness: 120 } });
  const subIn = interpolate(frame, [28, 46], [0, 1], { extrapolateRight: "clamp" });
  const subY = interpolate(frame, [28, 46], [20, 0], { extrapolateRight: "clamp" });
  const badgeIn = spring({ frame: frame - 40, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 120 }}>
        <div style={{ transform: `scale(${logoIn}) translateY(${(1 - logoIn) * 30}px)`, opacity: logoIn, marginBottom: 60 }}>
          <Logo size={90} />
        </div>

        <div
          style={{
            fontFamily: "SpaceGrotesk",
            fontWeight: 700,
            fontSize: 128,
            lineHeight: 1.02,
            letterSpacing: -3,
            color: theme.text,
            textAlign: "center",
            transform: `translateY(${(1 - titleIn) * 40}px)`,
            opacity: titleIn,
            maxWidth: 1500,
          }}
        >
          Leads que viram{" "}
          <span
            style={{
              backgroundImage: `linear-gradient(135deg, ${theme.violetGlow}, ${theme.cyan})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            clientes
          </span>
        </div>

        <div
          style={{
            marginTop: 30,
            fontFamily: "Inter",
            fontSize: 34,
            color: theme.textDim,
            textAlign: "center",
            opacity: subIn,
            transform: `translateY(${subY}px)`,
            maxWidth: 1200,
          }}
        >
          Encontre. Organize. Converta — tudo em um só lugar.
        </div>

        <div
          style={{
            marginTop: 50,
            transform: `scale(${badgeIn})`,
            opacity: badgeIn,
            display: "flex",
            gap: 14,
            alignItems: "center",
            padding: "12px 24px",
            borderRadius: 999,
            border: `1px solid ${theme.border}`,
            background: `${theme.surface}cc`,
            backdropFilter: "none",
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: 999, background: theme.success, boxShadow: `0 0 12px ${theme.success}` }} />
          <div style={{ fontFamily: "Inter", fontSize: 22, color: theme.text, fontWeight: 500 }}>
            Tutorial • O básico em 20 segundos
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
