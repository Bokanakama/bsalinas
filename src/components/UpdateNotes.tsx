import { useEffect, useState } from "react";

export const UPDATE_VERSION = "2026-11-28-crise";
const NOTES = [
  "🦆 6 bichinhos novos: Tucano, Arara Azul, Macaquinho, Boto, Bicho-Preguiça e Pato.",
  "😂 Reações: toque num emoji e ele aparece flutuando na TV.",
  "✨ Quem fecha todas as casas de uma cor ganha brilho dourado no tabuleiro.",
  "🚨 Alarme quando alguém paga um aluguel pesado.",
  "🏛️ Financiamento no leilão: sem saldo? O Banco empresta até o valor do imóvel e você continua com dinheiro no bolso.",
  "💸 Pague o empréstimo quando sobrar Boró: B$ 50, B$ 100 ou quite tudo. Enquanto dever, não dá para construir.",
  "⏱️ Bônus de B$ 400 no Início: 2 minutos para 2 jogadores e +1 minuto por jogador a mais.",
  "📣 Narração animada quando começa um leilão.",
  "📰 Gazeta mais compacta em todos os tabuleiros.",
];
const CITY_NOTES: Partial<Record<string, string[]>> = {
  esquecidos: [
    "🕯️ Cidade dos Esquecidos: a maldição desperta na 8ª rodada ou quando metade dos imóveis tiver dono.",
    "🕯️ O ritual não termina mais a partida: banco reabre após a crise. Quebrem um selo por jogada dos dados, seguindo a missão no celular.",
    "🌫️ Falhar custa 15% do saldo por selo faltante (até 60%). Imóveis na névoa ficam sem aluguel; conter a maldição salva os imóveis.",
    "👻 Fantasma errante e imóveis que mudam de lugar durante a crise; donos e construções acompanham seus imóveis.",
  ],
  selva: [
    "🐆 Rugido da Onça na TV quando ela anda pelo tabuleiro.",
    "💎 Altar das Relíquias mostra quem está perto de vencer.",
  ],
};
const BASE_KEY = "boro-update-seen";

/** Notas gerais + as do tabuleiro atual; notas de outro tabuleiro nunca entram. */
export function notesFor(city: string): string[] {
  return [...NOTES, ...(CITY_NOTES[city] ?? [])];
}

/** Aviso de novidades no celular, mostrado uma vez por versão. */
export function UpdateNotes({ city }: { city: string }) {
  const KEY = `${BASE_KEY}-${city}`;
  const notes = notesFor(city);
  const [open, setOpen] = useState(false);
  useEffect(() => { try { if (localStorage.getItem(KEY) !== UPDATE_VERSION) setOpen(true); } catch { /* sem storage */ } }, [KEY]);
  if (!open) return null;
  const close = () => { try { localStorage.setItem(KEY, UPDATE_VERSION); } catch { /* ignore */ } setOpen(false); };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-3 sm:items-center" role="dialog" aria-label="Novidades">
      <div className="w-full max-w-md rounded-2xl border-4 border-border bg-card p-4 shadow-[6px_6px_0_var(--foreground)]">
        <p className="font-display text-2xl">✨ Novidades no jogo</p>
        <ul className="my-3 space-y-2 text-sm">{notes.map((n) => <li key={n}>{n}</li>)}</ul>
        <button onClick={close} className="min-h-12 w-full rounded-xl border-4 border-border bg-secondary py-2 font-display text-lg">Bora jogar!</button>
      </div>
    </div>
  );
}
