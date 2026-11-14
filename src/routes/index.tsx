import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jogos das Cidades — escolha sua cidade" },
      { name: "description", content: "Escolha sua cidade e divirta-se com jogos de tabuleiro locais." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main className="azulejo flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-5xl space-y-8 py-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="font-display text-sm uppercase tracking-[0.25em] text-accent">🌴 Jogos feitos para jogar junto</p>
          <h1 className="mt-3 font-display text-5xl leading-tight text-primary md:text-7xl">Escolha sua cidade</h1>
          <p className="mt-4 text-lg text-foreground">Cada cidade tem seu próprio jogo, suas histórias e seus lugares especiais. Por onde vamos começar?</p>
        </header>
        <section className="grid gap-6 md:grid-cols-2">
          <a
            href="https://cidadeboro.lovable.app"
            target="_blank"
            rel="noopener noreferrer"
            className="group overflow-hidden rounded-3xl border-4 border-border bg-card shadow-[7px_7px_0_var(--foreground)] transition-transform hover:-translate-y-1"
          >
            <div className="grid min-h-64 place-items-center bg-secondary p-8 text-center">
              <div>
                <span className="text-7xl" aria-hidden="true">🏙️</span>
                <p className="mt-4 font-display text-4xl text-primary">CidadeBoró</p>
                <p className="mt-2 text-sm font-semibold text-foreground">Uma cidade cheia de diversão e surpresas</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 p-5">
              <span className="font-display text-xl">Visitar CidadeBoró</span>
              <span className="text-2xl transition-transform group-hover:translate-x-1" aria-hidden="true">↗</span>
            </div>
          </a>
          <a
            href="/salinas"
            className="group overflow-hidden rounded-3xl border-4 border-border bg-card shadow-[7px_7px_0_var(--foreground)] transition-transform hover:-translate-y-1"
          >
            <div className="grid min-h-64 place-items-center bg-primary/10 p-8 text-center">
              <div>
                <span className="text-7xl" aria-hidden="true">🌊</span>
                <p className="mt-4 font-display text-4xl text-primary">Salinas-PA</p>
                <p className="mt-2 text-sm font-semibold text-foreground">Sol, praias e negócios em Salinópolis</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 p-5">
              <span className="font-display text-xl">Jogar Salinas</span>
              <span className="text-2xl transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
            </div>
          </a>
        </section>
        <p className="text-center text-xs font-medium text-muted-foreground">Novas cidades e jogos poderão ser adicionados aqui.</p>
      </div>
    </main>
  );
}
