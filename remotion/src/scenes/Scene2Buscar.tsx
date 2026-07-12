import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Sequence } from "remotion";
import { Background } from "../components/Background";
import { theme } from "../theme";

const CATEGORIES = [
  { name: "Restaurantes", locked: false },
  { name: "Salões de beleza", locked: false },
  { name: "Academias", locked: false },
  { name: "Clínicas odontológicas", locked: true, plan: "Pro" },
  { name: "Escritórios de advocacia", locked: true, plan: "Business" },
];

const RESULTS = [
  { name: "Trattoria Nonna", rating: 4.8, area: "Jardins" },
  { name: "Bella Pizza Forno", rating: 4.6, area: "Vila Madalena" },
  { name: "Cantina do Chef", rating: 4.9, area: "Pinheiros" },
  { name: "Sushi Yamato", rating: 4.7, area: "Itaim" },
];

export const Scene2Buscar = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stepIn = spring({ frame, fps, config: { damping: 20 } });
  const panelIn = spring({ frame: frame - 8, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ padding: 100 }}>
        {/* Step label */}
        <div style={{ opacity: stepIn, transform: `translateY(${(1 - stepIn) * 20}px)`, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontFamily: "SpaceGrotesk", fontSize: 26, fontWeight: 700, color: theme.violetGlow, letterSpacing: 4 }}>
              01 — BUSCAR LEADS
            </div>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${theme.violet}, transparent)` }} />
          </div>
          <div style={{ fontFamily: "SpaceGrotesk", fontSize: 78, fontWeight: 700, color: theme.text, letterSpacing: -2, marginTop: 12, lineHeight: 1.05 }}>
            56 categorias no Google Maps,<br />
            <span style={{ color: theme.cyan }}>em segundos.</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 40, marginTop: 40, flex: 1 }}>
          {/* Category picker */}
          <div
            style={{
              flex: 1,
              opacity: panelIn,
              transform: `translateX(${(1 - panelIn) * -40}px)`,
              background: `${theme.surface}dd`,
              border: `1px solid ${theme.border}`,
              borderRadius: 24,
              padding: 32,
            }}
          >
            <div style={{ fontFamily: "Inter", fontSize: 22, color: theme.textMuted, marginBottom: 20, fontWeight: 500 }}>Categoria</div>
            {CATEGORIES.map((c, i) => {
              const rowIn = spring({ frame: frame - 20 - i * 5, fps, config: { damping: 20 } });
              return (
                <div
                  key={c.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "18px 22px",
                    borderRadius: 14,
                    background: !c.locked && i === 0 ? `${theme.violet}22` : "transparent",
                    border: !c.locked && i === 0 ? `1px solid ${theme.violet}66` : `1px solid transparent`,
                    marginBottom: 8,
                    opacity: rowIn,
                    transform: `translateX(${(1 - rowIn) * -20}px)`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: c.locked ? theme.surface2 : theme.violet,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: theme.text, fontSize: 16, fontWeight: 700,
                    }}>{c.locked ? "🔒" : "✓"}</div>
                    <div style={{ fontFamily: "Inter", fontSize: 26, color: c.locked ? theme.textMuted : theme.text, fontWeight: 500 }}>{c.name}</div>
                  </div>
                  {c.locked && (
                    <div style={{ fontFamily: "Inter", fontSize: 16, padding: "6px 12px", borderRadius: 999, background: `${theme.warn}22`, color: theme.warn, fontWeight: 600 }}>
                      {c.plan}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Results */}
          <div
            style={{
              flex: 1.1,
              opacity: panelIn,
              transform: `translateX(${(1 - panelIn) * 40}px)`,
              background: `${theme.surface}dd`,
              border: `1px solid ${theme.border}`,
              borderRadius: 24,
              padding: 32,
            }}
          >
            <div style={{ fontFamily: "Inter", fontSize: 22, color: theme.textMuted, marginBottom: 20, fontWeight: 500 }}>Resultados encontrados</div>
            {RESULTS.map((r, i) => {
              const rowIn = spring({ frame: frame - 45 - i * 8, fps, config: { damping: 18, stiffness: 140 } });
              return (
                <div
                  key={r.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px 22px",
                    borderRadius: 14,
                    background: theme.surface2,
                    marginBottom: 10,
                    opacity: rowIn,
                    transform: `translateY(${(1 - rowIn) * 20}px)`,
                  }}
                >
                  <div>
                    <div style={{ fontFamily: "Inter", fontSize: 26, color: theme.text, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontFamily: "Inter", fontSize: 18, color: theme.textMuted, marginTop: 4 }}>📍 {r.area}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: theme.warn, fontFamily: "Inter", fontSize: 22, fontWeight: 600 }}>
                    ★ {r.rating}
                  </div>
                </div>
              );
            })}
            <Sequence from={95}>
              <SavedBadge />
            </Sequence>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SavedBadge = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 180 } });
  return (
    <div
      style={{
        marginTop: 18,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 22px",
        borderRadius: 14,
        background: `${theme.success}22`,
        border: `1px solid ${theme.success}66`,
        transform: `scale(${s})`,
        opacity: s,
      }}
    >
      <div style={{ fontSize: 26 }}>✅</div>
      <div style={{ fontFamily: "Inter", fontSize: 22, color: theme.success, fontWeight: 600 }}>
        4 leads salvos no seu CRM
      </div>
    </div>
  );
};
