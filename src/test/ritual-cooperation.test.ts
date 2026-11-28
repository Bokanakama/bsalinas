import { describe, expect, it } from "vitest";
import * as G from "@/lib/game";
import { ritualAligned, ritualNeedle } from "@/lib/ritual-tuning";

function awake(): G.GameState {
  let s = G.newState("esquecidos");
  for (const [id, animal] of [["a", "gato"], ["b", "coelho"], ["c", "coala"], ["d", "panda"]] as const) s = G.join(s, id, id, animal);
  return G.horrorTick({ ...G.start(s), round: 8 }, 1000, 0);
}
function at(s: G.GameState, id: string, pos: number, balance?: number) {
  return { ...s, players: s.players.map((p) => p.id === id ? { ...p, pos, ...(balance === undefined ? {} : { balance }) } : p) };
}
function appealed() { return G.requestAltarHelp(at(awake(), "a", 0, 120), "a", 0, 2000); }
const bal = (s: G.GameState, id: string) => s.players.find((p) => p.id === id)?.balance;

describe("Flexible ritual and funding", () => {
  it("new crises allow any of the four altars within six squares", () => {
    const s = at(awake(), "c", 45);
    expect(G.availableAltars(s)).toEqual([0, 17, 28, 45]);
    expect(G.ritualTarget(s, "c")).toBe(45);
    expect(G.purifyAltar(s, "c", 45).curse?.altars[45]).toBe("c");
    expect(G.purifyAltar(at(s, "c", 38), "c", 45)).toEqual(at(s, "c", 38));
  });
  it("old crises keep the persisted sequence and one-seal-per-roll limit", () => {
    const s = awake(); if (!s.curse) throw new Error("curse");
    const legacy = at({ ...s, curse: { ...s.curse, freeAltars: false } }, "c", 45);
    expect(G.purifyAltar(legacy, "c", 45)).toBe(legacy);
    const first = G.purifyAltar(at(s, "a", 0), "a", 0);
    const second = at(first, "c", 45);
    expect(G.purifyAltar(second, "c", 45)).toBe(second);
  });
  it("selected travel consumes one torch only on the current turn", () => {
    const s = awake();
    expect(G.travelAltar(s, "a", 45).players[0]?.pos).toBe(45);
    expect(G.travelAltar(s, "a", 45).curse?.torches["a"]).toBe(1);
    expect(G.travelAltar(s, "b", 45)).toBe(s);
    expect(G.travelAltar(s, "a", 9)).toBe(s);
  });
  it("reserves requester funds for exactly ten seconds", () => {
    const s = appealed();
    expect(bal(s, "a")).toBe(0);
    expect(s.curse?.appeal?.endsAt).toBe(12000);
    expect(G.expireAltarAppeal(s, 11999)).toBe(s);
    expect(bal(G.expireAltarAppeal(s, 12000), "a")).toBe(120);
  });
  it("accepts only B$20/B$50 and caps the final contribution to the missing amount", () => {
    let s = appealed();
    expect(G.donateAltar(s, "b", 2000, 30, 3000)).toBe(s);
    s = G.donateAltar(s, "b", 2000, 50, 3000);
    s = G.donateAltar(s, "c", 2000, 50, 4000);
    expect(bal(s, "b")).toBe(1450);
    expect(bal(s, "c")).toBe(1470);
    expect(Object.values(s.curse?.appeal?.contributions ?? {}).reduce((a,b)=>a+b,0)).toBe(200);
    expect(G.donateAltar(s, "d", 2000, 50, 5000)).toBe(s);
  });
  it("only the requester completes a fully funded offering; duplicate actions do not charge twice", () => {
    const s = G.donateAltar(G.donateAltar(appealed(), "b", 2000, 50, 3000), "c", 2000, 50, 4000);
    expect(G.finishAltarHelp(s, "b", 2000, 5000)).toBe(s);
    const n = G.finishAltarHelp(s, "a", 2000, 5000);
    expect(n.curse?.altars[0]).toBe("a");
    expect(n.curse?.helpers).toEqual(["a", "b", "c"]);
    expect(G.finishAltarHelp(n, "a", 2000, 5000)).toBe(n);
  });
  it("refunds every reserved Boró on cancellation, expiry during movement and crisis failure", () => {
    const s = G.donateAltar(appealed(), "b", 2000, 50, 3000);
    const cancel = G.cancelAltarHelp(s, "a", 2000);
    expect(bal(cancel, "a")).toBe(120); expect(bal(cancel, "b")).toBe(1500);
    expect(G.cancelAltarHelp(cancel, "a", 2000)).toBe(cancel);
    const expired = G.horrorTick({ ...s, moving: true }, 12000);
    expect(bal(expired, "a")).toBe(120); expect(bal(expired, "b")).toBe(1500);
    const failed = G.horrorTick(s, 721000);
    expect(bal(failed, "a")).toBe(48); expect(bal(failed, "b")).toBe(600);
  });
  it("rejects stale appeals, foreign funding, and new rule actions in other cities", () => {
    const s = appealed();
    expect(G.donateAltar(s, "b", 1999, 50, 3000)).toBe(s);
    const other = { ...s, city: "salinas" as const };
    expect(G.requestAltarHelp(other, "b", 0, 3000)).toBe(other);
    expect(G.donateAltar(other, "b", 2000, 50, 3000)).toBe(other);
    expect(G.finishAltarHelp(other, "a", 2000, 3000)).toBe(other);
    expect(G.cancelAltarHelp(other, "a", 2000)).toBe(other);
  });
});
describe("Three-second tuning", () => {
  it("moves over three seconds and accepts the central safe zone", () => {
    expect(ritualNeedle(0)).toBe(0); expect(ritualNeedle(3000)).toBe(100);
    expect(ritualAligned(1049)).toBe(false); expect(ritualAligned(1050)).toBe(true);
    expect(ritualAligned(1950)).toBe(true); expect(ritualAligned(1951)).toBe(false);
    expect(ritualAligned(NaN)).toBe(false);
  });
});
describe("Optional shadow pact settlement", () => {
  it("can be enabled only for an Esquecidos lobby", () => {
    expect(G.configureHorror(G.newState("esquecidos"), true).horrorOptions?.pact).toBe(true);
    const s = awake(); expect(G.configureHorror(s,true)).toBe(s);
    const other = G.newState("salinas"); expect(G.configureHorror(other,true)).toBe(other);
  });
  it("protects only the accepted player on timeout, inherits fog assets and pays once", () => {
    const s = awake(); if (!s.curse) throw new Error("curse");
    const enabled = { ...s, horrorOptions: { pact: true }, owners: { 1:"b" }, houses:{1:2}, curse:{...s.curse,consumed:[1]} };
    const failed = G.horrorTick(enabled, 721000);
    const n = G.settleShadowPact(failed, {playerId:"a",accepted:true});
    expect(bal(n,"a")).toBe(1500); expect(bal(n,"b")).toBe(600);
    expect(n.owners[1]).toBe("a"); expect(n.houses?.[1]).toBe(2); expect(G.rentFor(n,1)).toBe(0);
    expect(G.settleShadowPact(n,{playerId:"a",accepted:true})).toBe(n);
    expect(G.settleShadowPact(failed,{playerId:"a",accepted:false})).toBe(failed);
  });
  it("never protects an accepted player on early fog failure or when disabled", () => {
    const s = awake(); if (!s.curse) throw new Error("curse");
    const early = G.horrorTick({...s,horrorOptions:{pact:true},curse:{...s.curse,fogGroups:[0,1,2,3,4,5,6],nextFogAt:2000}},2000);
    expect(bal(G.settleShadowPact(early,{playerId:"a",accepted:true}),"a")).toBe(600);
    const disabled = G.horrorTick(s,721000);expect(G.settleShadowPact(disabled,{playerId:"a",accepted:true})).toBe(disabled);
  });
});