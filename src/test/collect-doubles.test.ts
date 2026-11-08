import { describe, expect, it } from "vitest";
import * as G from "@/lib/game";

function three() {
  let s = G.newState();
  s = G.join(s, "a", "Ana");
  s = G.join(s, "b", "Beto");
  s = G.join(s, "c", "Caio");
  return G.start(s);
}
const cardAt = (pred: (c: G.LuckCard) => boolean) => (G.LUCK_CARDS.findIndex(pred) + 0.5) / G.LUCK_CARDS.length;

describe("Cobrança coletiva (Enviar Boró)", () => {
  it("rifa B$ 20: nobody is charged until each player taps send", () => {
    let s = G.land(G.roll(three(), "a", 3, 4), "p", cardAt((c) => c.each === 20));
    s = G.revealCard(s, "a");
    expect(s.pending).toMatchObject({ kind: "collect", targetId: "a", amount: 20 });
    expect(s.players.map((p) => p.balance)).toEqual([G.START_BALANCE, G.START_BALANCE, G.START_BALANCE]);
    s = G.payCollect(s, "b");
    expect(s.players[1]!.balance).toBe(G.START_BALANCE - 20);
    expect(s.turn).toBe(0);
    s = G.payCollect(s, "b"); // second tap does nothing
    expect(s.players[1]!.balance).toBe(G.START_BALANCE - 20);
    s = G.payCollect(s, "c");
    expect(s.players[0]!.balance).toBe(G.START_BALANCE + 40);
    expect(s.pending).toBeNull();
    expect(s.turn).toBe(1);
  });
  it("after the 30s timeout the remaining players are charged", () => {
    let s = G.revealCard(G.land(G.roll(three(), "a", 3, 4), "p", cardAt((c) => c.each === 20)), "a");
    s = G.payCollect(s, "b");
    const ends = (s.pending as { endsAt: number }).endsAt;
    expect(G.finishCollect(s, ends - 1)).toBe(s);
    s = G.finishCollect(s, ends);
    expect(s.players[2]!.balance).toBe(G.START_BALANCE - 20);
    expect(s.turn).toBe(1);
  });
});

describe("Duplas", () => {
  it("two doubles keep the player free; only the third sends to jail", () => {
    let s = three();
    s = G.land(G.roll(s, "a", 1, 1), "x"); // 1st double
    s = G.land(G.roll(s, "a", 1, 1), "y"); // 2nd double (Imposto de Renda)
    const a = () => s.players.find((p) => p.id === "a")!;
    expect(a().jail ?? 0).toBe(0);
    expect(s.turn).toBe(0);
    s = G.roll(s, "a", 3, 3);
    expect(a().jail).toBe(G.JAIL_TURNS);
  });
  it("a stale roll tap (old rollId) is ignored", () => {
    const s = three();
    const r1 = G.land(G.roll(s, "a", 1, 1, s.rollId), "x");
    expect(G.roll(r1, "a", 2, 2, s.rollId)).toBe(r1);
  });
  it("the next player always starts the turn with zero doubles", () => {
    let s = three();
    s = { ...s, players: s.players.map((p) => (p.id === "b" ? { ...p, doubles: 2 } : p)) };
    s = G.land(G.roll(s, "a", 1, 3), "x"); // Imposto de Renda
    expect(s.turn).toBe(1);
    expect(s.players[1]!.doubles).toBe(0);
  });
});
