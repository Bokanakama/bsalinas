import { afterEach, describe, expect, it, vi } from "vitest";
import * as G from "@/lib/game";

function playing() {
  return G.start(G.join(G.join(G.newState(), "a", "Ana"), "b", "Beto"));
}
afterEach(() => vi.useRealTimers());

describe("notícias de dois minutos", () => {
  it("paga B$ 400 antes de dois minutos e B$ 200 no instante da expiração", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const s: G.GameState = { ...playing(), cityEvent: { kind: "padroeira", text: "Festa", expiresAt: Date.now() + 120_000 } };
    s.players = s.players.map(p => p.id === "a" ? { ...p, pos: 55 } : p);
    vi.advanceTimersByTime(119_999);
    expect(G.startBonus(s)).toBe(400);
    expect(G.roll(s, "a", 1, 2).players[0]?.balance).toBe(G.START_BALANCE + 400);
    vi.advanceTimersByTime(1);
    expect(G.startBonus(s)).toBe(200);
    expect(G.roll(s, "a", 1, 2).players[0]?.balance).toBe(G.START_BALANCE + 200);
    expect(G.expireCityEvent(s).cityEvent).toBeNull();
  });
  it("cria notícia com duração exata de 120 segundos e mantém após mudar rodada", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    let s: G.GameState = { ...playing(), turn: 1, round: 11 };
    s = G.land(G.roll(s, "b", 1, 3), "p");
    expect(s.cityEvent?.expiresAt).toBe(1_120_000);
    s = G.land(G.roll(s, "a", 1, 3), "q");
    s = { ...s, players: s.players.map(p => p.id === "b" ? { ...p, pos: 0 } : p) };
    s = G.land(G.roll(s, "b", 1, 3), "r");
    expect(s.round).toBe(13);
    expect(s.cityEvent?.expiresAt).toBe(1_120_000);
  });
  it("feriadão dura 1 rodada, não 2 minutos", () => {
    const s: G.GameState = { ...playing(), round: 4, owners: { 5: "b" }, cityEvent: { kind: "feriado", text: "Feriado", until: 5 } };
    expect(G.rentFor(s, 5)).toBe(75);
    expect(G.rentFor({ ...s, round: 5 }, 5)).toBe(25);
  });
});