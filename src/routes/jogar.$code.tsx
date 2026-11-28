import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { getPlayerId, sendAction, setPlayerId, useRoomState } from "@/lib/room";
import * as G from "@/lib/game";
import { DicePair } from "@/components/Dice";
import { Button } from "@/components/ui/button";
import { paymentText } from "@/lib/payment-text";
import { Animal } from "@/components/Animal";
import { TransferShow } from "@/components/TransferShow";
import { sfx } from "@/lib/sfx";
import { StreetStrip } from "@/components/StreetStrip";
import { PropertyDetails } from "@/components/PropertyDetails";
import { TradeTable } from "@/components/TradeTable";
import { ScratchCard } from "@/components/ScratchCard";
import { Gazette, RelicTracker, MoneyRain, ScratchingBanner, TitleInfo } from "@/components/GameInfo";
import { SelvaIntro, SelvaRulesButton } from "@/components/SelvaGuide";
import { MiniMap } from "@/components/MiniMap";
import { CurseReveal, HorrorPanel, HorrorRulesButton } from "@/components/HorrorPanel";
import { UpdateNotes } from "@/components/UpdateNotes";

export const Route = createFileRoute("/jogar/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Carteira — sala ${params.code} | Banco Boró e Salinas` },
      { name: "description", content: "Sua carteira de Borós: escolha seu bichinho, jogue os dados e compre terrenos." },
      { property: "og:title", content: "Carteira — Banco Boró e Salinas" },
      { property: "og:description", content: "Entre na partida de Banco Boró e Salinas pelo celular." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Wallet,
});

const btn = "min-h-12 w-full rounded-xl border-4 border-border py-3 font-display text-lg shadow-[4px_4px_0_var(--foreground)] active:translate-y-1 active:shadow-none disabled:opacity-40";

