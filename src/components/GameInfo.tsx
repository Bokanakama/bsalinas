import { activeCityEvent, boardFor, cityName, groupOwners, money, type GameState } from "@/lib/game";
import { useEffect, useState } from "react";
import { Animal } from "./Animal";

/** Gazeta da Cidade: the active city news stays visible until it expires. */
export function Gazette({ state, className = "" }: { state: GameState; className?: string }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const ev = activeCityEvent(state, now || Date.now());
  if (!ev) return null;
  const left = Math.max(0, Math.ceil(((ev.expiresAt ?? now + 120_000) - now) / 1000));
  return (
    <div className={`cedula flex items-center gap-2 rounded-xl border-4 border-border px-3 py-1 shadow-[4px_4px_0_var(--foreground)] ${className}`}>
      <span className="font-display uppercase text-primary">📰 Gazeta de {cityName(state)}</span>
      <span className="flex-1 font-bold">{ev.text}</span>
      <span className="carimbo whitespace-nowrap px-1 text-xs text-destructive">{ev.expiresAt !== undefined ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` : "nesta rodada"}</span>
    </div>
  );
}

/** Mini título de propriedade for auctions: rent levels and who already owns that color. */
export function TitleInfo({ state, square, big = false }: { state: GameState; square: number; big?: boolean }) {
  const sq = boardFor(state)[square]!;
  const g = sq.group ?? 0;
  const owners = groupOwners(state, square);
  const total = boardFor(state).filter((b) => b.group === g).length;
  const rentLine =
    g === 8 ? "Aluguel B$ 25 · 50 · 100 · 200 (por rodoviária)" : g === 9 ? "Aluguel: dados ×4 (ou ×10 com as duas)" : `Aluguel ${money(sq.rent ?? 0)} · cor completa ${money((sq.rent ?? 0) * 2)}`;
  return (
    <div className={`overflow-hidden rounded-lg border-2 border-border bg-card text-left ${big ? "text-[1.8cqw]" : "text-sm"}`}>
      <div className="h-2" style={{ background: `var(--group-${g})` }} />
      <div className="px-2 py-1">
        <p className="font-bold">{rentLine}</p>
        {owners.length ? (
          <p className="flex flex-wrap items-center gap-1">
            {owners.map((o) => {
              const p = state.players.find((x) => x.id === o.id);
              return (
                <span key={o.id} className="flex items-center gap-0.5">
                  <Animal id={p?.animal} className={big ? "h-[2.4cqw] w-auto" : "h-5 w-auto"} />
                  <b style={{ color: p?.color }}>{p?.name}</b> já tem {o.count} de {total}
                </span>
              );
            })}
          </p>
        ) : (
          <p className="text-muted-foreground">Ninguém tem terrenos desta cor ainda</p>
        )}
      </div>
    </div>
  );
}

/** Banner shown to everyone while someone scratches the Sorte ou Revés card. */
export function ScratchingBanner({ state, className = "" }: { state: GameState; className?: string }) {
  const pd = state.pending;
  if (pd?.kind !== "scratch") return null;
  const p = state.players.find((x) => x.id === pd.playerId);
  return (
    <div className={`animate-pop flex items-center gap-2 rounded-xl border-4 border-secondary bg-foreground px-3 py-2 font-display text-secondary ${className}`}>
      <Animal id={p?.animal} className="animate-bob h-[1.8em] w-auto" />
      <span>🎟️ <span className="text-background underline decoration-4" style={{ textDecorationColor: p?.color }}>{p?.name}</span> está raspando a Sorte ou Revés…</span>
    </div>
  );
}

/** Chuva de Borós: banknotes falling over the screen at the end of the game. */
export function MoneyRain() {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden>
      {Array.from({ length: 28 }, (_, i) => (
        <span key={i} className="animate-rain absolute -top-16 text-4xl" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i * 0.37) % 3}s`, animationDuration: `${2.6 + (i % 5) * 0.5}s` }}>
          {i % 3 ? "💵" : "🪙"}
        </span>
      ))}
    </div>
  );
}
