import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Background } from "../components/Background";
import { Logo } from "../components/Logo";
import { theme } from "../theme";

const PLANS = [
  { name: "Gratuito", price: "R$ 0", features: ["5 categorias", "70 buscas/mês", "100 leads"], accent: theme.textDim },
  { name: "Pro", price: "R$ 89", features: ["40 categorias", "1.500 buscas", "5.000 leads", "Busca por bairro"], accent: theme.violetGlow, highlight: true },
  { name: "Business", price: "R$ 249", features: ["Todas as categorias", "Ilimitado", "Suporte prioritário"], accent: theme.cyan },
];

const BENEFITS = [
  { icon: "🎯", text: "Busca precisa via Google Places" },
  { icon: "🤖", text: "Sites gerados por IA em segundos" },
  { icon: "📱", text: "Fotos reais do Instagram" },
  { icon: "🚀", text: "Publicação em 1 clique" },
];

export const Scene5Close = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ padding: 90 }}>
        {/* Benefits row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
          {BENEFITS.map((b, i) => {
            const s = spring({ frame: frame - 5 - i * 5, fps, config: { damping: 20 } });
            return (
              <div key={b.text} style={{
                flex: 1,
                background: `${theme.surface}dd`,
                border: `1px solid ${theme.border}`,
                borderRadius: 16,
                padding: 20,
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: s,
                transform: `translateY(${(1 - s) * 20}px)`,
              }}>
                <div style={{ fontSize: 28 }}>{b.icon}</div>
                <div style={{ fontFamily: "Inter", fontSize: 18, color: theme.text, fontWeight: 500 }}>{b.text}</div>
              </div>
            );
          })}
        </div>

        {/* Plans */}
        <div style={{ opacity: titleIn, transform: `translateY(${(1 - titleIn) * 20}px)`, marginBottom: 24 }}>
          <div style={{ fontFamily: "SpaceGrotesk", fontSize: 62, fontWeight: 700, color: theme.text, letterSpacing: -2, textAlign: "center" }}>
            Escolha seu plano e <span style={{ color: theme.cyan }}>comece hoje</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, flex: 1, alignItems: "stretch" }}>
          {PLANS.map((p, i) => {
            const s = spring({ frame: frame - 30 - i * 8, fps, config: { damping: 18 } });
            const isHighlight = !!p.highlight;
            return (
              <div key={p.name} style={{
                flex: 1,
                background: isHighlight ? `linear-gradient(180deg, ${theme.violet}33, ${theme.surface}dd)` : `${theme.surface}dd`,
                border: `1px solid ${isHighlight ? theme.violet : theme.border}`,
                borderRadius: 24,
                padding: 32,
                opacity: s,
                transform: `translateY(${(1 - s) * 30}px) scale(${isHighlight ? 1.03 : 1})`,
                boxShadow: isHighlight ? `0 30px 80px ${theme.violet}55` : "none",
                display: "flex",
                flexDirection: "column",
              }}>
                {isHighlight && (
                  <div style={{
                    alignSelf: "flex-start",
                    padding: "4px 12px",
                    borderRadius: 999,
                    background: theme.cyan,
                    color: theme.bg,
                    fontFamily: "Inter",
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 12,
                  }}>MAIS POPULAR</div>
                )}
                <div style={{ fontFamily: "SpaceGrotesk", fontSize: 32, fontWeight: 700, color: p.accent }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
                  <div style={{ fontFamily: "SpaceGrotesk", fontSize: 56, fontWeight: 700, color: theme.text }}>{p.price}</div>
                  <div style={{ fontFamily: "Inter", fontSize: 20, color: theme.textMuted }}>/mês</div>
                </div>
                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                  {p.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "Inter", fontSize: 20, color: theme.textDim }}>
                      <div style={{ color: theme.success }}>✓</div>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer logo */}
        <div style={{
          marginTop: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: interpolate(frame, [90, 120], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <Logo size={48} />
          <div style={{ fontFamily: "Inter", fontSize: 22, color: theme.textDim }}>
            lumeleads.app · comece grátis
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
