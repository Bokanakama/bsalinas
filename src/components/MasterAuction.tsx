import { useEffect, useState } from "react";
import * as G from "@/lib/game";
import { Button } from "./ui/button";
import { TitleInfo } from "./GameInfo";

/** Display ticks are local; authoritative expiry stays on the master's action queue. */
export function MasterAuction({ state, onDismiss }: { state: G.GameState; onDismiss: () => void }) {
  const [now, setNow] = useState(0);
  const pending = state.pending;
  const endsAt = pending?.kind === "auction" ? pending.endsAt : 0;
  useEffect(() => {
    if (!endsAt) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [endsAt]);
  if (pending?.kind !== "auction") return null;
  const square = G.boardFor(state)[pending.square];
  if (!square) return null;
  const nameOf = (id: string) => state.players.find((p) => p.id === id)?.name ?? "";
  const urgent = now > 0 && pending.endsAt - now <= 5000;
  return (
    <div className={`animate-pop rounded-xl border-4 px-4 py-2 font-display ${urgent ? "animate-pulse border-destructive bg-secondary ring-4 ring-destructive" : "border-border bg-secondary"}`}>
      <p className="text-[3.6cqw] uppercase">{urgent ? "🔥 Últimos segundos! · " : ""}Leilão · vez de {nameOf(G.auctionTurn(state) ?? "")} · {Math.max(0, Math.ceil((pending.endsAt - now) / 1000))}s</p>
      <p className="text-[5.8cqw] leading-tight">{square.name}</p>
      <p className="text-[4.3cqw]">{pending.bidder ? `${nameOf(pending.bidder)} · ${G.money(pending.bid)}` : "Sem lances ainda"} · Tabela {G.money(square.price ?? 0)}</p>
      <TitleInfo state={state} square={pending.square} big />
      <Button variant="outline" className="mt-1 h-auto rounded-lg border-2 border-border bg-card px-3 py-0.5 text-[2.6cqw]" onClick={() => {
        if (window.confirm(pending.bidder ? `Encerrar o leilão agora? ${nameOf(pending.bidder)} leva por ${G.money(pending.bid)}.` : "Encerrar o leilão sem vencedor?")) onDismiss();
      }}>⏹️ Dispensar leilão</Button>
    </div>
  );
}