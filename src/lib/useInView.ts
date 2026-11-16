import { useEffect, useState, type RefObject } from "react";

/** True while at least `threshold` of the element is on screen. Without IntersectionObserver it is always true. */
export function useInView(
  ref: RefObject<Element | null>,
  threshold = 0.3,
): boolean {
  const [inView, setInView] = useState(
    typeof IntersectionObserver === "undefined",
  );
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return inView;
}
