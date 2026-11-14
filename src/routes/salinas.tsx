import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createRoom, makeCode } from "@/lib/room";

export const Route = createFileRoute("/salinas")({
  head: () => ({
    meta: [
      { title: "Banco Imobiliário Salinas — o jogo de Salinópolis no celular" },
      { name: "description", content: "Compre a Praia do Atalaia, o Maçarico e os resorts de Salinópolis, receba aluguéis em Borós e jogue com celulares." },
      { property: "og:title", content: "Banco Imobiliário Salinas" },
      { property: "og:description", content: "Banco imobiliário de Salinas (PA): tabuleiro na TV, carteira de Borós no celular." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function create() {
    setBusy(true); setErr("");
    let c = "";
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        c = makeCode();
        try { await createRoom(c); break; }
        catch (error) { if (!(error instanceof Error) || error.message !== "Código indisponível." || attempt === 3) throw error; }
      }
      nav({ to: "/mestre/$code", params: { code: c } });
    } catch { setErr("Não deu para criar a sala. Verifique a internet e tente de novo."); }
    finally { setBusy(false); }
  }

  return (
    <main className="azulejo flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
        <section className="flex flex-col justify-center">
          <p className="font-display text-sm uppercase tracking-widest text-accent">☀️ Veraneio em Salinópolis · PA</p>
          <h1 className="font-display text-6xl leading-none text-primary md:text-7xl">Banco<br />Salinas</h1>
          <p className="mt-4 text-lg leading-relaxed text-foreground">Compre a orla do Atalaia, o Maçarico e os resorts, receba aluguéis e cuide dos seus <b>B$ Borós</b>. Um celular ou TV é o tabuleiro; cada celular é uma carteira.</p>
          <ol className="mt-6 space-y-3">
            {[
              ["📺", "Abra o tabuleiro na TV ou num celular deitado."],
              ["📱", "Cada jogador lê o QR code ou digita o código da sala."],
              ["🎲", "Escolha seu bicho e jogue os dados no seu celular."],
            ].map(([icon, text], i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl bg-card/80 px-3 py-2 shadow-[var(--shadow-soft)]">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-xl">{icon}</span>
                <span className="text-sm font-semibold leading-snug">{text}</span>
              </li>
            ))}
          </ol>
        </section>
        <section className="space-y-4">
          <div className="rounded-2xl border-4 border-border bg-secondary p-5 shadow-[6px_6px_0_var(--foreground)]">
            <h2 className="font-display text-2xl">Sou o tabuleiro</h2>
            <p className="mb-3 text-sm">Use na TV ou num celular deitado. Ele é o banco central.</p>
            <button disabled={busy} onClick={create} className="min-h-12 w-full rounded-xl border-4 border-border bg-primary py-3 font-display text-lg text-primary-foreground active:translate-y-1">
              {busy ? <span className="inline-flex items-center gap-2"><span className="animate-spin-slow">🎲</span>Criando…</span> : "Criar sala"}
            </button>
            {err && <p role="alert" className="mt-2 text-sm font-bold text-destructive">{err}</p>}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (code.length === 4) nav({ to: "/jogar/$code", params: { code } }); }}
            className="rounded-2xl border-4 border-border bg-card p-5 shadow-[6px_6px_0_var(--foreground)]"
          >
            <h2 className="font-display text-2xl">Sou jogador</h2>
            <p className="mb-3 text-sm">Digite o código que aparece no tabuleiro.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))}
              placeholder="ABCD"
              aria-label="Código da sala"
              autoCapitalize="characters"
              autoComplete="off"
              className="mb-3 w-full rounded-xl border-4 border-border bg-background p-3 text-center font-display text-3xl tracking-[0.4em]"
            />
            <button disabled={code.length !== 4} className="min-h-12 w-full rounded-xl border-4 border-border bg-accent py-3 font-display text-lg text-accent-foreground disabled:opacity-40">
              {code.length === 4 ? "Entrar na sala" : `Faltam ${4 - code.length} letra${4 - code.length > 1 ? "s" : ""}`}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
