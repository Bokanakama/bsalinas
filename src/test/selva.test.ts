import { describe, expect, it } from "vitest";
import * as G from "@/lib/game";

const playing = () => G.start(G.join(G.join(G.newState("selva"), "a", "Ana", "gato"), "b", "Bia", "coelho"));
const bal = (s: G.GameState, id: string) => s.players.find((p) => p.id === id)!.balance;

describe("Selva dos Tambores", () => {
  it("has 56 squares, its own names and cabanas/templos", () => {
    const s = playing();
    expect(G.boardFor(s)).toHaveLength(56);
    expect(G.boardFor(s)[55]?.name).toBe("Pico do Trovão");
    expect(G.buildingName(s)).toBe("cabana");
    expect(G.buildingName(s, true)).toBe("templo");
    expect(s.beast).toBe(28);
  });
  it("doubles move the Onça; sharing her square costs B$ 50", () => {
    const s = { ...playing(), beast: 20 };
    const a = s.players[s.turn]!.id;
    const pos = s.players[s.turn]!.pos;
    const after = G.beastStep({ ...s, players: s.players.map((p) => p.id === a ? { ...p, pos: (20 + 4) % 56 } : p) }, a, 4);
    expect(after.beast).toBe(24);
    expect(bal(after, a)).toBe(1450);
    const miss = G.beastStep(s, a, 0);
    expect(miss.beast).toBe(20);
    expect(bal(miss, a)).toBe(1500);
    expect(pos).toBe(0);
  });
  it("rolling no double leaves the Onça still", () => {
    const s = playing();
    const a = G.current(s).id;
    expect(G.roll(s, a, 1, 2).beast).toBe(28);
    expect(G.roll(s, a, 2, 2).beast).toBe(32);
  });
  it("claims a free relic and steals a held one for B$ 100", () => {
    let s = G.claimRelic(playing(), "a", 0);
    expect(s.relics?.[0]).toBe("a");
    s = G.claimRelic(s, "b", 0);
    expect(s.relics?.[0]).toBe("b");
    expect(bal(s, "b")).toBe(1400);
    expect(bal(s, "a")).toBe(1600);
  });
  it("three relics win the game immediately", () => {
    let s = playing();
    for (const r of [0, 1, 2]) s = G.claimRelic(s, "a", r);
    expect(s.phase).toBe("over");
    expect(s.winner).toBe("a");
  });
});
