import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Background } from "../components/Background";
import { theme } from "../theme";

const COLUMNS = [
  { title: "Novo", color: theme.cyan, cards: ["Trattoria Nonna", "Sushi Yamato", "Bella Pizza"] },
  { title: "Em contato", color: theme.violetGlow, cards: ["Cantina do Chef", "Bar do Zé"] },
  { title: "Reunião", color: theme.warn, cards: ["Padaria Central"] },
  { title: "Fechado", color: theme.success, cards: ["Café Aurora", "Bistrô Lyon"] },
];

export const Scene3Crm = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stepIn = spring({ frame, fps, config: { damping: 20 } });

  // moving card animation (drag from col 0 to col 1)
  const dragProgress = interpolate(frame, [70, 105], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dragX = dragProgress * 340;
  const dragScale = 1 + Math.sin(dragProgress * Math.PI) * 0.05;
  const dragElevation = Math.sin(dragProgress * Math.PI) * 20;

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ padding: 100 }}>
        <div style={{ opacity: stepIn, transform: `translateY(${(1 - stepIn) * 20}px)`, marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontFamily: "SpaceGrotesk", fontSize: 26, fontWeight: 700, color: theme.violetGlow, letterSpacing: 4 }}>
              02 — CRM + AGENDA
            </div>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${theme.violet}, transparent)` }} />
          </div>
          <div style={{ fontFamily: "SpaceGrotesk", fontSize: 78, fontWeight: 700, color: theme.text, letterSpacing: -2, marginTop: 12, lineHeight: 1.05 }}>
            Kanban visual + <span style={{ color: theme.cyan }}>agendamentos</span>
          </div>
          <div style={{ fontFamily: "Inter", fontSize: 26, color: theme.textDim, marginTop: 12 }}>
            Arraste, agende reuniões e feche negócios sem sair da tela.
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, flex: 1 }}>
          {COLUMNS.map((col, ci) => {
            const colIn = spring({ frame: frame - 15 - ci * 6, fps, config: { damping: 22 } });
            return (
              <div
                key={col.title}
                style={{
                  flex: 1,
                  background: `${theme.surface}dd`,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 20,
                  padding: 20,
                  opacity: colIn,
                  transform: `translateY(${(1 - colIn) * 30}px)`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 999, background: col.color, boxShadow: `0 0 10px ${col.color}` }} />
                  <div style={{ fontFamily: "Inter", fontSize: 22, fontWeight: 600, color: theme.text }}>{col.title}</div>
                  <div style={{ marginLeft: "auto", fontFamily: "Inter", fontSize: 16, color: theme.textMuted, padding: "2px 10px", borderRadius: 999, background: theme.surface2 }}>{col.cards.length}</div>
                </div>
                {col.cards.map((card, i) => {
                  const cardIn = spring({ frame: frame - 30 - ci * 6 - i * 4, fps, config: { damping: 20 } });
                  const isDrag = ci === 0 && i === 0;
                  return (
                    <div
                      key={card}
                      style={{
                        background: theme.surface2,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 10,
                        opacity: cardIn,
                        transform: isDrag
                          ? `translateX(${dragX}px) scale(${dragScale}) translateY(${-dragElevation}px)`
                          : `translateY(${(1 - cardIn) * 20}px)`,
                        boxShadow: isDrag ? `0 ${20 + dragElevation}px 40px ${theme.violet}55` : "none",
                        border: isDrag ? `1px solid ${theme.violet}` : "1px solid transparent",
                        zIndex: isDrag ? 10 : 1,
                        position: "relative",
                      }}
                    >
                      <div style={{ fontFamily: "Inter", fontSize: 20, color: theme.text, fontWeight: 500 }}>{card}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <div style={{ fontSize: 14, color: theme.textMuted, fontFamily: "Inter" }}>📞</div>
                        <div style={{ fontSize: 14, color: theme.textMuted, fontFamily: "Inter" }}>📅</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
