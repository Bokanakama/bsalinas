import { useEffect, useState } from "react";

const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

/** Realistic ivory die: soft bevel, cast shadow and recessed pips (1 is red, like a classic die). */
export function Die({ value, size = 56, gold = false }: { value: number; size?: number | undefined; gold?: boolean }) {
  const pip = size / 5.6;
  return (
    <div
      className="grid grid-cols-3 grid-rows-3"
      style={{
        width: size, height: size, padding: size * 0.14, borderRadius: size * 0.22,
        background: gold
          ? "radial-gradient(120% 120% at 25% 20%, oklch(0.97 0.08 95), var(--secondary) 55%, oklch(0.72 0.14 80))"
          : "radial-gradient(120% 120% at 25% 20%, oklch(0.995 0.005 95), oklch(0.95 0.01 90) 55%, oklch(0.84 0.015 85))",
        boxShadow: `inset ${-size * 0.06}px ${-size * 0.08}px ${size * 0.12}px color-mix(in oklab, var(--foreground) 22%, transparent), inset ${size * 0.04}px ${size * 0.04}px ${size * 0.06}px oklch(1 0 0 / .9), 0 ${size * 0.1}px ${size * 0.18}px -${size * 0.04}px color-mix(in oklab, var(--foreground) 45%, transparent)${gold ? ", 0 0 18px 4px var(--secondary)" : ""}`,
      }}
    >
      {Array.from({ length: 9 }, (_, i) => {
        const on = PIPS[value]?.includes(i);
        const red = value === 1;
        return (
          <span key={i} className="m-auto rounded-full" style={on ? {
            width: red ? pip * 1.35 : pip, height: red ? pip * 1.35 : pip,
            background: red ? "radial-gradient(circle at 35% 30%, oklch(0.7 0.2 27), oklch(0.45 0.18 27))" : "radial-gradient(circle at 35% 30%, oklch(0.45 0.04 230), oklch(0.18 0.03 230))",
            boxShadow: "inset 0 1px 2px oklch(0 0 0 / .55), 0 1px 0 oklch(1 0 0 / .8)",
          } : { width: pip, height: pip }} />
        );
      })}
    </div>
  );
}

/** Tumbling 3D-ish dice for ~0.7s whenever rollId changes; doubles glow gold. */
export function DicePair({ dice, rollId, size }: { dice: [number, number]; rollId: number; size?: number | undefined }) {
  const [shown, setShown] = useState(dice);
  const [spin, setSpin] = useState(false);
  const [landed, setLanded] = useState(0);
  useEffect(() => {
    if (!rollId) return;
    setSpin(true);
    const iv = setInterval(() => setShown([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]), 70);
    const t = setTimeout(() => { clearInterval(iv); setShown(dice); setSpin(false); setLanded((n) => n + 1); }, 700);
    return () => { clearInterval(iv); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollId]);
  const dbl = !spin && rollId > 0 && shown[0] === shown[1];
  return (
    <div className="flex flex-col items-center gap-1">
      <div key={landed} className={`flex gap-3 ${landed ? "animate-shake" : ""}`} style={{ perspective: 400 }}>
        {shown.map((v, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className={spin ? "animate-tumble" : "animate-pop"} style={{ animationDelay: `${i * 80}ms` }}>
              <Die value={v} size={size} gold={dbl} />
            </div>
            <div className={`mt-1 h-1.5 rounded-full bg-foreground/30 transition-all ${spin ? "w-1/3" : "w-4/5"}`} />
          </div>
        ))}
      </div>
      {dbl && <p className="animate-pop rounded-full bg-secondary px-3 font-display text-sm">🎲🎲 DUPLA! Joga de novo</p>}
    </div>
  );
}
