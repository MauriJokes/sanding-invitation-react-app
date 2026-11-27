import type { CSSProperties } from "react";
import flower from "../../../design-assets/textures/navy-flower-gold-leaves.png";
import fern from "../../../design-assets/textures/slender-leaf-branch.png";
import branch from "../../../design-assets/textures/round-leaf-branch.png";
import smallBranch from "../../../design-assets/textures/round-leaf-sprig.png";
import "./details-botanicals.css";

type Side = "left" | "right";
type Stem = {
  side: Side;
  top: number;
  size: number;
  angle: number;
  image?: string;
  root?: number;
};

const stems: readonly Stem[] = [
  { side: "left", top: 5, size: 122, angle: 45 },
  { side: "left", top: 8, size: 130, angle: 63 },
  { side: "left", top: 12, size: 105, angle: 42 },
  { side: "left", top: 15, size: 115, angle: 68 },
  { side: "left", top: 17, size: 105, angle: -10, image: branch, root: 55 },
  { side: "left", top: 21, size: 112, angle: 46 },
  { side: "left", top: 24, size: 120, angle: 72 },
  { side: "left", top: 28, size: 132, angle: 50 },
  { side: "left", top: 32, size: 108, angle: 68 },
  { side: "left", top: 35, size: 125, angle: 50 },
  { side: "left", top: 39, size: 135, angle: 58 },
  { side: "left", top: 42, size: 105, angle: 60 },
  { side: "left", top: 46, size: 125, angle: 72 },
  { side: "left", top: 52, size: 115, angle: 48 },
  { side: "left", top: 54.5, size: 110, angle: -5, image: branch, root: 55 },
  { side: "left", top: 58, size: 120, angle: 68 },
  { side: "left", top: 63, size: 130, angle: 45 },
  { side: "left", top: 66, size: 120, angle: 69 },
  { side: "left", top: 70, size: 130, angle: 55 },
  { side: "left", top: 75, size: 125, angle: 42 },
  { side: "left", top: 80, size: 125, angle: 62 },
  { side: "left", top: 84, size: 105, angle: 35, image: smallBranch, root: 20 },
  { side: "left", top: 88, size: 115, angle: 55 },
  { side: "left", top: 92, size: 125, angle: 73 },
  { side: "left", top: 96, size: 115, angle: 69 },
  { side: "right", top: 5, size: 125, angle: -72 },
  { side: "right", top: 8, size: 120, angle: -58 },
  { side: "right", top: 13, size: 115, angle: -43 },
  { side: "right", top: 17, size: 135, angle: -65 },
  {
    side: "right",
    top: 20,
    size: 108,
    angle: -38,
    image: smallBranch,
    root: 20,
  },
  { side: "right", top: 23, size: 125, angle: -74 },
  { side: "right", top: 28, size: 135, angle: -52 },
  { side: "right", top: 33, size: 112, angle: -55 },
  { side: "right", top: 36, size: 118, angle: -69 },
  { side: "right", top: 39, size: 120, angle: -45 },
  {
    side: "right",
    top: 42,
    size: 105,
    angle: -53,
    image: smallBranch,
    root: 20,
  },
  { side: "right", top: 44, size: 112, angle: -48 },
  { side: "right", top: 49, size: 126, angle: -62 },
  // { side: "right", top: 54, size: 110, angle: -35, image: branch, root: 55 },
  { side: "right", top: 57, size: 130, angle: -63 },
  { side: "right", top: 62, size: 110, angle: -42 },
  { side: "right", top: 67, size: 132, angle: -68 },
  { side: "right", top: 72, size: 110, angle: -40 },
  { side: "right", top: 76, size: 135, angle: -57 },
  { side: "right", top: 82, size: 108, angle: -70 },
  {
    side: "right",
    top: 85,
    size: 105,
    angle: -58,
    image: smallBranch,
    root: 20,
  },
  { side: "right", top: 89, size: 132, angle: -60 },
  { side: "right", top: 93, size: 120, angle: -74 },
  { side: "right", top: 98, size: 125, angle: -50 },
];

const flowers: readonly { side: Side; top: number }[] = [
  { side: "left", top: 4 },
  { side: "right", top: 47 },
  { side: "left", top: 79 },
];

export function DetailsBotanicals() {
  return (
    <div className="details-botanicals" aria-hidden="true">
      {stems.map((stem) => {
        const style = {
          "--top": `${stem.top}%`,
          "--size": `${stem.size * 0.72}px`,
          "--root": `${stem.root ?? 6}%`,
          "--angle": `${stem.angle}deg`,
        } as CSSProperties;
        return (
          <div
            key={`${stem.side}-${stem.top}`}
            className={`details-stem details-stem--${stem.side}`}
            style={style}
          >
            <img src={stem.image ?? fern} alt="" />
          </div>
        );
      })}
      {flowers.map(({ side, top }) => (
        <div
          key={`${side}-${top}`}
          className={`details-flower details-flower--${side}`}
          style={{ top: `${top}%` }}
        >
          <img src={flower} alt="" />
        </div>
      ))}
    </div>
  );
}
