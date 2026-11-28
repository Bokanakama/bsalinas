import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Dice5, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HorrorRules } from "@/components/HorrorPanel";
import { createRoom, makeCode } from "@/lib/room";
import cover from "@/assets/esquecidos-cover.asset.json";

export const Route = createFileRoute("/esquecidos")({
  head: () => ({ meta: [
    { title: "Boró: Cidade dos Esquecidos — a maldição da cidade" },
    { name: "description", content: "Uma cidade que negocia de dia e esquece seus moradores à noite. Quebre quatro selos para evitar penalidades, reabra o banco e continue disputando a cidade com amigos." },
    { property: "og:title", content: "Boró: Cidade dos Esquecidos" },
    { property: "og:description", content: "Dinheiro, propriedades e uma crise cooperativa contra a névoa, sem encerrar a partida. Um novo mapa de terror psicológico no Banco Boró." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { property: "og:image", content: cover.url },
    { name: "twitter:image", content: cover.url },
  ] }),
  component: ForgottenLobby,
});

function ForgottenLobby() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function create() {
    setBusy(true); setError("");
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        const roomCode = makeCode();
        try { await createRoom(roomCode, "esquecidos"); await navigate({ to: "/mestre/$code", params: { code: roomCode } }); return; }
        catch (err) { if (!(err instanceof Error) || err.message !== "Código indisponível." || attempt === 3) throw err; }
      }
    } catch { setError("A cidade não abriu seus portões. Confira a internet e tente novamente."); }
    finally { setBusy(false); }
  }
  return <main className="esquecidos-game min-h-dvh bg-background text-foreground">
    <header className="relative flex min-h-72 items-end overflow-hidden sm:min-h-96">
      <img src={cover.url} alt="Cidade abandonada em miniatura, torre do relógio e altares acesos entre casas esquecidas" className="absolute inset-0 size-full object-cover" fetchPriority="high" />
      <div className="absolute inset-0 bg-background/55" />
      <div className="relative mx-auto w-full max-w-4xl px-5 py-7"><Link to="/" className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" />Banco Boró</Link><p className="mb-2 text-xs font-bold uppercase text-secondary">Boró · terror psicológico · 2 a 6 jogadores</p><h1 className="font-display text-4xl sm:text-5xl">Cidade dos Esquecidos</h1><p className="mt-3 max-w-lg text-sm leading-relaxed">A cidade vende imóveis. Mas não permite que seus moradores partam.</p></div>
    </header>
    <div className="mx-auto max-w-4xl space-y-9 px-5 py-8">
      <div className="grid gap-7 sm:grid-cols-2"><section><h2 className="mb-4 flex items-center gap-2 font-display text-xl"><Dice5 />Sou o tabuleiro</h2><Button className="h-14 w-full text-base" disabled={busy} onClick={create}><Dice5 className={busy ? "animate-spin-slow" : ""} />{busy ? "Abrindo os portões…" : "Criar sala dos Esquecidos"}</Button>{error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}</section><form onSubmit={(e) => { e.preventDefault(); if (code.length === 4) void navigate({ to: "/jogar/$code", params: { code } }); }}><h2 className="mb-4 flex items-center gap-2 font-display text-xl"><Users />Sou jogador</h2><label htmlFor="forgotten-code" className="mb-2 block text-sm">Código da sala</label><div className="flex gap-2"><input id="forgotten-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))} placeholder="ABCD" maxLength={4} autoComplete="off" autoCapitalize="characters" className="h-14 min-w-0 flex-1 rounded-md border border-input bg-card px-3 text-center font-display text-2xl" /><Button type="submit" disabled={code.length !== 4} variant="secondary" className="h-14">Entrar</Button></div></form></div>
      <section className="border-t border-border pt-7"><h2 className="mb-6 font-display text-2xl">Diário dos Esquecidos</h2><HorrorRules /></section>
      <p className="text-center text-xs text-muted-foreground">Sem sustos estridentes ou violência gráfica. Mistério, tensão e ritual em equipe; a disputa continua após a maldição.</p>
    </div>
  </main>;
}