function Wallet() {
  const { code } = Route.useParams();
  const { state, missing } = useRoomState(code);
  const [pid, setPid] = useState("");
  const [name, setName] = useState("");
  const [animal, setAnimal] = useState("");
  const [sent, setSent] = useState(false);
  const [trade, setTrade] = useState<{ to?: string; give?: number[] } | null>(null);
  const [now, setNow] = useState(0);
  const [inspect, setInspect] = useState<number | null>(null);
  const [map, setMap] = useState(false);
  const [joinError, setJoinError] = useState("");
  useEffect(() => setPid(getPlayerId()), []);

  const [netFail, setNetFail] = useState(false);
  const act = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    sfx.unlock();
    void sendAction(code, pid, type, payload).then((ok) => setNetFail(!ok));
  }, [code, pid]);

  const me = state?.players.find((p) => p.id === pid);
  const cur = state ? G.current(state) : undefined;
  const myTurn = state?.phase === "playing" && cur?.id === pid;
  const pd = state?.pending;
  const auctionOn = pd?.kind === "auction";
  useEffect(() => { if (!auctionOn) return; setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, [auctionOn]);
  const taken = state ? G.takenAnimals(state) : new Set<string>();

  // if my chosen animal got taken by someone else, unselect and allow retry
  useEffect(() => {
    if (animal && taken.has(animal as G.AnimalId) && !me) {
      if (sent) setJoinError("Esse bichinho acabou de ser escolhido por outro jogador. Escolha outro!");
      setAnimal(""); setSent(false);
    }
  }, [state?.players.length]); // eslint-disable-line react-hooks/exhaustive-deps
  // Never leave the button stuck on "Entrando…": if the board ignored the join, let the player try again.
  useEffect(() => {
    if (!sent || me) return;
    const t = setTimeout(() => { setSent(false); setJoinError("Não deu para entrar. Confira o nome e o bichinho e tente de novo."); }, 8000);
    return () => clearTimeout(t);
  }, [sent, me]);

  const prevBal = useRef<number | null>(null);
  useEffect(() => {
    if (!me) return;
    if (prevBal.current !== null && me.balance !== prevBal.current) {
      (me.balance > prevBal.current ? sfx.coin : sfx.bad)();
      if (me.balance > prevBal.current) navigator.vibrate?.(100);
    }
    prevBal.current = me.balance;
  }, [me?.balance, me]);
  useEffect(() => { if (myTurn && !state?.moving && !pd) { sfx.turn(); navigator.vibrate?.(150); } }, [myTurn, state?.turn]); // eslint-disable-line react-hooks/exhaustive-deps
  const jailed = !!me?.jail;
  const wasJailed = useRef(false);
  useEffect(() => { if (jailed && !wasJailed.current) navigator.vibrate?.([150, 100, 150]); wasJailed.current = jailed; }, [jailed]);

  if (missing) return <Center>Sala {code} não existe. <Link to="/" className="text-primary underline">Voltar</Link></Center>;
  if (!state || !pid) return <Center><span className="flex flex-col items-center gap-3"><span className="animate-spin-slow text-5xl">🎲</span>Conectando à sala…</span></Center>;

  if (!me) {
    if (state.phase !== "lobby") {
      const seats = state.players.filter((p) => !p.out);
      return (
        <Center>
          <div className="w-full max-w-sm space-y-3 rounded-2xl border-4 border-border bg-card p-5 shadow-[6px_6px_0_var(--foreground)]">
            <h1 className="font-display text-2xl text-primary">A partida já começou. Você já estava jogando?</h1>
            <p className="font-sans text-sm text-muted-foreground">Toque no seu bichinho para voltar com o seu saldo e seus terrenos.</p>
            <div className="grid grid-cols-2 gap-2">
              {seats.map((p) => (
                <button key={p.id} type="button" onClick={() => { if (window.confirm(`Você é ${p.name}?`)) { setPlayerId(p.id); setPid(p.id); } }} className="flex flex-col items-center rounded-xl border-4 border-border bg-muted p-2">
                  <Animal id={p.animal} className="h-16 w-auto" />
                  <span className="font-display" style={{ color: p.color }}>{p.name}</span>
                  <span className="text-xs">Sou eu (Reconectar)</span>
                </button>
              ))}
            </div>
          </div>
        </Center>
      );
    }
    return (
      <Center>
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim() && animal) { setJoinError(""); act("join", { name, animal }); setSent(true); } }} className="w-full max-w-sm space-y-3 rounded-2xl border-4 border-border bg-card p-5 shadow-[6px_6px_0_var(--foreground)]">
          <h1 className="font-display text-3xl text-primary">Sala {code}</h1>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={16} placeholder="Seu nome" aria-label="Seu nome" autoComplete="nickname" className="w-full rounded-xl border-4 border-border bg-background p-3 text-xl" />
          <p className="font-display">Escolha seu bichinho</p>
          <div className="grid grid-cols-3 gap-2">
            {G.ANIMALS.map((a) => {
              const off = taken.has(a.id);
              return (
                <button type="button" key={a.id} disabled={off} onClick={() => { setAnimal(a.id); setJoinError(""); }}
                  className={`relative flex flex-col items-center rounded-xl border-4 p-1 transition ${animal === a.id ? "scale-105 border-border bg-secondary" : "border-transparent bg-muted"} disabled:opacity-30`}>
                  <Animal id={a.id} className={`h-20 w-auto ${animal === a.id ? "animate-bob" : ""}`} />
                  <span className="text-xs font-bold">{off ? "Ocupado" : a.name}</span>
                </button>
              );
            })}
          </div>
          {joinError && <p role="alert" className="rounded-lg bg-destructive p-2 font-sans text-sm font-bold text-destructive-foreground">{joinError}</p>}
          <button disabled={sent || !animal || !name.trim()} className={`${btn} bg-primary text-primary-foreground`}>{sent ? "Entrando…" : "Entrar na partida"}</button>
        </form>
      </Center>
    );
  }

  const iPay = pd?.kind === "pix" && pd.from === pid;
  const iReceive = pd?.kind === "pix" && pd.to === pid;
  const mine = Object.entries(state.owners).filter(([, o]) => o === pid).map(([i]) => +i);
  const t = state.transfer;
  const touchesMe = t && (t.from === pid || t.to === pid);

  return (
    <main className={`${G.cityOf(state) === "salinas" ? "" : `${G.cityOf(state)}-game `}${G.horrorActive(state) ? "curse-awake " : ""}azulejo mx-auto flex min-h-dvh max-w-md flex-col gap-3 p-3`}>
      {netFail && (
        <button role="alert" onClick={() => setNetFail(false)} className="sticky top-2 z-50 rounded-xl border-4 border-border bg-destructive px-3 py-2 text-sm font-bold text-destructive-foreground">
          📶 Sua jogada não chegou ao tabuleiro. Confira a internet e toque de novo.
        </button>
      )}
      {G.cityOf(state) === "selva" && <><SelvaIntro /><div className="flex justify-end"><SelvaRulesButton className="border-border bg-card" /></div></>}
      <header className="cedula relative overflow-hidden rounded-2xl border-4 border-border p-4 shadow-[6px_6px_0_var(--foreground)]">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <span>Banco de {G.cityName(state)} · Sala {code}</span>
          <span>{G.ANIMALS.find((a) => a.id === me.animal)?.name}</span>
        </div>
        <p className="font-display text-2xl" style={{ color: me.color }}>{me.name}</p>
        <p className="text-xs uppercase text-muted-foreground">Saldo</p>
        <p key={me.balance} className={`animate-pop font-display text-5xl ${me.balance < 0 ? "text-destructive" : "text-foreground"}`}>{G.money(me.balance)}</p>
        <p className="text-sm">📍 {G.boardFor(state)[me.pos]!.name}{me.freeJail ? ` · 🎫 Saia Livre ×${me.freeJail}` : ""}</p>
        <Animal id={me.animal} className="absolute -bottom-2 right-1 h-28 w-auto" />
      </header>

      <UpdateNotes city={G.cityOf(state)} />
      {G.cityOf(state) === "esquecidos" && <><div className="flex justify-end"><HorrorRulesButton /></div><CurseReveal state={state} code={code} /><HorrorPanel state={state} playerId={pid} act={act} /></>}
      {!!me.loan && !me.out && !G.horrorActive(state) && (
        <Card>
          <p className="text-xs font-bold uppercase text-muted-foreground">🏛️ Financiamento bancário</p>
          <p className="font-display text-2xl">{G.money(me.loan)} a pagar</p>
          <p className="mb-2 text-xs text-muted-foreground">Pague quando sobrar Boró. Enquanto dever, o Banco não libera obras.</p>
          <div className="grid grid-cols-3 gap-2">
            {[50, 100].map((v) => <button key={v} disabled={me.balance < Math.min(v, me.loan!)} onClick={() => act("repayLoan", { amount: v })} className={`${btn} bg-muted text-sm`}>Pagar {G.money(Math.min(v, me.loan!))}</button>)}
            <button disabled={me.balance < me.loan} onClick={() => act("repayLoan", { amount: me.loan! })} className={`${btn} bg-secondary text-sm`}>Quitar</button>
          </div>
        </Card>
      )}
      <Gazette state={state} className="text-sm" />
      <RelicTracker state={state} className="text-sm" />
      {pd?.kind === "scratch" && pd.playerId !== pid && <ScratchingBanner state={state} />}
      {state.phase === "over" && <MoneyRain />}
      {touchesMe && <TransferShow state={state} top />}

      {state.phase === "lobby" ? (
        <Card>
          <p className="font-display text-xl">Aguardando o tabuleiro começar…</p>
          <div className="mt-2 flex justify-center gap-1">{state.players.map((p) => <Animal key={p.id} id={p.animal} className="h-12 w-auto" />)}</div>
        </Card>
      ) : (
        <Card highlight={myTurn}>
          <div className="flex items-center justify-center gap-2">
            <Animal id={cur?.animal} className="h-14 w-auto" />
            <div className="text-left">
              <p className="text-xs uppercase text-muted-foreground">Vez de</p>
              <p className="font-display text-3xl leading-none" style={{ color: cur?.color }}>{myTurn ? "Você!" : cur?.name}</p>
            </div>
          </div>
          <div className="my-3 flex justify-center"><DicePair dice={state.dice} rollId={state.rollId} size={68} /></div>
          {state.phase === "over" && <p className="font-display text-2xl">{`🏆 ${state.players.find((p) => p.id === state.winner)?.name ?? "Ninguém"} venceu!`}</p>}
          {me.out && <p className="font-display text-xl text-destructive">Você faliu 😢</p>}
          {myTurn && !pd && !state.moving && me.jail ? (
            <div className="mb-2 rounded-xl border-4 border-border bg-muted p-2">
              <p className="font-display">👮 Na Delegacia ({me.jail} tentativa{me.jail > 1 ? "s" : ""})</p>
              <p className="mb-2 text-sm">Tire dupla nos dados para sair, ou pague a fiança.</p>
              <button disabled={me.balance < G.JAIL_FINE} onClick={() => act("bail")} className={`${btn} bg-secondary`}>Pagar fiança {G.money(G.JAIL_FINE)}</button>
            </div>
          ) : null}
          {myTurn && !pd && state.phase === "playing" && (
            <button disabled={state.moving || (G.horrorActive(state) && (state.curse?.sanity[pid] ?? 0) <= 0)} onClick={() => { sfx.dice(); navigator.vibrate?.([40, 60, 40]); act("roll", { rollId: state.rollId }); }} className={`${btn} bg-primary py-5 text-2xl text-primary-foreground`}>
              {state.moving ? "Andando…" : "🎲 Jogar dados"}
            </button>
          )}
          {state.event && <p key={state.event.id} className="animate-pop mt-2 text-sm font-bold">{paymentText(state.event.text)}</p>}
        </Card>
      )}


      {pd?.kind === "auction" && !me.out && (() => {
        const turnId = G.auctionTurn(state);
        const mine = turnId === pid;
        const left = Math.max(0, Math.ceil((pd.endsAt - now) / 1000));
        return (
          <Card highlight={mine}>
            <p className="text-xs font-bold uppercase text-muted-foreground">Leilão · {mine ? `sua vez · ${left}s` : `vez de ${state.players.find((p) => p.id === turnId)?.name ?? "?"} · ${left}s`}</p>
            <p className="font-display text-2xl">{G.boardFor(state)[pd.square]!.name}</p>
            <p className="mb-3 text-sm">Lance atual: <b>{G.money(pd.bid)}</b>{pd.bidder ? ` · ${pd.bidder === pid ? "seu!" : state.players.find((p) => p.id === pd.bidder)?.name}` : ""} · Tabela {G.money(G.boardFor(state)[pd.square]!.price!)}</p>
            <div className="mb-3"><TitleInfo state={state} square={pd.square} /></div>
            {mine ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {[G.AUCTION_STEP, 50, 100].map((inc) => (
                    <button key={inc} disabled={pd.bid + inc > G.bidPower(state, pid, pd.square)} onClick={() => act("bid", { amount: pd.bid + inc })} className={`${btn} bg-secondary text-base`}>+{inc}</button>
                  ))}
                </div>
                {(() => { const f = G.financeSplit(me.balance, pd.bid + G.AUCTION_STEP); return f.loan > 0 ? <p className="mt-2 text-xs text-muted-foreground">🏛️ Crédito do Banco: até {G.money(G.auctionCredit(state, pid, pd.square))}. Se ganhar acima do seu saldo, você paga metade do saldo e o resto vira financiamento.</p> : null; })()}
                <button onClick={() => act("pass")} className={`${btn} mt-2 bg-muted text-base`}>Passar</button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{pd.order.includes(pid) ? "Aguarde sua vez de dar lance." : "Você saiu deste leilão."}</p>
            )}
          </Card>
        );
      })()}

      {pd?.kind === "buy" && pd.playerId === pid && !state.moving && (() => {
        const sq = G.boardFor(state)[pd.square]!;
        return (
          <Card>
            <p className="font-display text-sm uppercase tracking-widest text-accent">Terreno à venda</p>
            <p className="font-display text-2xl">{sq.name}</p>
            <p className="mb-3 text-sm">Preço <b>{G.money(sq.price ?? 0)}</b> · Você tem {G.money(me.balance)}</p>
            <div className="mb-3"><TitleInfo state={state} square={pd.square} /></div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => act("buy", { accept: true })} className={`${btn} bg-success text-success-foreground`}>Comprar</button>
              <button onClick={() => act("buy", { accept: false })} className={`${btn} bg-muted text-base`}>Não quero</button>
            </div>
          </Card>
        );
      })()}
      {pd?.kind === "buy" && pd.playerId !== pid && (
        <Card><p className="text-sm">{state.players.find((p) => p.id === pd.playerId)?.name} está decidindo se compra <b>{G.boardFor(state)[pd.square]!.name}</b>…</p></Card>
      )}

      {pd?.kind === "collect" && pd.targetId === pid && (
        <Card highlight>
          <p className="font-display text-xl">🎉 {paymentText(pd.reason)}</p>
          <p className="text-sm">Aguardando os jogadores enviarem {G.money(pd.amount)}… ({pd.paid.length} de {pd.paid.length + G.collectPending(state).length} enviados)</p>
        </Card>
      )}
      {pd?.kind === "collect" && pd.targetId !== pid && !me.out && (
        <Card highlight={!pd.paid.includes(pid)}>
          <p className="font-display text-lg">🎟️ {state.players.find((p) => p.id === pd.targetId)?.name} tirou: {paymentText(pd.reason)}</p>
          {pd.paid.includes(pid) ? (
            <p className="mt-2 font-display text-success">✓ {G.money(pd.amount)} enviado!</p>
          ) : (
            <button onClick={() => { sfx.pix(); act("payCollect"); }} className={`${btn} mt-2 bg-success text-success-foreground`}>💸 Enviar {G.money(pd.amount)}</button>
          )}
        </Card>
      )}

      {pd?.kind === "debt" && pd.playerId === pid && (
        <Card highlight>
          <p className="font-display text-xl text-destructive">⚠️ Risco de falência</p>
          <p className="mb-2">Você precisa de <b>{G.money(pd.amount)}</b> ({pd.reason}). Tem {G.money(me.balance)}.</p>
          <p className="mb-3 text-sm text-muted-foreground">Venda {G.buildingName(state, false, true)}, hipoteque ou negocie terrenos em "Seus bairros" abaixo e depois pague.</p>
          <div className="flex gap-2">
            <button disabled={me.balance < pd.amount} onClick={() => act("payDebt")} className={`${btn} bg-success text-success-foreground`}>Pagar dívida</button>
            <button onClick={() => act("giveUp")} className={`${btn} bg-muted`}>Declarar falência</button>
          </div>
        </Card>
      )}
      {pd?.kind === "debt" && pd.playerId !== pid && (
        <Card><p className="text-sm">⚠️ {state.players.find((p) => p.id === pd.playerId)?.name} está tentando juntar {G.money(pd.amount)} para não falir…</p></Card>
      )}
      {iPay && pd?.kind === "pix" && (
        <Card highlight>
          <p className="font-display text-sm uppercase tracking-widest text-destructive">{paymentText(pd.reason)}</p>
          <p className="font-display text-2xl">Pague {G.money(pd.amount)}</p>
          <p className="mb-3 text-sm">para {state.players.find((p) => p.id === pd.to)?.name} · Você tem {G.money(me.balance)}</p>
          <Button onClick={() => { sfx.pix(); act("pixConfirm", { id: pd.id }); }} className={`${btn} mt-2 h-auto whitespace-normal bg-success text-success-foreground hover:bg-success/90`}>Confirmar pagamento de {G.money(pd.amount)}</Button>
          {pd.reason === "Pix" && <Button variant="secondary" onClick={() => act("pixCancel")} className={`${btn} mt-2 h-auto bg-muted text-base`}>Cancelar</Button>}
        </Card>
      )}
      {iReceive && pd?.kind === "pix" && (
        <Card highlight>
          <p className="font-display text-sm uppercase tracking-widest text-success">Você vai receber</p>
          <p className="font-display text-3xl">{G.money(pd.amount)}</p>
          <p className="mb-3 text-sm">de {state.players.find((p) => p.id === pd.from)?.name} · {paymentText(pd.reason)}</p>
          <p role="status" className="mt-2 text-sm text-muted-foreground">Aguardando confirmação do pagamento…</p>
        </Card>
      )}
      {pd?.kind === "pix" && !iPay && !iReceive && (
        <Card><p className="text-sm">{state.players.find((p) => p.id === pd.from)?.name} está pagando {G.money(pd.amount)} a {state.players.find((p) => p.id === pd.to)?.name}…</p></Card>
      )}
      {state.offer?.to === pid && (() => {
        const o = state.offer!;
        const nm = (l: number[]) => l.map((i) => G.boardFor(state)[i]!.name);
        const you = [...nm(o.wantSquares ?? []), o.cashTo > 0 ? G.money(o.cashTo) : ""].filter(Boolean).join(" + ") || "nada";
        const get = [...nm(o.giveSquares ?? []), o.cashFrom > 0 ? G.money(o.cashFrom) : ""].filter(Boolean).join(" + ") || "nada";
        return (
          <Card highlight>
            <p className="font-display text-xl">🤝 Proposta de {state.players.find((p) => p.id === o.from)?.name}</p>
            <p className="mt-2">Você entrega: <b>{you}</b></p>
            <p className="mb-3">Você recebe: <b>{get}</b></p>
            <div className="flex gap-2">
              {me.balance < o.cashTo && <p className="mb-2 text-sm font-bold text-destructive">Saldo insuficiente para pagar {G.money(o.cashTo)}.</p>}
              <button disabled={me.balance < o.cashTo} onClick={() => act("tradeAnswer", { id: o.id, accept: true })} className={`${btn} bg-success text-success-foreground`}>Aceitar negociação</button>
              <button onClick={() => act("tradeAnswer", { id: o.id, accept: false })} className={`${btn} bg-muted`}>Recusar</button>
            </div>
          </Card>
        );
      })()}
      {state.offer?.from === pid && (
        <Card>
          <p className="text-sm">Aguardando resposta: {G.offerText(state, state.offer)}…</p>
          <button onClick={() => act("tradeAnswer", { id: state.offer!.id, accept: false })} className={`${btn} mt-2 bg-muted text-base`}>Cancelar oferta</button>
        </Card>
      )}


      {state.phase === "playing" && !me.out && state.players.filter((p) => !p.out).length > 1 && (
        <button disabled={!!state.offer} onClick={() => setTrade({})} className={`${btn} w-full bg-accent text-accent-foreground`}>🤝 Negociar</button>
      )}
      {mine.length > 0 && <Neighborhoods state={state} pid={pid} balance={me.balance} act={act} onInspect={setInspect} onSell={(i) => setTrade({ give: [i] })} onTrade={(to) => !state.offer && state.phase === "playing" && setTrade({ to })} />}

      {state.phase !== "lobby" && !me.out && <StreetStrip state={state} playerId={pid} onPick={setInspect} />}
      {state.phase !== "lobby" && <button onClick={() => setMap(true)} className="mx-auto min-h-12 rounded-xl px-3 text-sm font-bold text-primary underline underline-offset-4">🗺️ Ver Tabuleiro Completo</button>}
      {map && <MiniMap state={state} onClose={() => setMap(false)} />}
      {inspect !== null && <PropertyDetails state={state} square={inspect} onClose={() => setInspect(null)} />}

      {pd?.kind === "scratch" && pd.playerId === pid && state.card && !state.moving && (
        <ScratchCard key={state.card.id} text={paymentText(state.card.text)} good={state.card.good} onDone={() => act("scratch")} />
      )}
      {trade && state.phase === "playing" && (
        <TradeTable state={state} pid={pid} initialTo={trade.to} initialGive={trade.give} onClose={() => setTrade(null)} onSend={(p) => { act("trade", p); setTrade(null); }} />
      )}
      {state.phase === "playing" && !me.out && <ReactionBar onReact={(emoji) => { navigator.vibrate?.(15); act("react", { emoji }); }} />}
    </main>
  );
}

