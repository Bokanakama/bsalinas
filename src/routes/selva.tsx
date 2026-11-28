import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Dice5, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createRoom, makeCode } from "@/lib/room";
import { SelvaCards } from "@/components/SelvaGuide";
import cover from "@/assets/selva-cover-1280.asset.json";
import coverSmall from "@/assets/selva-cover-640.asset.json";

export const Route = createFileRoute("/selva")({
  head: () => ({ meta: [
    { title: "Selva dos Tambores — Banco Boró" },
    { name: "description", content: "Selva dos Tambores: fuja da Onça, junte 3 relíquias e domine a floresta em Borós." },
    { property: "og:title", content: "Selva dos Tambores — Banco Boró" },
    { property: "og:description", content: "Um tabuleiro de aventura na selva, com Onça andando sozinha e vitória por relíquias." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SelvaLobby,
});

function SelvaLobby() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function create() {
    setBusy(true); setError("");
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        const roomCode = makeCode();
        try {
          await createRoom(roomCode, "selva");
          await navigate({ to: "/mestre/$code", params: { code: roomCode } });
          return;
        } catch (err) {
          if (!(err instanceof Error) || err.message !== "Código indisponível." || attempt === 3) throw err;
        }
      }
    } catch { setError("Não deu para criar a sala. Confira a internet e tente de novo."); }
    finally { setBusy(false); }
  }
  return (
    <main className="selva-game min-h-dvh bg-background text-foreground">
      <header className="relative flex min-h-64 items-end overflow-hidden sm:min-h-80">
        <img src={cover.url} srcSet={`${coverSmall.url} 640w, ${cover.url} 1280w`} sizes="100vw" decoding="async" alt="Selva com ruínas, tambores e uma onça à espreita" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 bg-foreground/35" />
        <div className="relative mx-auto w-full max-w-3xl px-5 py-6 text-primary-foreground">
          <Link to="/" className="mb-6 inline-flex min-h-11 items-center gap-2 font-semibold"><ArrowLeft className="size-4" />Banco Boró</Link>
          <h1 className="font-display text-4xl sm:text-5xl">Selva dos Tambores</h1>
          <p className="mt-2 font-semibold">Fuja da Onça e junte as 3 relíquias para vencer</p>
        </div>
      </header>
      <div className="mx-auto grid max-w-3xl gap-8 px-5 py-8 sm:grid-cols-2 sm:gap-10">
        <section>
          <h2 className="mb-5 flex items-center gap-2 font-display text-2xl"><Dice5 className="size-6 text-primary" />Sou o tabuleiro</h2>
          <Button disabled={busy} onClick={create} className="h-14 w-full text-base"><Dice5 className={busy ? "animate-spin-slow" : ""} />{busy ? "Criando…" : "Criar sala na Selva"}</Button>
          {error && <p role="alert" className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
        </section>
        <section className="sm:col-span-2">
          <h2 className="mb-3 font-display text-2xl">📜 Manual da Selva</h2>
          <SelvaCards />
        </section>
        <form onSubmit={(e) => { e.preventDefault(); if (code.length === 4) void navigate({ to: "/jogar/$code", params: { code } }); }}>
          <h2 className="mb-5 flex items-center gap-2 font-display text-2xl"><Users className="size-6 text-accent" />Sou jogador</h2>
          <label htmlFor="selva-code" className="mb-2 block text-sm font-semibold">Código da sala</label>
          <input id="selva-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))} placeholder="ABCD" autoCapitalize="characters" autoComplete="off" maxLength={4} className="mb-3 h-14 w-full rounded-lg border-2 border-input bg-card px-3 text-center font-display text-2xl" />
          <Button disabled={code.length !== 4} type="submit" variant="secondary" className="h-14 w-full text-base"><Users />Entrar na sala</Button>
        </form>
      </div>
    </main>
  );
}