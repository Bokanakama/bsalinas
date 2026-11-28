import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";

/** Raspadinha: scratch the silver layer to reveal the Sorte ou Revés card. */
export function ScratchCard({ text, good, onDone, onReveal }: { text: string; good: boolean; onDone: () => void; onReveal?: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const drawing = useRef(false);
  useEffect(() => {
    if (!open) return;
    onReveal?.();
    const t = setTimeout(onDone, 6000); // safety: continue automatically after 6s
    return () => clearTimeout(t);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const last = useRef(0);
  const strokes = useRef(0);
  const lastCoverage = useRef(0);

  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const css = getComputedStyle(document.documentElement);
    ctx.fillStyle = css.getPropertyValue("--muted-foreground") || "gray";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = css.getPropertyValue("--muted") || "silver";
    for (let i = 0; i < 160; i++) ctx.fillRect(Math.random() * c.width, Math.random() * c.height, 3, 3);
    ctx.font = "bold 26px 'Archivo Black', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = css.getPropertyValue("--background") || "white";
    ctx.fillText("RASPE AQUI ✋", c.width / 2, c.height / 2 + 9);
  }, []);

  const scratch = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || open) return;
    const c = cv.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(((e.clientX - r.left) / r.width) * c.width, ((e.clientY - r.top) / r.height) * c.height, 22, 0, Math.PI * 2);
    ctx.fill();
    const t = Date.now();
    if (t - last.current > 90) { last.current = t; sfx.scratch(); }
    if (++strokes.current % 6 === 0 && t - lastCoverage.current >= 100) {
      lastCoverage.current = t;
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let clear = 0;
      for (let i = 3; i < d.length; i += 64) if (d[i] === 0) clear++;
      if (clear / (d.length / 64) > 0.4) { setOpen(true); (good ? sfx.coin : sfx.bad)(); }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-md">
      <div className="animate-pop w-full max-w-sm rounded-2xl border-4 border-border bg-card p-4 text-center shadow-[8px_8px_0_var(--foreground)]">
        <p className="font-display text-xl text-primary">🎟️ Sorte ou Revés</p>
        <div className="relative my-3 h-40 overflow-hidden rounded-xl border-4 border-border">
          <div className={`flex h-full items-center justify-center p-3 font-display text-xl ${good ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}>
            {good ? "🍀 " : "⚡ "}{text}
          </div>
          <canvas
            ref={cv}
            width={320}
            height={160}
            className={`absolute inset-0 h-full w-full touch-none transition-opacity duration-500 ${open ? "pointer-events-none opacity-0" : ""}`}
            onPointerDown={(e) => { drawing.current = true; scratch(e); }}
            onPointerMove={scratch}
            onPointerUp={() => (drawing.current = false)}
            onPointerLeave={() => (drawing.current = false)}
          />
        </div>
        <button onClick={() => (open ? onDone() : setOpen(true))} className="w-full min-h-12 rounded-xl border-4 border-border bg-secondary py-3 font-display text-lg">
          {open ? "Continuar ✓" : "Revelar de uma vez"}
        </button>
      </div>
    </div>
  );
}
