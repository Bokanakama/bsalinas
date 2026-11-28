import { describe, expect, it } from "vitest";
import { boardFor, horrorTick, join, newState, start } from "@/lib/game";

describe("Immutable board layout cache", () => {
  it("reuses an unchanged validated layout and resolves a new permutation independently", () => {
    const playing = start(join(join(newState("esquecidos"), "a", "Ana", "gato"), "b", "Bia", "coelho"));
    const awake = horrorTick({ ...playing, round: 9 }, 1000);
    const curse = awake.curse;
    if (!curse) throw new Error("Expected active curse");
    const base = boardFor(awake);
    const slots = base.flatMap((sq, i) => sq.kind === "property" ? [i] : []);
    const a = slots[0], b = slots[1];
    if (a === undefined || b === undefined) throw new Error("Expected properties");
    const layout = base.map((_, i) => i);
    layout[a] = b; layout[b] = a;
    const shifted = { ...awake, curse: { ...curse, layout } };
    const resolved = boardFor(shifted);
    expect(boardFor(shifted)).toBe(resolved);
    expect(resolved[a]).toBe(base[b]);
    const restored = boardFor({ ...awake, curse: { ...curse, layout: base.map((_, i) => i) } });
    expect(restored[a]).toBe(base[a]);
    expect(boardFor({ ...shifted, city: "salinas" })[a]).not.toBe(resolved[a]);
  });
});