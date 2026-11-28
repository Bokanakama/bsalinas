import { describe, expect, it } from "vitest";
import * as G from "@/lib/game";
import { ALTARS, CRISIS_MS, SHIFT_MIN_MS, SHIFT_MAX_MS, GHOST_MIN_MS, GHOST_MAX_MS } from "@/lib/esquecidos";
const playing = () => G.start(G.join(G.join(G.newState("esquecidos"), "a", "Ana", "gato"), "b", "Bia", "coelho"));
const awake = () => G.horrorTick({ ...playing(), round: 8 }, 1000, 0);
const bal = (s: G.GameState, id: string) => s.players.find((p) => p.id === id)?.balance;

describe("Esquecidos mid-game crisis", () => {
  it("cannot break multiple seals in one dice roll, even using another player", () => {
    const s = G.purifyAltar(awake(), "a", 0);
    const near = { ...s, players: s.players.map((p) => ({ ...p, pos: 17 })) };
    expect(G.purifyAltar(near, "a", 17)).toBe(near);
    expect(G.purifyAltar(near, "b", 17)).toBe(near);
    expect(G.purifyAltar({ ...near, rollId: 1 }, "b", 17).curse?.altars[17]).toBe("b");
  });
  it.each([0, 1, 2, 3])("penalties increase with missing seals (%i completed), exactly once", (completed) => {
    const s = awake();
    if (!s.curse) throw new Error("Missing curse");
    const altars = Object.fromEntries(ALTARS.slice(0, completed).map((i) => [i, "a"]));
    const n = G.horrorTick({ ...s, curse: { ...s.curse, altars, consumed: [1] }, owners: { 1: "a", 3: "b" } }, 1000 + CRISIS_MS);
    expect(n.phase).toBe("playing");
    expect(bal(n, "a")).toBe([600, 825, 1050, 1275][completed]);
    expect(G.rentFor(n, 1)).toBe(0);
    expect(G.rentFor(n, 3)).toBeGreaterThan(0);
    expect(G.startBonus(n)).toBe(200);
    expect(G.horrorTick(n, 10000000)).toBe(n);
  });
  it("random shift deadlines stay between 45 and 90 seconds", () => {
    for (const random of [0, .25, .75, 1]) {
      const s = G.horrorTick({ ...playing(), round: 8 }, 1000, random);
      expect(s.curse?.nextShiftAt).toBeGreaterThanOrEqual(1000 + SHIFT_MIN_MS);
      expect(s.curse?.nextShiftAt).toBeLessThanOrEqual(1000 + SHIFT_MAX_MS);
      expect(s.curse?.nextGhostAt).toBeGreaterThanOrEqual(1000 + GHOST_MIN_MS);
      expect(s.curse?.nextGhostAt).toBeLessThanOrEqual(1000 + GHOST_MAX_MS);
    }
  });
  it("moves properties and attached assets, preserving corners, players and total value", () => {
    const s = { ...awake(), owners: { 1: "a", 31: "b" }, houses: { 1: 2 }, mortgaged: { 1: true } };
    const n = G.shiftProperties(s, 0);
    const destination = G.boardFor(n).findIndex((sq) => sq.name === G.boardFor(s)[1]?.name);
    expect(destination).not.toBe(1);
    expect(n.owners[destination]).toBe("a");
    expect(n.houses?.[destination]).toBe(2);
    expect(n.mortgaged?.[destination]).toBe(true);
    expect(G.netWorth(n, "a")).toBe(G.netWorth(s, "a"));
    expect(n.players).toEqual(s.players);
    expect(ALTARS.map((i) => G.boardFor(n)[i])).toEqual(ALTARS.map((i) => G.boardFor(s)[i]));
    expect(G.shiftProperties({ ...s, moving: true }, 0).curse).toBe(s.curse);
  });
  it("ghost crossing charges at most B$50 and 10 sanity and can be repelled 10 squares", () => {
    const s = awake();
    const near = { ...s, players: s.players.map((p) => p.id === "a" ? { ...p, pos: 29, balance: 20 } : p) };
    const n = G.horrorTick(near, 1000 + GHOST_MIN_MS, 0);
    expect(n.curse?.ghost).toBe(29);
    expect(bal(n, "a")).toBe(0);
    expect(n.curse?.sanity['a']).toBe(90);
    const repelled = G.repelGhost(n, "a");
    expect(repelled.curse?.ghost).toBe(19);
    expect(repelled.curse?.torches['a']).toBe(1);
    expect(G.repelGhost(repelled, "a")).toBe(repelled);
  });
  it("ghost cannot freeze a turn when it drains the current player to zero", () => {
    const s = awake();
    if (!s.curse) throw new Error("Missing curse");
    const n = G.horrorTick({ ...s, curse: { ...s.curse, sanity: { a: 10, b: 100 } }, players: s.players.map((p) => p.id === "a" ? { ...p, pos: 29 } : p) }, 16000, 0);
    expect(n.turn).toBe(1);
    expect(n.phase).toBe("playing");
  });
  it("resumes old terminal ritual rooms without replaying rewards or penalties", () => {
    const s = awake();
    if (!s.curse) throw new Error("Missing curse");
    const { version: _version, ...legacy } = s.curse;
    const n = G.resumeLegacyHorror({ ...s, phase: "over", curse: { ...legacy, stage: "escaped" } }, 9999);
    expect(n.phase).toBe("playing");
    expect(n.players).toEqual(s.players);
    expect(G.resumeLegacyHorror(n, 10000)).toBe(n);
  });
  it("normal bankruptcy victory still works after resolving a crisis", () => {
    const s = G.horrorTick(awake(), 1000 + CRISIS_MS);
    const n = G.kickPlayer(s, "b");
    expect(n.phase).toBe("over");
    expect(n.winner).toBe("a");
  });
  it("a pending voluntary transfer cannot pause the twelve-minute crisis deadline", () => {
    const s = awake();
    const n = G.horrorTick({ ...s, pending: { kind: "pix", id: "transfer", from: "a", to: "b", amount: 50, reason: "Pix" } }, 1000 + CRISIS_MS);
    expect(n.pending).toBeNull();
    expect(n.phase).toBe("playing");
    expect(n.curse?.stage).toBe("forgotten");
    expect(bal(n, "a")).toBe(600);
    expect(bal(n, "b")).toBe(600);
  });
  it("ignores malformed property permutations rather than corrupting the board", () => {
    const s = awake();
    if (!s.curse) throw new Error("Missing curse");
    const malformed = { ...s, curse: { ...s.curse, layout: Array(56).fill(1) as number[] } };
    expect(G.boardFor(malformed)).toEqual(G.boardFor(s));
  });
});
