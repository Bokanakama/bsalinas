import { useEffect, useState } from "react";
import { BANK, money, type GameState, type Transfer } from "@/lib/game";
import { Animal } from "./Animal";

function Who({ s, id }: { s: GameState; id: string }) {
  const p = s.players.find((x) => x.id === id);
  return (
    <div className="flex w-[28%] flex-col items-center">
      {id === BANK ? <span className="text-[clamp(28px,8vh,90px)] leading-none">🏦</span> : <Animal id={p?.animal} className="h-[clamp(40px,11vh,120px)] w-auto" />}
      <span className="mt-1 truncate font-display text-[clamp(10px,2.2vh,22px)]">{id === BANK ? "Banco" : p?.name}</span>
    </div>
  );
}

/** Big animated "money on the way" banner shown whenever state.transfer changes. */
export function TransferShow({ state, ms = 2600, top = false }: { state: GameState; ms?: number; top?: boolean }) {
  const [t, setT] = useState<Transfer | null>(null);
  const id = state.transfer?.id;
  useEffect(() => {
    if (!state.transfer) return;
    setT(state.transfer);
    const h = setTimeout(() => setT(null), ms);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  if (!t) return null;
  return (
    <div className={`pointer-events-none z-30 animate-pop ${top ? "fixed inset-x-3 top-2 scale-90" : "absolute inset-x-[6%] top-1/2 -translate-y-1/2"} rounded-2xl border-4 border-border bg-card p-3 shadow-[6px_6px_0_var(--foreground)]`}>
      <p className="text-center font-display text-[clamp(10px,2vh,20px)] uppercase text-muted-foreground">{t.reason}</p>
      <div className="flex items-center justify-between">
        <Who s={state} id={t.from} />
        <div className="relative h-[clamp(30px,7vh,70px)] flex-1 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <span key={i} className="cedula absolute inset-y-[20%] left-1/2 w-[40%] -translate-x-1/2 animate-fly rounded border-2 border-border text-center font-display text-[clamp(8px,1.6vh,16px)] text-success" style={{ animationDelay: `${i * 0.35}s` }}>B$</span>
          ))}
        </div>
        <Who s={state} id={t.to} />
      </div>
      <p className="text-center font-display text-[clamp(20px,5vh,56px)] leading-none text-success">{money(t.amount)}</p>
    </div>
  );
}
