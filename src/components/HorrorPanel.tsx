import { useEffect, useState } from "react";
import { Flame, HelpCircle, KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as G from "@/lib/game";
import { ALTARS, CURSE_MESSAGE, RITUAL_COST } from "@/lib/esquecidos";

export function HorrorRules() {
  return <div className="grid gap-5 sm:grid-cols-2">
    {[
      ["01 · A cidade negocia", "Compre, receba aluguéis e negocie Borós normalmente. Na 8ª rodada completa, ou quando metade dos imóveis tiver dono, a maldição desperta."],
      ["02 · O banco fecha", "Compras, empréstimos, obras e aluguéis param. Negociações entre jogadores continuam. A cada 90 segundos, um dos 8 bairros desaparece. O oitavo encerra a fuga."],
      ["03 · Proteja os nomes", "Todos começam com 100 de sanidade e 2 tochas. Casas comuns tiram 5; a névoa tira 20. Altares recuperam 15. Cartas podem recuperar 10 e dar uma tocha, ou tirar 10. Uma tocha recupera 30 para você ou um aliado, inclusive perdido nas sombras."],
      ["04 · Quebre os quatro selos", "O diário revela o próximo altar: a ordem muda entre partidas. Chegue até 6 casas dele e ofereça B$ 200 ou um imóvel seu. Na sua vez, uma tocha leva diretamente ao altar. Cada selo recupera 20 de sanidade. Quatro selos: todos escapam; sem sanidade em todo o grupo: a cidade vence."],
    ].map(([title, text]) => <article key={title} className="border-l-2 border-primary pl-4"><h3 className="mb-2 font-display text-lg text-secondary">{title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{text}</p></article>)}
  </div>;
}

export function HorrorRulesButton() {
  const [open, setOpen] = useState(false);
  return <><Button variant="outline" size="icon" aria-label="Regras da Cidade dos Esquecidos" title="Regras da Cidade dos Esquecidos" onClick={() => setOpen(true)}><HelpCircle /></Button>{open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4"><div role="dialog" aria-modal="true" aria-label="Regras da Cidade dos Esquecidos" className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-5"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="font-display text-2xl">Diário dos Esquecidos</h2><Button variant="ghost" size="icon" aria-label="Fechar regras" onClick={() => setOpen(false)}><X /></Button></div><HorrorRules /></div></div>}</>;
}

export function HorrorPanel({ state, playerId, act }: { state: G.GameState; playerId?: string; act?: (type: string, payload?: Record<string, unknown>) => void }) {
  const [now, setNow] = useState(0);
  const [sacrifice, setSacrifice] = useState("");
  const c = state.curse;
  useEffect(() => { if (c?.stage !== "awake") return; setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [c?.stage]);
  if (G.cityOf(state) !== "esquecidos" || !c) return null;
  const target = G.ritualTarget(state);
  const me = state.players.find((p) => p.id === playerId);
  const active = G.horrorActive(state);
  const near = me && target !== undefined && G.altarNear(state, me.id, target);
  const blocked = state.moving || !!state.pending || !me || me.out || (c.sanity[me.id] ?? 0) <= 0;
  const mine = Object.entries(state.owners).filter(([, owner]) => owner === playerId);
  return <section aria-label="Estado da maldição" className="rounded-lg border border-primary/40 bg-card p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-base text-secondary"><KeyRound className="mr-1 inline size-4" />{c.stage === "escaped" ? "Todos escaparam" : c.stage === "forgotten" ? "A cidade venceu" : "O ritual da fuga"}</h2><span className="text-xs font-bold text-muted-foreground">{Object.keys(c.altars).length}/4 selos · {c.fogGroups.length}/8 bairros</span></div>
    {active && <p className="mt-1 text-xs text-muted-foreground">Banco fechado · próxima névoa em {Math.max(0, Math.ceil((c.nextFogAt - (now || c.awakenedAt)) / 1000))}s</p>}
    <div className="mt-3 grid grid-cols-4 gap-1">{ALTARS.map((altar, i) => <div key={altar} className={`rounded border p-1.5 text-center ${c.altars[altar] ? "border-success bg-success/15" : target === altar ? "border-primary bg-primary/10" : "border-border"}`}><span className="text-lg">{c.altars[altar] ? "🔥" : "🕯️"}</span><p className="text-xs font-semibold">{["Início", "Masmorra", "Santuário", "Abismo"][i]}</p><p className="truncate text-[10px] text-muted-foreground">{c.altars[altar] ? state.players.find((p) => p.id === c.altars[altar])?.name : target === altar ? "Próximo selo" : "Trancado"}</p></div>)}</div>
    <ul className="mt-3 space-y-1.5">{state.players.filter((p) => !p.out).map((p) => <li key={p.id} className="flex items-center justify-between gap-2 text-xs"><span className="truncate font-semibold">{p.name}{p.id === playerId ? " · você" : ""}</span><span className={(c.sanity[p.id] ?? 0) <= 20 ? "text-destructive font-bold" : "text-muted-foreground"}>{c.sanity[p.id] ?? 0}% · 🔥 {c.torches[p.id] ?? 0}</span></li>)}</ul>
    {active && me && act && <div className="mt-4 space-y-3 border-t border-border pt-3">
      <p className="text-sm font-bold text-secondary">O diário sussurra: {target !== undefined ? G.boardFor(state)[target]?.name : "…"}</p>
      {(c.sanity[me.id] ?? 0) === 0 && <p role="status" className="text-sm text-destructive">Você está perdido. Peça uma tocha a um aliado para voltar a jogar.</p>}
      <div className="grid grid-cols-2 gap-2"><Button disabled={blocked || (c.torches[me.id] ?? 0) < 1 || (c.sanity[me.id] ?? 0) >= 100} variant="outline" className="h-auto min-h-11 whitespace-normal" onClick={() => act("useTorch", { to: me.id })}><Flame />Recuperar +30</Button><Button disabled={blocked || G.current(state)?.id !== me.id || (c.torches[me.id] ?? 0) < 1 || near} variant="secondary" className="h-auto min-h-11 whitespace-normal" onClick={() => act("travelAltar")}><KeyRound />Ir ao altar · 1 🔥</Button></div>
      <div className="flex flex-wrap gap-2">{state.players.filter((p) => p.id !== me.id && !p.out && (c.sanity[p.id] ?? 0) < 100).map((p) => <Button key={p.id} disabled={blocked || (c.torches[me.id] ?? 0) < 1} variant="outline" size="sm" onClick={() => act("useTorch", { to: p.id })}>🔥 Ajudar {p.name}</Button>)}</div>
      <Button className="h-auto min-h-11 w-full whitespace-normal" disabled={blocked || !near || me.balance < RITUAL_COST} onClick={() => act("purifyAltar", { square: target })}>Acender selo · {G.money(RITUAL_COST)}</Button>
      {mine.length > 0 && <div className="flex gap-2"><select aria-label="Imóvel para sacrificar" value={sacrifice} onChange={(e) => setSacrifice(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs"><option value="">Escolher imóvel</option>{mine.map(([i]) => <option key={i} value={i}>{G.boardFor(state)[Number(i)]?.name}</option>)}</select><Button variant="destructive" disabled={blocked || !near || !mine.some(([i]) => i === sacrifice)} onClick={() => { if (window.confirm(`Sacrificar ${G.boardFor(state)[Number(sacrifice)]?.name} para acender este selo?`)) act("purifyAltar", { square: target, sacrifice: Number(sacrifice) }); }}>Sacrificar</Button></div>}
      {!near && <p className="text-xs text-muted-foreground">Para acender, fique até 6 casas do próximo altar ou use uma tocha na sua vez.</p>}
    </div>}
  </section>;
}

export function CurseReveal({ state, code }: { state: G.GameState; code: string }) {
  const [open, setOpen] = useState(false);
  const at = state.curse?.awakenedAt;
  useEffect(() => { if (!at) return; try { setOpen(localStorage.getItem(`curse-reveal-${code}-${at}`) !== "seen"); } catch { setOpen(true); } }, [at, code]);
  if (!open || state.curse?.stage !== "awake") return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-6"><div role="dialog" aria-modal="true" aria-label="A maldição despertou" className="max-w-lg text-center"><Flame className="mx-auto mb-6 size-10 text-primary" /><p className="mb-4 text-xs font-semibold uppercase text-secondary">O relógio parou. O banco fechou.</p><h2 className="font-display text-2xl leading-relaxed sm:text-3xl">“{CURSE_MESSAGE}”</h2><p className="my-6 text-sm text-muted-foreground">Quebrem os quatro selos. Não deixem ninguém para trás.</p><Button className="min-h-12" onClick={() => { try { localStorage.setItem(`curse-reveal-${code}-${at}`, "seen"); } catch { /* Storage may be unavailable on TV. */ } setOpen(false); }}>Enfrentar a cidade</Button></div></div>;
}