import { useEffect, useState } from "react";
import { BEAST_BITE, RELIC_NAMES, RELIC_STEAL } from "@/lib/selva";
import { Button } from "@/components/ui/button";

export const SELVA_STEPS = [
  { icon: "🐆", title: "O Despertar da Onça", text: `Toda dupla nos dados acorda a Onça, que corre sozinha pelo tabuleiro. Se ela parar na mesma casa de quem tirou a dupla, essa pessoa perde B$ ${BEAST_BITE}.` },
  { icon: "💎", title: "As 3 Relíquias", text: `${RELIC_NAMES.join(", ")}. Pare na casa da relíquia para pegá-la. Já tem dono? Pague B$ ${RELIC_STEAL} a ele e roube.` },
  { icon: "🛖", title: "Cabanas e Templos", text: "Feche um grupo de terrenos para construir cabanas. Com 4 cabanas, ergue um templo e o aluguel dispara." },
  { icon: "🏆", title: "Duas formas de vencer", text: "Junte as 3 relíquias e vença na hora — ou seja o último de pé quando os rivais falirem." },
];

export function SelvaCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {SELVA_STEPS.map((s) => (
        <article key={s.title} className="rounded-xl border-2 border-border/40 bg-card p-4 shadow-[var(--shadow-soft)]">
          <div className="mb-1 text-3xl" aria-hidden>{s.icon}</div>
          <h3 className="font-display text-lg">{s.title}</h3>
          <p className="text-sm leading-6">{s.text}</p>
        </article>
      ))}
    </div>
  );
}

/** Quick-reference modal (TV and phone). */
export function SelvaRulesButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Regras da Selva" className={`min-h-10 rounded-lg border-2 px-2 font-display ${className}`}>📜 Regras</button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Regras da Selva" className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/60 p-3" onClick={() => setOpen(false)}>
          <div className="max-h-[90dvh] w-full max-w-2xl overflow-auto rounded-2xl border-4 border-border bg-background p-4 text-foreground" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-3 font-display text-2xl">📜 Regras da Selva</h2>
            <SelvaCards />
            <Button className="mt-4 h-12 w-full" onClick={() => setOpen(false)}>Voltar ao jogo</Button>
          </div>
        </div>
      )}
    </>
  );
}

const SKIP_KEY = "selva-intro-skip";

/** Stories-style intro shown once per device when entering a Selva room. */
export function SelvaIntro() {
  const [show, setShow] = useState(false);
  const [i, setI] = useState(0);
  const [never, setNever] = useState(false);
  useEffect(() => { try { if (!localStorage.getItem(SKIP_KEY)) setShow(true); } catch { setShow(true); } }, []);
  if (!show) return null;
  const close = () => { if (never) { try { localStorage.setItem(SKIP_KEY, "1"); } catch { /* ignore */ } } setShow(false); };
  const s = SELVA_STEPS[i]!;
  const last = i === SELVA_STEPS.length - 1;
  return (
    <div role="dialog" aria-modal="true" aria-label="Bem-vindo à Selva" className="fixed inset-0 z-[90] flex flex-col bg-background p-5 text-foreground">
      <div className="flex gap-1">{SELVA_STEPS.map((_, k) => <span key={k} className={`h-1.5 flex-1 rounded-full ${k <= i ? "bg-primary" : "bg-muted"}`} />)}</div>
      <button type="button" className="flex flex-1 flex-col items-center justify-center text-center" onClick={() => (last ? close() : setI(i + 1))}>
        <div className="mb-4 text-7xl" aria-hidden>{s.icon}</div>
        <h2 className="mb-3 font-display text-3xl">{s.title}</h2>
        <p className="max-w-md text-lg leading-7">{s.text}</p>
        <p className="mt-6 text-sm opacity-70">Toque para {last ? "começar" : "continuar"}</p>
      </button>
      <label className="mb-3 flex items-center justify-center gap-2 text-sm"><input type="checkbox" checked={never} onChange={(e) => setNever(e.target.checked)} className="size-4" />Não mostrar novamente</label>
      <Button className="h-12 w-full" variant={last ? "default" : "secondary"} onClick={close}>{last ? "Bora jogar!" : "Pular e Jogar"}</Button>
    </div>
  );
}
