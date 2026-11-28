import { describe, expect, it } from "vitest";
import * as G from "@/lib/game";
import { ALTARS, FOG_MS, CRISIS_MS, SHIFT_MIN_MS, SHIFT_MAX_MS, GHOST_MIN_MS, GHOST_MAX_MS } from "@/lib/esquecidos";
import { notesFor } from "@/components/UpdateNotes";

const playing = (city: G.CityId = "esquecidos") => G.start(G.join(G.join(G.newState(city), "a", "Ana", "gato"), "b", "Bia", "coelho"));
// Existing saved crises keep their sequential altar rule.
const awake = () => { const s = G.horrorTick({ ...playing(), round: 8 }, 1000, 0); return s.curse ? { ...s, curse: { ...s.curse, freeAltars: false } } : s; };
const bal = (s: G.GameState, id: string) => s.players.find((p) => p.id === id)?.balance;

describe("Cidade dos Esquecidos", () => {
  it("preserves 56 squares and the four corners", () => {
    const board = G.boardFor(playing());
    expect(board).toHaveLength(56);
    expect(ALTARS.map((i) => board[i]?.name)).toEqual(["Altar do Início", "Masmorra Esquecida", "Santuário em Ruínas", "O Abismo"]);
  });
  it("wakes at eight completed rounds, never at seven", () => {
    expect(G.horrorTick({ ...playing(), round: 7 }, 1000).curse).toBeUndefined();
    expect(awake().curse?.stage).toBe("awake");
  });
  it("also wakes when 50 percent of properties have owners", () => {
    const s = playing();
    const ids = G.boardFor(s).flatMap((sq, i) => sq.kind === "property" ? [i] : []);
    const half = Math.ceil(ids.length / 2);
    const owners = Object.fromEntries(ids.slice(0, half - 1).map((i) => [i, "a"]));
    expect(G.horrorTick({ ...s, owners }, 1000).curse).toBeUndefined();
    expect(G.horrorTick({ ...s, owners: Object.fromEntries(ids.slice(0, half).map((i) => [i, "a"])) }, 1000).curse?.stage).toBe("awake");
  });
  it("waits for the current payment or movement before awakening", () => {
    const s = { ...playing(), round: 8, moving: true };
    expect(G.horrorTick(s, 1000)).toBe(s);
    const pending: G.GameState = { ...s, moving: false, pending: { kind: "buy", square: 1, playerId: "a" } };
    expect(G.horrorTick(pending, 1000)).toBe(pending);
  });
  it("starts every participant at 100 sanity and two torches", () => {
    expect(awake().curse?.sanity).toEqual({ a: 100, b: 100 });
    expect(awake().curse?.torches).toEqual({ a: 2, b: 2 });
  });
  it("persists a different ritual order without changing on later ticks", () => {
    const s = G.horrorTick({ ...playing(), round: 8 }, 1000, 0.75);
    expect(s.curse?.order).toEqual([45, 0, 17, 28]);
    expect(G.horrorTick(s, 2000, 0).curse?.order).toEqual([45, 0, 17, 28]);
  });
  it("covers a district at 90 seconds without deleting owners, buildings or mortgages", () => {
    const s = { ...awake(), owners: { 1: "a", 48: "b" }, houses: { 1: 2 }, mortgaged: { 1: true } };
    expect(G.horrorTick(s, 1000 + FOG_MS - 1).curse?.fogGroups).toEqual([]);
    const n = G.horrorTick(s, 1000 + FOG_MS);
    expect(n.curse?.fogGroups).toEqual([0]);
    const slot = G.boardFor(n).findIndex((sq) => sq.name === G.boardFor(s)[1]?.name);
    expect(n.curse?.consumed).toContain(slot);
    expect(n.owners[slot]).toBe("a");
    expect(n.houses?.[slot]).toBe(2);
    expect(n.mortgaged?.[slot]).toBe(true);
    expect(n.owners[48]).toBe("b");
    expect(n.curse?.nextFogAt).toBe(181000);
  });
  it("closes bank operations and rents, but preserves Boró balances", () => {
    const s = awake();
    expect(G.startBonus(s)).toBe(0);
    expect(G.rentFor(s, 1)).toBe(0);
    expect(G.build(s, "a", 1)).toBe(s);
    expect(G.mortgage({ ...s, owners: { 1: "a" } }, "a", 1).players).toEqual(s.players);
    expect(G.repayLoan({ ...s, players: s.players.map((p) => ({ ...p, loan: 100 })) }, "a", 50).players[0]?.balance).toBe(1500);
    const rolled = G.roll({ ...s, players: s.players.map((p) => ({ ...p, pos: 55 })) }, "a", 1, 2);
    expect(bal(rolled, "a")).toBe(1500);
  });
  it("keeps player negotiations operational after the bank closes", () => {
    const s = { ...awake(), owners: { 1: "a" } };
    const offered = G.proposeTrade(s, "a", "b", [1], [], 0, 100, "offer");
    const n = G.answerTrade(offered, "b", "offer", true);
    expect(n.owners[1]).toBe("b");
    expect(bal(n, "a")).toBe(1600);
    expect(bal(n, "b")).toBe(1400);
  });
  it("charges B$200 for the next altar only once, within six squares", () => {
    const s = awake();
    expect(G.purifyAltar(s, "a", 17)).toBe(s);
    const n = G.purifyAltar(s, "a", 0);
    expect(bal(n, "a")).toBe(1300);
    expect(n.curse?.altars[0]).toBe("a");
    expect(G.purifyAltar(n, "a", 0)).toBe(n);
    const far = { ...s, players: s.players.map((p) => ({ ...p, pos: 7 })) };
    expect(G.purifyAltar(far, "a", 0)).toBe(far);
  });
  it("allows an owned property instead of cash, never another player's property", () => {
    const s = { ...awake(), owners: { 1: "a", 3: "b" } };
    expect(G.purifyAltar(s, "a", 0, 3)).toBe(s);
    const n = G.purifyAltar(s, "a", 0, 1);
    expect(n.owners[1]).toBeUndefined();
    expect(bal(n, "a")).toBe(1500);
    expect(n.curse?.altars[0]).toBe("a");
  });
  it("uses one torch to recover 30 sanity, including reviving an ally", () => {
    const s = awake();
    if (!s.curse) throw new Error("Missing curse");
    const low = { ...s, curse: { ...s.curse, sanity: { a: 90, b: 0 } } };
    const n = G.useTorch(low, "a", "b");
    expect(n.curse?.sanity['b']).toBe(30);
    expect(n.curse?.torches['a']).toBe(1);
    expect(G.useTorch(low, "a").curse?.sanity['a']).toBe(100);
    expect(G.useTorch(low, "b", "a")).toBe(low);
  });
  it("travels to the next altar for one torch only on the player's turn", () => {
    const s = G.purifyAltar(awake(), "a", 0);
    expect(G.travelAltar(s, "b")).toBe(s);
    const n = G.travelAltar(s, "a");
    expect(n.players[0]?.pos).toBe(17);
    expect(n.curse?.torches['a']).toBe(1);
    expect(bal(n, "a")).toBe(1300);
  });
  it("normal houses cost five sanity, fog costs twenty, and corners restore fifteen", () => {
    const s = awake();
    if (!s.curse) throw new Error("Missing curse");
    const c = s.curse;
    const landed = (pos: number) => ({ ...s, players: s.players.map((p) => ({ ...p, pos })), curse: { ...c, sanity: { a: 80, b: 100 }, consumed: [1] } });
    expect(G.land(landed(3), "x").curse?.sanity['a']).toBe(75);
    expect(G.land(landed(1), "x").curse?.sanity['a']).toBe(60);
    expect(G.land(landed(17), "x").curse?.sanity['a']).toBe(95);
  });
  it("four seals reopen the bank without ending the game and reward each helper only once", () => {
    let s = awake();
    for (const altar of ALTARS) {
      s = { ...s, players: s.players.map((p) => p.id === "a" ? { ...p, pos: altar } : p) };
      s = G.purifyAltar({ ...s, rollId: s.rollId + 1 }, "a", altar);
    }
    expect(s.phase).toBe("playing");
    expect(s.curse?.stage).toBe("escaped");
    expect(s.winner).toBeNull();
    expect(bal(s, "a")).toBe(950);
    expect(bal(s, "b")).toBe(1500);
    expect(G.startBonus(s)).toBe(200);
    expect(G.horrorTick(s, 999999)).toBe(s);
    expect(G.purifyAltar(s, "a", 45)).toBe(s);
    expect(G.roll(s, G.current(s).id, 1, 2).rollId).toBe(s.rollId + 1);
  });
  it("deadline applies penalties and continues instead of ending the game", () => {
    let s = awake();
    for (let i = 1; i <= 8; i++) s = G.horrorTick(s, 1000 + i * FOG_MS);
    expect(s.curse?.penaltyRate).toBeCloseTo(0.6);
    expect(bal(s, "a")).toBe(600);
    expect(s.curse?.stage).toBe("forgotten");
    expect(s.phase).toBe("playing");
  });
  it("zero group sanity resolves the crisis without ending the game; lost players are skipped", () => {
    const s = awake();
    if (!s.curse) throw new Error("Missing curse");
    const low = { ...s, curse: { ...s.curse, sanity: { a: 5, b: 0 } }, players: s.players.map((p) => ({ ...p, pos: 3 })) };
    expect(G.land(low, "x").curse?.stage).toBe("forgotten");
    const one = { ...low, curse: { ...low.curse, sanity: { a: 100, b: 0 } } };
    expect(G.land(one, "x").turn).toBe(0);
  });
  it("never introduces curse state or exclusive update notes in other maps", () => {
    for (const city of ["salinas", "boro", "selva"] as const) {
      const s = { ...playing(city), round: 12 };
      expect(G.horrorTick(s, 1000)).toBe(s);
      expect(G.startBonus(s)).toBe(200);
      expect(notesFor(city).some((n) => /maldição|Fantasma errante/.test(n))).toBe(false);
    }
    expect(notesFor("esquecidos").some((n) => /ritual não termina/.test(n))).toBe(true);
  });
});