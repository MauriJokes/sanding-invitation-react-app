import { useCallback, useEffect, useState } from "react";
import { vi } from "vitest";

type Handler = () => void;

/** Just enough of Embla's API for the slider; jsdom has no layout, so the real carousel cannot move. */
export class FakeEmblaApi {
  index = 0;
  private handlers = new Map<string, Set<Handler>>();

  get count() {
    return document.querySelectorAll("[aria-roledescription=slide]").length;
  }
  selectedScrollSnap = () => this.index;
  canScrollPrev = () => this.index > 0;
  canScrollNext = () => this.index < this.count - 1;
  slideNodes = () =>
    Array.from(
      document.querySelectorAll<HTMLElement>("[aria-roledescription=slide]"),
    );
  scrollNext = vi.fn<(instant?: boolean) => void>(() =>
    this.go(this.index + 1),
  );
  scrollPrev = vi.fn<(instant?: boolean) => void>(() =>
    this.go(this.index - 1),
  );
  scrollTo = vi.fn<(index: number, instant?: boolean) => void>((index) =>
    this.go(index),
  );

  on(event: string, handler: Handler) {
    const set = this.handlers.get(event) ?? new Set<Handler>();
    set.add(handler);
    this.handlers.set(event, set);
    return this;
  }
  off(event: string, handler: Handler) {
    this.handlers.get(event)?.delete(handler);
    return this;
  }
  emit(event: string) {
    for (const handler of this.handlers.get(event) ?? []) handler();
  }
  private go(index: number) {
    this.index = Math.max(0, Math.min(index, this.count - 1));
    this.emit("select");
  }
}

/** The carousel the slider is currently using (the last one created). */
export const embla: { api: FakeEmblaApi | undefined } = { api: undefined };

/** Replacement for the default export of "embla-carousel-react". */
export default function useFakeEmbla(): [
  (node: HTMLElement | null) => void,
  FakeEmblaApi | undefined,
] {
  const [api, setApi] = useState<FakeEmblaApi | undefined>();
  useEffect(() => {
    const created = new FakeEmblaApi();
    embla.api = created;
    setApi(created);
    return () => {
      embla.api = undefined;
    };
  }, []);
  const ref = useCallback(() => undefined, []);
  return [ref, api];
}
