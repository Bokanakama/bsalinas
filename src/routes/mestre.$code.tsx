import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { publishState, joinRoomChannel, ensureRoomAccess, accessRoom } from "@/lib/room";
import * as G from "@/lib/game";
import { Board } from "@/components/Board";
import { DicePair } from "@/components/Dice";
import { music, sfx, voice, type VoiceClip } from "@/lib/sfx";
import { Animal } from "@/components/Animal";
import { TransferShow } from "@/components/TransferShow";
import { Gazette, MoneyRain, ScratchingBanner, TitleInfo } from "@/components/GameInfo";
import { paymentText } from "@/lib/payment-text";

export const Route = createFileRoute("/mestre/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Tabuleiro ${params.code} — Banco Boró e Salinas` },
      { name: "description", content: "Tabuleiro mestre e banco central da partida de Banco Boró e Salinas." },
      { property: "og:title", content: "Tabuleiro — Banco Boró e Salinas" },
      { property: "og:description", content: "O banco central da partida: saldos, dados e movimentos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Master,
});

interface ActionRow { id: string; player_id: string; type: string; payload: { name?: string; accept?: boolean; to?: string; amount?: number; id?: string }; created_at: string }

function Master() {
  const { code } = Route.useParams();
  const [state, setState] = useState<G.GameState | null>(null);
  const [missing, setMissing] = useState(false);
  const [displayPos, setDisplayPos] = useState<Record<string, number>>({});
  const [origin, setOrigin] = useState("");
  const [focus, setFocus] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [voiceOn, setVoice] = useState(true);
  const voiceRef = useRef(true);
  voiceRef.current = voiceOn;
  const [song, setSong] = useState(false);
  const [now, setNow] = useState(0);
  useEffect(() => () => music.stop(), []);
  const ref = useRef<G.GameState | null>(null);
  const seen = useRef(new Set<string>());
  const queue = useRef(Promise.resolve());

  const commit = useCallback((next: G.GameState) => {
    ref.current = next;
    setState(next);
    void publishState(code, next).catch(() => console.error("Não deu para salvar a sala."));
  }, [code]);

  const handle = useCallback(async (a: ActionRow) => {
    if (seen.current.has(a.id) || !ref.current) return;
    seen.current.add(a.id);
    let s: G.GameState = { ...ref.current, lastActionAt: a.created_at || ref.current.lastActionAt };
    const p = a.payload;
    switch (a.type) {
      case "join": s = G.join(s, a.player_id, String(p.name ?? ""), String((p as { animal?: string }).animal ?? "")); break;
      case "buy": s = G.buy(s, a.player_id, !!p.accept); break;
      case "pixConfirm": s = G.confirmPix(s, a.player_id, String(p.id)); break;
      case "pixCancel": s = G.cancelPix(s, a.player_id); break;
      case "bail": s = G.payBail(s, a.player_id); break;
      case "scratch": s = G.revealCard(s, a.player_id); break;
      case "bid": s = G.bid(s, a.player_id, Number(p.amount)); break;
      case "pass": s = G.passBid(s, a.player_id); break;
      case "mortgage": s = G.mortgage(s, a.player_id, Number((p as { square?: number }).square)); break;
      case "unmortgage": s = G.unmortgage(s, a.player_id, Number((p as { square?: number }).square)); break;
      case "trade": {
        const t = p as { to?: string; give?: number[]; want?: number[]; cashFrom?: number; cashTo?: number };
        s = G.proposeTrade(s, a.player_id, String(t.to), t.give ?? [], t.want ?? [], Number(t.cashFrom) || 0, Number(t.cashTo) || 0, crypto.randomUUID());
        break;
      }
      case "payDebt": s = G.payDebt(s, a.player_id); break;
      case "giveUp": s = G.giveUp(s, a.player_id); break;
      case "tradeAnswer": s = G.answerTrade(s, a.player_id, String(p.id), !!p.accept); break;
      case "payCollect": s = G.payCollect(s, a.player_id); break;
      case "build": s = G.build(s, a.player_id, Number((p as { square?: number }).square)); break;
      case "sellHouse": s = G.sellHouse(s, a.player_id, Number((p as { square?: number }).square)); break;
      case "autoResolve": s = G.autoResolve(s); break;
      case "skipTurn": s = G.skipTurn(s); break;
      case "kick": s = G.kickPlayer(s, String(p.id)); break;
      case "roll": {
        const before = s;
        const d1 = 1 + Math.floor(Math.random() * 6), d2 = 1 + Math.floor(Math.random() * 6);
        const rid = (p as { rollId?: unknown }).rollId; const seenRoll = typeof rid === "number" ? rid : undefined;
        s = G.roll(s, a.player_id, d1, d2, seenRoll);
        if (s !== before && !s.moving && d1 === d2 && voiceRef.current && s.players.find((x) => x.id === a.player_id)?.pos === G.JAIL) voice.play("tres_duplas");
        if (s === before) break;
        if (!s.moving) { sfx.dice(); break; }
        commit(s);
        sfx.dice();
        if (d1 === d2 && !s.players.find((x) => x.id === a.player_id)?.jail && voiceRef.current) {
          const dn = s.players.find((x) => x.id === a.player_id)?.doubles ?? 1;
          voice.play(dn >= 2 ? "dupla2" : "dupla1");
        }
        await new Promise((r) => setTimeout(r, 700));
        const from = before.players.find((x) => x.id === a.player_id)!.pos;
        setFocus(from);
        await new Promise((r) => setTimeout(r, 250));
        for (let k = 1; k <= d1 + d2; k++) {
          setDisplayPos((d) => ({ ...d, [a.player_id]: (from + k) % G.boardFor(s).length }));
          
          sfx.step();
          await new Promise((r) => setTimeout(r, 90));
        }
        await new Promise((r) => setTimeout(r, 400));
        setFocus(null);
        await new Promise((r) => setTimeout(r, 150));
        s = G.land(ref.current!, crypto.randomUUID());
        { const sq = G.boardFor(s)[s.players.find((x) => x.id === a.player_id)?.pos ?? 0]; if (sq?.group === 8) sfx.trainWhistle(); else if (sq?.kind === "rest" || sq?.name.includes("Cafezinho")) sfx.coffeeCup(); }
        break;
      }
    }
    commit(s);
  }, [commit]);

  const enqueue = useCallback((a: ActionRow) => { queue.current = queue.current.then(() => handle(a)).catch(console.error); }, [handle]);

  useEffect(() => {
    setOrigin(window.location.origin);
    let alive = true, fetching = false;
    let room: ReturnType<typeof joinRoomChannel> | undefined;
    (async () => {
      if (!await ensureRoomAccess(code, true)) { if (alive) setMissing(true); return; }
      if (!alive) return;
      const data = await accessRoom(code, "read", {}, true) as { state: G.GameState } | null;
      if (!data) return setMissing(true);
      let s = data.state;
      if (s.cityEvent?.kind === "padroeira" && s.cityEvent.expiresAt === undefined) {
        s = { ...s, cityEvent: G.activeCityEvent(s) ? { ...s.cityEvent, expiresAt: Date.now() + G.CITY_EVENT_MS } : null };
        commit(s);
      }
      if (!alive) return;
      ref.current = s; setState(s);
      setDisplayPos(Object.fromEntries(s.players.map((p) => [p.id, p.pos])));
      room = joinRoomChannel(code);
      room.ch.on("broadcast", { event: "player_action" }, () => void catchUp());
      room.subscribe(() => void catchUp());
      await catchUp();
    })().catch(() => { if (alive) setMissing(true); });
    async function catchUp() {
      if (!alive || fetching || !ref.current) return;
      fetching = true;
      try {
        const since = ref.current.lastActionAt;
        const backlog = await accessRoom(code, "actions", since ? { since } : {}, true) as unknown as ActionRow[];
        if (alive) backlog?.forEach((a) => { if (!seen.current.has(a.id)) enqueue(a); });
      } catch { /* Retry on the next poll after an interrupted connection. */ }
      finally { fetching = false; }
    }
    const poll = setInterval(() => { if (ref.current) void catchUp(); }, 1500);
    return () => { alive = false; clearInterval(poll); room?.leave(); };
  }, [code, enqueue, commit]);

  // The master persists the same expiry for every device, even between turns.
  const cityExpiresAt = state?.cityEvent?.expiresAt;
  useEffect(() => {
    if (cityExpiresAt === undefined) return;
    const timer = setTimeout(() => {
      queue.current = queue.current.then(() => {
        const current = ref.current;
        if (!current) return;
        const next = G.expireCityEvent(current);
        if (next !== current) commit(next);
      });
    }, Math.max(0, cityExpiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [cityExpiresAt, commit]);

  // Leilão: tick the clock and close it when time is up (through the same action queue).
  const auctionEnds = state?.pending?.kind === "auction" ? state.pending.endsAt : 0;
  useEffect(() => {
    if (!auctionEnds) return;
    const t = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= (ref.current?.pending?.kind === "auction" ? ref.current.pending.endsAt : Infinity)) {
        queue.current = queue.current.then(() => { const n = G.closeAuction(ref.current!); if (n !== ref.current) commit(n); });
      }
    }, 250);
    return () => clearInterval(t);
  }, [auctionEnds, commit]);

  // Raspadinha: if the player never finishes scratching, reveal it automatically.
  const scratchSince = state?.pending?.kind === "scratch" ? state.pending.since : 0;
  useEffect(() => {
    if (!scratchSince) return;
    const t = setTimeout(() => {
      queue.current = queue.current.then(() => { const n = G.revealCard(ref.current!); if (n !== ref.current) commit(n); });
    }, Math.max(1000, scratchSince + G.SCRATCH_MS - Date.now()));
    return () => clearTimeout(t);
  }, [scratchSince, commit]);

  // Cobrança coletiva: after the safety timeout, charge whoever has not sent yet.
  const collectEnds = state?.pending?.kind === "collect" ? state.pending.endsAt : 0;
  useEffect(() => {
    if (!collectEnds) return;
    const t = setTimeout(() => {
      queue.current = queue.current.then(() => { const n = G.finishCollect(ref.current!); if (n !== ref.current) commit(n); });
    }, Math.max(1000, collectEnds - Date.now() + 200));
    return () => clearTimeout(t);
  }, [collectEnds, commit]);

  /** Host buttons go through the same queue as phone actions. */
  const hostAct = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    const cur = ref.current ? G.current(ref.current) : undefined;
    enqueue({ id: `host-${crypto.randomUUID()}`, player_id: cur?.id ?? "", type, payload, created_at: "" });
  }, [enqueue]);

  // Turn timer: 60 s to roll, buy, pay rent or settle a debt; then the bank acts for the player.
  const tpd = state?.pending;
  // Turn timer disabled by request: players have unlimited time; the host can still skip or kick.
  const timed = false && !!tpd;
  const turnKey = timed ? `${state!.turn}|${state!.rollId}|${tpd?.kind ?? ""}|${tpd?.kind === "pix" ? tpd.id : ""}` : "";
  const [deadline, setDeadline] = useState(0);
  const [clock, setClock] = useState(0);
  useEffect(() => {
    if (!turnKey) { setDeadline(0); return; }
    const end = Date.now() + G.TURN_MS;
    setDeadline(end); setClock(Date.now());
    let fired = false, lastBeep = 0;
    const t = setInterval(() => {
      const n = Date.now();
      setClock(n);
      const left = Math.ceil((end - n) / 1000);
      if (left <= 10 && left > 0 && left !== lastBeep) { lastBeep = left; sfx.step(); }
      if (n >= end && !fired) {
        fired = true;
        const s = ref.current;
        if (!s) return;
        if (!s.pending) hostAct("roll", { rollId: s.rollId });
        else hostAct("autoResolve");
      }
    }, 250);
    return () => clearInterval(t);
  }, [turnKey, hostAct]);

  // Keep the actions table small: drop old processed actions every round and everything once the game ends.
  const round = state?.round ?? 0;
  const phase = state?.phase;
  useEffect(() => {
    if (!phase || phase === "lobby") return;
    void accessRoom(code, "prune", {}, true).catch(() => {});
  }, [round, phase, code]);
  const [hostFor, setHostFor] = useState<string | null>(null);

  // keep tokens in sync with state when not animating
  useEffect(() => {
    if (state && !state.moving) setDisplayPos(Object.fromEntries(state.players.map((p) => [p.id, p.pos])));
  }, [state]);

  const evId = state?.event?.id;
  useEffect(() => {
    if (!state?.event) return;
    if (state.event.tone === "good") sfx.coin(); else if (state.event.tone === "bad") sfx.bad();
    // Narração sutil: só notícias da cidade, Sorte/Revés e o vencedor.
    const t = paymentText(state.event.text);
    const clip: VoiceClip | null = state.phase === "over" ? "fim"
      : t.includes("ganhou o cartão Saia Livre") ? "saia_livre"
      : state.cityEvent && t.includes(state.cityEvent.text) ? (G.cityOf(state) === "boro" ? `boro_${state.cityEvent.kind}` : state.cityEvent.kind)
      : state.card && t.includes(state.card.text) ? (state.card.good ? "sorte" : "reves")
      : null;
    if (voiceOn && clip) voice.play(clip);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evId]);

  if (missing) return <div className="p-8 text-center font-display">Sala não encontrada ou este aparelho não tem autorização para controlar o tabuleiro. Crie uma nova sala ou volte ao aparelho que a criou. <Link to="/" className="text-primary underline">Voltar</Link></div>;
  if (!state) return <div className="azulejo flex h-dvh flex-col items-center justify-center gap-3 font-display"><span className="animate-spin-slow text-6xl">🎲</span>Montando o tabuleiro…</div>;

  const joinUrl = `${origin}/jogar/${code}`;
  const cur = G.current(state);
  const pd = state.pending;
  const nameOf = (id: string) => state.players.find((p) => p.id === id)?.name;

  const rentInfo = pd?.kind === "pix" && pd.reason !== "Pix" ? (() => {
    const sqIdx = G.boardFor(state).findIndex((b) => pd.reason === `Aluguel ${b.name}`);
    const sq = G.boardFor(state)[sqIdx];
    return { sq, doubled: sq && sq.group! < 8 && !G.housesAt(state, sqIdx) ? pd.amount > (sq.rent ?? 0) : false };
  })() : null;
  const fullscreen = () => { sfx.unlock(); if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen?.().catch(() => {}); };

  const winner = state.players.find((p) => p.id === state.winner);
  const ranking = [...state.players].sort((a, b) => G.netWorth(state, b.id) - G.netWorth(state, a.id));
  const center =
    state.phase === "over" ? (
      <>
        <p className="font-display text-[5.4cqw] uppercase text-muted-foreground">Fim de jogo</p>
        <Animal id={winner?.animal} className="animate-bob h-[39.6cqw] w-auto" />
        <p className="font-display text-[12.6cqw] leading-none" style={{ color: winner?.color }}>{winner?.name ?? "Ninguém"} venceu!</p>
        <ol className="w-[108.0cqw] space-y-[1.1cqw] text-left">
          {ranking.map((p, i) => (
            <li key={p.id} className={`flex items-center gap-[1.8cqw] rounded-lg border-2 border-border bg-card px-[2.2cqw] py-[0.7cqw] text-[4.0cqw] ${p.out ? "opacity-50" : ""}`}>
              <span className="font-display">{["🥇", "🥈", "🥉"][i] ?? `${i + 1}º`}</span>
              <Animal id={p.animal} className="h-[7.2cqw] w-auto" />
              <span className="flex-1 font-display" style={{ color: p.color }}>{p.name}</span>
              <span className="font-bold">{p.out ? "Faliu" : G.money(G.netWorth(state, p.id))}</span>
            </li>
          ))}
        </ol>
        {G.honors(state).length > 0 && (
          <div className="grid w-[108cqw] grid-cols-2 gap-[1.1cqw]">
            {G.honors(state).map((h) => (
              <div key={h.title} className="flex items-center gap-[1.4cqw] rounded-lg bg-foreground px-[1.8cqw] py-[0.8cqw] text-left text-background">
                <span className="text-[5cqw]">{h.icon}</span>
                <span className="min-w-0 flex-1 leading-tight"><span className="block font-display text-[3.2cqw] text-secondary">{h.title}</span><span className="text-[2.8cqw]">{h.player.name} · {h.value}</span></span>
              </div>
            ))}
          </div>
        )}
        <MoneyRain />
        <Link to="/" className="relative z-40 rounded-xl border-4 border-border bg-primary px-5 py-2 font-display text-primary-foreground">Nova partida</Link>
      </>
    ) : state.phase === "lobby" ? (
      <>
        <p className="font-display text-[5.0cqw]">Entre pelo celular</p>
        <div className="rounded-lg border-4 border-border bg-card p-2"><QRCodeSVG value={joinUrl} size={256} style={{ width: "34cqw", height: "34cqw" }} /></div>
        <p className="font-display text-[9cqw] leading-none tracking-[0.3em] text-primary">{code}</p>
        <button
          onClick={() => { sfx.unlock(); commit(G.start(state)); }}
          disabled={state.players.length < 2}
          className="rounded-xl border-4 border-border bg-primary px-5 py-2 font-display text-primary-foreground shadow-[4px_4px_0_var(--foreground)] disabled:opacity-40"
        >
          {state.players.length < 2 ? "Mínimo 2 jogadores" : "Começar partida"}
        </button>
      </>
    ) : (
      <>
        <TransferShow state={state} />
        <div className="flex items-center gap-3">
          <Animal id={cur?.animal} className="animate-bob h-[23.4cqw] w-auto" />
          <div className="text-left">
            <p className="font-display text-[3.6cqw] uppercase text-muted-foreground">Vez de</p>
            <p className="font-display text-[9.9cqw] leading-none" style={{ color: cur?.color }}>{cur?.name}</p>
          </div>
        </div>
        <DicePair dice={state.dice} rollId={state.rollId} size={56} />
        {deadline > 0 && (() => {
          const left = Math.max(0, Math.ceil((deadline - clock) / 1000));
          return <p aria-live="polite" className={`rounded-full border-2 px-3 font-display text-[3.4cqw] ${left <= 10 ? "animate-pulse border-destructive bg-destructive text-destructive-foreground" : "border-border bg-card"}`}>⏱️ {left}s{left <= 10 ? " · o banco vai agir" : ""}</p>;
        })()}
        {pd?.kind === "buy" && (
          <div className="animate-pop rounded-xl border-4 border-border bg-secondary px-4 py-2 font-display">
            <p className="text-[4.7cqw]">{nameOf(pd.playerId)} pode comprar {G.boardFor(state)[pd.square]!.name}</p>
            <p className="text-[3.6cqw]">Preço {G.money(G.boardFor(state)[pd.square]!.price!)} · Aluguel {G.money(G.boardFor(state)[pd.square]!.rent!)}</p>
          </div>
        )}
        {pd?.kind === "auction" && (
          <div className={`animate-pop rounded-xl border-4 px-4 py-2 font-display ${pd.endsAt - now <= 5000 && now > 0 ? "animate-pulse border-destructive bg-secondary ring-4 ring-destructive" : "border-border bg-secondary"}`}>
            <p className="text-[3.6cqw] uppercase">{pd.endsAt - now <= 5000 && now > 0 ? "🔥 Últimos segundos! · " : ""}Leilão · vez de {nameOf(G.auctionTurn(state) ?? "")} · {Math.max(0, Math.ceil((pd.endsAt - now) / 1000))}s</p>
            <p className="text-[5.8cqw] leading-tight">{G.boardFor(state)[pd.square]!.name}</p>
            <p className="text-[4.3cqw]">{pd.bidder ? `${nameOf(pd.bidder)} · ${G.money(pd.bid)}` : "Sem lances ainda"} · Tabela {G.money(G.boardFor(state)[pd.square]!.price!)}</p>
            <TitleInfo state={state} square={pd.square} big />
          </div>
        )}
        {state.offer && (
          <p className="rounded-lg border-2 border-border bg-card px-3 py-1 text-[3.2cqw] font-bold">🤝 Proposta na mesa: {G.offerText(state, state.offer)} — aguardando {state.players.find((x) => x.id === state.offer!.to)?.name}</p>
        )}
        {pd?.kind === "debt" && (
          <p className="animate-pulse rounded-lg border-2 border-destructive bg-destructive px-3 py-1 text-[3.4cqw] font-bold text-destructive-foreground">⚠️ {nameOf(pd.playerId)} em risco de falência: precisa de {G.money(pd.amount)} ({pd.reason})</p>
        )}
        {pd?.kind === "collect" && (
          <div className="animate-pop rounded-xl border-4 border-border bg-secondary px-4 py-2 text-secondary-foreground">
            <p className="font-display text-[3.6cqw]">🎉 {nameOf(pd.targetId)}: cada jogador envia {G.money(pd.amount)}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 text-[3.2cqw] font-bold">
              {state.players.filter((o) => o.id !== pd.targetId && !o.out).map((o) => <span key={o.id}>{pd.paid.includes(o.id) ? "✓" : "⏳"} {o.name}</span>)}
            </div>
          </div>
        )}
        <ScratchingBanner state={state} className="text-[4.7cqw]" />
        {pd?.kind === "pix" && (
          <div className="animate-pop rounded-xl border-4 border-border bg-accent px-4 py-2 font-display text-accent-foreground">
            <p className="text-[3.6cqw] uppercase">{rentInfo?.sq ? `Aluguel · ${rentInfo.sq.name}` : "Transferência"}{rentInfo?.doubled ? " · cor completa ×2" : ""}</p>
            <p className="text-[6.1cqw] leading-tight">{nameOf(pd.from)} paga {G.money(pd.amount)} a {nameOf(pd.to)}</p>
            <p className="text-[3.2cqw] opacity-80">Aguardando confirmação no celular…</p>
          </div>
        )}
        {state.card && state.event?.text.includes(state.card.text) && !pd && <p className={`animate-pop rounded-xl border-4 border-border px-4 py-2 font-display text-[4.7cqw] ${state.card.good ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}>🎟️ {nameOf(state.card.playerId)} raspou: {paymentText(state.card.text)}</p>}
        {state.event && !pd && <p key={state.event.id} className={`animate-pop max-w-[90%] text-[4.3cqw] font-bold ${state.event.tone === "bad" ? "text-destructive" : state.event.tone === "good" ? "text-success" : ""}`}>{paymentText(state.event.text)}</p>}
      </>
    );

  const side = (
    <>
      <div className="flex items-center gap-2 rounded-xl bg-primary px-3 py-[0.6vh] text-primary-foreground shadow-[var(--shadow-soft)]">
        <span className="flex-1 font-display text-[clamp(13px,2.6vh,28px)]">{G.cityOf(state) === "boro" ? "Cidade Boró" : "Banco Imobiliário Salinas"}</span>
        <span className="font-display tracking-widest text-[clamp(12px,2.2vh,24px)]">{code}</span>
        <button onClick={() => setPaused(true)} aria-label="Pausar" className="min-h-10 rounded-lg border-2 border-primary-foreground px-2 font-display">❚❚</button>
      </div>
      <Gazette state={state} className="text-[clamp(10px,1.7vh,18px)]" />
      <div className="grid grid-cols-2 gap-[0.8vh]">
        {ranking.map((p) => {
          const i = state.players.indexOf(p);
          const props = Object.entries(state.owners).filter(([, o]) => o === p.id);
          const active = state.phase === "playing" && i === state.turn;
          return (
            <button type="button" key={p.id} onClick={() => !p.out && setHostFor(p.id)} aria-label={`Opções de ${p.name}`} className={`flex items-center text-left ${p.out ? "opacity-40 grayscale" : ""} gap-2 rounded-xl bg-card p-[0.7vh] shadow-[var(--shadow-soft)] transition ${active ? "ring-4 ring-secondary" : ""}`}>
              <Animal id={p.animal} className={`h-[clamp(28px,6.5vh,80px)] w-auto ${active ? "animate-bob" : ""}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[clamp(11px,2.1vh,22px)]" style={{ color: p.color }}>{p.name}{p.jail ? " 👮" : ""}{p.freeJail ? " 🎫" : ""}{p.out ? " · faliu" : ""}</p>
                <p className={`font-display text-[clamp(12px,2.6vh,30px)] leading-none ${p.balance < 0 ? "text-destructive" : ""}`}>{G.money(p.balance)}</p>
                {!p.out && state.phase !== "lobby" && <p className="truncate text-[clamp(9px,1.4vh,15px)] text-muted-foreground">Patrimônio {G.money(G.netWorth(state, p.id))}</p>}
                <div className="mt-0.5 flex flex-wrap gap-0.5">
                  {props.map(([sq]) => <span key={sq} title={G.boardFor(state)[+sq]!.name} className="h-[1vh] w-[1.5vh] rounded-sm border border-border" style={{ background: `var(--group-${G.boardFor(state)[+sq]!.group})` }} />)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {state.phase === "playing" && state.players.length <= 3 && (
        <div className="rounded-xl bg-card p-[0.8vh] shadow-[var(--shadow-soft)]">
          <p className="font-display text-[clamp(11px,2vh,22px)] text-primary">Rodada {(state.round ?? 0) + 1}</p>
          <ul className="space-y-[0.4vh] text-[clamp(10px,1.6vh,17px)]">
            {state.log.slice(0, 3).map((l, i) => <li key={i} className={i === 0 ? "font-bold" : "text-muted-foreground"}>{paymentText(l)}</li>)}
          </ul>
        </div>
      )}
      {state.players.length === 0 && <p className="rounded-xl bg-card p-3 text-sm">Aguardando jogadores…</p>}
    </>
  );

  return (
    <main className={`${G.cityOf(state) === "boro" ? "boro-game " : ""}azulejo relative flex h-dvh items-center justify-center overflow-hidden p-[1vmin]`}>
      <div className="flex size-full min-h-0 min-w-0 items-center justify-center" style={{ containerType: "size" }}>
        <Board state={state} center={center} side={side} displayPos={displayPos} focus={focus} />
      </div>

      {paused && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-foreground/60 p-6">
          <div className="flex max-h-full w-full max-w-xl flex-col gap-3 rounded-2xl border-4 border-border bg-card p-5 shadow-[8px_8px_0_var(--foreground)]">
            <h2 className="font-display text-3xl text-primary">Pausa</h2>
            <div className="flex gap-2">
              <button onClick={() => setPaused(false)} className="flex-1 rounded-xl border-4 border-border bg-primary py-2 font-display text-primary-foreground">Continuar</button>
              <button onClick={fullscreen} className="flex-1 rounded-xl border-4 border-border bg-secondary py-2 font-display">Tela cheia</button>
              <button onClick={() => { if (song) music.stop(); else music.start(); setSong(!song); }} className="flex-1 rounded-xl border-4 border-border bg-success py-2 font-display text-success-foreground">{song ? "🎵 Música" : "🔇 Música"}</button>
              <button onClick={() => { setVoice((v) => !v); voice.stop(); }} className="flex-1 rounded-xl border-4 border-border bg-accent py-2 font-display text-accent-foreground">{voiceOn ? "🔊 Narração" : "🔇 Narração"}</button>
              <Link to="/" className="flex-1 rounded-xl border-4 border-border bg-muted py-2 text-center font-display">Sair</Link>
            </div>
            {state.phase === "playing" && (
              <div className="flex flex-wrap gap-2">
                <button disabled={state.moving || (!!pd && !["buy", "pix", "debt"].includes(pd.kind))} onClick={() => { hostAct("skipTurn"); setPaused(false); }} className="flex-1 rounded-xl border-4 border-border bg-secondary py-2 font-display">⏭️ Passar a vez de {cur?.name}</button>
                <button onClick={() => { setHostFor(cur?.id ?? null); setPaused(false); }} className="flex-1 rounded-xl border-4 border-border bg-destructive py-2 font-display text-destructive-foreground">🚫 Desconectar jogador…</button>
              </div>
            )}
            <h3 className="font-display">Histórico</h3>
            <div className="min-h-0 flex-1 overflow-auto rounded-xl border-2 border-border p-2 text-sm">
              {state.log.map((l, i) => <p key={i} className={i === 0 ? "font-bold" : "text-muted-foreground"}>{paymentText(l)}</p>)}
            </div>
          </div>
        </div>
      )}

      {hostFor && (() => {
        const p = state.players.find((x) => x.id === hostFor);
        if (!p) return null;
        const isTurn = state.phase === "playing" && G.current(state).id === p.id && !state.moving && (!state.pending || ["buy", "pix", "debt"].includes(state.pending.kind));
        return (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-foreground/60 p-6" onClick={() => setHostFor(null)}>
            <div role="dialog" aria-label={`Opções de ${p.name}`} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-4 border-border bg-card p-5 shadow-[8px_8px_0_var(--foreground)]">
              <div className="flex items-center gap-3"><Animal id={p.animal} className="h-16 w-auto" /><h2 className="font-display text-3xl" style={{ color: p.color }}>{p.name}</h2></div>
              {isTurn && <button onClick={() => { hostAct("skipTurn"); setHostFor(null); }} className="rounded-xl border-4 border-border bg-secondary py-2 font-display">⏭️ Passar a vez</button>}
              <button onClick={() => { if (window.confirm(`${p.name} vai ${state.phase === "lobby" ? "sair da sala" : "falir e devolver os bens ao banco"}. Confirmar?`)) { hostAct("kick", { id: p.id }); setHostFor(null); } }} className="rounded-xl border-4 border-border bg-destructive py-2 font-display text-destructive-foreground">{state.phase === "lobby" ? "Tirar da sala" : "🚫 Desconectar / Falir jogador"}</button>
              <button onClick={() => setHostFor(null)} className="rounded-xl border-4 border-border bg-muted py-2 font-display">Fechar</button>
            </div>
          </div>
        );
      })()}
      <div className="portrait-lock absolute inset-0 z-50 hidden flex-col items-center justify-center gap-4 bg-background p-8 text-center font-display text-2xl">
        <span className="text-6xl" aria-hidden>📱↻</span>
        Vire a tela na horizontal (modo paisagem) para usar o tabuleiro
      </div>
    </main>
  );
}
