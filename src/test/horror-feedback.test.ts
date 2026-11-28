import { describe, expect, it } from "vitest";
import * as G from "@/lib/game";
import { horrorFeedback } from "@/lib/horror-feedback";

function fixture(pos = 0, sanity = 100): G.GameState {
  const s = G.horrorTick({ ...G.start(G.join(G.join(G.newState("esquecidos"), "a", "Ana", "gato"), "b", "Bia", "coelho")), round: 8 }, 1000, 0);
  if (!s.curse) throw new Error("Missing curse");
  return { ...s, players: s.players.map((p) => ({ ...p, pos })), curse: { ...s.curse, ghost: 0, sanity: { a: sanity, b: 100 } } };
}

describe("personal horror feedback", () => {
  it("starts double-heartbeat pacing only within four squares", () => {
    expect(horrorFeedback(fixture(4), "a").heartbeatMs).toBe(1450);
    expect(horrorFeedback(fixture(5), "a").heartbeatMs).toBe(0);
    expect(horrorFeedback(fixture(0), "a").heartbeatMs).toBe(650);
  });
  it("measures proximity across Start on the 56-square perimeter", () => {
    expect(horrorFeedback(fixture(55), "a").distance).toBe(1);
    expect(horrorFeedback(fixture(55), "a").heartbeatMs).toBe(850);
  });
  it("low sanity starts below 40 percent, not at 40", () => {
    expect(horrorFeedback(fixture(0, 40), "a").lowSanity).toBe(false);
    expect(horrorFeedback(fixture(0, 39), "a").lowSanity).toBe(true);
  });
  it("stops heartbeat when lost, resolved, out or outside Esquecidos", () => {
    expect(horrorFeedback(fixture(0, 0), "a")).toMatchObject({ lost: true, heartbeatMs: 0 });
    const s = fixture();
    expect(horrorFeedback({ ...s, city: "salinas" }, "a").active).toBe(false);
    expect(horrorFeedback(G.horrorTick(s, 721000), "a").active).toBe(false);
    expect(horrorFeedback({ ...s, players: s.players.map((p) => ({ ...p, out: true })) }, "a").active).toBe(false);
  });
});