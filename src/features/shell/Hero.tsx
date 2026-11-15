import { useMemo, type CSSProperties, type Ref } from "react";
import { EVENT } from "../../../shared/config/event";
import { useViewportSize } from "../../lib/useViewportSize";
import { Rosette } from "../motif/Rosette";
import { bandRosettes } from "../motif/rosettes";
import "./shell.css";

type RiseStyle = CSSProperties & { "--i": number };

function Corner({ side }: { side: "left" | "right" }) {
  return (
    <div aria-hidden="true" className={`hero-corner hero-corner-${side}`}>
      <div className="hero-sway">
        <svg className="hero-medallion" viewBox="0 0 200 200">
          <use href="#sanding-medallion" />
        </svg>
        <div className="hero-tassel">
          <svg viewBox="0 0 40 130">
            <use href="#sanding-tassel" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Band() {
  const { width } = useViewportSize();
  const rosettes = useMemo(() => bandRosettes(width), [width]);
  return (
    <div aria-hidden="true" className="hero-band">
      {rosettes.map((r) => (
        <Rosette key={r.key} spec={r} />
      ))}
    </div>
  );
}

interface HeroProps {
  /** True once Buka is pressed: the heading, names and date then rise in sequence. */
  intro: boolean;
  headingRef: Ref<HTMLHeadingElement>;
  date: string;
}

export function Hero({ intro, headingRef, date }: HeroProps) {
  return (
    <section className="hero" data-intro={intro ? "play" : undefined} aria-labelledby="hero-title">
      <Corner side="left" />
      <Corner side="right" />
      <div className="hero-content">
        <p className="hero-rise hero-eyebrow" style={{ "--i": 0 } as RiseStyle}>
          {EVENT.title}
        </p>
        <h1 id="hero-title" ref={headingRef} tabIndex={-1} className="hero-rise hero-names font-script" style={{ "--i": 1 } as RiseStyle}>
          <span>Izyan</span> <span className="hero-amp">&amp;</span> <span>Adam</span>
        </h1>
        <p className="hero-rise hero-meta" style={{ "--i": 2 } as RiseStyle}>
          <span>{date}</span>
          <span>{EVENT.venueName}</span>
        </p>
      </div>
      <Band />
    </section>
  );
}
