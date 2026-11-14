import { describe, expect, it } from "vitest";
import * as G from "@/lib/game";

const setup = () => G.start(G.join(G.join(G.newState(), "a", "Ana"), "b", "Beto"));
const balance = (s: G.GameState, id: string) => s.players.find((p) => p.id === id)?.balance;

describe("In-game payment confirmation", () => {
  it("confirms rent once, credits the owner and preserves the next turn", () => {
    const initial = { ...setup(), owners: { 3: "b" } };
    const pending = G.land(G.roll(initial, "a", 1, 2), "rent");
    const paid = G.confirmPix(pending, "a", "rent");
    expect(balance(paid, "a")).toBe(G.START_BALANCE - 16);
    expect(balance(paid, "b")).toBe(G.START_BALANCE + 16);
    expect(paid.pending).toBeNull();
    expect(paid.turn).toBe(1);
    expect(G.confirmPix(paid, "a", "rent")).toBe(paid);
  });

  it("confirms an existing voluntary transfer without advancing the turn", () => {
    const pending = G.requestTransfer(setup(), "a", "b", 120, "transfer");
    expect(G.confirmPix(pending, "b", "transfer")).toBe(pending);
    expect(G.confirmPix(pending, "a", "wrong")).toBe(pending);
    const paid = G.confirmPix(pending, "a", "transfer");
    expect(balance(paid, "a")).toBe(G.START_BALANCE - 120);
    expect(balance(paid, "b")).toBe(G.START_BALANCE + 120);
    expect(paid.turn).toBe(0);
    expect(paid.pending).toBeNull();
    expect(paid.transfer).toMatchObject({ from: "a", to: "b", amount: 120 });
  });

  it("cancels voluntary transfers without changing balances", () => {
    const cancelled = G.cancelPix(G.requestTransfer(setup(), "a", "b", 120, "transfer"), "a");
    expect(balance(cancelled, "a")).toBe(G.START_BALANCE);
    expect(balance(cancelled, "b")).toBe(G.START_BALANCE);
    expect(cancelled.pending).toBeNull();
  });
});