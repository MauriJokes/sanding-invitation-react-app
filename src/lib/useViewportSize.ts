import { useEffect, useState } from "react";

export interface ViewportSize {
  width: number;
  height: number;
}

const read = (): ViewportSize => ({ width: window.innerWidth, height: window.innerHeight });

/** Viewport size, updated after resizing settles (decoration should not re-layout on every frame). */
export function useViewportSize(settleMs = 150): ViewportSize {
  const [size, setSize] = useState(read);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setSize(read()), settleMs);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [settleMs]);
  return size;
}
