import { useEffect, useRef, useState, type CSSProperties } from "react";
import { boardFor, housesAt, isMortgaged, money, rentFor, cityOf, horrorActive, availableAltars, type GameState } from "@/lib/game";
import { Animal } from "./Animal";
import { sfx } from "@/lib/sfx";

const ICON: Record<string, string> = { start: "★", toll: "🚧", fine: "🚨", bonus: "💵", rest: "🌴", luck: "❓", gojail: "👮", jail: "👮", samba: "🥁" };
const N = 56;

/** Horizontal street strip: 5 squares around the player's (animated) position. */
export function StreetStrip({ state, playerId, onPick }: { state: GameState; playerId: string; onPick?: (i: number) => void }) {
  const me = state.players.find((p) => p.id === playerId);
  const target = me?.pos ?? 0;
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    const dist = (target - shownRef.current + N) % N;
    if (dist === 0) return;
    if (dist > 12) { shownRef.current = target; setShown(target); return; }
    const t = setInterval(() => {
      shownRef.current = (shownRef.current + 1) % N;
      setShown(shownRef.current);
      sfx.step();
      if (shownRef.current === target) clearInterval(t);
    }, 180);
    return () => clearInterval(t);
  }, [target]);

  return (
    <section className="street-strip overflow-hidden rounded-xl border-2 border-border bg-foreground/90 p-1">
      <div className="flex items-end gap-1">
        {[-2, -1, 0, 1, 2].map((off) => {
          const i = (shown + off + N) % N;
          const sq = boardFor(state)[i]!;
          const owner = state.players.find((p) => p.id === state.owners[i]);
          const here = state.players.filter((p) => (p.id === playerId ? shown : p.pos) === i);
          const h = housesAt(state, i);
          const center = off === 0;
          return (
            <button type="button" onClick={() => onPick?.(i)} key={`${i}-${off}`} className={`${cityOf(state) === "esquecidos" ? "horror-tile" : ""} flex min-w-0 flex-col overflow-hidden rounded-lg bg-card text-center transition-all duration-200 ${center ? "h-28 flex-[1.8]" : "h-20 flex-1 opacity-75"} ${isMortgaged(state, i) ? "grayscale" : ""}`}>
              {sq.kind === "property" ? (
                <div className="flex h-3 shrink-0 items-center justify-center text-xs" style={{ background: `var(--group-${sq.group})` }}>
                  {owner && <Animal badge id={owner.animal} className="h-3 w-auto" />}
                  {h > 0 && <span>{h >= 4 ? "🏠" : "⛺".repeat(h)}</span>}
                </div>
              ) : (
                <div className="shrink-0 text-xs leading-4">{ICON[sq.kind] ?? "•"}</div>
              )}
              <p className={`px-0.5 font-display leading-tight break-words ${center ? "text-sm font-semibold" : "text-xs font-semibold"}`}>{sq.name}</p>
              {horrorActive(state) && [0,17,28,45].includes(i) && <span className="text-[10px] text-secondary">{state.curse?.altars[i] ? "🔥 Purificado" : availableAltars(state).includes(i) ? "Selo livre" : "Trancado"}</span>}
              {center && sq.kind === "property" && (
                <p className="text-xs font-semibold leading-tight">{owner ? `Dono: ${owner.name}` : money(sq.price!)}<br />Aluguel {money(rentFor(state, i))}</p>
              )}
              {center && sq.amount ? <p className="text-xs font-bold">{(sq.kind === "bonus" ? "+" : "−") + money(sq.amount)}</p> : null}
              <div className={`mt-auto flex justify-center pb-1 ${cityOf(state) === "esquecidos" ? "gap-1" : "-space-x-3"}`}>
                {here.map((p) => (
                  cityOf(state) === "esquecidos" ? <span key={`${p.id}-${i}`} className={`player-pin street-pin ${horrorActive(state) && (state.curse?.sanity[p.id] ?? 0) <= 0 ? "player-lost" : ""}`} title={p.name} style={{ "--player-color": p.color } as CSSProperties}><Animal id={p.animal} alt={p.name} className={center ? "h-7 w-auto" : "h-5 w-auto"} /><span className="player-pin-number">{state.players.indexOf(p) + 1}</span></span> : <Animal key={`${p.id}-${i}`} badge id={p.animal} alt={p.name} className={`animate-hop w-auto ${center ? (p.id === playerId ? "h-9" : "h-6") : "h-5"}`} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
