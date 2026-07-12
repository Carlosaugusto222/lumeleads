import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

// 5 scenes at 30fps, with 4 transitions of 18f overlap
// Scenes: 100 + 130 + 130 + 150 + 160 = 670
// Minus 4*18 overlaps = 598 frames (~20s)
export const RemotionRoot = () => (
  <Composition
    id="main"
    component={MainVideo}
    durationInFrames={598}
    fps={30}
    width={1920}
    height={1080}
  />
);
