import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { makeCode } from "@/lib/room";
import { newState } from "@/lib/game";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Banco Imobiliário Salinas — banco imobiliário no celular" },
      { name: "description", content: "Compre terrenos, cobre aluguel via Pix e jogue com celulares. Um celular ou TV vira o tabuleiro." },
      { property: "og:title", content: "Banco Imobiliário Salinas" },
      { property: "og:description", content: "Banco imobiliário brasileiro: tabuleiro na TV, carteira Pix no celular." },
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
    const c = makeCode();
    const { error } = await supabase.from("rooms").insert({ code: c, state: newState() as unknown as Json });
    setBusy(false);
    if (error) setErr("Não deu para criar a sala. Verifique a internet e tente de novo.");
    else {
      localStorage.setItem(`boro-master-${c}`, "1");
      nav({ to: "/mestre/$code", params: { code: c } });
    }
  }

  return (
    <main className="azulejo flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
        <section className="flex flex-col justify-center">
          <p className="font-display text-sm uppercase tracking-widest text-accent">Banco imobiliário brasileiro</p>
          <h1 className="font-display text-6xl leading-none text-primary md:text-7xl">Banco<br />Salinas</h1>
          <p className="mt-4 text-lg leading-relaxed text-foreground">Compre terrenos, cobre aluguel no Pix e cuide dos seus <b>B$ Borós</b>. Um celular ou TV é o tabuleiro; cada celular é uma carteira.</p>
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
