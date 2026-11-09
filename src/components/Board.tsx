import { BOARD, groupTag, HOUSE_MULT, housesAt, isMortgaged, money, ownsGroup, rentFor, startBonus, type GameState } from "@/lib/game";
import { useState, type ReactNode } from "react";
import { Animal } from "./Animal";

// 56 squares on the perimeter of an 18x12 grid (16:9 friendly), clockwise from bottom-right.
const C = 18;
const R = 12;
const CF = [2.2, ...Array(C - 2).fill(1), 2.2] as number[];
const RF = [1.9, ...Array(R - 2).fill(1), 1.9] as number[];
type Side = "bottom" | "left" | "top" | "right";
const B = C - 1, L = B + R - 1, T = L + C - 1;
function cell(i: number): { r: number; c: number; side: Side } {
  if (i <= B) return { r: R, c: C - i, side: "bottom" };
  if (i <= L) return { r: R - (i - B), c: 1, side: "left" };
  if (i <= T) return { r: 1, c: 1 + (i - L), side: "top" };
  return { r: 1 + (i - T), c: C, side: "right" };
}

/** One consistent line-icon set (24px grid, 2px stroke) for every special square. */
type IconName = "start" | "jail" | "rest" | "gojail" | "luck" | "toll" | "fine" | "bonus" | "samba" | "bus" | "bolt";
const PATHS: Record<IconName, ReactNode> = {
  start: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
  jail: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 4v16M15 4v16" /></>,
  rest: <><circle cx="12" cy="8" r="3.5" /><path d="M3 15c3 3 15 3 18 0M3 19h18" /></>,
  gojail: <><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  luck: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M10 9a2 2 0 1 1 3 1.7c-.7.4-1 .9-1 1.6M12 16h.01" /></>,
  toll: <><path d="M4 20V9l8-5 8 5v11" /><path d="M4 13h16" /></>,
  fine: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
  bonus: <><circle cx="12" cy="12" r="8" /><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5v11" /></>,
  samba: <><ellipse cx="12" cy="8" rx="8" ry="3" /><path d="M4 8v8c0 1.7 3.6 3 8 3s8-1.3 8-3V8M8 2l3 5M16 2l-3 5" /></>,
  bus: <><rect x="4" y="3" width="16" height="15" rx="3" /><path d="M4 11h16M8 21v-3M16 21v-3" /><circle cx="8" cy="14.5" r=".6" /><circle cx="16" cy="14.5" r=".6" /></>,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
};
function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>{PATHS[name]}</svg>;
}
const KIND_ICON: Record<string, IconName> = { toll: "toll", fine: "fine", bonus: "bonus", luck: "luck", samba: "samba" };
const KIND_TONE: Record<string, string> = { toll: "text-foreground", fine: "text-destructive", bonus: "text-success", luck: "text-accent", samba: "text-primary" };
const CORNER: Record<number, { icon: IconName; title: string; tag: string; tone: string }> = {
  0: { icon: "start", title: "Início", tag: "+B$ 200", tone: "bg-secondary text-secondary-foreground" },
  17: { icon: "jail", title: "Delegacia", tag: "Só visitando", tone: "bg-muted text-foreground" },
  28: { icon: "rest", title: "Sombra de Coqueiro", tag: "Descanso", tone: "bg-success text-success-foreground" },
  45: { icon: "gojail", title: "Vá para a Delegacia", tag: "Mandado", tone: "bg-destructive text-destructive-foreground" },
};
const ICON_BY_GROUP: Record<number, IconName> = { 8: "bus", 9: "bolt" };

function Tents({ n }: { n: number }) {
  if (n >= 4) return <svg viewBox="0 0 24 20" className="h-full w-auto"><path d="M2 9 12 2l10 7v10H2z" fill="var(--secondary)" stroke="var(--foreground)" strokeWidth="1.4" /><rect x="9" y="12" width="6" height="7" fill="var(--foreground)" /></svg>;
  return (
    <span className="flex h-full gap-[8%]">
      {Array.from({ length: n }, (_, k) => (
        <svg key={k} viewBox="0 0 20 18" className="h-full w-auto"><path d="M10 1 19 17H1z" fill="var(--card)" stroke="var(--foreground)" strokeWidth="1.4" /></svg>
      ))}
    </span>
  );
}

