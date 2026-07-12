import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";

export const Background = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 60) * 40;
  const drift2 = Math.cos(frame / 80) * 60;
  return (
    <AbsoluteFill style={{ background: theme.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: `${-200 + drift}px`,
          left: `${-100 + drift2}px`,
          width: 1200,
          height: 1200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.violet}55 0%, transparent 60%)`,
          filter: "blur(30px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: `${-300 - drift}px`,
          right: `${-200 - drift2}px`,
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.cyan}33 0%, transparent 60%)`,
          filter: "blur(40px)",
        }}
      />
      {/* Grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          opacity: 0.4,
        }}
      />
    </AbsoluteFill>
  );
};