function Card({ children, highlight }: { children: ReactNode; highlight?: boolean }) {
  return <section className={`animate-pop rounded-2xl border-4 border-border bg-card p-4 text-center shadow-[6px_6px_0_var(--foreground)] ${highlight ? "ring-4 ring-secondary" : ""}`}>{children}</section>;
}
function Center({ children }: { children: ReactNode }) {
  return <main className="azulejo flex min-h-dvh items-center justify-center p-4 text-center font-display">{children}</main>;
}

const miniBtn = "min-h-12 flex-1 py-2 text-xs font-bold disabled:opacity-40";
/** Lands grouped by color, with who owns the ones still missing. */
function Neighborhoods({ state, pid, balance, act, onSell, onInspect, onTrade }: { state: G.GameState; pid: string; balance: number; act: (t: string, p?: Record<string, unknown>) => void; onSell: (i: number) => void; onInspect: (i: number) => void; onTrade: (to: string) => void }) {
  const groups = [...new Set(G.boardFor(state).map((b, i) => (state.owners[i] === pid ? b.group : undefined)).filter((g): g is number => g !== undefined))].sort((a, b) => a - b);
  const label = (g: number) => (g === 8 ? "Rodoviárias" : g === 9 ? "Companhias" : `Bairro ${g + 1}`);
  return (
    <section className="space-y-2">
      <p className="font-display">Seus bairros</p>
      {groups.map((g) => {
        const sqs = G.boardFor(state).map((b, i) => ({ b, i })).filter(({ b }) => b.group === g);
        const have = sqs.filter(({ i }) => state.owners[i] === pid).length;
        const full = have === sqs.length;
        return (
          <div key={g} className="overflow-hidden rounded-xl border-4 border-border bg-card shadow-[4px_4px_0_var(--foreground)]">
            <div className="flex items-center justify-between px-3 py-1 font-display text-sm" style={{ background: `var(--group-${g})` }}>
              <span><b className="mr-1 rounded px-1 text-card" style={{ background: `var(--group-${g})` }}>{G.groupTag(g)}</b>{label(g)}</span>
              <span className="rounded-full bg-card px-2 text-xs">{full ? "🌟 Completo" : `${have} de ${sqs.length}`}</span>
            </div>
            <ul className="divide-y-2 divide-border">
              {sqs.map(({ b, i }) => {
                const owner = state.players.find((p) => p.id === state.owners[i]);
                if (owner?.id !== pid) return (
                  <li key={i}>
                    <div className="flex min-h-12 w-full items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground">
                      <button type="button" onClick={() => onInspect(i)} className="min-h-10 flex-1 truncate text-left">{b.name} <span aria-hidden className="text-xs">ⓘ</span></button>
                      {owner ? (
                        <button type="button" onClick={() => onTrade(owner.id)} aria-label={`Negociar com ${owner.name}`} className="flex min-h-10 items-center gap-1 rounded-lg bg-muted px-1.5">
                          <Animal id={owner.animal} className="h-7 w-auto drop-shadow-sm" /><span className="text-xs font-bold" style={{ color: owner.color }}>{owner.name}</span><span aria-hidden>🤝</span>
                        </button>
                      ) : <span className="text-xs">Livre · {G.money(b.price ?? 0)}</span>}
                    </div>
                  </li>
                );
                const h = G.housesAt(state, i);
                const mort = G.isMortgaged(state, i);
                const groupHasHouses = G.boardFor(state).some((x, j) => x.group === g && G.housesAt(state, j) > 0);
                const canBuild = g < 8 && !mort && G.ownsGroup(state, pid, g) && h < G.MAX_HOUSES && !G.boardFor(state).some((x, j) => x.group === g && G.housesAt(state, j) < h) && !G.boardFor(state).some((x, j) => x.group === g && G.isMortgaged(state, j));
                return (
                  <li key={i} className={`px-3 py-1.5 text-sm ${mort ? "bg-muted" : ""}`}>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => onInspect(i)} className="min-h-10 flex-1 truncate text-left font-bold underline decoration-dotted underline-offset-4">{b.name}</button>
                      <span className="text-xs">{h ? (h >= G.MAX_HOUSES ? "🏠" : "⛺".repeat(h)) : ""} {mort ? "Hipotecado" : `Aluguel ${G.money(G.rentFor(state, i))}`}</span>
                    </div>
                    {state.phase === "playing" && !G.horrorActive(state) && (
                      <div className="mt-1 flex gap-1 overflow-hidden rounded-md border-2 border-border">
                        {mort ? (
                          <button disabled={state.moving || balance < G.unmortgageCost(i, state)} onClick={() => act("unmortgage", { square: i })} className={`${miniBtn} bg-muted`}>Resgatar {G.money(G.unmortgageCost(i, state))}</button>
                        ) : !groupHasHouses && (
                          <>
                            <button disabled={state.moving} onClick={() => act("mortgage", { square: i })} className={`${miniBtn} bg-muted`}>Hipotecar +{G.money(G.mortgageValue(i, state))}</button>
                            <button disabled={!!state.offer} onClick={() => onSell(i)} className={`${miniBtn} bg-accent text-accent-foreground`}>Negociar</button>
                          </>
                        )}
                        {h > 0 && (
                          <button disabled={state.moving || G.boardFor(state).some((x, j) => x.group === g && G.housesAt(state, j) > h)} onClick={() => { if (window.confirm(`Vender ${h >= G.MAX_HOUSES ? `o ${G.buildingName(state, true)}` : `${G.buildingArticle(state)} ${G.buildingName(state)}`} de ${G.boardFor(state)[i]!.name} por ${G.money(G.houseSaleValue(g))}?`)) act("sellHouse", { square: i }); }} className="min-h-8 rounded-lg bg-muted px-2 py-1 text-xs font-semibold disabled:opacity-40">
                            Vender {G.buildingName(state, h >= G.MAX_HOUSES)} +{G.money(G.houseSaleValue(g))}
                          </button>
                        )}
                        {canBuild && (
                          <button disabled={state.moving || balance < G.houseCost(g) || !!state.players.find((x) => x.id === pid)?.loan} onClick={() => act("build", { square: i })} className={`${miniBtn} bg-secondary`}>
                            {h === G.MAX_HOUSES - 1 ? "🏠" : "⛺"} {G.money(G.houseCost(g))}
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

function ReactionBar({ onReact }: { onReact: (e: string) => void }) {
  const [cool, setCool] = useState(false);
  return (
    <div className="sticky bottom-2 z-30 flex justify-between gap-1 rounded-full border-4 border-border bg-card px-2 py-1 shadow-[4px_4px_0_var(--foreground)]" aria-label="Reações para a TV">
      {G.REACTIONS.map((e) => (
        <button key={e} type="button" disabled={cool} aria-label={`Reagir ${e}`} onClick={() => { onReact(e); setCool(true); setTimeout(() => setCool(false), 1500); }} className="text-2xl leading-none transition active:scale-125 disabled:opacity-40">{e}</button>
      ))}
    </div>
  );
}
