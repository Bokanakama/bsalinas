import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getPlayerId, sendAction, useRoomState } from "@/lib/room";
import * as G from "@/lib/game";
import { DicePair } from "@/components/Dice";
import { PixScanner } from "@/components/PixScanner";
import { Animal } from "@/components/Animal";
import { TransferShow } from "@/components/TransferShow";
import { sfx } from "@/lib/sfx";
import { StreetStrip } from "@/components/StreetStrip";
import { PropertyDetails } from "@/components/PropertyDetails";
import { TradeTable } from "@/components/TradeTable";
import { ScratchCard } from "@/components/ScratchCard";
import { Gazette, MoneyRain, ScratchingBanner, TitleInfo } from "@/components/GameInfo";

export const Route = createFileRoute("/jogar/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Carteira — sala ${params.code} | Cidade Boró` },
      { name: "description", content: "Sua carteira de Borós: escolha seu bichinho, jogue os dados e compre terrenos." },
      { property: "og:title", content: "Carteira — Cidade Boró" },
      { property: "og:description", content: "Entre na partida de Cidade Boró pelo celular." },
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
  const [camera, setCamera] = useState(false);
  const [trade, setTrade] = useState<{ to?: string; give?: number[] } | null>(null);
  const [now, setNow] = useState(0);
  const [inspect, setInspect] = useState<number | null>(null);
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
  useEffect(() => { if (animal && taken.has(animal as G.AnimalId) && !me) { setAnimal(""); setSent(false); } }, [state?.players.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevBal = useRef<number | null>(null);
  useEffect(() => {
    if (!me) return;
    if (prevBal.current !== null && me.balance !== prevBal.current) (me.balance > prevBal.current ? sfx.coin : sfx.bad)();
    prevBal.current = me.balance;
  }, [me?.balance, me]);
  useEffect(() => { if (myTurn && !state?.moving && !pd) { sfx.turn(); navigator.vibrate?.(150); } }, [myTurn, state?.turn]); // eslint-disable-line react-hooks/exhaustive-deps

  const pixId = pd?.kind === "pix" ? pd.id : "";
  useEffect(() => setCamera(false), [pixId]);
  const onScan = useCallback((text: string) => {
    try {
      const d = JSON.parse(text);
      if (d.pix === pixId) { sfx.pix(); act("pixConfirm", { id: pixId }); }
    } catch { /* not ours */ }
  }, [pixId, act]);

  if (missing) return <Center>Sala {code} não existe. <Link to="/" className="text-primary underline">Voltar</Link></Center>;
  if (!state || !pid) return <Center><span className="flex flex-col items-center gap-3"><span className="animate-spin-slow text-5xl">🎲</span>Conectando à sala…</span></Center>;

  if (!me) {
    if (state.phase !== "lobby") return <Center>A partida já começou.</Center>;
    return (
      <Center>
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim() && animal) { act("join", { name, animal }); setSent(true); } }} className="w-full max-w-sm space-y-3 rounded-2xl border-4 border-border bg-card p-5 shadow-[6px_6px_0_var(--foreground)]">
          <h1 className="font-display text-3xl text-primary">Sala {code}</h1>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={16} placeholder="Seu nome" aria-label="Seu nome" autoComplete="nickname" className="w-full rounded-xl border-4 border-border bg-background p-3 text-xl" />
          <p className="font-display">Escolha seu bichinho</p>
          <div className="grid grid-cols-3 gap-2">
            {G.ANIMALS.map((a) => {
              const off = taken.has(a.id);
              return (
                <button type="button" key={a.id} disabled={off} onClick={() => setAnimal(a.id)}
                  className={`relative flex flex-col items-center rounded-xl border-4 p-1 transition ${animal === a.id ? "scale-105 border-border bg-secondary" : "border-transparent bg-muted"} disabled:opacity-30`}>
                  <Animal id={a.id} className={`h-20 w-auto ${animal === a.id ? "animate-bob" : ""}`} />
                  <span className="text-xs font-bold">{off ? "Ocupado" : a.name}</span>
                </button>
              );
            })}
          </div>
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
    <main className="azulejo mx-auto flex min-h-dvh max-w-md flex-col gap-3 p-3">
      {netFail && (
        <button role="alert" onClick={() => setNetFail(false)} className="sticky top-2 z-50 rounded-xl border-4 border-border bg-destructive px-3 py-2 text-sm font-bold text-destructive-foreground">
          📶 Sua jogada não chegou ao tabuleiro. Confira a internet e toque de novo.
        </button>
      )}
      <header className="cedula relative overflow-hidden rounded-2xl border-4 border-border p-4 shadow-[6px_6px_0_var(--foreground)]">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <span>Banco Boró · Sala {code}</span>
          <span>{G.ANIMALS.find((a) => a.id === me.animal)?.name}</span>
        </div>
        <p className="font-display text-2xl" style={{ color: me.color }}>{me.name}</p>
        <p className="text-xs uppercase text-muted-foreground">Saldo</p>
        <p key={me.balance} className={`animate-pop font-display text-5xl ${me.balance < 0 ? "text-destructive" : "text-foreground"}`}>{G.money(me.balance)}</p>
        <p className="text-sm">📍 {G.BOARD[me.pos]!.name}{me.freeJail ? ` · 🎫 Saia Livre ×${me.freeJail}` : ""}</p>
        <Animal id={me.animal} className="absolute -bottom-2 right-1 h-28 w-auto" />
      </header>

      <Gazette state={state} className="text-sm" />
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
          {state.phase === "over" && <p className="font-display text-2xl">🏆 {state.players.find((p) => p.id === state.winner)?.name} venceu!</p>}
          {me.out && <p className="font-display text-xl text-destructive">Você faliu 😢</p>}
          {myTurn && !pd && !state.moving && me.jail ? (
            <div className="mb-2 rounded-xl border-4 border-border bg-muted p-2">
              <p className="font-display">👮 Na Delegacia ({me.jail} tentativa{me.jail > 1 ? "s" : ""})</p>
              <p className="mb-2 text-sm">Tire dupla nos dados para sair, ou pague a fiança.</p>
              <button disabled={me.balance < G.JAIL_FINE} onClick={() => act("bail")} className={`${btn} bg-secondary`}>Pagar fiança {G.money(G.JAIL_FINE)}</button>
            </div>
          ) : null}
          {myTurn && !pd && state.phase === "playing" && (
            <button disabled={state.moving} onClick={() => { sfx.dice(); act("roll", { rollId: state.rollId }); }} className={`${btn} bg-primary py-5 text-2xl text-primary-foreground`}>
              {state.moving ? "Andando…" : "🎲 Jogar dados"}
            </button>
          )}
          {state.event && <p key={state.event.id} className="animate-pop mt-2 text-sm font-bold">{state.event.text}</p>}
        </Card>
      )}


      {pd?.kind === "auction" && !me.out && (() => {
        const turnId = G.auctionTurn(state);
        const mine = turnId === pid;
        const left = Math.max(0, Math.ceil((pd.endsAt - now) / 1000));
        return (
          <Card highlight={mine}>
            <p className="text-xs font-bold uppercase text-muted-foreground">Leilão · {mine ? `sua vez · ${left}s` : `vez de ${state.players.find((p) => p.id === turnId)?.name ?? "?"} · ${left}s`}</p>
            <p className="font-display text-2xl">{G.BOARD[pd.square]!.name}</p>
            <p className="mb-3 text-sm">Lance atual: <b>{G.money(pd.bid)}</b>{pd.bidder ? ` · ${pd.bidder === pid ? "seu!" : state.players.find((p) => p.id === pd.bidder)?.name}` : ""} · Tabela {G.money(G.BOARD[pd.square]!.price!)}</p>
            <div className="mb-3"><TitleInfo state={state} square={pd.square} /></div>
            {mine ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {[G.AUCTION_STEP, 50, 100].map((inc) => (
                    <button key={inc} disabled={pd.bid + inc > me.balance} onClick={() => act("bid", { amount: pd.bid + inc })} className={`${btn} bg-secondary text-base`}>+{inc}</button>
                  ))}
                </div>
                <button onClick={() => act("pass")} className={`${btn} mt-2 bg-muted text-base`}>Passar</button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{pd.order.includes(pid) ? "Aguarde sua vez de dar lance." : "Você saiu deste leilão."}</p>
            )}
          </Card>
        );
      })()}

      {pd?.kind === "buy" && pd.playerId === pid && !state.moving && (() => {
        const sq = G.BOARD[pd.square]!;
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
        <Card><p className="text-sm">{state.players.find((p) => p.id === pd.playerId)?.name} está decidindo se compra <b>{G.BOARD[pd.square]!.name}</b>…</p></Card>
      )}

      {pd?.kind === "collect" && pd.targetId === pid && (
        <Card highlight>
          <p className="font-display text-xl">🎉 {pd.reason}</p>
          <p className="text-sm">Aguardando os jogadores enviarem {G.money(pd.amount)}… ({pd.paid.length} de {pd.paid.length + G.collectPending(state).length} enviados)</p>
        </Card>
      )}
      {pd?.kind === "collect" && pd.targetId !== pid && !me.out && (
        <Card highlight={!pd.paid.includes(pid)}>
          <p className="font-display text-lg">🎟️ {state.players.find((p) => p.id === pd.targetId)?.name} tirou: {pd.reason}</p>
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
          <p className="mb-3 text-sm text-muted-foreground">Hipoteque ou venda terrenos em "Seus bairros" abaixo e depois pague.</p>
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
          <p className="font-display text-sm uppercase tracking-widest text-destructive">{pd.reason}</p>
          <p className="font-display text-2xl">Pague {G.money(pd.amount)}</p>
          <p className="mb-3 text-sm">para {state.players.find((p) => p.id === pd.to)?.name} · Você tem {G.money(me.balance)}</p>
          {camera ? <PixScanner onScan={onScan} /> : (
            <button onClick={() => setCamera(true)} className={`${btn} mb-2 bg-secondary`}>📷 Ler QR code do Pix</button>
          )}
          <button onClick={() => { sfx.pix(); act("pixConfirm", { id: pd.id }); }} className={`${btn} mt-2 bg-success text-success-foreground`}>Pagar direto</button>
          {pd.reason === "Pix" && <button onClick={() => act("pixCancel")} className={`${btn} mt-2 bg-muted text-base`}>Cancelar</button>}
        </Card>
      )}
      {iReceive && pd?.kind === "pix" && (
        <Card highlight>
          <p className="font-display text-sm uppercase tracking-widest text-success">Você vai receber</p>
          <p className="font-display text-3xl">{G.money(pd.amount)}</p>
          <p className="mb-3 text-sm">de {state.players.find((p) => p.id === pd.from)?.name} · {pd.reason}</p>
          <div className="mx-auto w-fit rounded-xl bg-card p-2"><QRCodeSVG value={JSON.stringify({ pix: pd.id })} size={200} /></div>
          <p className="mt-2 text-xs text-muted-foreground">Mostre este código para quem vai pagar.</p>
        </Card>
      )}
      {pd?.kind === "pix" && !iPay && !iReceive && (
        <Card><p className="text-sm">{state.players.find((p) => p.id === pd.from)?.name} está pagando {G.money(pd.amount)} a {state.players.find((p) => p.id === pd.to)?.name}…</p></Card>
      )}
      {state.offer?.to === pid && (() => {
        const o = state.offer!;
        const nm = (l: number[]) => l.map((i) => G.BOARD[i]!.name);
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
      {inspect !== null && <PropertyDetails state={state} square={inspect} onClose={() => setInspect(null)} />}

      {pd?.kind === "scratch" && pd.playerId === pid && state.card && !state.moving && (
        <ScratchCard key={state.card.id} text={state.card.text} good={state.card.good} onDone={() => act("scratch")} />
      )}
      {trade && state.phase === "playing" && (
        <TradeTable state={state} pid={pid} initialTo={trade.to} initialGive={trade.give} onClose={() => setTrade(null)} onSend={(p) => { act("trade", p); setTrade(null); }} />
      )}
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
  const groups = [...new Set(G.BOARD.map((b, i) => (state.owners[i] === pid ? b.group : undefined)).filter((g): g is number => g !== undefined))].sort((a, b) => a - b);
  const label = (g: number) => (g === 8 ? "Rodoviárias" : g === 9 ? "Companhias" : `Bairro ${g + 1}`);
  return (
    <section className="space-y-2">
      <p className="font-display">Seus bairros</p>
      {groups.map((g) => {
        const sqs = G.BOARD.map((b, i) => ({ b, i })).filter(({ b }) => b.group === g);
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
                const groupHasHouses = G.BOARD.some((x, j) => x.group === g && G.housesAt(state, j) > 0);
                const canBuild = g < 8 && !mort && G.ownsGroup(state, pid, g) && h < G.MAX_HOUSES;
                return (
                  <li key={i} className={`px-3 py-1.5 text-sm ${mort ? "bg-muted" : ""}`}>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => onInspect(i)} className="min-h-10 flex-1 truncate text-left font-bold underline decoration-dotted underline-offset-4">{b.name}</button>
                      <span className="text-xs">{h ? (h >= G.MAX_HOUSES ? "🏠" : "⛺".repeat(h)) : ""} {mort ? "Hipotecado" : `Aluguel ${G.money(G.rentFor(state, i))}`}</span>
                    </div>
                    {state.phase === "playing" && (
                      <div className="mt-1 flex gap-1 overflow-hidden rounded-md border-2 border-border">
                        {mort ? (
                          <button disabled={state.moving || balance < G.unmortgageCost(i)} onClick={() => act("unmortgage", { square: i })} className={`${miniBtn} bg-muted`}>Resgatar {G.money(G.unmortgageCost(i))}</button>
                        ) : !groupHasHouses && (
                          <>
                            <button disabled={state.moving} onClick={() => act("mortgage", { square: i })} className={`${miniBtn} bg-muted`}>Hipotecar +{G.money(G.mortgageValue(i))}</button>
                            <button disabled={!!state.offer} onClick={() => onSell(i)} className={`${miniBtn} bg-accent text-accent-foreground`}>Negociar</button>
                          </>
                        )}
                        {canBuild && (
                          <button disabled={state.moving || balance < G.houseCost(g)} onClick={() => act("build", { square: i })} className={`${miniBtn} bg-secondary`}>
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
