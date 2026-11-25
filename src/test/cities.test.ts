import { describe, expect, it } from "vitest";
import * as G from "@/lib/game";

function playing(city: G.CityId) {
  return G.start(G.join(G.join(G.newState(city), "a", "Ana", "gato"), "b", "Bia", "coelho"));
}

describe("Independent cities", () => {
  it("defaults old rooms to Salinas without changing their state", () => {
    const state = G.newState();
    delete state.city;
    expect(G.boardFor(state)[1]?.name).toBe("Vila de Cuiarana");
    expect(state.city).toBeUndefined();
  });
  it("uses 56 original Boró squares and keeps Salinas separate", () => {
    expect(G.boardFor(G.newState("boro"))).toHaveLength(56);
    expect(G.boardFor(G.newState("boro"))[1]?.name).toBe("Beco do Sapo");
    expect(G.boardFor(G.newState("salinas"))[1]?.name).toBe("Vila de Cuiarana");
    expect(G.buildingName(G.newState("boro"))).toBe("barraca");
    expect(G.buildingName(G.newState("boro"), true)).toBe("sobrado");
  });
  it("buys Boró land and confirms rent with correct balances", () => {
    let state = playing("boro");
    state = G.buy({ ...state, pending: { kind: "buy", playerId: "a", square: 1 } }, "a", true);
    expect(state.players.find((p) => p.id === "a")?.balance).toBe(1440);
    state = { ...state, turn: 1, players: state.players.map((p) => p.id === "b" ? { ...p, pos: 1 } : p) };
    state = G.land(state, "rent");
    expect(state.pending).toMatchObject({ reason: "Aluguel Beco do Sapo", amount: 10 });
    state = G.confirmPix(state, "b", "rent");
    expect(state.players.find((p) => p.id === "a")?.balance).toBe(1450);
    expect(state.players.find((p) => p.id === "b")?.balance).toBe(1490);
    expect(state.city).toBe("boro");
  });
  it("uses Boró cards and pays the start bonus only for its start card", () => {
    const state = playing("boro");
    const card = G.cardsFor(state).findIndex((c) => c.goto === 0);
    expect(card).toBe(8);
    const result = G.revealCard({ ...state, pending: { kind: "scratch", playerId: "a", card, since: 0 } }, "a");
    expect(result.players[0]?.balance).toBe(1700);
  });
  it("uses city-specific news and the same event mechanics", () => {
    const state = { ...playing("boro"), owners: { 5: "a", 42: "a" } };
    expect(G.eventsFor(state)[0]?.text).toContain("Feriadão na Cidade");
    expect(G.rentFor({ ...state, cityEvent: { kind: "feriado", text: "", expiresAt: Date.now() + 120000 } }, 5)).toBe(75);
    expect(G.rentFor({ ...state, cityEvent: { kind: "temporal", text: "", expiresAt: Date.now() + 120000 } }, 42)).toBe(0);
  });
});
describe("Baixa temporada em Salinas", () => {
  it("cobra metade do aluguel nos hotéis", () => {
    const state = { ...playing("salinas"), owners: { 48: "a", 42: "a" } };
    const ev = { kind: "temporal" as const, text: "", expiresAt: Date.now() + 120000 };
    expect(G.rentFor(state, 48)).toBe(55);
    expect(G.rentFor({ ...state, cityEvent: ev }, 48)).toBe(27);
    expect(G.rentFor({ ...state, cityEvent: ev }, 42)).toBe(44);
  });
});
