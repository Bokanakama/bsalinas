import { useEffect, useState } from "react";

export const UPDATE_VERSION = "2026-11-financiamento";
const NOTES = [
  "🏛️ Financiamento no leilão: sem saldo? O Banco empresta até o valor do imóvel e você continua com dinheiro no bolso.",
  "💸 Pague o empréstimo quando sobrar Boró: B$ 50, B$ 100 ou quite tudo. Enquanto dever, não dá para construir.",
  "⏱️ Bônus de B$ 400 no Início: 2 minutos para 2 jogadores e +1 minuto por jogador a mais.",
  "📣 Narração animada quando começa um leilão.",
  "💎 Selva: Altar das Relíquias mostra quem está perto de vencer.",
  "📰 Gazeta mais compacta em todos os tabuleiros.",
];
const KEY = "boro-update-seen";

/** Aviso de novidades no celular, mostrado uma vez por versão. */
export function UpdateNotes() {
  const [open, setOpen] = useState(false);
  useEffect(() => { try { if (localStorage.getItem(KEY) !== UPDATE_VERSION) setOpen(true); } catch { /* sem storage */ } }, []);
  if (!open) return null;
  const close = () => { try { localStorage.setItem(KEY, UPDATE_VERSION); } catch { /* ignore */ } setOpen(false); };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-3 sm:items-center" role="dialog" aria-label="Novidades">
      <div className="w-full max-w-md rounded-2xl border-4 border-border bg-card p-4 shadow-[6px_6px_0_var(--foreground)]">
        <p className="font-display text-2xl">✨ Novidades no jogo</p>
        <ul className="my-3 space-y-2 text-sm">{NOTES.map((n) => <li key={n}>{n}</li>)}</ul>
        <button onClick={close} className="min-h-12 w-full rounded-xl border-4 border-border bg-secondary py-2 font-display text-lg">Bora jogar!</button>
      </div>
    </div>
  );
}
