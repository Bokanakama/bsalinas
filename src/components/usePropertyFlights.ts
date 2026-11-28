import { useLayoutEffect, useRef } from "react";

/** Visual-only flights; the master has already persisted the destinations. */
export function usePropertyFlights(layoutKey: string, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef(new Map<string, { rect: DOMRect; clone: HTMLElement }>());
  useLayoutEffect(() => {
    const board = ref.current;
    if (!board || !enabled) { previous.current.clear(); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { previous.current.clear(); return; }
    const bounds = board.getBoundingClientRect();
    const next = new Map<string, { rect: DOMRect; clone: HTMLElement }>();
    const cleanup: (() => void)[] = [];
    // Read every rectangle before any DOM write, avoiding repeated layout flushes.
    const snapshots = Array.from(board.querySelectorAll<HTMLElement>("[data-property-id]")).map((node) => ({ node, rect: node.getBoundingClientRect() }));
    snapshots.forEach(({ node, rect }) => {
      const id = node.dataset["propertyId"];
      if (!id) return;
      const clone = node.cloneNode(true) as HTMLElement;
      next.set(id, { rect, clone });
      const old = previous.current.get(id);
      if (!old || (old.rect.x === rect.x && old.rect.y === rect.y)) return;
      const flight = old.clone;
      flight.removeAttribute("data-property-id");
      flight.querySelectorAll("[data-player-tokens]").forEach((tokens) => tokens.remove());
      flight.classList.add("property-flight");
      flight.setAttribute("aria-hidden", "true");
      flight.tabIndex = -1;
      Object.assign(flight.style, { left: `${old.rect.x - bounds.x}px`, top: `${old.rect.y - bounds.y}px`, width: `${old.rect.width}px`, height: `${old.rect.height}px`, gridRow: "auto", gridColumn: "auto" });
      board.append(flight);
      const dx = rect.x - old.rect.x, dy = rect.y - old.rect.y;
      const animation = flight.animate([
        { transform: "translate(0, 0) scale(1)" },
        { transform: `translate(${dx * .5}px, ${dy * .5 - bounds.height * .16}px) scale(1.25) rotate(-5deg)` },
        { transform: `translate(${dx}px, ${dy}px) scale(1)`, width: `${rect.width}px`, height: `${rect.height}px` },
      ], { duration: 2200, easing: "ease-in-out" });
      animation.onfinish = () => flight.remove();
      cleanup.push(() => { animation.cancel(); flight.remove(); });
    });
    previous.current = next;
    return () => cleanup.forEach((stop) => stop());
  }, [layoutKey, enabled]);
  return ref;
}