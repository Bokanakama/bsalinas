import { useEffect, useState } from "react";
import { Flame, HelpCircle, KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Animal } from "@/components/Animal";
import * as G from "@/lib/game";
import { ALTARS, CRISIS_MS, CURSE_MESSAGE, RITUAL_COST } from "@/lib/esquecidos";

export function HorrorRules() {
  return <div className="grid gap-5 sm:grid-cols-2">
    {[
      ["01 · A cidade negocia", "Compre, receba aluguéis e negocie Borós normalmente. Na 8ª rodada completa, ou quando metade dos imóveis tiver dono, a maldição desperta."],
      ["02 · O banco fecha", "Compras, empréstimos, obras e aluguéis param. Negociações entre jogadores continuam. Há 12 minutos para conter a crise. A cada 90 segundos, um bairro fica na névoa, mas seus imóveis continuam seus. Depois que todos os jogadores ativos passam pelo Início, dois imóveis trocam de lugar; donos e obras vão junto. Na próxima volta de todos, esse par retorna e outro par se move. Isso continua após o ritual. Um fantasma anda a cada 15–30 segundos: cobra até B$ 50 e tira 10 de sanidade ao atravessar alguém."],
      ["03 · Proteja os nomes", "Todos começam com 100 de sanidade e 2 tochas. Casas comuns tiram 5; a névoa tira 20. Altares recuperam 15. Cartas podem recuperar 10 e dar uma tocha, ou tirar 10. Uma tocha recupera 30 para você ou um aliado, inclusive perdido nas sombras."],
      ["04 · Quebre os quatro selos", "O diário revela o próximo altar: a ordem muda entre partidas. Chegue até 6 casas dele e ofereça B$ 200 ou um imóvel seu. Na sua vez, uma tocha leva diretamente ao altar. Cada selo recupera 20 de sanidade. O grupo pode quebrar um selo por jogada dos dados: depois de acender, joguem para liberar o próximo. Quatro selos reabrem o banco, salvam os aluguéis e dão B$ 250 a cada participante do ritual, uma vez. A partida NÃO termina. Se o prazo acabar, os 8 bairros forem cobertos ou todos perderem a sanidade, o banco reabre: perda de 15% do saldo por selo faltante (até 60%) e imóveis na névoa ficam sem aluguel. A vitória continua sendo por falência dos adversários."],
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
  if (!G.horrorActive(state) || !c) return null;
  const target = G.ritualTarget(state);
  const me = state.players.find((p) => p.id === playerId);
  const near = me && target !== undefined && G.altarNear(state, me.id, target);
  const blocked = state.moving || !!state.pending || !me || me.out || (c.sanity[me.id] ?? 0) <= 0;
  const cooling = c.lastSealRollId === state.rollId;
  const remaining = Math.max(0, Math.ceil(((c.deadline ?? c.awakenedAt + CRISIS_MS) - (now || c.awakenedAt)) / 1000));
  const distance = me && target !== undefined ? Math.min(Math.abs(me.pos - target), 56 - Math.abs(me.pos - target)) : 0;
  const ghostDistance = me ? Math.min(Math.abs(me.pos - (c.ghost ?? 28)), 56 - Math.abs(me.pos - (c.ghost ?? 28))) : 56;
  const mine = Object.entries(state.owners).filter(([, owner]) => owner === playerId);
  return <section aria-label="Estado da maldição" className="horror-mission border-y border-primary/40 py-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-base text-secondary"><KeyRound className="mr-1 inline size-4" />{c.stage === "escaped" ? "Maldição contida · banco aberto" : c.stage === "forgotten" ? "Banco aberto em emergência" : "Quebrem os quatro selos"}</h2><span className="text-xs font-bold text-muted-foreground">{Object.keys(c.altars).length}/4 selos · {c.fogGroups.length}/8 bairros</span></div>
    <p className="mt-1 text-xs text-muted-foreground">Banco fechado · <strong className={remaining <= 60 ? "text-destructive" : "text-foreground"}>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</strong> para os selos · névoa em {Math.max(0, Math.ceil((c.nextFogAt - (now || c.awakenedAt)) / 1000))}s</p>
    {target !== undefined && <div className="mt-3 border-l-2 border-secondary pl-3" aria-label="Missão do próximo selo">
      <p className="text-xs font-bold uppercase text-secondary">Próximo selo · casa {target}</p>
      <h3 className="font-display text-lg leading-tight">{G.boardFor(state)[target]?.name}</h3>
      <p className="mt-2 text-sm font-semibold">{me ? near ? "Ao alcance · oferenda disponível" : `${distance} casas de distância · alcance de 6` : `Oferenda: ${G.money(RITUAL_COST)} ou um imóvel · alcance de 6 casas`}</p>
      {me && <p className="mt-2 text-xs font-bold text-secondary" role="status">{cooling ? "Aguardando a próxima jogada dos dados" : state.moving ? "Aguarde o movimento terminar" : state.pending ? "Conclua a transação pendente" : (c.sanity[me.id] ?? 0) <= 0 ? "Peça a um aliado para recuperar sua sanidade" : near ? "Você pode fazer a oferenda agora" : G.current(state)?.id === me.id ? "Sua vez: jogue ou vá ao altar com uma tocha" : "Aguarde sua vez para se aproximar"}</p>}
    </div>}
    <div className="mt-3 grid grid-cols-4 gap-1">{ALTARS.map((altar, i) => <div key={altar} className={`rounded border p-1.5 text-center ${c.altars[altar] ? "border-success bg-success/15" : target === altar ? "border-primary bg-primary/10" : "border-border"}`}><span className="text-lg">{c.altars[altar] ? "🔥" : "🕯️"}</span><p className="text-xs font-semibold">{["Início", "Masmorra", "Santuário", "Abismo"][i]}</p><p className="truncate text-[10px] text-muted-foreground">{c.altars[altar] ? state.players.find((p) => p.id === c.altars[altar])?.name : target === altar ? "Próximo selo" : "Trancado"}</p></div>)}</div>
    {me && <div className="mt-3 flex items-center gap-3 border-b border-border pb-3"><Animal id={me.animal} className="size-10 object-contain" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold">Sua sanidade · {c.sanity[me.id] ?? 0}%</p><progress aria-label="Sua sanidade" max={100} value={c.sanity[me.id] ?? 0} className={`sanity-meter mt-1 w-full ${(c.sanity[me.id] ?? 0) < 40 ? "sanity-low" : ""}`} /></div><span className="shrink-0 text-sm font-semibold">🔥 {c.torches[me.id] ?? 0}</span></div>}
    {!me && <ul className="mt-3 space-y-2">{state.players.filter((p) => !p.out).map((p) => <li key={p.id} className="flex items-center gap-2 text-xs"><Animal id={p.animal} className="size-7 object-contain" /><span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span><span className={(c.sanity[p.id] ?? 0) <= 20 ? "text-destructive font-bold" : "text-muted-foreground"}>{c.sanity[p.id] ?? 0}% · 🔥 {c.torches[p.id] ?? 0}</span></li>)}</ul>}
    {me && act && <div className="mt-3 space-y-3">
      {(c.sanity[me.id] ?? 0) === 0 && <p role="status" className="text-sm text-destructive">Você está perdido. Peça uma tocha a um aliado para voltar a jogar.</p>}
      {!near && <Button disabled={blocked || G.current(state)?.id !== me.id || (c.torches[me.id] ?? 0) < 1} variant="secondary" className="h-auto min-h-12 w-full whitespace-normal" onClick={() => act("travelAltar")}><KeyRound />Ir ao altar · 1 🔥</Button>}
      <Button className="h-auto min-h-11 w-full whitespace-normal" disabled={blocked || cooling || !near || me.balance < RITUAL_COST} onClick={() => act("purifyAltar", { square: target })}>Quebrar selo · {G.money(RITUAL_COST)}</Button>
      {mine.length > 0 && <div className="flex gap-2"><select aria-label="Imóvel para sacrificar" value={sacrifice} onChange={(e) => setSacrifice(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs"><option value="">Escolher imóvel</option>{mine.map(([i]) => <option key={i} value={i}>{G.boardFor(state)[Number(i)]?.name}</option>)}</select><Button variant="destructive" disabled={blocked || cooling || !near || !mine.some(([i]) => i === sacrifice)} onClick={() => { if (window.confirm(`Sacrificar ${G.boardFor(state)[Number(sacrifice)]?.name} para acender este selo?`)) act("purifyAltar", { square: target, sacrifice: Number(sacrifice) }); }}>Sacrificar</Button></div>}
      <div className="grid grid-cols-2 gap-2"><Button disabled={blocked || (c.torches[me.id] ?? 0) < 1 || (c.sanity[me.id] ?? 0) >= 100} variant="outline" className="h-auto min-h-11 whitespace-normal" onClick={() => act("useTorch", { to: me.id })}><Flame />Recuperar +30</Button><Button variant="outline" className="h-auto min-h-11 whitespace-normal" disabled={blocked || ghostDistance > 6 || (c.torches[me.id] ?? 0) < 1} onClick={() => act("repelGhost")}>👻 Afastar · 1 🔥</Button></div>
      <p role="status" className={`text-xs ${ghostDistance <= 4 ? "text-destructive font-bold" : "text-muted-foreground"}`}>Fantasma · {ghostDistance === 0 ? "na sua casa" : `${ghostDistance} casas de você`} · casa {c.ghost ?? 28}</p>
      <h3 className="text-xs font-semibold uppercase text-muted-foreground">Iluminar aliado · 1 🔥 · +30 sanidade</h3>
      <div className="grid grid-cols-3 gap-2">{state.players.filter((p) => p.id !== me.id && !p.out).map((p) => <Button key={p.id} aria-label={`${(c.sanity[p.id] ?? 0) === 0 ? "Resgatar" : "Ajudar"} ${p.name}`} disabled={blocked || (c.torches[me.id] ?? 0) < 1 || (c.sanity[p.id] ?? 0) >= 100} variant="outline" className={`h-auto min-w-0 flex-col gap-1 px-1 py-2 ${(c.sanity[p.id] ?? 0) === 0 ? "border-destructive" : ""}`} onClick={() => act("useTorch", { to: p.id })}><Animal id={p.animal} className="size-9 object-contain" /><span className="max-w-full truncate text-xs">{p.name}</span><span className={(c.sanity[p.id] ?? 0) < 40 ? "text-destructive text-xs" : "text-xs text-muted-foreground"}>{(c.sanity[p.id] ?? 0) === 0 ? "Resgatar" : `${c.sanity[p.id] ?? 0}%`}</span></Button>)}</div>
    </div>}
  </section>;
}

export function CurseReveal({ state, code }: { state: G.GameState; code: string }) {
  const [open, setOpen] = useState(false);
  const at = state.curse?.awakenedAt;
  useEffect(() => { if (!at) return; try { setOpen(localStorage.getItem(`curse-reveal-${code}-${at}`) !== "seen"); } catch { setOpen(true); } }, [at, code]);
  if (!open || state.curse?.stage !== "awake") return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-6"><div role="dialog" aria-modal="true" aria-label="A maldição despertou" className="max-w-lg text-center"><Flame className="mx-auto mb-6 size-10 text-primary" /><p className="mb-4 text-xs font-semibold uppercase text-secondary">O relógio parou. O banco fechou.</p><h2 className="font-display text-2xl leading-relaxed sm:text-3xl">“{CURSE_MESSAGE}”</h2><p className="my-6 text-sm text-muted-foreground">Quebrem os quatro selos em até 12 minutos para evitar penalidades. O banco reabre depois da crise e a partida continua; o ritual não é a vitória final.</p><Button className="min-h-12" onClick={() => { try { localStorage.setItem(`curse-reveal-${code}-${at}`, "seen"); } catch { /* Storage may be unavailable on TV. */ } setOpen(false); }}>Enfrentar a cidade</Button></div></div>;
}