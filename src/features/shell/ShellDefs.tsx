import tileUrl from "../../assets/motif/tile.svg";

/** Shared SVG symbols for the hero corners: a quarter tile medallion and the tassel. Rendered once per page. */
export function ShellDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="sanding-tile" width="84" height="84" patternUnits="userSpaceOnUse">
          <image href={tileUrl} width="84" height="84" />
        </pattern>
        <clipPath id="sanding-quarter">
          <path d="M0 0H196A196 196 0 0 1 0 196Z" />
        </clipPath>
        <symbol id="sanding-medallion" viewBox="0 0 200 200">
          <path d="M0 0H196A196 196 0 0 1 0 196Z" fill="#1b2352" />
          <g clipPath="url(#sanding-quarter)">
            <rect width="200" height="200" fill="url(#sanding-tile)" />
          </g>
          <path d="M0 0H196A196 196 0 0 1 0 196Z" fill="none" stroke="#b8a472" strokeWidth="2" />
          <path d="M0 0H186A186 186 0 0 1 0 186Z" fill="none" stroke="#b8a472" strokeWidth=".8" opacity=".8" />
        </symbol>
        <symbol id="sanding-tassel" viewBox="0 0 40 130">
          <g fill="none" stroke="currentColor" strokeLinecap="round">
            <path d="M20 0V22" strokeWidth="2" />
            <circle cx="20" cy="27" r="5.5" fill="currentColor" stroke="none" />
            <path d="M14 36h12M15 40h10" strokeWidth="1.6" />
            <path d="M20 31V38" strokeWidth="2" />
            <rect x="13" y="38" width="14" height="14" rx="3" fill="currentColor" stroke="none" />
            <path d="M13 44h14M13 48h14" stroke="#1b2352" strokeWidth=".9" opacity=".55" />
            <path d="M14 52L8 124M16 52L14 126M18 52L18 128M20 52V130M22 52L22 128M24 52L26 126M26 52L32 124" strokeWidth="1.4" />
            <path d="M11 88h18" strokeWidth="1.2" />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}
