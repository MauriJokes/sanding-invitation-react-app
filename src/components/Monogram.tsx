import monogramUrl from "../assets/monogram/monogram.png";

/** Typographic placeholder for the couple's monogram until the designer's original is supplied. Size it with font-size. */
export function Monogram({ className = "" }: { className?: string }) {
  return (
    // <span aria-hidden="true" className={`flex items-baseline justify-center gap-[0.05em] leading-none tracking-[0.04em] ${className}`}>
    //   <span className="-mr-[0.12em] text-[0.81em] text-gold-bright">I</span>
    //   <span className="text-[1.19em]">A</span>
    // </span>
    <img
      src={monogramUrl}
      alt="Couple's monogram"
      width={1000}
      height={1000}
      className={`mx-auto block h-auto w-[clamp(1.19em,12vw,5rem)] ${className}`}
    />
  );
}