function Details({ state, i, onClose }: { state: GameState; i: number; onClose: () => void }) {
  const sq = BOARD[i]!;
  const owner = state.players.find((p) => p.id === state.owners[i]);
  const prop = sq.kind === "property";
  const util = sq.group === 9;
  const station = sq.group === 8;
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-foreground/30 p-[4cqw] backdrop-blur-[2px]" onClick={onClose}>
      <div className="animate-pop w-[40cqw] overflow-hidden rounded-[1.5cqw] bg-card text-left text-card-foreground shadow-[var(--shadow-soft)]" onClick={(e) => e.stopPropagation()}>
        <div className="px-[3cqw] py-[2.2cqw]" style={{ background: prop ? `var(--group-${sq.group})` : "var(--muted)" }}>
          <p className="font-display text-[1.8cqw] text-card/90" style={prop ? undefined : { display: "none" }}>{groupTag(sq.group)} · {sq.group === 8 ? "Rodoviária" : sq.group === 9 ? "Utilidade" : `Bairro ${(sq.group ?? 0) + 1}`}</p>
          <p className="font-display text-[4.2cqw] leading-tight text-card drop-shadow-sm" style={prop ? undefined : { color: "var(--foreground)" }}>{sq.name}</p>
        </div>
        <div className="space-y-[1.2cqw] px-[3cqw] py-[2.5cqw] text-[2.6cqw]">
          {prop ? (
            <>
              <Row k="Preço" v={money(sq.price!)} />
              <Row k="Aluguel agora" v={money(rentFor(state, i))} strong />
              {!util && !station && HOUSE_MULT.slice(1).map((m, k) => <Row key={k} k={k === 3 ? "Com resort" : `Com ${k + 1} chalé${k ? "s" : ""}`} v={money((sq.rent ?? 0) * m)} />)}
              {station && <Row k="Regra" v="Dobra a cada rodoviária" />}
              {util && <Row k="Regra" v="Dados × 4 (×10 com as duas)" />}
              <Row k="Dono" v={owner ? owner.name : "Banco (à venda)"} />
              {isMortgaged(state, i) && <Row k="Situação" v="No prego — sem aluguel" />}
            </>
          ) : (
            <Row k="Efeito" v={sq.amount ? `${sq.kind === "bonus" ? "+" : "−"}${money(sq.amount)}${sq.kind === "samba" ? " para cada jogador" : ""}` : sq.kind === "luck" ? "Raspadinha da sorte" : "—"} />
          )}
        </div>
        <button onClick={onClose} className="min-h-12 w-full border-t border-border/15 py-[1.6cqw] font-display text-[2.6cqw] text-accent">Fechar</button>
      </div>
    </div>
  );
}
function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return <div className="flex items-baseline justify-between gap-[2cqw] border-b border-dashed border-border/15 pb-[0.6cqw]"><span className="text-muted-foreground">{k}</span><span className={strong ? "font-display text-primary" : "font-semibold"}>{v}</span></div>;
}

