import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Dice5, MapPin, Trees, Waves } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import cidadeboroCover from "@/assets/joga-brasil-cidadeboro.jpg";
import selvaCover from "@/assets/selva-cover.jpg";
import salinasCover from "@/assets/joga-brasil-salinas.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Banco Boró — escolha seu próximo destino" },
      { name: "description", content: "Escolha CidadeBoró ou Salinas-PA e comece a jogar. Qual será seu próximo destino?" },
      { property: "og:title", content: "Banco Boró — escolha seu próximo destino" },
      { property: "og:description", content: "Dois destinos para jogar: CidadeBoró e Salinas-PA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main className="city-portal min-h-screen bg-background px-4 py-7 text-foreground sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-7 flex flex-col items-center text-center sm:mb-10">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm" aria-hidden="true">
            <Dice5 className="size-7 -rotate-12" strokeWidth={1.8} />
          </div>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">Banco <span className="text-primary">Boró</span><span className="text-accent">.</span></h1>
          <p className="mt-2 text-base text-muted-foreground sm:text-lg">Qual será seu próximo destino?</p>
          <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />3 jogos disponíveis</p>
        </header>
        <section aria-label="Escolha seu jogo" className="grid gap-5 md:grid-cols-2 md:gap-7">
          <Link
            to="/boro"
            aria-label="Jogar CidadeBoró"
            className="city-destination group block min-w-0 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
              <img src={cidadeboroCover} alt="Cidade ilustrada com casinhas coloridas, uma praça e peças de tabuleiro" width={1152} height={768} fetchPriority="high" className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-lg bg-card/95 px-3 py-1.5 text-xs font-semibold text-primary"><Building2 className="size-3.5" aria-hidden="true" />CidadeBoró</span>
            </div>
            <div className="p-5 sm:p-6">
              <h2 className="font-display text-3xl">CidadeBoró</h2>
              <p className="mt-2 min-h-12 text-base leading-6 text-muted-foreground">Explore a cidade e descubra novas aventuras</p>
              <span className={buttonVariants({ className: "mt-5 h-12 w-full justify-between rounded-xl px-4 text-sm font-bold group-hover:bg-primary/90" })} aria-hidden="true">JOGAR CIDADEBORÓ<ArrowRight className="size-5" /></span>
            </div>
          </Link>
          <Link
            to="/salinas"
            aria-label="Jogar Salinas"
            className="city-destination city-destination-coast group block min-w-0 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
              <img src={salinasCover} alt="Praia de Salinas ilustrada com mar azul, coqueiros e quiosques coloridos" width={1152} height={768} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-lg bg-card/95 px-3 py-1.5 text-xs font-semibold text-primary"><MapPin className="size-3.5" aria-hidden="true" />Salinópolis · PA</span>
            </div>
            <div className="p-5 sm:p-6">
              <h2 className="font-display text-3xl">Salinas-PA</h2>
              <p className="mt-2 min-h-12 text-base leading-6 text-muted-foreground">Compre terrenos, negocie e vença seus amigos!</p>
              <span className={buttonVariants({ className: "mt-5 h-12 w-full justify-between rounded-xl px-4 text-sm font-bold group-hover:bg-primary/90" })} aria-hidden="true">JOGAR SALINAS<ArrowRight className="size-5" /></span>
            </div>
          </Link>
          <Link
            to="/selva"
            aria-label="Jogar Selva dos Tambores"
            className="city-destination group block min-w-0 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground md:col-span-2"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-muted md:aspect-[21/9]">
              <img src={selvaCover} alt="Selva com ruínas de templo, tambores, uma onça e uma joia verde" width={1536} height={1024} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-lg bg-card/95 px-3 py-1.5 text-xs font-semibold text-primary"><Trees className="size-3.5" aria-hidden="true" />Novo · Aventura</span>
            </div>
            <div className="p-5 sm:p-6">
              <h2 className="font-display text-3xl">Selva dos Tambores</h2>
              <p className="mt-2 min-h-12 text-base leading-6 text-muted-foreground">Fuja da Onça, roube relíquias e vença a floresta!</p>
              <span className={buttonVariants({ className: "mt-5 h-12 w-full justify-between rounded-xl px-4 text-sm font-bold group-hover:bg-primary/90" })} aria-hidden="true">JOGAR NA SELVA<ArrowRight className="size-5" /></span>
            </div>
          </Link>
        </section>
        <footer className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground"><Waves className="size-4 text-primary" aria-hidden="true" />Mais cidades chegando em breve!</footer>
      </div>
    </main>
  );
}
