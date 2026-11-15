import type { CSSProperties } from "react";
import type { Rosette as RosetteSpec } from "./rosettes";
import "./rosette.css";

type RosetteStyle = CSSProperties & { "--d": string; "--dir": "normal" | "reverse" };

/** Decorative rosette placed on the tile grid (the parent must be positioned). */
export function Rosette({ spec }: { spec: RosetteSpec }) {
  return (
    <i
      className="ros"
      style={{ left: spec.x, top: spec.y, "--d": `${spec.duration}s`, "--dir": spec.reverse ? "reverse" : "normal" } as RosetteStyle}
    />
  );
}
