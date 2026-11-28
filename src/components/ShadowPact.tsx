import { useEffect, useState } from "react";
import { accessRoom, type ShadowPact as Pact } from "@/lib/room";
import { Button } from "@/components/ui/button";
import { horrorActive, type GameState } from "@/lib/game";

export function ShadowPact({ state, code, playerId }: { state: GameState; code: string; playerId: string }) {
  const [pact, setPact] = useState<Pact | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const active = horrorActive(state) && state.horrorOptions?.pact === true;
  useEffect(() => {
    if (!active) { setPact(null); return; }
    let alive = true;
    const read = () => { if (document.visibilityState === "visible") void accessRoom(code, "pact").then((p) => { if (alive) setPact(p as Pact | null); }).catch(() => {}); };
    read(); const timer = setInterval(read, 6000);
    return () => { alive = false; clearInterval(timer); };
  }, [active, code, playerId]);
  async function answer(accept: boolean) {
    setBusy(true); setError(false);
    try { setPact(await accessRoom(code, "pactAnswer", { accept }) as Pact | null); } catch { setError(true); }
    finally { setBusy(false); }
  }
  if (!active || !pact || pact.playerId !== playerId) return null;
  return <section aria-label="Pacto privado" className="border-y border-accent py-4"><p className="text-xs font-bold uppercase text-accent">Só para os seus olhos</p><h2 className="mt-1 font-display text-xl">O Pacto das Sombras</h2>{pact.answered ? <p role="status" className="mt-2 text-sm">{pact.accepted ? "A cidade guardou sua promessa. O pacto será revelado quando a crise terminar." : "Você recusou a cidade. Seu segredo permanece guardado."}</p> : <><p className="mt-2 text-sm leading-relaxed">Se o tempo acabar sem os quatro selos, você escapa da penalidade e herda os imóveis na névoa, ainda sem aluguel. Se o grupo salvar a cidade, ou a crise acabar antes do prazo, não há recompensa.</p><div className="mt-3 grid grid-cols-2 gap-2"><Button disabled={busy} variant="outline" onClick={() => void answer(false)}>Recusar</Button><Button disabled={busy} variant="destructive" onClick={() => { if (window.confirm("Aceitar o pacto secreto e colocar seus interesses contra o ritual do grupo?")) void answer(true); }}>Aceitar pacto</Button></div></>}{error && <p role="alert" className="mt-2 text-xs text-destructive">Sua resposta não chegou. Tente novamente.</p>}</section>;
}