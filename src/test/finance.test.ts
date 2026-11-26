import { describe, expect, it } from "vitest";
import * as G from "@/lib/game";

const base = () => {
  let s = G.newState("salinas");
  s = G.join(G.join(s, "a", "Ana", "gato"), "b", "Bia", "coelho");
  return G.start(s);
};

describe("financiamento e bônus", () => {
  it("lance acima do saldo paga metade do saldo e financia o resto", () => {
    expect(G.financeSplit(100, 190)).toEqual({ cash: 50, loan: 140 });
    expect(G.financeSplit(300, 190)).toEqual({ cash: 190, loan: 0 });
  });
  it("amortiza só o que o jogador escolher e quita no fim", () => {
    let s = base();
    s = { ...s, players: s.players.map((p) => (p.id === "a" ? { ...p, balance: 500, loan: 140 } : p)) };
    s = G.repayLoan(s, "a", 50);
    expect(s.players[0]!.loan).toBe(90);
    expect(s.players[0]!.balance).toBe(450);
    s = G.repayLoan(s, "a", 999);
    expect(s.players[0]!.loan).toBe(0);
    expect(s.players[0]!.balance).toBe(360);
  });
  it("crédito do leilão vai até o valor de tabela menos a dívida", () => {
    const s = base();
    const sq = G.boardFor(s).findIndex((b) => b.kind === "property");
    const price = G.boardFor(s)[sq]!.price!;
    const t = { ...s, players: s.players.map((p) => (p.id === "a" ? { ...p, loan: 20 } : p)) };
    expect(G.auctionCredit(t, "a", sq)).toBe(price - 20);
  });
  it("bônus do Início dura 2 min com 2 jogadores e +1 min por jogador extra", () => {
    const s = base();
    expect(G.cityEventMs(s)).toBe(120_000);
    const six = { ...s, players: [...s.players, ...["c", "d", "e", "f"].map((id) => ({ ...s.players[0]!, id }))] };
    expect(G.cityEventMs(six)).toBe(360_000);
  });
});
