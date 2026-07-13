import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Background } from "../components/Background";
import { theme } from "../theme";

const STEPS = ["Lead", "Cores", "Fotos", "Redes", "Gerar"];
const PALETTE = ["#e11d48", "#f59e0b", "#f5f5f4", "#1c1917"];
const PHOTOS = [
  "linear-gradient(135deg, #f97316, #db2777)",
  "linear-gradient(135deg, #06b6d4, #6366f1)",
  "linear-gradient(135deg, #10b981, #84cc16)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #8b5cf6, #ec4899)",
  "linear-gradient(135deg, #14b8a6, #22d3ee)",
];

export const Scene4Sites = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stepIn = spring({ frame, fps, config: { damping: 20 } });
  const activeStep = Math.min(4, Math.floor(interpolate(frame, [20, 110], [0, 5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));

  // Preview reveal
  const previewIn = spring({ frame: frame - 100, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ padding: 100 }}>
        <div style={{ opacity: stepIn, transform: `translateY(${(1 - stepIn) * 20}px)`, marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontFamily: "SpaceGrotesk", fontSize: 26, fontWeight: 700, color: theme.violetGlow, letterSpacing: 4 }}>
              03 — CRIAR SITE COM IA
            </div>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${theme.violet}, transparent)` }} />
          </div>
          <div style={{ fontFamily: "SpaceGrotesk", fontSize: 78, fontWeight: 700, color: theme.text, letterSpacing: -2, marginTop: 12, lineHeight: 1.05 }}>
            Do lead ao site publicado em <span style={{ color: theme.cyan }}>1 clique</span>
          </div>
        </div>

        {/* Stepper */}
        <div style={{ display: "flex", gap: 14, marginBottom: 32 }}>
          {STEPS.map((s, i) => {
            const stepShown = spring({ frame: frame - 18 - i * 5, fps, config: { damping: 20 } });
            const done = i < activeStep;
            const active = i === activeStep;
            return (
              <div key={s} style={{ flex: 1, opacity: stepShown }}>
                <div style={{
                  height: 6, borderRadius: 999,
                  background: done ? theme.cyan : active ? `linear-gradient(90deg, ${theme.violet}, ${theme.surface2})` : theme.surface2,
                  marginBottom: 10,
                  boxShadow: done ? `0 0 12px ${theme.cyan}88` : "none",
                }} />
                <div style={{ fontFamily: "Inter", fontSize: 20, color: done || active ? theme.text : theme.textMuted, fontWeight: 500 }}>
                  {i + 1}. {s}
                </div>
              </div>
            );
          })}
        </div>

        {/* Two panels: wizard config left, site preview right */}
        <div style={{ display: "flex", gap: 30, flex: 1 }}>
          {/* Config side */}
          <div style={{
            flex: 0.9,
            background: `${theme.surface}dd`,
            border: `1px solid ${theme.border}`,
            borderRadius: 20,
            padding: 28,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}>
            {/* Palette */}
            <div>
              <div style={{ fontFamily: "Inter", fontSize: 18, color: theme.textMuted, marginBottom: 10 }}>Paleta sugerida pela IA</div>
              <div style={{ display: "flex", gap: 10 }}>
                {PALETTE.map((c, i) => {
                  const s = spring({ frame: frame - 30 - i * 4, fps, config: { damping: 15 } });
                  return <div key={c} style={{ width: 70, height: 70, borderRadius: 14, background: c, transform: `scale(${s})`, border: "2px solid rgba(255,255,255,0.1)" }} />;
                })}
              </div>
            </div>
            {/* Photos */}
            <div>
              <div style={{ fontFamily: "Inter", fontSize: 18, color: theme.textMuted, marginBottom: 10 }}>Fotos do Instagram + Google</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {PHOTOS.map((p, i) => {
                  const s = spring({ frame: frame - 55 - i * 3, fps, config: { damping: 15 } });
                  return <div key={i} style={{ height: 90, borderRadius: 10, background: p, transform: `scale(${s})`, opacity: s }} />;
                })}
              </div>
            </div>
            {/* Generate button */}
            <div style={{
              marginTop: "auto",
              padding: "20px 28px",
              borderRadius: 14,
              background: `linear-gradient(135deg, ${theme.violet}, ${theme.cyan})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              boxShadow: `0 20px 60px ${theme.violet}66`,
              transform: `scale(${spring({ frame: frame - 88, fps, config: { damping: 12 } })})`,
            }}>
              <div style={{ fontSize: 24 }}>✨</div>
              <div style={{ fontFamily: "Inter", fontSize: 24, color: "#fff", fontWeight: 700 }}>Gerar site com IA</div>
            </div>
          </div>

          {/* Preview site */}
          <div style={{
            flex: 1.1,
            opacity: previewIn,
            transform: `translateX(${(1 - previewIn) * 40}px) scale(${0.95 + previewIn * 0.05})`,
            borderRadius: 20,
            overflow: "hidden",
            border: `1px solid ${theme.border}`,
            background: "#fdf6f0",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* browser bar */}
            <div style={{ background: "#f3e9db", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: "#ef4444" }} />
              <div style={{ width: 10, height: 10, borderRadius: 999, background: "#f59e0b" }} />
              <div style={{ width: 10, height: 10, borderRadius: 999, background: "#10b981" }} />
              <div style={{ marginLeft: 16, background: "#fff", padding: "4px 14px", borderRadius: 8, fontFamily: "Inter", fontSize: 14, color: "#78716c" }}>
                lumeleads.app/s/trattoria-nonna
              </div>
            </div>
            {/* hero */}
            <div style={{
              flex: 1,
              background: `linear-gradient(135deg, #e11d48 0%, #f59e0b 100%)`,
              padding: 40,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              position: "relative",
            }}>
              <div style={{ fontFamily: "SpaceGrotesk", fontSize: 64, fontWeight: 700, color: "#fdf6f0", letterSpacing: -2, lineHeight: 1 }}>
                Trattoria<br />Nonna
              </div>
              <div style={{ fontFamily: "Inter", fontSize: 22, color: "#fdf6f0dd", marginTop: 16, maxWidth: 400 }}>
                Massa fresca, forno a lenha e receitas da nonna desde 1978.
              </div>
              <div style={{
                marginTop: 24,
                display: "inline-flex",
                alignSelf: "flex-start",
                padding: "12px 22px",
                borderRadius: 999,
                background: "#1c1917",
                color: "#fdf6f0",
                fontFamily: "Inter",
                fontSize: 18,
                fontWeight: 600,
              }}>
                Reservar mesa →
              </div>
            </div>
            <div style={{ background: "#1c1917", padding: "12px 20px", display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "Inter", fontSize: 14, color: "#fdf6f088" }}>📍 R. Oscar Freire, 800</div>
              <div style={{ fontFamily: "Inter", fontSize: 14, color: "#fdf6f088" }}>@trattorianonna</div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
