import { BOARD, type GameState } from "@/lib/game";
import { Animal } from "./Animal";

/** Phone: quick look at every square and where each player is. */
export function MiniMap({ state, onClose }: { state: GameState; onClose: () => void }) {
  const at = (i: number) => state.players.filter((p) => !p.out && p.pos === i);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-3" onClick={onClose}>
      <div role="dialog" aria-label="Tabuleiro completo" onClick={(e) => e.stopPropagation()} className="animate-pop flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border-4 border-border bg-card shadow-[6px_6px_0_var(--foreground)]">
        <p className="border-b-4 border-border px-4 py-2 font-display text-xl">🗺️ Tabuleiro completo</p>
        <ol className="grid min-h-0 flex-1 grid-cols-4 gap-1 overflow-y-auto p-2">
          {BOARD.map((b, i) => {
            const here = at(i);
            const owner = state.players.find((p) => p.id === state.owners[i]);
            return (
              <li key={i} className={`flex min-h-14 flex-col overflow-hidden rounded-md border-2 text-[10px] leading-tight ${here.length ? "border-primary ring-2 ring-primary" : "border-border/40"}`}>
                <span className="h-1.5 shrink-0" style={{ background: b.group !== undefined ? `var(--group-${b.group})` : "var(--muted)" }} />
                <span className="px-1 font-bold">{i}. {b.name}</span>
                {owner && <span className="px-1" style={{ color: owner.color }}>{owner.name}</span>}
                {here.length > 0 && <span className="mt-auto flex flex-wrap px-0.5">{here.map((p) => <Animal key={p.id} id={p.animal} className="h-6 w-auto" />)}</span>}
              </li>
            );
          })}
        </ol>
        <button onClick={onClose} className="min-h-12 border-t-4 border-border font-display text-lg text-accent">Fechar</button>
      </div>
    </div>
  );
}
