import { theme } from "../theme";

export const Logo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.3 }}>
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: `linear-gradient(135deg, ${theme.violet}, ${theme.cyan})`,
        boxShadow: `0 0 40px ${theme.violet}88`,
      }}
    />
    <div style={{ fontFamily: "SpaceGrotesk", fontWeight: 700, fontSize: size * 0.9, color: theme.text, letterSpacing: -1 }}>
      LumeLeads
    </div>
  </div>
);
