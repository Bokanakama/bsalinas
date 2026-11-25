import { boardFor, buildingName, groupTag, HOUSE_MULT, isMortgaged, money, mortgageValue, rentFor, type GameState } from "@/lib/game";
import { Animal } from "./Animal";

/** Phone version of the board's property card: prices, rent table, mortgage and owner. */
export function PropertyDetails({ state, square, onClose }: { state: GameState; square: number; onClose: () => void }) {
  const sq = boardFor(state)[square]!;
  const owner = state.players.find((p) => p.id === state.owners[square]);
  const prop = sq.kind === "property";
  const station = sq.group === 8;
  const util = sq.group === 9;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-label={sq.name} className="animate-pop w-full max-w-sm overflow-hidden rounded-2xl border-4 border-border bg-card text-card-foreground shadow-[6px_6px_0_var(--foreground)]" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3" style={{ background: prop ? `var(--group-${sq.group})` : "var(--muted)" }}>
          {prop && <p className="font-display text-sm text-card/90">{groupTag(sq.group)} · {station ? "Rodoviária" : util ? "Utilidade" : `Bairro ${(sq.group ?? 0) + 1}`}</p>}
          <p className={`font-display text-2xl leading-tight ${prop ? "text-card drop-shadow-sm" : ""}`}>{sq.name}</p>
        </div>
        <div className="space-y-1.5 px-4 py-3 text-sm">
          {prop ? (
            <>
              <Row k="Preço" v={money(sq.price!)} />
              <Row k="Aluguel agora" v={money(rentFor(state, square))} strong />
              {!station && !util && HOUSE_MULT.slice(1).map((m, k) => <Row key={k} k={k === 3 ? `Com ${buildingName(state, true)}` : `Com ${k + 1} ${buildingName(state, false, k > 0)}`} v={money((sq.rent ?? 0) * m)} />)}
              {station && <Row k="Regra" v="B$ 25 · 50 · 100 · 200" />}
              {util && <Row k="Regra" v="Dados × 4 (×10 com as duas)" />}
              <Row k="Hipoteca" v={money(mortgageValue(square, state))} />
              <div className="flex items-center justify-between gap-2 pb-1">
                <span className="text-muted-foreground">Dono</span>
                <span className="flex items-center gap-1 font-semibold">{owner && <Animal id={owner.animal} className="h-7 w-auto" />}<span style={owner ? { color: owner.color } : undefined}>{owner ? owner.name : "Banco (à venda)"}</span></span>
              </div>
              {isMortgaged(state, square) && <Row k="Situação" v="No prego — sem aluguel" />}
            </>
          ) : (
            <Row k="Efeito" v={sq.amount ? `${sq.kind === "bonus" ? "+" : "−"}${money(sq.amount)}${sq.kind === "samba" ? " para cada jogador" : ""}` : sq.kind === "luck" ? "Raspadinha da sorte" : "—"} />
          )}
        </div>
        <button onClick={onClose} className="min-h-12 w-full border-t-4 border-border py-3 font-display text-lg text-accent">Fechar</button>
      </div>
    </div>
  );
}
function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return <div className="flex items-baseline justify-between gap-2 border-b border-dashed border-border/30 pb-1"><span className="text-muted-foreground">{k}</span><span className={strong ? "font-display text-primary" : "font-semibold"}>{v}</span></div>;
}
