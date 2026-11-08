import { useState } from "react";
import * as G from "@/lib/game";
import { Animal } from "./Animal";

const chip = (on: boolean) => `flex min-h-12 items-center gap-1 rounded-xl border-4 px-2 text-left text-sm font-bold ${on ? "border-border bg-secondary" : "border-transparent bg-muted"}`;
const btn = "min-h-12 flex-1 rounded-xl px-3 py-2 font-display text-lg disabled:opacity-40";

/** Mesa de Negociação: escolha o parceiro, marque imóveis dos dois lados e combine Borós. */
export function TradeTable({ state, pid, initialTo, initialGive, onSend, onClose }: {
  state: G.GameState; pid: string; initialTo?: string | undefined; initialGive?: number[] | undefined;
  onSend: (p: { to: string; give: number[]; want: number[]; cashFrom: number; cashTo: number }) => void; onClose: () => void;
}) {
  const me = state.players.find((p) => p.id === pid)!;
  const [to, setTo] = useState(initialTo ?? "");
  const [give, setGive] = useState<number[]>(initialGive ?? []);
  const [want, setWant] = useState<number[]>([]);
  const [payMe, setPayMe] = useState("");
  const [payThem, setPayThem] = useState("");
  const other = state.players.find((p) => p.id === to);
  const tradable = (id: string) => G.BOARD.map((b, i) => ({ b, i })).filter(({ i }) => state.owners[i] === id && G.housesAt(state, i) === 0);
  const toggle = (l: number[], set: (v: number[]) => void, i: number) => set(l.includes(i) ? l.filter((x) => x !== i) : [...l, i]);
  const cf = Number(payMe) || 0, ct = Number(payThem) || 0;
  const ok = !!other && (give.length > 0 || want.length > 0) && cf <= me.balance;
  const preview: G.Offer | null = other ? { id: "p", from: pid, to, giveSquares: give, wantSquares: want, cashFrom: Math.max(0, cf - ct), cashTo: Math.max(0, ct - cf) } : null;
  const list = (id: string, sel: number[], set: (v: number[]) => void) => {
    const l = tradable(id);
    if (!l.length) return <p className="text-xs text-muted-foreground">Nenhum imóvel disponível (sem barracas).</p>;
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {l.map(({ b, i }) => (
          <button type="button" key={i} aria-pressed={sel.includes(i)} onClick={() => toggle(sel, set, i)} className={chip(sel.includes(i))}>
            <span className="rounded px-1 text-xs text-card" style={{ background: `var(--group-${b.group})` }}>{G.groupTag(b.group)}</span>
            <span className="truncate">{b.name}</span>
          </button>
        ))}
      </div>
    );
  };
  const cash = (v: string, set: (v: string) => void, label: string) => (
    <input inputMode="numeric" placeholder={label} aria-label={label} value={v} onChange={(e) => set(e.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border-4 border-border bg-background p-2 text-lg" />
  );
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/60 p-3">
      <form onSubmit={(e) => { e.preventDefault(); if (ok) onSend({ to, give, want, cashFrom: cf, cashTo: ct }); }} className="max-h-[94dvh] w-full max-w-md space-y-3 overflow-y-auto rounded-2xl border-4 border-border bg-card p-4">
        <p className="font-display text-2xl">🤝 Mesa de Negociação</p>
        <div className="grid grid-cols-3 gap-2">
          {state.players.filter((p) => p.id !== pid && !p.out).map((p) => (
            <button type="button" key={p.id} onClick={() => { setTo(p.id); setWant([]); }} className={`min-h-12 rounded-xl border-4 p-1 text-xs font-bold ${to === p.id ? "border-border bg-secondary" : "border-transparent bg-muted"}`}>
              <Animal id={p.animal} className="mx-auto h-10 w-auto" />{p.name}
            </button>
          ))}
        </div>
        {other && (
          <>
            <section className="space-y-2 rounded-xl border-2 border-border p-2">
              <p className="font-display">Você entrega</p>
              {list(pid, give, setGive)}
              {cash(payMe, setPayMe, `B$ que você paga (saldo ${G.money(me.balance)})`)}
            </section>
            <section className="space-y-2 rounded-xl border-2 border-border p-2">
              <p className="font-display">Você pede de {other.name}</p>
              {list(to, want, setWant)}
              {cash(payThem, setPayThem, `B$ que ${other.name} paga`)}
            </section>
            {preview && (give.length > 0 || want.length > 0) && <p className="rounded-lg bg-muted p-2 text-sm">{G.offerText(state, preview)}</p>}
            {cf > me.balance && <p className="text-sm font-bold text-destructive">Saldo insuficiente.</p>}
          </>
        )}
        <div className="flex gap-2">
          <button disabled={!ok} className={`${btn} bg-primary text-primary-foreground`}>Enviar proposta</button>
          <button type="button" onClick={onClose} className={`${btn} bg-muted`}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