export function Board({ state, center, side, displayPos, focus }: { state: GameState; center: ReactNode; side?: ReactNode; displayPos: Record<string, number>; focus: number | null }) {
  const [picked, setPicked] = useState<number | null>(null);
  
  const turnId = state.players[state.turn]?.id;
  return (
    <div style={{ width: "min(100cqw, calc(100cqh * 16 / 9))", height: "min(100cqh, calc(100cqw * 9 / 16))", containerType: "size" }} className="relative overflow-hidden rounded-[1.6cqw] border border-border/20 bg-[var(--board-gap)] shadow-[var(--shadow-soft)]">
      <div
        className="grid size-full gap-[0.35cqw] p-[0.6cqw] transition-transform duration-500 ease-out"
        style={{ gridTemplateColumns: CF.map((v) => `${v}fr`).join(" "), gridTemplateRows: RF.map((v) => `${v}fr`).join(" ") }}
      >
        {BOARD.map((sq, i) => {
          const { r, c, side } = cell(i);
          const owner = state.players.find((p) => p.id === state.owners[i]);
          const here = state.players.filter((p) => (displayPos[p.id] ?? p.pos) === i);
          const prop = sq.kind === "property";
          const rent = prop ? rentFor(state, i) : 0;
          const h = housesAt(state, i);
          const full = !!owner && (sq.group ?? 9) < 8 && ownsGroup(state, owner.id, sq.group!);
          const mort = isMortgaged(state, i);
          const horiz = side === "left" || side === "right";
          const tokens = (
            <div className="pointer-events-none absolute inset-x-0 top-[1%] z-20 flex justify-center gap-[0.1cqw]">
              {here.map((p) => <Animal key={`${p.id}-${displayPos[p.id] ?? p.pos}`} id={p.animal} badge alt={p.name} className={`animate-hop h-[2.4cqw] w-auto rounded-full ring-1 ring-foreground/40 drop-shadow-[0_2px_2px_color-mix(in_oklab,var(--foreground)_35%,transparent)] ${p.id === turnId ? "scale-110" : "opacity-90"}`} />)}
            </div>
          );
          const ring = focus === i ? "animate-glow z-20 ring-4 ring-secondary ring-offset-2 ring-offset-background" : full ? "ring-2 ring-secondary" : "";
          const base = `relative overflow-hidden text-left shadow-[0_1px_0_color-mix(in_oklab,var(--foreground)_10%,transparent)] transition-[transform,box-shadow] duration-200 hover:z-20 hover:-translate-y-[0.15cqw] ${ring}`;

          if (CORNER[i]) {
            const k = CORNER[i]!;
            return (
              <button type="button" onClick={() => setPicked(i)} key={i} style={{ gridRow: r, gridColumn: c }} className={`${base} flex flex-col items-center justify-center gap-[0.25cqw] rounded-[1cqw] p-[0.4cqw] text-center overflow-hidden ${k.tone}`}>
                <Icon name={k.icon} className="size-[2.8cqw] shrink-0" />
                <span className="max-w-full break-words font-display text-[1.25cqw] leading-none">{k.title}</span>
                <span className="rounded-full bg-card/80 px-[0.6cqw] py-[0.1cqw] text-[0.88cqw] font-semibold shrink-0 text-foreground max-w-full truncate">{i === 0 ? `+${money(startBonus(state))}` : k.tag}</span>
                {tokens}
              </button>
            );
          }

          const band = prop ? (
            <div className={`relative flex shrink-0 items-center justify-center text-card ${horiz ? "h-full w-[20%] flex-col" : "h-[20%] w-full"}`} style={{ backgroundColor: `var(--group-${sq.group})` }}>
              <span className={`absolute rounded-sm bg-card/90 px-[0.2cqw] font-display text-[0.7cqw] leading-tight text-foreground ${horiz ? "top-[4%]" : "left-[3%]"}`}>{groupTag(sq.group)}</span>
              {owner && horiz ? <Animal id={owner.animal} badge alt={`Dono: ${owner.name}`} className="h-[1.5cqw] w-auto shrink-0" /> : !h && ICON_BY_GROUP[sq.group!] && <Icon name={ICON_BY_GROUP[sq.group!]!} className={horiz ? "w-[70%]" : "h-[75%]"} />}
              {h > 0 && <span className={horiz ? "h-[1.6cqw]" : "h-[70%]"}><Tents n={h} /></span>}
            </div>
          ) : null;

          return (
            <button type="button" onClick={() => setPicked(i)} key={i} style={{ gridRow: r, gridColumn: c }} className={`${base} flex rounded-[0.5cqw] bg-card text-card-foreground ${horiz ? (side === "left" ? "flex-row-reverse" : "flex-row") : "flex-col"} ${mort ? "grayscale-[60%]" : ""}`}>
              {band}
              <div className={`flex min-w-0 flex-1 flex-col items-center justify-between text-center ${horiz ? "px-[0.4cqw] py-[0.2cqw] justify-center gap-[0.2cqw]" : "px-[0.2cqw] pb-[0.2cqw] pt-[0.6cqw]"}`}>
                {!prop && !horiz && <Icon name={KIND_ICON[sq.kind] ?? "luck"} className={`size-[1.6cqw] shrink-0 ${KIND_TONE[sq.kind] ?? ""}`} />}
                <span className={`font-display leading-[1.05] break-words ${horiz ? "text-[0.95cqw] line-clamp-2" : "max-w-full text-[0.8cqw] leading-[1] line-clamp-3 [overflow-wrap:anywhere] hyphens-auto"}`}>{sq.name}</span>
                {prop ? (
                  <span className={`flex shrink-0 items-center leading-none ${horiz ? "flex-row gap-[0.3cqw]" : "flex-col gap-[0.15cqw]"}`}>
                    {!owner && <span className="text-[0.9cqw] text-muted-foreground">{money(sq.price!)}</span>}
                    <span className={`rounded-full px-[0.5cqw] py-[0.1cqw] text-[1cqw] font-bold ${full || h > 0 ? "bg-secondary text-secondary-foreground" : owner ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      {money(rent)}{full && !h ? " ×2" : ""}
                    </span>
                  </span>
                ) : (
                  <span className={`text-[0.95cqw] font-bold ${KIND_TONE[sq.kind] ?? ""}`}>{sq.amount ? (sq.kind === "samba" ? "−" + money(sq.amount) + " c/u" : (sq.kind === "bonus" ? "+" : "−") + money(sq.amount)) : ""}</span>
                )}
              </div>
              {owner && !horiz && (
                <div className="pointer-events-none absolute inset-x-0 top-[21%] flex h-[1.3cqw] items-center justify-center">
                  <Animal id={owner.animal} badge alt={`Dono: ${owner.name}`} className="h-full w-auto" />
                </div>
              )}
              {mort && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><span className="-rotate-[30deg] w-[140%] bg-destructive py-[0.2cqw] text-center font-display text-[1.1cqw] text-destructive-foreground">NO PREGO</span></div>
              )}
              {tokens}
            </button>
          );
        })}
        <div style={{ gridRow: `2 / ${R}`, gridColumn: `2 / ${C}` }} className="filigrana relative grid min-h-0 grid-cols-[1fr_minmax(0,0.85fr)] gap-[1cqw] overflow-hidden rounded-[1cqw] border border-border/10 p-[1cqw]">
          <div style={{ containerType: "inline-size" }} className="flex min-h-0 flex-col items-center justify-center gap-[1.5cqw] overflow-hidden text-center">{center}</div>
          {side && <div className="flex min-h-0 flex-col gap-[0.8cqh] overflow-y-auto">{side}</div>}
        </div>
      </div>
      {picked !== null && <Details state={state} i={picked} onClose={() => setPicked(null)} />}
    </div>
  );
}
