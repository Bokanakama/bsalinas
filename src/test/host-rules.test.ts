import { describe, expect, it } from "vitest";
import * as G from "@/lib/game";

const two = () => G.start(G.join(G.join(G.newState(), "a", "Ana"), "b", "Beto"));
const three = () => G.start(G.join(G.join(G.join(G.newState(), "a", "Ana"), "b", "Beto"), "c", "Caio"));
const bal = (s: G.GameState, id: string) => s.players.find((p) => p.id === id)!.balance;
// Group 0 squares owned by "a"
const g0 = G.BOARD.map((b, i) => (b.group === 0 ? i : -1)).filter((i) => i >= 0);

describe("chalés: construção nivelada e venda", () => {
  const full = (): G.GameState => ({ ...two(), owners: Object.fromEntries(g0.map((i) => [i, "a"])) });
  it("não deixa pôr o 2º chalé num terreno antes dos outros da cor", () => {
    let s = G.build(full(), "a", g0[0]!);
    expect(G.housesAt(s, g0[0]!)).toBe(1);
    expect(G.build(s, "a", g0[0]!)).toBe(s);
    s = G.build(s, "a", g0[1]!);
    expect(G.housesAt(s, g0[1]!)).toBe(1);
  });
  it("vender chalé devolve 50% do custo da obra", () => {
    const s = G.build(full(), "a", g0[0]!);
    const n = G.sellHouse(s, "a", g0[0]!);
    expect(G.housesAt(n, g0[0]!)).toBe(0);
    expect(bal(n, "a")).toBe(bal(s, "a") + G.houseCost(0) / 2);
  });
  it("demolição nivelada: não vende de onde há menos chalés", () => {
    let s = full();
    for (const i of g0) s = G.build(s, "a", i);
    s = G.build(s, "a", g0[0]!); // g0[0] has 2, others 1
    expect(G.sellHouse(s, "a", g0[1]!)).toBe(s);
    expect(G.housesAt(G.sellHouse(s, "a", g0[0]!), g0[0]!)).toBe(1);
  });
});

describe("carta da Van até a Rodoviária", () => {
  it("voltar da casa 7 para a 5 não paga o bônus do Início", () => {
    const idx = G.LUCK_CARDS.findIndex((c) => c.goto === 5);
    let s = G.land(G.roll(two(), "a", 3, 4), "p", (idx + 0.5) / G.LUCK_CARDS.length);
    s = G.revealCard(s, "a");
    expect(s.players[0]!.pos).toBe(5);
    expect(bal(s, "a")).toBe(G.START_BALANCE);
  });
  it("buggy até o Início paga o bônus", () => {
    const idx = G.LUCK_CARDS.findIndex((c) => c.goto === 0);
    const s = G.revealCard(G.land(G.roll(two(), "a", 3, 4), "p", (idx + 0.5) / G.LUCK_CARDS.length), "a");
    expect(bal(s, "a")).toBe(G.START_BALANCE + G.START_BONUS);
  });
});

describe("tempo de 60 segundos e controles do tabuleiro", () => {
  it("o turno dura 60 segundos", () => expect(G.TURN_MS).toBe(60_000));
  it("tempo esgotado na compra recusa e passa a vez", () => {
    const s = G.land(G.roll(two(), "a", 1, 2), "x");
    expect(s.pending?.kind).toBe("buy");
    const n = G.autoResolve(s);
    expect(n.pending).toBeNull();
    expect(n.owners[3]).toBeUndefined();
    expect(n.turn).toBe(1);
  });
  it("tempo esgotado no aluguel debita automático quando há saldo", () => {
    const s = G.land(G.roll({ ...two(), owners: { 3: "b" } }, "a", 1, 2), "p");
    const n = G.autoResolve(s);
    expect(bal(n, "a")).toBe(G.START_BALANCE - 16);
    expect(n.turn).toBe(1);
  });
  it("tempo esgotado na dívida sem saldo declara falência", () => {
    const s: G.GameState = { ...two(), pending: { kind: "debt", playerId: "a", to: "b", amount: 99999, reason: "x" } };
    expect(G.autoResolve(s).players[0]!.out).toBe(true);
  });
  it("Passar a vez avança o turno", () => {
    expect(G.skipTurn(two()).turn).toBe(1);
  });
  it("Falir jogador ausente devolve os terrenos ao banco e passa a vez", () => {
    const s = G.kickPlayer({ ...three(), owners: { 1: "a" } }, "a");
    expect(s.players[0]!.out).toBe(true);
    expect(s.owners[1]).toBeUndefined();
    expect(s.turn).toBe(1);
    expect(s.phase).toBe("playing");
  });
});
