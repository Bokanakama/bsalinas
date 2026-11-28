import { useEffect, useRef, useState } from "react";
import { Radio, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ritualAligned, ritualNeedle } from "@/lib/ritual-tuning";
import { RITUAL_TUNING_MS } from "@/lib/esquecidos";

export function RitualTuning({ altar, confirm, close }: { altar: string; confirm: () => void; close: () => void }) {
  const [phase, setPhase] = useState<"ready" | "running" | "miss">("ready");
  const [reduced, setReduced] = useState(false);
  const start = useRef(0);
  const needle = useRef<HTMLDivElement>(null);
  useEffect(() => { setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  useEffect(() => {
    if (phase !== "running") return;
    let frame = 0;
    const update = () => {
      const elapsed = performance.now() - start.current;
      if (needle.current) needle.current.style.left = `${ritualNeedle(elapsed)}%`;
      if (elapsed >= RITUAL_TUNING_MS || document.visibilityState !== "visible") { setPhase("miss"); return; }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [phase]);
  function stop() { if (ritualAligned(performance.now() - start.current)) confirm(); else setPhase("miss"); }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4"><section role="dialog" aria-modal="true" aria-label="Sintonia do altar" className="w-full max-w-sm rounded-lg border border-primary bg-card p-5"><div className="flex items-center justify-between"><h2 className="font-display text-xl"><Radio className="mr-2 inline size-5" />Sintonia</h2><Button variant="ghost" size="icon" aria-label="Fechar sintonia" onClick={close}><X /></Button></div><p className="mt-3 font-semibold">{altar}</p><div className="ritual-dial relative my-5 h-12 overflow-hidden rounded border border-border bg-background"><div className="ritual-safe absolute inset-y-0 left-[35%] w-[30%] bg-success/30" /><div ref={needle} className="absolute inset-y-1 left-0 w-1 bg-secondary" /></div><p role="status" className="mb-4 min-h-10 text-sm text-muted-foreground">{phase === "miss" ? "A frequência escapou. Nenhum Boró foi gasto." : phase === "running" ? "Sintonize na faixa iluminada." : reduced ? "Sintonia sem movimento." : "A cidade responde por três segundos."}</p>{phase === "running" ? <Button autoFocus className="min-h-12 w-full" onClick={stop}>Sintonizar</Button> : <Button className="min-h-12 w-full" onClick={() => { if (reduced) confirm(); else { start.current = performance.now(); setPhase("running"); } }}>{reduced ? "Confirmar oferenda" : phase === "miss" ? "Tentar novamente" : "Iniciar sintonia"}</Button>}{phase !== "running" && <Button variant="outline" className="mt-3 min-h-11 w-full" onClick={confirm}>Confirmar sem timing</Button>}</section></div>;
}