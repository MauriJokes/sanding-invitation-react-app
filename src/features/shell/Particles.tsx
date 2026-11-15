import { useMemo, type CSSProperties } from "react";
import { useViewportSize } from "../../lib/useViewportSize";
import { makeParticles, particleCount } from "./particleLayout";
import "./shell.css";

type ParticleStyle = CSSProperties & { "--o": number };

/** Gold specks and small tile rosettes drifting down behind the content. Decorative; the parent decides when to mount it. */
export function Particles() {
  const { width } = useViewportSize();
  const particles = useMemo(() => makeParticles(particleCount(width)), [width]);
  return (
    <div aria-hidden="true" className="particles">
      {particles.map((p) => (
        <div
          key={p.key}
          className="particle"
          style={{ left: `${p.left}%`, animationDuration: `${p.fallSeconds}s`, animationDelay: `${p.fallDelay}s`, "--o": p.opacity } as ParticleStyle}
        >
          <i className={`particle-${p.kind}`} style={{ animationDuration: `${p.driftSeconds}s` }} />
        </div>
      ))}
    </div>
  );
}
